import { supabase, supabaseReady } from '../supabase';
import type { LeadSource } from '../config';
import { fireEvent } from './automation';

export type LeadInput = {
  full_name: string;
  business_name?: string;
  email: string;
  phone?: string;
  whatsapp?: string;
  website?: string;
  service: string;
  meeting_type?: string;
  requirements?: string;
  budget?: string;
  timeline?: string;
  lead_source?: LeadSource;
  meeting_date?: string;
  meeting_time?: string;
  timezone?: string;
};

export type LeadRecord = LeadInput & {
  id: string;
  status: string;
  created_at: string;
};

export type ConsultationInput = {
  lead_id: string;
  service: string;
  meeting_type: string;
  meeting_date: string;
  meeting_time: string;
  timezone: string;
  duration_minutes?: number;
  notes?: string;
};

export type QuoteInput = {
  lead_id: string;
  service: string;
  requirements: string;
  budget?: string;
  timeline?: string;
};

export type SubmissionResult =
  | { ok: true; leadId: string }
  | { ok: false; offline: true; message: string }
  | { ok: false; offline: false; message: string };

/**
 * Create a lead. Falls back to an honest "offline" result when Supabase
 * is not configured so the UI never pretends a record was saved.
 */
export async function createLead(input: LeadInput): Promise<SubmissionResult> {
  if (!supabaseReady) {
    return {
      ok: false,
      offline: true,
      message:
        'Lead storage is not configured yet. Please use WhatsApp or email to reach Zyntiqo.',
    };
  }

  try {
    const { data, error } = await supabase
      .from('leads')
      .insert({
        full_name: input.full_name,
        business_name: input.business_name ?? null,
        email: input.email,
        phone: input.phone ?? null,
        whatsapp: input.whatsapp ?? null,
        website: input.website ?? null,
        service: input.service,
        meeting_type: input.meeting_type ?? null,
        requirements: input.requirements ?? null,
        budget: input.budget ?? null,
        timeline: input.timeline ?? null,
        lead_source: input.lead_source ?? null,
        meeting_date: input.meeting_date ?? null,
        meeting_time: input.meeting_time ?? null,
        timezone: input.timezone ?? null,
      })
      .select('id')
      .single();

    if (error || !data) {
      return { ok: false, offline: false, message: error?.message ?? 'Unknown error' };
    }

    return { ok: true, leadId: data.id };
  } catch (err) {
    return {
      ok: false,
      offline: false,
      message: err instanceof Error ? err.message : 'Unexpected error',
    };
  }
}

/**
 * After a lead is created, fire the new_lead automation trigger.
 * Failures here must not affect the lead creation result.
 */
async function fireNewLeadTrigger(leadId: string, input: LeadInput): Promise<void> {
  try {
    await fireEvent('new_lead', {
      lead_id: leadId,
      full_name: input.full_name,
      email: input.email,
      phone: input.phone,
      service: input.service,
      budget: input.budget,
      timeline: input.timeline,
    });
  } catch {
    // best-effort — never block lead creation
  }
}

export async function createLeadWithAutomation(input: LeadInput): Promise<SubmissionResult> {
  const result = await createLead(input);
  if (result.ok) {
    await fireNewLeadTrigger(result.leadId, input);
  }
  return result;
}

export async function updateLeadEmailStatus(
  leadId: string,
  emailStatus: string,
): Promise<void> {
  if (!supabaseReady) return;
  try {
    await supabase.from('leads').update({ email_status: emailStatus }).eq('id', leadId);
  } catch {
    // best-effort
  }
}

export async function createConsultation(
  input: ConsultationInput,
): Promise<{ ok: boolean; message?: string }> {
  if (!supabaseReady) return { ok: false, message: 'offline' };

  try {
    const { error } = await supabase.from('consultations').insert({
      lead_id: input.lead_id,
      service: input.service,
      meeting_type: input.meeting_type,
      meeting_date: input.meeting_date,
      meeting_time: input.meeting_time,
      timezone: input.timezone,
      duration_minutes: input.duration_minutes ?? 30,
      notes: input.notes ?? null,
    });

    if (error) return { ok: false, message: error.message };
    return { ok: true };
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : 'Unexpected error' };
  }
}

export async function createQuoteRequest(
  input: QuoteInput,
): Promise<{ ok: boolean; message?: string }> {
  if (!supabaseReady) return { ok: false, message: 'offline' };

  try {
    const { error } = await supabase.from('quote_requests').insert({
      lead_id: input.lead_id,
      service: input.service,
      requirements: input.requirements,
      budget: input.budget ?? null,
      timeline: input.timeline ?? null,
    });

    if (error) return { ok: false, message: error.message };
    return { ok: true };
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : 'Unexpected error' };
  }
}
