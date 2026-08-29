/*
# Create leads, consultations, and quote_requests tables

## Purpose
Zyntiqo lead-generation system. Public website visitors submit project requests,
quote requests, and consultation bookings. These are stored as structured leads
for the Zyntiqo team. No user accounts / sign-in — the site is a public marketing
site, so the anon-key client must be able to insert new leads.

## 1. New Tables

### leads
Central record for every inbound inquiry.
- id (uuid, PK)
- full_name (text, required)
- business_name (text, optional)
- email (text, required)
- phone (text, optional)
- whatsapp (text, optional)
- website (text, optional)
- service (text, required)
- meeting_type (text, optional)
- requirements (text, optional)
- budget (text, optional)
- timeline (text, optional)
- lead_source (text, optional)
- meeting_date (date, optional)
- meeting_time (text, optional)
- timezone (text, optional)
- status (text, default 'New')
- created_at (timestamp with time zone, default now())

### consultations
Booking requests for consultations. Each consultation is linked to a lead.
- id (uuid, PK)
- lead_id (uuid, FK -> leads.id, required)
- service (text, required)
- meeting_type (text, required)
- meeting_date (date, required)
- meeting_time (text, required)
- timezone (text, required)
- duration_minutes (int, default 30)
- status (text, default 'Requested')
- calendar_event_id (text, optional)
- meeting_link (text, optional)
- notes (text, optional)
- created_at (timestamp with time zone, default now())

### quote_requests
Project quote requests. Each quote request is linked to a lead.
- id (uuid, PK)
- lead_id (uuid, FK -> leads.id, required)
- service (text, required)
- requirements (text, required)
- budget (text, optional)
- timeline (text, optional)
- status (text, default 'New')
- created_at (timestamp with time zone, default now())

## 2. Status values
- leads.status: New, Contacted, Qualified, Meeting Scheduled, Proposal Sent, Won, Lost
- consultations.status: Requested, Confirmed, Completed, Cancelled
- quote_requests.status: New, Reviewed, Quoted, Accepted, Rejected

## 3. Security (RLS)
- Enable RLS on all three tables.
- Public INSERT only (anon + authenticated can insert new leads/consultations/quotes).
- No public SELECT/UPDATE/DELETE — leads are private business data.
- No-auth public marketing site, so TO anon, authenticated on INSERT.
*/

CREATE TABLE IF NOT EXISTS leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  business_name text,
  email text NOT NULL,
  phone text,
  whatsapp text,
  website text,
  service text NOT NULL,
  meeting_type text,
  requirements text,
  budget text,
  timeline text,
  lead_source text,
  meeting_date date,
  meeting_time text,
  timezone text,
  status text NOT NULL DEFAULT 'New',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_insert_leads" ON leads;
CREATE POLICY "anon_insert_leads"
ON leads FOR INSERT
TO anon, authenticated WITH CHECK (true);

CREATE TABLE IF NOT EXISTS consultations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  service text NOT NULL,
  meeting_type text NOT NULL,
  meeting_date date NOT NULL,
  meeting_time text NOT NULL,
  timezone text NOT NULL,
  duration_minutes int NOT NULL DEFAULT 30,
  status text NOT NULL DEFAULT 'Requested',
  calendar_event_id text,
  meeting_link text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE consultations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_insert_consultations" ON consultations;
CREATE POLICY "anon_insert_consultations"
ON consultations FOR INSERT
TO anon, authenticated WITH CHECK (true);

CREATE TABLE IF NOT EXISTS quote_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  service text NOT NULL,
  requirements text NOT NULL,
  budget text,
  timeline text,
  status text NOT NULL DEFAULT 'New',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE quote_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_insert_quote_requests" ON quote_requests;
CREATE POLICY "anon_insert_quote_requests"
ON quote_requests FOR INSERT
TO anon, authenticated WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads (status);
CREATE INDEX IF NOT EXISTS idx_consultations_lead_id ON consultations (lead_id);
CREATE INDEX IF NOT EXISTS idx_quote_requests_lead_id ON quote_requests (lead_id);
