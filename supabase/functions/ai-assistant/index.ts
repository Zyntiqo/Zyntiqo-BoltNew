// @ts-nocheck
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const GEMINI_API_KEY = Deno.env.get("Geminiapi") ?? Deno.env.get("GEMINI_API_KEY") ?? "";
const GEMINI_MODEL = "gemini-2.0-flash";
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const SYSTEM_PROMPT = `You are the Zyntiqo AI Assistant. Zyntiqo is a digital agency that helps businesses "Build. Grow. Automate." — offering web development, CRM, marketing automation, AI integration, and business consulting services.

Your role:
- Answer general business questions clearly and concisely.
- Explain Zyntiqo's services: web development, CRM, pipeline management, marketing campaigns, automations, AI assistant, project management, quotes, invoices, support tickets, and customer portal.
- Help visitors understand the website and how to get started (contact form, request a quote, book a consultation).
- When the user is an authenticated staff member, you can summarize leads, customer information, and business data that is provided to you in the context.
- When the user is an authenticated customer, you can help with their projects, quotes, invoices, and support tickets using data provided in context.

Rules:
- Never invent data. If context data is not provided, say you don't have that information.
- Keep responses focused and helpful. Avoid unnecessary filler.
- If asked about sensitive topics (passwords, API keys, other users' private data), decline politely.
- Format responses with clear paragraphs. Use bullet points when listing items.`;

type ChatMessage = { role: string; content: string };

type AIRequest = {
  task: 'generate_content' | 'qualify_lead' | 'suggest_followup' | 'recommend' | 'summarize' | 'create_automation' | 'chat' | 'generate_image';
  context: Record<string, unknown>;
  prompt?: string;
  history?: ChatMessage[];
};

// Simple in-memory rate limiting (per instance, best-effort)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 15;

function checkRateLimit(identifier: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(identifier);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(identifier, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT_MAX) return false;
  entry.count++;
  return true;
}

async function callGemini(
  systemPrompt: string,
  userPrompt: string,
  history: ChatMessage[],
): Promise<{ ok: true; content: string } | { ok: false; error: string }> {
  if (!GEMINI_API_KEY) {
    return { ok: false, error: "GEMINI_API_KEY is not configured" };
  }

  const contents = [
    ...history.map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    })),
    { role: 'user', parts: [{ text: userPrompt }] },
  ];

  try {
    const res = await fetch(GEMINI_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1024,
        },
      }),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      const msg = errBody?.error?.message ?? `Gemini API error (${res.status})`;
      return { ok: false, error: msg };
    }

    const data = await res.json();
    const content = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!content) {
      return { ok: false, error: "Gemini returned no content" };
    }
    return { ok: true, content: content.trim() };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Gemini request failed" };
  }
}

async function getAuthUser(req: Request): Promise<{ user: any | null; profile: any | null }> {
  const authHeader = req.headers.get("Authorization") ?? "";
  if (!authHeader.startsWith("Bearer ")) return { user: null, profile: null };

  const supabase = createClient(supabaseUrl, serviceKey);
  const token = authHeader.replace("Bearer ", "");

  const { data: { user } } = await supabase.auth.getUser(token);
  if (!user) return { user: null, profile: null };

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  return { user, profile };
}

async function buildContextualPrompt(
  req: AIRequest,
  user: any | null,
  profile: any | null,
  supabase: any,
): Promise<string> {
  const parts: string[] = [req.prompt ?? ""];

  // For staff: fetch and include lead/customer summaries when asked
  if (profile && ['SUPER_ADMIN', 'ADMIN', 'SALES', 'PROJECT_MANAGER', 'SUPPORT'].includes(profile.role)) {
    const task = req.task;
    const ctx = req.context;

    if (task === 'summarize' || (ctx?.question as string)?.toLowerCase().includes('lead')) {
      const { data: leads } = await supabase
        .from("leads")
        .select("full_name, email, service, status, created_at, budget, timeline")
        .order("created_at", { ascending: false })
        .limit(20);
      if (leads && leads.length > 0) {
        parts.push(`\n\nRecent leads data (for staff summary):\n${JSON.stringify(leads, null, 2)}`);
      }
    }

    if ((ctx?.question as string)?.toLowerCase().includes('customer')) {
      const { data: customers } = await supabase
        .from("profiles")
        .select("full_name, email, business_name, phone, created_at")
        .eq("role", "CUSTOMER")
        .order("created_at", { ascending: false })
        .limit(20);
      if (customers && customers.length > 0) {
        parts.push(`\n\nCustomer data (for staff summary):\n${JSON.stringify(customers, null, 2)}`);
      }
    }
  }

  // For customers: include their project/quote data when relevant
  if (profile?.role === 'CUSTOMER' && user) {
    if ((req.context?.question as string)?.toLowerCase().includes('project')) {
      const { data: projects } = await supabase
        .from("projects")
        .select("name, status, start_date, end_date")
        .eq("customer_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10);
      if (projects && projects.length > 0) {
        parts.push(`\n\nYour projects:\n${JSON.stringify(projects, null, 2)}`);
      }
    }
  }

  return parts.join("\n");
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    // Rate limit by IP
    const clientIP = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    if (!checkRateLimit(clientIP)) {
      return new Response(
        JSON.stringify({ ok: false, error: "Rate limit exceeded. Please wait a moment and try again." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const body: AIRequest = await req.json();

    // Get authenticated user (if any)
    const { user, profile } = await getAuthUser(req);
    const supabase = createClient(supabaseUrl, serviceKey);

    // Build contextual prompt with auth-scoped data
    const contextualPrompt = await buildContextualPrompt(body, user, profile, supabase);

    // Build system prompt with role context
    let systemPrompt = SYSTEM_PROMPT;
    if (profile) {
      systemPrompt += `\n\nThe current user is authenticated as: ${profile.full_name} (${profile.role}).`;
      if (['SUPER_ADMIN', 'ADMIN', 'SALES', 'PROJECT_MANAGER', 'SUPPORT'].includes(profile.role)) {
        systemPrompt += " They are a staff member and can see lead and customer summaries.";
      } else {
        systemPrompt += " They are a customer and can only see their own project, quote, and invoice information.";
      }
    } else {
      systemPrompt += "\n\nThe current user is not authenticated. Only provide general information about Zyntiqo services and the website. Do not provide any private business data.";
    }

    const result = await callGemini(systemPrompt, contextualPrompt, body.history ?? []);

    if (!result.ok) {
      return new Response(
        JSON.stringify({ ok: false, error: result.error }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({ ok: true, content: result.content }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("[ai-assistant] Error:", err);
    return new Response(
      JSON.stringify({ ok: false, error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
