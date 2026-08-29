/*
# Tighten RLS on old SaaS platform tables

## Purpose
The original SaaS platform tables (contacts, deals, campaigns, automations,
automation_runs, tasks, meetings, activities, ai_recommendations) were
created with `USING (true)` policies for both anon and authenticated roles.
Now that the app has proper authentication, these admin-only tables should
NOT be accessible to the anon role. Only authenticated staff users should
be able to read and write these tables.

## Changes
- Drop the old `anon_*` policies on each table.
- Create new `staff_*` policies that require `TO authenticated` and check
  that the user has a staff role (SUPER_ADMIN, ADMIN, SALES,
  PROJECT_MANAGER, SUPPORT) in the profiles table.
- This does NOT affect the `leads`, `consultations`, or `quote_requests`
  tables which remain writable by anon (for public website form submissions).

## Security
- Anon role loses all access to these tables.
- Authenticated customers (role = CUSTOMER) also lose access — only staff
  roles can read/write.
- Customer-facing data (projects, quotes, invoices, etc.) is in separate
  tables with proper customer-scoped RLS.
*/

-- Helper: a reusable staff check expression
-- We inline it in each policy since RLS doesn't support function calls
-- in USING for performance reasons, but the pattern is:
-- EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('SUPER_ADMIN','ADMIN','SALES','PROJECT_MANAGER','SUPPORT'))

-- contacts
DROP POLICY IF EXISTS "anon_crud_contacts" ON contacts;
DROP POLICY IF EXISTS "anon_insert_contacts" ON contacts;
DROP POLICY IF EXISTS "anon_update_contacts" ON contacts;
DROP POLICY IF EXISTS "anon_delete_contacts" ON contacts;

CREATE POLICY "staff_select_contacts" ON contacts FOR SELECT
  TO authenticated USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('SUPER_ADMIN','ADMIN','SALES','PROJECT_MANAGER','SUPPORT')));
CREATE POLICY "staff_insert_contacts" ON contacts FOR INSERT
  TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('SUPER_ADMIN','ADMIN','SALES','PROJECT_MANAGER','SUPPORT')));
CREATE POLICY "staff_update_contacts" ON contacts FOR UPDATE
  TO authenticated USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('SUPER_ADMIN','ADMIN','SALES','PROJECT_MANAGER','SUPPORT')))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('SUPER_ADMIN','ADMIN','SALES','PROJECT_MANAGER','SUPPORT')));
CREATE POLICY "staff_delete_contacts" ON contacts FOR DELETE
  TO authenticated USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('SUPER_ADMIN','ADMIN','SALES')));

-- deals
DROP POLICY IF EXISTS "anon_crud_deals" ON deals;
DROP POLICY IF EXISTS "anon_insert_deals" ON deals;
DROP POLICY IF EXISTS "anon_update_deals" ON deals;
DROP POLICY IF EXISTS "anon_delete_deals" ON deals;

CREATE POLICY "staff_select_deals" ON deals FOR SELECT
  TO authenticated USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('SUPER_ADMIN','ADMIN','SALES','PROJECT_MANAGER','SUPPORT')));
CREATE POLICY "staff_insert_deals" ON deals FOR INSERT
  TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('SUPER_ADMIN','ADMIN','SALES','PROJECT_MANAGER')));
CREATE POLICY "staff_update_deals" ON deals FOR UPDATE
  TO authenticated USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('SUPER_ADMIN','ADMIN','SALES','PROJECT_MANAGER')))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('SUPER_ADMIN','ADMIN','SALES','PROJECT_MANAGER')));
CREATE POLICY "staff_delete_deals" ON deals FOR DELETE
  TO authenticated USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('SUPER_ADMIN','ADMIN','SALES')));

-- campaigns
DROP POLICY IF EXISTS "anon_crud_campaigns" ON campaigns;
DROP POLICY IF EXISTS "anon_insert_campaigns" ON campaigns;
DROP POLICY IF EXISTS "anon_update_campaigns" ON campaigns;
DROP POLICY IF EXISTS "anon_delete_campaigns" ON campaigns;

