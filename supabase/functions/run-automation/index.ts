// @ts-nocheck
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

type Step = {
  id: string;
  type: "condition" | "ai_action" | "action" | "delay" | "branch";
  label: string;
  config?: Record<string, unknown>;
};

type LogEntry = {
  step: string;
  status: string;
  message: string;
  timestamp: string;
};

function nowISO() {
  return new Date().toISOString();
}

async function executeStep(
  supabase: ReturnType<typeof createClient>,
  step: Step,
  context: Record<string, unknown>,
  log: LogEntry[],
): Promise<{ success: boolean; error?: string }> {
  const ts = nowISO();

  switch (step.type) {
    case "delay": {
      const minutes = Number(step.config?.minutes ?? 0);
      if (minutes > 0 && minutes <= 5) {
        await new Promise((r) => setTimeout(r, minutes * 60 * 1000));
      }
      log.push({ step: step.label, status: "completed", message: `Delayed ${minutes} min`, timestamp: ts });
      return { success: true };
    }

    case "condition": {
      const field = String(step.config?.field ?? "");
      const operator = String(step.config?.operator ?? "equals");
      const expected = String(step.config?.value ?? "");
      const actual = String(context[field] ?? "");

      let passes = false;
      if (operator === "equals") passes = actual === expected;
      else if (operator === "not_equals") passes = actual !== expected;
      else if (operator === "contains") passes = actual.toLowerCase().includes(expected.toLowerCase());
      else if (operator === "gt") passes = Number(actual) > Number(expected);
      else if (operator === "lt") passes = Number(actual) < Number(expected);
      else passes = true;

      log.push({
        step: step.label,
        status: passes ? "completed" : "skipped",
        message: passes ? "Condition met" : "Condition not met — remaining steps skipped",
        timestamp: ts,
      });
      return { success: passes };
    }

    case "action": {
      const action = String(step.config?.action ?? "");

      if (action === "create_task") {
        const { error } = await supabase.from("tasks").insert({
          title: String(step.config?.task_title ?? `Follow up: ${context.full_name ?? context.name ?? "New lead"}`),
          description: String(step.config?.task_description ?? ""),
          priority: String(step.config?.priority ?? "medium"),
          status: "todo",
          related_contact_id: context.contact_id ?? null,
        });
        if (error) {
          log.push({ step: step.label, status: "failed", message: error.message, timestamp: ts });
          return { success: false, error: error.message };
        }
        log.push({ step: step.label, status: "completed", message: "Task created", timestamp: ts });
        return { success: true };
      }

      if (action === "update_lead_status") {
        const leadId = context.lead_id ?? context.id;
        if (!leadId) {
          log.push({ step: step.label, status: "failed", message: "No lead ID in context", timestamp: ts });
          return { success: false, error: "No lead ID" };
        }
        const { error } = await supabase
          .from("leads")
          .update({ status: String(step.config?.status ?? "Contacted") })
          .eq("id", leadId);
        if (error) {
          log.push({ step: step.label, status: "failed", message: error.message, timestamp: ts });
          return { success: false, error: error.message };
        }
        log.push({ step: step.label, status: "completed", message: `Lead status → ${step.config?.status ?? "Contacted"}`, timestamp: ts });
        return { success: true };
      }

      if (action === "update_deal_stage") {
        const dealId = context.deal_id ?? context.id;
        if (!dealId) {
          log.push({ step: step.label, status: "failed", message: "No deal ID in context", timestamp: ts });
          return { success: false, error: "No deal ID" };
        }
        const { error } = await supabase
          .from("deals")
          .update({ stage: String(step.config?.stage ?? "qualified") })
          .eq("id", dealId);
        if (error) {
          log.push({ step: step.label, status: "failed", message: error.message, timestamp: ts });
          return { success: false, error: error.message };
        }
        log.push({ step: step.label, status: "completed", message: `Deal stage → ${step.config?.stage}`, timestamp: ts });
        return { success: true };
      }

      if (action === "add_note") {
        const { error } = await supabase.from("activities").insert({
          type: "note",
          description: String(step.config?.note ?? step.label),
          entity_id: context.lead_id ?? context.contact_id ?? context.id ?? null,
        });
        if (error) {
          log.push({ step: step.label, status: "failed", message: error.message, timestamp: ts });
          return { success: false, error: error.message };
        }
        log.push({ step: step.label, status: "completed", message: "Note added", timestamp: ts });
        return { success: true };
      }

      if (action === "send_email") {
        const to = String(step.config?.to ?? context.email ?? "");
        const template = String(step.config?.template ?? "new_lead");
        if (!to) {
          log.push({ step: step.label, status: "failed", message: "No recipient email in context", timestamp: ts });
          return { success: false, error: "No recipient" };
        }
        const emailRes = await fetch(`${supabaseUrl}/functions/v1/send-email`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}` },
          body: JSON.stringify({ to, template, data: context }),
        });
        if (!emailRes.ok) {
          const body = await emailRes.json().catch(() => ({}));
          const msg = body?.error ?? `Email service error (${emailRes.status})`;
          log.push({ step: step.label, status: "failed", message: msg, timestamp: ts });
          return { success: false, error: msg };
        }
        log.push({ step: step.label, status: "completed", message: "Email sent", timestamp: ts });
        return { success: true };
      }

      if (action === "internal_notification") {
        const { error } = await supabase.from("activities").insert({
          type: "notification",
          description: String(step.config?.message ?? `Automation notification: ${step.label}`),
          entity_id: context.lead_id ?? context.id ?? null,
        });
        if (error) {
          log.push({ step: step.label, status: "failed", message: error.message, timestamp: ts });
          return { success: false, error: error.message };
        }
        log.push({ step: step.label, status: "completed", message: "Notification logged", timestamp: ts });
        return { success: true };
      }

      log.push({ step: step.label, status: "skipped", message: `Unknown action: ${action}`, timestamp: ts });
      return { success: true };
    }

    case "ai_action": {
      const aiTask = String(step.config?.ai_task ?? "recommend");
      const prompt = String(step.config?.prompt ?? step.label);

      const aiRes = await fetch(`${supabaseUrl}/functions/v1/ai-assistant`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}` },
        body: JSON.stringify({ task: aiTask, context, prompt }),
      });

      if (!aiRes.ok) {
        const body = await aiRes.json().catch(() => ({}));
        const msg = body?.message ?? body?.error ?? `AI service error (${aiRes.status})`;
        log.push({ step: step.label, status: "failed", message: msg, timestamp: ts });
        return { success: false, error: msg };
      }

      const aiData = await aiRes.json().catch(() => ({}));
      if (!aiData?.content) {
        const msg = "AI returned no content";
        log.push({ step: step.label, status: "failed", message: msg, timestamp: ts });
        return { success: false, error: msg };
      }

      log.push({ step: step.label, status: "completed", message: "AI action completed", timestamp: ts });
      context[`ai_output_${step.id}`] = aiData.content;
      return { success: true };
    }

    default:
      log.push({ step: step.label, status: "skipped", message: `Unknown step type: ${step.type}`, timestamp: ts });
      return { success: true };
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  const supabase = createClient(supabaseUrl, serviceKey);

  try {
    const body = await req.json();
    const { automation_id, trigger_data } = body;

    if (!automation_id) {
      return new Response(
        JSON.stringify({ ok: false, error: "Missing automation_id" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { data: auto, error: autoErr } = await supabase
      .from("automations")
      .select("*")
      .eq("id", automation_id)
      .maybeSingle();

    if (autoErr || !auto) {
      return new Response(
        JSON.stringify({ ok: false, error: "Automation not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (!auto.enabled) {
      return new Response(
        JSON.stringify({ ok: false, error: "Automation is paused" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const steps: Step[] = auto.steps ?? [];
    const context: Record<string, unknown> = trigger_data ?? {};
    const log: LogEntry[] = [];
    const startTime = Date.now();

    const { data: run, error: runErr } = await supabase
      .from("automation_runs")
      .insert({
        automation_id: auto.id,
        status: "running",
        log: [{ step: auto.trigger, status: "triggered", message: "Workflow triggered", timestamp: nowISO() }],
      })
      .select()
      .single();

    if (runErr || !run) {
      return new Response(
        JSON.stringify({ ok: false, error: "Failed to create run record" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    let failed = false;
    let skipped = false;

    for (const step of steps) {
      const result = await executeStep(supabase, step, context, log);
      await supabase.from("automation_runs").update({ log }).eq("id", run.id);

      if (!result.success && step.type === "condition") {
        skipped = true;
        break;
      }
      if (!result.success && step.type !== "condition") {
        failed = true;
        break;
      }
    }

    const durationMs = Date.now() - startTime;
    const finalStatus = failed ? "failed" : "completed";

    await supabase
      .from("automation_runs")
      .update({
        status: finalStatus,
        completed_at: nowISO(),
        log,
        error_message: failed ? log.find((l) => l.status === "failed")?.message ?? "Unknown error" : null,
        duration_ms: durationMs,
      })
      .eq("id", run.id);

    await supabase.from("activities").insert({
      type: "automation",
      description: `Automation "${auto.name}" ${failed ? "failed" : "completed"} (${durationMs}ms)`,
    });

    return new Response(
      JSON.stringify({ ok: true, run_id: run.id, status: finalStatus, duration_ms: durationMs }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("[run-automation] Error:", err);
    return new Response(
      JSON.stringify({ ok: false, error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
