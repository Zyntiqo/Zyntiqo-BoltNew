import { supabase, supabaseReady } from '../supabase';

/**
 * Customer portal service layer.
 * All queries are scoped to the current authenticated user via RLS.
 */

export type Project = {
  id: string;
  customer_id: string;
  name: string;
  service: string | null;
  status: string;
  progress: number;
  start_date: string | null;
  expected_completion: string | null;
  assigned_staff: string[] | null;
  notes: string | null;
  website: string | null;
  created_at: string;
};

export type Milestone = {
  id: string;
  project_id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  completed: boolean;
  created_at: string;
};

export type Quote = {
  id: string;
  customer_id: string;
  project_id: string | null;
  quote_number: string;
  subject: string | null;
  description: string | null;
  amount: number;
  tax: number;
  discount: number;
  total: number;
  status: string;
  valid_until: string | null;
  customer_approved_at: string | null;
  customer_rejected_at: string | null;
  created_at: string;
};

export type QuoteItem = {
  id: string;
  quote_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
  created_at: string;
};

export type Invoice = {
  id: string;
  customer_id: string;
  project_id: string | null;
  invoice_number: string;
  amount: number;
  due_date: string | null;
  status: string;
  notes: string | null;
  created_at: string;
};

export type Payment = {
  id: string;
  invoice_id: string;
  amount: number;
  method: string | null;
  status: string;
  paid_at: string | null;
  created_at: string;
};

export type SupportTicket = {
  id: string;
  customer_id: string;
  subject: string;
  description: string | null;
  priority: string;
  status: string;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
};

export type TicketMessage = {
  id: string;
  ticket_id: string;
  author_id: string;
  message: string;
  is_staff: boolean;
  created_at: string;
};

export type ProjectFile = {
  id: string;
  project_id: string | null;
  customer_id: string;
  file_name: string;
  file_path: string;
  file_type: string | null;
  file_size: number | null;
  category: string;
  uploaded_by: string | null;
  created_at: string;
};

export type Notification = {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string | null;
  entity_id: string | null;
  read: boolean;
  created_at: string;
};

async function fetchAll<T>(table: string, orderBy = 'created_at', ascending = false): Promise<T[]> {
  if (!supabaseReady) return [];
  const { data, error } = await supabase.from(table).select('*').order(orderBy, { ascending });
  if (error) { console.warn(`[portal] fetch ${table}:`, error.message); return []; }
  return (data ?? []) as T[];
}

export const projectsApi = {
  list: () => fetchAll<Project>('projects', 'created_at', false),
  get: async (id: string) => {
    if (!supabaseReady) return null;
    const { data } = await supabase.from('projects').select('*').eq('id', id).maybeSingle();
    return data as Project | null;
  },
};

export const milestonesApi = {
  list: () => fetchAll<Milestone>('milestones', 'due_date', true),
  forProject: async (projectId: string) => {
    if (!supabaseReady) return [];
    const { data } = await supabase.from('milestones').select('*').eq('project_id', projectId).order('due_date', { ascending: true });
    return (data ?? []) as Milestone[];
  },
};

export const quotesApi = {
  list: () => fetchAll<Quote>('quotes', 'created_at', false),
  get: async (id: string) => {
    if (!supabaseReady) return null;
    const { data } = await supabase.from('quotes').select('*').eq('id', id).maybeSingle();
    return data as Quote | null;
  },
  update: async (id: string, patch: Partial<Quote>) => {
    if (!supabaseReady) return null;
    const { data } = await supabase.from('quotes').update(patch).eq('id', id).select().single();
    return data as Quote | null;
  },
};

export const quoteItemsApi = {
  forQuote: async (quoteId: string) => {
    if (!supabaseReady) return [];
    const { data } = await supabase.from('quote_items').select('*').eq('quote_id', quoteId).order('created_at', { ascending: true });
    return (data ?? []) as QuoteItem[];
  },
};

export const invoicesApi = {
  list: () => fetchAll<Invoice>('invoices', 'created_at', false),
};

export const paymentsApi = {
  forInvoice: async (invoiceId: string) => {
    if (!supabaseReady) return [];
    const { data } = await supabase.from('payments').select('*').eq('invoice_id', invoiceId).order('created_at', { ascending: false });
    return (data ?? []) as Payment[];
  },
};

export const ticketsApi = {
  list: () => fetchAll<SupportTicket>('support_tickets', 'created_at', false),
  create: async (input: Partial<SupportTicket>) => {
    if (!supabaseReady) return null;
    const { data } = await supabase.from('support_tickets').insert(input).select().single();
    return data as SupportTicket | null;
  },
  update: async (id: string, patch: Partial<SupportTicket>) => {
    if (!supabaseReady) return null;
    const { data } = await supabase.from('support_tickets').update(patch).eq('id', id).select().single();
    return data as SupportTicket | null;
  },
};

export const ticketMessagesApi = {
  forTicket: async (ticketId: string) => {
    if (!supabaseReady) return [];
    const { data } = await supabase.from('ticket_messages').select('*').eq('ticket_id', ticketId).order('created_at', { ascending: true });
    return (data ?? []) as TicketMessage[];
  },
  create: async (input: Partial<TicketMessage>) => {
    if (!supabaseReady) return null;
    const { data } = await supabase.from('ticket_messages').insert(input).select().single();
    return data as TicketMessage | null;
  },
};

export const filesApi = {
  list: () => fetchAll<ProjectFile>('project_files', 'created_at', false),
};

export const notificationsApi = {
  list: () => fetchAll<Notification>('notifications', 'created_at', false),
  markRead: async (id: string) => {
    if (!supabaseReady) return;
    await supabase.from('notifications').update({ read: true }).eq('id', id);
  },
};