CREATE POLICY "staff_select_campaigns" ON campaigns FOR SELECT
  TO authenticated USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('SUPER_ADMIN','ADMIN','SALES','PROJECT_MANAGER','SUPPORT')));
CREATE POLICY "staff_insert_campaigns" ON campaigns FOR INSERT
  TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('SUPER_ADMIN','ADMIN','SALES','PROJECT_MANAGER')));
CREATE POLICY "staff_update_campaigns" ON campaigns FOR UPDATE
  TO authenticated USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('SUPER_ADMIN','ADMIN','SALES','PROJECT_MANAGER')))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('SUPER_ADMIN','ADMIN','SALES','PROJECT_MANAGER')));
CREATE POLICY "staff_delete_campaigns" ON campaigns FOR DELETE
  TO authenticated USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('SUPER_ADMIN','ADMIN','SALES')));

-- automations
DROP POLICY IF EXISTS "anon_crud_automations" ON automations;
DROP POLICY IF EXISTS "anon_insert_automations" ON automations;
DROP POLICY IF EXISTS "anon_update_automations" ON automations;
DROP POLICY IF EXISTS "anon_delete_automations" ON automations;

CREATE POLICY "staff_select_automations" ON automations FOR SELECT
  TO authenticated USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('SUPER_ADMIN','ADMIN','SALES','PROJECT_MANAGER','SUPPORT')));
CREATE POLICY "staff_insert_automations" ON automations FOR INSERT
  TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('SUPER_ADMIN','ADMIN','SALES','PROJECT_MANAGER')));
CREATE POLICY "staff_update_automations" ON automations FOR UPDATE
  TO authenticated USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('SUPER_ADMIN','ADMIN','SALES','PROJECT_MANAGER')))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('SUPER_ADMIN','ADMIN','SALES','PROJECT_MANAGER')));
CREATE POLICY "staff_delete_automations" ON automations FOR DELETE
  TO authenticated USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('SUPER_ADMIN','ADMIN')));

-- automation_runs
DROP POLICY IF EXISTS "anon_crud_automation_runs" ON automation_runs;
DROP POLICY IF EXISTS "anon_insert_automation_runs" ON automation_runs;
DROP POLICY IF EXISTS "anon_update_automation_runs" ON automation_runs;
DROP POLICY IF EXISTS "anon_delete_automation_runs" ON automation_runs;

CREATE POLICY "staff_select_automation_runs" ON automation_runs FOR SELECT
  TO authenticated USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('SUPER_ADMIN','ADMIN','SALES','PROJECT_MANAGER','SUPPORT')));
CREATE POLICY "staff_insert_automation_runs" ON automation_runs FOR INSERT
  TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('SUPER_ADMIN','ADMIN','SALES','PROJECT_MANAGER')));
CREATE POLICY "staff_update_automation_runs" ON automation_runs FOR UPDATE
  TO authenticated USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('SUPER_ADMIN','ADMIN','SALES','PROJECT_MANAGER')))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('SUPER_ADMIN','ADMIN','SALES','PROJECT_MANAGER')));
CREATE POLICY "staff_delete_automation_runs" ON automation_runs FOR DELETE
  TO authenticated USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('SUPER_ADMIN','ADMIN')));

-- tasks (admin tasks, not customer-facing)
DROP POLICY IF EXISTS "anon_crud_tasks" ON tasks;
DROP POLICY IF EXISTS "anon_insert_tasks" ON tasks;
DROP POLICY IF EXISTS "anon_update_tasks" ON tasks;
DROP POLICY IF EXISTS "anon_delete_tasks" ON tasks;

CREATE POLICY "staff_select_tasks" ON tasks FOR SELECT
  TO authenticated USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('SUPER_ADMIN','ADMIN','SALES','PROJECT_MANAGER','SUPPORT')));
CREATE POLICY "staff_insert_tasks" ON tasks FOR INSERT
  TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('SUPER_ADMIN','ADMIN','SALES','PROJECT_MANAGER','SUPPORT')));
