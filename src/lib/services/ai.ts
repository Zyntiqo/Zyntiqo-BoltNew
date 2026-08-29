import { siteConfig } from '../config';

/**
 * AI service abstraction for Zyntiqo Pro.
 *
 * When VITE_AI_ENABLED is true and an AI edge function is deployed, this
 * calls the real model. Otherwise it returns honest "not configured"
 * results — the UI shows a clear status and never fakes AI output.
 */

export type AIResult =
  | { ok: true; content: string }
  | { ok: false; reason: 'not_configured' | 'error'; message: string };

export type AIRequest = {
  task: 'generate_content' | 'qualify_lead' | 'suggest_followup' | 'recommend' | 'summarize' | 'create_automation' | 'chat' | 'generate_image';
  context: Record<string, unknown>;
  prompt?: string;
  history?: { role: string; content: string }[];
};

export function isAIConfigured(): boolean {
  return siteConfig.aiEnabled;
}

export async function callAI(req: AIRequest): Promise<AIResult> {
  if (!siteConfig.aiEnabled) {
    return {
      ok: false,
      reason: 'not_configured',
      message: 'AI is not connected yet. Add an API key to enable AI-powered features.',
    };
  }

  try {
    const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-assistant`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify(req),
    });
    if (!res.ok) {
      return { ok: false, reason: 'error', message: `AI service error (${res.status})` };
    }
    const data = await res.json();
    if (!data?.content) {
      return { ok: false, reason: 'error', message: 'AI returned an empty response.' };
    }
    return { ok: true, content: data.content as string };
  } catch (err) {
    return {
      ok: false,
      reason: 'error',
      message: err instanceof Error ? err.message : 'Unexpected AI error',
    };
  }
}

export type ImageGenResult =
  | { ok: true; imageUrl: string }
  | { ok: false; reason: 'not_configured' | 'error'; message: string };

export function isImageGenConfigured(): boolean {
  return siteConfig.imageGenEnabled;
}

export async function generateImage(prompt: string): Promise<ImageGenResult> {
  if (!siteConfig.imageGenEnabled) {
    return {
      ok: false,
      reason: 'not_configured',
      message: 'Image generation is not connected yet. Add an API key to enable AI image creation.',
    };
  }

  try {
    const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-assistant`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ task: 'generate_image', prompt }),
    });
    if (!res.ok) {
      return { ok: false, reason: 'error', message: `Image service error (${res.status})` };
    }
    const data = await res.json();
    if (!data?.imageUrl) {
      return { ok: false, reason: 'error', message: 'Image service returned no image.' };
    }
    return { ok: true, imageUrl: data.imageUrl as string };
  } catch (err) {
    return {
      ok: false,
      reason: 'error',
      message: err instanceof Error ? err.message : 'Unexpected image generation error',
    };
  }
}
