import { supabase, supabaseReady } from '../supabase';

/**
 * Generic CRUD helpers for the Zyntiqo Pro platform tables.
 * Single-tenant demo mode — the anon-key client can read and write.
 */

export type Contact = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  title: string | null;
  status: string;
  source: string | null;
  tags: string[] | null;
  last_contacted_at: string | null;
  created_at: string;
};

export type Deal = {
  id: string;
  contact_id: string | null;
  title: string;
  value: number;
  stage: string;
  probability: number;
  expected_close_date: string | null;
  notes: string | null;
  created_at: string;
};

export type Campaign = {
  id: string;
  name: string;
  channel: string;
  status: string;
  audience: string | null;
  content: string | null;
  cta: string | null;
  budget: number;
  created_at: string;
};

export type Automation = {
  id: string;
  name: string;
  trigger: string;
  enabled: boolean;
  steps: AutomationStep[];
  created_at: string;
};

export type AutomationStep = {
  id: string;
  type: 'condition' | 'ai_action' | 'action' | 'delay' | 'branch';
  label: string;
  config?: Record<string, unknown>;
};

export type AutomationRun = {
  id: string;
  automation_id: string;
  status: string;
  started_at: string;
  completed_at: string | null;
  log: { step: string; status: string; message: string; timestamp: string }[];
  error_message: string | null;
  duration_ms: number | null;
};

export type Task = {
  id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  priority: string;
  status: string;
  related_contact_id: string | null;
  created_at: string;
};

export type Meeting = {
  id: string;
  title: string;
  contact_id: string | null;
  scheduled_at: string;
  duration_minutes: number;
  status: string;
  agenda: string | null;
  notes: string | null;
  created_at: string;
};

export type Activity = {
  id: string;
  type: string;
  description: string;
  entity_id: string | null;
  created_at: string;
};

export type AIRecommendation = {
  id: string;
  type: string;
  title: string;
  description: string;
  priority: string;
  action_label: string | null;
  action_target: string | null;
  status: string;
  created_at: string;
};

async function fetchAll<T>(table: string, orderBy = 'created_at', ascending = false): Promise<T[]> {
  if (!supabaseReady) return [];
  const { data, error } = await supabase.from(table).select('*').order(orderBy, { ascending });
  if (error) {
    console.warn(`[platform] fetch ${table}:`, error.message);
    return [];
  }
  return (data ?? []) as T[];
}

export const contactsApi = {
  list: () => fetchAll<Contact>('contacts', 'created_at', false),
  create: async (input: Partial<Contact>) => {
    if (!supabaseReady) return null;
    const { data } = await supabase.from('contacts').insert(input).select().single();
    return data as Contact | null;
  },
  update: async (id: string, patch: Partial<Contact>) => {
    if (!supabaseReady) return null;
    const { data } = await supabase.from('contacts').update(patch).eq('id', id).select().single();
    return data as Contact | null;
  },
  remove: async (id: string) => {
    if (!supabaseReady) return;
    await supabase.from('contacts').delete().eq('id', id);
  },
};

export const dealsApi = {
  list: () => fetchAll<Deal>('deals', 'created_at', false),
  create: async (input: Partial<Deal>) => {
    if (!supabaseReady) return null;
    const { data } = await supabase.from('deals').insert(input).select().single();
    return data as Deal | null;
  },
  update: async (id: string, patch: Partial<Deal>) => {
    if (!supabaseReady) return null;
    const { data } = await supabase.from('deals').update(patch).eq('id', id).select().single();
    return data as Deal | null;
  },
  remove: async (id: string) => {
    if (!supabaseReady) return;
    await supabase.from('deals').delete().eq('id', id);
  },
};

export const campaignsApi = {
  list: () => fetchAll<Campaign>('campaigns', 'created_at', false),
  create: async (input: Partial<Campaign>) => {
    if (!supabaseReady) return null;
    const { data } = await supabase.from('campaigns').insert(input).select().single();
    return data as Campaign | null;
  },
  update: async (id: string, patch: Partial<Campaign>) => {
    if (!supabaseReady) return null;
    const { data } = await supabase.from('campaigns').update(patch).eq('id', id).select().single();
    return data as Campaign | null;
  },
  remove: async (id: string) => {
    if (!supabaseReady) return;
    await supabase.from('campaigns').delete().eq('id', id);
  },
};

export const automationsApi = {
  list: () => fetchAll<Automation>('automations', 'created_at', false),
  create: async (input: Partial<Automation>) => {
    if (!supabaseReady) return null;
    const { data } = await supabase.from('automations').insert(input).select().single();
    return data as Automation | null;
  },
  update: async (id: string, patch: Partial<Automation>) => {
    if (!supabaseReady) return null;
    const { data } = await supabase.from('automations').update(patch).eq('id', id).select().single();
    return data as Automation | null;
  },
  remove: async (id: string) => {
    if (!supabaseReady) return;
    await supabase.from('automations').delete().eq('id', id);
  },
};

export const automationRunsApi = {
  list: () => fetchAll<AutomationRun>('automation_runs', 'started_at', false),
  create: async (input: Partial<AutomationRun>) => {
    if (!supabaseReady) return null;
    const { data } = await supabase.from('automation_runs').insert(input).select().single();
    return data as AutomationRun | null;
  },
  update: async (id: string, patch: Partial<AutomationRun>) => {
    if (!supabaseReady) return null;
    const { data } = await supabase.from('automation_runs').update(patch).eq('id', id).select().single();
    return data as AutomationRun | null;
  },
};

export const tasksApi = {
  list: () => fetchAll<Task>('tasks', 'due_date', true),
  create: async (input: Partial<Task>) => {
    if (!supabaseReady) return null;
    const { data } = await supabase.from('tasks').insert(input).select().single();
    return data as Task | null;
  },
  update: async (id: string, patch: Partial<Task>) => {
    if (!supabaseReady) return null;
    const { data } = await supabase.from('tasks').update(patch).eq('id', id).select().single();
    return data as Task | null;
  },
  remove: async (id: string) => {
    if (!supabaseReady) return;
    await supabase.from('tasks').delete().eq('id', id);
  },
};

export const meetingsApi = {
  list: () => fetchAll<Meeting>('meetings', 'scheduled_at', true),
  create: async (input: Partial<Meeting>) => {
    if (!supabaseReady) return null;
    const { data } = await supabase.from('meetings').insert(input).select().single();
    return data as Meeting | null;
  },
  update: async (id: string, patch: Partial<Meeting>) => {
    if (!supabaseReady) return null;
    const { data } = await supabase.from('meetings').update(patch).eq('id', id).select().single();
    return data as Meeting | null;
  },
  remove: async (id: string) => {
    if (!supabaseReady) return;
    await supabase.from('meetings').delete().eq('id', id);
  },
};

export const activitiesApi = {
  list: () => fetchAll<Activity>('activities', 'created_at', false),
  create: async (input: Partial<Activity>) => {
    if (!supabaseReady) return null;
    const { data } = await supabase.from('activities').insert(input).select().single();
    return data as Activity | null;
  },
};

export const recommendationsApi = {
  list: () => fetchAll<AIRecommendation>('ai_recommendations', 'created_at', false),
  update: async (id: string, patch: Partial<AIRecommendation>) => {
    if (!supabaseReady) return null;
    const { data } = await supabase.from('ai_recommendations').update(patch).eq('id', id).select().single();
    return data as AIRecommendation | null;
  },
};