CREATE POLICY "staff_update_tasks" ON tasks FOR UPDATE
  TO authenticated USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('SUPER_ADMIN','ADMIN','SALES','PROJECT_MANAGER','SUPPORT')))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('SUPER_ADMIN','ADMIN','SALES','PROJECT_MANAGER','SUPPORT')));
CREATE POLICY "staff_delete_tasks" ON tasks FOR DELETE
  TO authenticated USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('SUPER_ADMIN','ADMIN','SALES','PROJECT_MANAGER')));

-- meetings (admin meetings, not customer-facing)
DROP POLICY IF EXISTS "anon_crud_meetings" ON meetings;
DROP POLICY IF EXISTS "anon_insert_meetings" ON meetings;
DROP POLICY IF EXISTS "anon_update_meetings" ON meetings;
DROP POLICY IF EXISTS "anon_delete_meetings" ON meetings;

CREATE POLICY "staff_select_meetings" ON meetings FOR SELECT
  TO authenticated USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('SUPER_ADMIN','ADMIN','SALES','PROJECT_MANAGER','SUPPORT')));
CREATE POLICY "staff_insert_meetings" ON meetings FOR INSERT
  TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('SUPER_ADMIN','ADMIN','SALES','PROJECT_MANAGER')));
CREATE POLICY "staff_update_meetings" ON meetings FOR UPDATE
  TO authenticated USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('SUPER_ADMIN','ADMIN','SALES','PROJECT_MANAGER')))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('SUPER_ADMIN','ADMIN','SALES','PROJECT_MANAGER')));
CREATE POLICY "staff_delete_meetings" ON meetings FOR DELETE
  TO authenticated USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('SUPER_ADMIN','ADMIN','SALES','PROJECT_MANAGER')));

-- activities (admin activity log)
DROP POLICY IF EXISTS "anon_crud_activities" ON activities;
DROP POLICY IF EXISTS "anon_insert_activities" ON activities;
DROP POLICY IF EXISTS "anon_update_activities" ON activities;
DROP POLICY IF EXISTS "anon_delete_activities" ON activities;

CREATE POLICY "staff_select_activities" ON activities FOR SELECT
  TO authenticated USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('SUPER_ADMIN','ADMIN','SALES','PROJECT_MANAGER','SUPPORT')));
CREATE POLICY "staff_insert_activities" ON activities FOR INSERT
  TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('SUPER_ADMIN','ADMIN','SALES','PROJECT_MANAGER','SUPPORT')));
CREATE POLICY "staff_update_activities" ON activities FOR UPDATE
  TO authenticated USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('SUPER_ADMIN','ADMIN')))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('SUPER_ADMIN','ADMIN')));
CREATE POLICY "staff_delete_activities" ON activities FOR DELETE
  TO authenticated USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('SUPER_ADMIN','ADMIN')));

-- ai_recommendations (admin only)
DROP POLICY IF EXISTS "anon_crud_ai_recommendations" ON ai_recommendations;
DROP POLICY IF EXISTS "anon_insert_ai_recommendations" ON ai_recommendations;
DROP POLICY IF EXISTS "anon_update_ai_recommendations" ON ai_recommendations;
DROP POLICY IF EXISTS "anon_delete_ai_recommendations" ON ai_recommendations;

CREATE POLICY "staff_select_ai_recommendations" ON ai_recommendations FOR SELECT
  TO authenticated USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('SUPER_ADMIN','ADMIN','SALES','PROJECT_MANAGER','SUPPORT')));
CREATE POLICY "staff_insert_ai_recommendations" ON ai_recommendations FOR INSERT
  TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('SUPER_ADMIN','ADMIN','SALES','PROJECT_MANAGER','SUPPORT')));
CREATE POLICY "staff_update_ai_recommendations" ON ai_recommendations FOR UPDATE
  TO authenticated USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('SUPER_ADMIN','ADMIN','SALES','PROJECT_MANAGER','SUPPORT')))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('SUPER_ADMIN','ADMIN','SALES','PROJECT_MANAGER','SUPPORT')));
CREATE POLICY "staff_delete_ai_recommendations" ON ai_recommendations FOR DELETE
  TO authenticated USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('SUPER_ADMIN','ADMIN')));
