/*
# Create SaaS platform tables for Zyntiqo Pro

## Purpose
Extend the lead-gen schema with full CRM, automation, campaign, task,
meeting, activity, and AI recommendation tables for the Zyntiqo Pro
business operating platform. No user accounts / sign-in yet — the app
runs in single-tenant demo mode where the anon-key client can read and
write all platform data.

## 1. New Tables

### contacts
CRM contact records (customers + leads).
- id, name, email, phone, company, title, status (lead/customer/churned), source, tags (text[]), last_contacted_at, created_at

### deals
Sales pipeline opportunities.
- id, contact_id (FK contacts), title, value (numeric), stage (lead/qualified/proposal/negotiation/won/lost), probability (int), expected_close_date, notes, created_at

### campaigns
Marketing campaigns.
- id, name, channel (email/social/ad/blog), status (draft/active/paused/completed), audience, content, cta, budget (numeric), created_at

### automations
Workflow automation definitions.
- id, name, trigger, enabled (bool), steps (jsonb), created_at

### automation_runs
Execution history for automations.
- id, automation_id (FK), status (running/completed/failed), started_at, completed_at, log (jsonb)

### tasks
Tasks and follow-ups.
- id, title, description, due_date, priority (low/medium/high), status (todo/in_progress/done), related_contact_id (FK, nullable), created_at

### meetings
Meeting records.
- id, title, contact_id (FK, nullable), scheduled_at (timestamptz), duration_minutes, status (scheduled/completed/cancelled), agenda, notes, created_at

### activities
Activity feed / audit log.
- id, type (lead/contact/meeting/campaign/automation/task), description, entity_id (uuid, nullable), created_at

### ai_recommendations
Proactive AI suggestions.
- id, type, title, description, priority (low/medium/high), action_label, action_target, status (pending/done/dismissed), created_at

## 2. Security (RLS)
- Enable RLS on all tables.
- Single-tenant demo: anon + authenticated can do CRUD on all tables.
- USING (true) / WITH CHECK (true) is acceptable because there is no
  sign-in and all platform data is intentionally shared in this mode.
*/

CREATE TABLE IF NOT EXISTS contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text,
  phone text,
  company text,
  title text,
  status text NOT NULL DEFAULT 'lead',
  source text,
  tags text[] DEFAULT '{}',
  last_contacted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_crud_contacts" ON contacts;
CREATE POLICY "anon_crud_contacts" ON contacts FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "anon_insert_contacts" ON contacts FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_update_contacts" ON contacts FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_contacts" ON contacts FOR DELETE TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS deals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id uuid REFERENCES contacts(id) ON DELETE SET NULL,
  title text NOT NULL,
  value numeric DEFAULT 0,
  stage text NOT NULL DEFAULT 'lead',
  probability int DEFAULT 10,
  expected_close_date date,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_crud_deals" ON deals;
CREATE POLICY "anon_crud_deals" ON deals FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "anon_insert_deals" ON deals FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_update_deals" ON deals FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_deals" ON deals FOR DELETE TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  channel text NOT NULL DEFAULT 'email',
  status text NOT NULL DEFAULT 'draft',
  audience text,
  content text,
  cta text,
  budget numeric DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_crud_campaigns" ON campaigns;
CREATE POLICY "anon_crud_campaigns" ON campaigns FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "anon_insert_campaigns" ON campaigns FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_update_campaigns" ON campaigns FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_campaigns" ON campaigns FOR DELETE TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS automations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  trigger text NOT NULL,
  enabled boolean NOT NULL DEFAULT true,
  steps jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE automations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_crud_automations" ON automations;
CREATE POLICY "anon_crud_automations" ON automations FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "anon_insert_automations" ON automations FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_update_automations" ON automations FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_automations" ON automations FOR DELETE TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS automation_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  automation_id uuid REFERENCES automations(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'running',
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  log jsonb DEFAULT '[]'::jsonb
);

ALTER TABLE automation_runs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_crud_automation_runs" ON automation_runs;
CREATE POLICY "anon_crud_automation_runs" ON automation_runs FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "anon_insert_automation_runs" ON automation_runs FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_update_automation_runs" ON automation_runs FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_automation_runs" ON automation_runs FOR DELETE TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  due_date date,
  priority text NOT NULL DEFAULT 'medium',
  status text NOT NULL DEFAULT 'todo',
  related_contact_id uuid REFERENCES contacts(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_crud_tasks" ON tasks;
CREATE POLICY "anon_crud_tasks" ON tasks FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "anon_insert_tasks" ON tasks FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_update_tasks" ON tasks FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_tasks" ON tasks FOR DELETE TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS meetings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  contact_id uuid REFERENCES contacts(id) ON DELETE SET NULL,
  scheduled_at timestamptz NOT NULL,
  duration_minutes int NOT NULL DEFAULT 30,
  status text NOT NULL DEFAULT 'scheduled',
  agenda text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_crud_meetings" ON meetings;
CREATE POLICY "anon_crud_meetings" ON meetings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "anon_insert_meetings" ON meetings FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_update_meetings" ON meetings FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_meetings" ON meetings FOR DELETE TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL,
  description text NOT NULL,
  entity_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_crud_activities" ON activities;
CREATE POLICY "anon_crud_activities" ON activities FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "anon_insert_activities" ON activities FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_update_activities" ON activities FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_activities" ON activities FOR DELETE TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS ai_recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  priority text NOT NULL DEFAULT 'medium',
  action_label text,
  action_target text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE ai_recommendations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_crud_ai_recommendations" ON ai_recommendations;
CREATE POLICY "anon_crud_ai_recommendations" ON ai_recommendations FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "anon_insert_ai_recommendations" ON ai_recommendations FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_update_ai_recommendations" ON ai_recommendations FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_ai_recommendations" ON ai_recommendations FOR DELETE TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_contacts_status ON contacts (status);
CREATE INDEX IF NOT EXISTS idx_deals_stage ON deals (stage);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks (status);
CREATE INDEX IF NOT EXISTS idx_meetings_scheduled ON meetings (scheduled_at);
CREATE INDEX IF NOT EXISTS idx_activities_created ON activities (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_automation_runs_automation ON automation_runs (automation_id);
