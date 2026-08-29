import { supabase } from '../supabase';

/**
 * Automation execution service.
 *
 * Calls the run-automation edge function which executes each step for real —
 * creating tasks, updating records, calling AI, sending emails, etc.
 * The edge function holds the service-role key and does the actual DB writes.
 */

export type AutomationTriggerResult =
  | { ok: true; runId?: string; status?: string }
  | { ok: false; message: string };

/**
 * Trigger an automation by its ID. Pass trigger_data containing the context
 * the workflow needs (lead_id, email, full_name, etc.).
 */
export async function triggerAutomation(
  automationId: string,
  triggerData: Record<string, unknown>,
): Promise<AutomationTriggerResult> {
  try {
    const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/run-automation`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ automation_id: automationId, trigger_data: triggerData }),
    });

    const body = await res.json().catch(() => ({}));

    if (!res.ok || body.ok === false) {
      const msg = body?.error ?? `Automation service error (${res.status})`;
      return { ok: false, message: msg };
    }

    return { ok: true, runId: body.run_id, status: body.status };
  } catch (err) {
    return {
      ok: false,
      message: err instanceof Error ? err.message : 'Unexpected error',
    };
  }
}

/**
 * Fire all enabled automations matching a trigger event.
 * Called after real business events (e.g., after createLead).
 * Failures are silent — the triggering action (lead creation, etc.)
 * should still succeed even if an automation fails.
 */
export async function fireEvent(
  trigger: string,
  data: Record<string, unknown>,
): Promise<void> {
  try {
    const { data: automations } = await supabase
      .from('automations')
      .select('id')
      .eq('trigger', trigger)
      .eq('enabled', true);

    if (!automations || automations.length === 0) return;

    await Promise.all(
      automations.map((a) => triggerAutomation(a.id, data).catch(() => {})),
    );
  } catch {
    // best-effort — never block the triggering action
  }
}
