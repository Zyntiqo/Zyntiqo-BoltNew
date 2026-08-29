/*
# Multi-role SaaS platform: auth profiles, projects, quotes, invoices, support, notifications, files

## Purpose
Extend the existing Zyntiqo Pro schema with full multi-role SaaS entities.
This migration adds user profiles with roles, customer-facing projects,
quotes/invoices, support tickets, notifications, and file metadata.
All tables use RLS with auth.uid()-based ownership for customer isolation.

## 1. New Tables

### profiles
Extends auth.users with role and business info.
- id (uuid, PK, FK -> auth.users.id)
- email (text)
- full_name (text)
- business_name (text, nullable)
- phone (text, nullable)
- website (text, nullable)
- role (text, default 'CUSTOMER') — SUPER_ADMIN, ADMIN, SALES, PROJECT_MANAGER, SUPPORT, CUSTOMER
- created_at (timestamptz, default now())

### projects
Customer-facing projects managed by Zyntiqo staff.
- id, customer_id (FK -> profiles), name, service, status (Planning/In Progress/Review/Completed/On Hold), progress (int 0-100), start_date, expected_completion, assigned_staff (text[]), notes, created_at

### milestones
Project milestones.
- id, project_id (FK -> projects), title, description, due_date, completed (bool), created_at

### quotes
Customer-facing quotations.
- id, customer_id (FK -> profiles), project_id (FK -> projects, nullable), quote_number, subject, description, amount (numeric), tax (numeric, default 0), discount (numeric, default 0), total (numeric), status (Draft/Sent/Viewed/Approved/Rejected/Expired), valid_until (date), customer_approved_at (timestamptz, nullable), customer_rejected_at (timestamptz, nullable), created_at

### quote_items
Line items for a quote.
- id, quote_id (FK -> quotes), description, quantity (numeric, default 1), unit_price (numeric), total (numeric), created_at

### invoices
Customer invoices.
- id, customer_id (FK -> profiles), project_id (FK -> projects, nullable), invoice_number, amount (numeric), due_date (date), status (Draft/Sent/Paid/Partially Paid/Overdue/Cancelled), notes, created_at

### payments
Payment records for invoices.
- id, invoice_id (FK -> invoices), amount (numeric), method (text), status (Pending/Completed/Failed), paid_at (timestamptz, nullable), created_at

### support_tickets
Customer support tickets.
- id, customer_id (FK -> profiles), subject, description, priority (Low/Medium/High/Urgent), status (Open/In Progress/Waiting for Customer/Resolved/Closed), assigned_to (text, nullable), created_at, updated_at

### ticket_messages
Messages/replies on a support ticket.
- id, ticket_id (FK -> support_tickets), author_id (FK -> profiles), message, is_staff (bool, default false), created_at

### notifications
In-app notifications for users.
- id, user_id (FK -> profiles), type, title, message, entity_id (uuid, nullable), read (bool, default false), created_at

### project_files
File metadata for customer/staff files (actual storage is via Supabase Storage or external).
- id, project_id (FK -> projects, nullable), customer_id (FK -> profiles), file_name, file_path, file_type, file_size (bigint), category (Project Document/Brand Asset/Invoice/Quote/Deliverable), uploaded_by (FK -> profiles), created_at

## 2. Security (RLS)
- Enable RLS on all tables.
- profiles: users can read/update their own profile; staff (role IN ADMIN, SALES, PROJECT_MANAGER, SUPPORT, SUPER_ADMIN) can read all.
- projects: customers see their own; staff see all.
- milestones: customers see milestones for their projects; staff see all.
- quotes: customers see their own quotes; staff see all.
- quote_items: accessible via quote ownership.
- invoices: customers see their own; staff see all.
- payments: customers see payments for their invoices; staff see all.
- support_tickets: customers see their own; staff see all.
- ticket_messages: participants in the ticket can read; ticket owner or staff can write.
- notifications: users see only their own notifications.
- project_files: customers see files for their projects; staff see all.
*/

-- profiles
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text NOT NULL,
  business_name text,
  phone text,
  website text,
  role text NOT NULL DEFAULT 'CUSTOMER',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_profile" ON profiles;
CREATE POLICY "select_own_profile" ON profiles FOR SELECT
  TO authenticated USING (auth.uid() = id OR EXISTS (
    SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('SUPER_ADMIN','ADMIN','SALES','PROJECT_MANAGER','SUPPORT')
  ));

DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "insert_own_profile" ON profiles;
CREATE POLICY "insert_own_profile" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

-- projects
CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  service text,
  status text NOT NULL DEFAULT 'Planning',
  progress int NOT NULL DEFAULT 0,
  start_date date,
  expected_completion date,
  assigned_staff text[] DEFAULT '{}',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_projects" ON projects;
CREATE POLICY "select_projects" ON projects FOR SELECT
  TO authenticated USING (
    customer_id = auth.uid() OR EXISTS (
      SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('SUPER_ADMIN','ADMIN','SALES','PROJECT_MANAGER','SUPPORT')
    )
  );

DROP POLICY IF EXISTS "insert_projects_staff" ON projects;
CREATE POLICY "insert_projects_staff" ON projects FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('SUPER_ADMIN','ADMIN','SALES','PROJECT_MANAGER'))
  );

DROP POLICY IF EXISTS "update_projects_staff" ON projects;
CREATE POLICY "update_projects_staff" ON projects FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('SUPER_ADMIN','ADMIN','SALES','PROJECT_MANAGER'))
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('SUPER_ADMIN','ADMIN','SALES','PROJECT_MANAGER'))
  );

DROP POLICY IF EXISTS "delete_projects_staff" ON projects;
CREATE POLICY "delete_projects_staff" ON projects FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('SUPER_ADMIN','ADMIN'))
  );

-- milestones
CREATE TABLE IF NOT EXISTS milestones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  due_date date,
  completed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_milestones" ON milestones;
CREATE POLICY "select_milestones" ON milestones FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM projects WHERE projects.id = milestones.project_id AND projects.customer_id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('SUPER_ADMIN','ADMIN','SALES','PROJECT_MANAGER','SUPPORT'))
  );

DROP POLICY IF EXISTS "insert_milestones_staff" ON milestones;
CREATE POLICY "insert_milestones_staff" ON milestones FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('SUPER_ADMIN','ADMIN','SALES','PROJECT_MANAGER'))
  );

DROP POLICY IF EXISTS "update_milestones_staff" ON milestones;
CREATE POLICY "update_milestones_staff" ON milestones FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('SUPER_ADMIN','ADMIN','SALES','PROJECT_MANAGER'))
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('SUPER_ADMIN','ADMIN','SALES','PROJECT_MANAGER'))
  );

DROP POLICY IF EXISTS "delete_milestones_staff" ON milestones;
CREATE POLICY "delete_milestones_staff" ON milestones FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('SUPER_ADMIN','ADMIN','PROJECT_MANAGER'))
  );

-- quotes
CREATE TABLE IF NOT EXISTS quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  project_id uuid REFERENCES projects(id) ON DELETE SET NULL,
  quote_number text NOT NULL,
  subject text,
  description text,
  amount numeric NOT NULL DEFAULT 0,
  tax numeric NOT NULL DEFAULT 0,
  discount numeric NOT NULL DEFAULT 0,
  total numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'Draft',
  valid_until date,
  customer_approved_at timestamptz,
  customer_rejected_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_quotes" ON quotes;
CREATE POLICY "select_quotes" ON quotes FOR SELECT
  TO authenticated USING (
    customer_id = auth.uid() OR EXISTS (
      SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('SUPER_ADMIN','ADMIN','SALES','PROJECT_MANAGER','SUPPORT')
    )
  );

DROP POLICY IF EXISTS "insert_quotes_staff" ON quotes;
CREATE POLICY "insert_quotes_staff" ON quotes FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('SUPER_ADMIN','ADMIN','SALES','PROJECT_MANAGER'))
  );

DROP POLICY IF EXISTS "update_quotes" ON quotes;
CREATE POLICY "update_quotes" ON quotes FOR UPDATE
  TO authenticated USING (
    customer_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('SUPER_ADMIN','ADMIN','SALES','PROJECT_MANAGER'))
  ) WITH CHECK (
    customer_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('SUPER_ADMIN','ADMIN','SALES','PROJECT_MANAGER'))
  );

DROP POLICY IF EXISTS "delete_quotes_staff" ON quotes;
CREATE POLICY "delete_quotes_staff" ON quotes FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('SUPER_ADMIN','ADMIN','SALES'))
  );

-- quote_items
CREATE TABLE IF NOT EXISTS quote_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id uuid NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
  description text NOT NULL,
  quantity numeric NOT NULL DEFAULT 1,
  unit_price numeric NOT NULL DEFAULT 0,
  total numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE quote_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_quote_items" ON quote_items;
CREATE POLICY "select_quote_items" ON quote_items FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM quotes WHERE quotes.id = quote_items.quote_id AND quotes.customer_id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('SUPER_ADMIN','ADMIN','SALES','PROJECT_MANAGER','SUPPORT'))
  );

DROP POLICY IF EXISTS "insert_quote_items_staff" ON quote_items;
CREATE POLICY "insert_quote_items_staff" ON quote_items FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('SUPER_ADMIN','ADMIN','SALES','PROJECT_MANAGER'))
  );

DROP POLICY IF EXISTS "delete_quote_items_staff" ON quote_items;
CREATE POLICY "delete_quote_items_staff" ON quote_items FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('SUPER_ADMIN','ADMIN','SALES','PROJECT_MANAGER'))
  );

-- invoices
CREATE TABLE IF NOT EXISTS invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  project_id uuid REFERENCES projects(id) ON DELETE SET NULL,
  invoice_number text NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  due_date date,
  status text NOT NULL DEFAULT 'Draft',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_invoices" ON invoices;
CREATE POLICY "select_invoices" ON invoices FOR SELECT
  TO authenticated USING (
    customer_id = auth.uid() OR EXISTS (
      SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('SUPER_ADMIN','ADMIN','SALES','PROJECT_MANAGER','SUPPORT')
    )
  );

DROP POLICY IF EXISTS "insert_invoices_staff" ON invoices;
CREATE POLICY "insert_invoices_staff" ON invoices FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('SUPER_ADMIN','ADMIN','SALES'))
  );

DROP POLICY IF EXISTS "update_invoices_staff" ON invoices;
CREATE POLICY "update_invoices_staff" ON invoices FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('SUPER_ADMIN','ADMIN','SALES'))
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('SUPER_ADMIN','ADMIN','SALES'))
  );

DROP POLICY IF EXISTS "delete_invoices_staff" ON invoices;
CREATE POLICY "delete_invoices_staff" ON invoices FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('SUPER_ADMIN','ADMIN'))
  );

-- payments
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  amount numeric NOT NULL DEFAULT 0,
  method text,
  status text NOT NULL DEFAULT 'Pending',
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_payments" ON payments;
CREATE POLICY "select_payments" ON payments FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM invoices WHERE invoices.id = payments.invoice_id AND invoices.customer_id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('SUPER_ADMIN','ADMIN','SALES','SUPPORT'))
  );

DROP POLICY IF EXISTS "insert_payments_staff" ON payments;
CREATE POLICY "insert_payments_staff" ON payments FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('SUPER_ADMIN','ADMIN','SALES'))
  );

-- support_tickets
CREATE TABLE IF NOT EXISTS support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  subject text NOT NULL,
  description text,
  priority text NOT NULL DEFAULT 'Medium',
  status text NOT NULL DEFAULT 'Open',
  assigned_to text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_tickets" ON support_tickets;
CREATE POLICY "select_tickets" ON support_tickets FOR SELECT
  TO authenticated USING (
    customer_id = auth.uid() OR EXISTS (
      SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('SUPER_ADMIN','ADMIN','SUPPORT','SALES','PROJECT_MANAGER')
    )
  );

DROP POLICY IF EXISTS "insert_tickets" ON support_tickets;
CREATE POLICY "insert_tickets" ON support_tickets FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = customer_id OR EXISTS (
    SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('SUPER_ADMIN','ADMIN','SUPPORT')
  ));

DROP POLICY IF EXISTS "update_tickets" ON support_tickets;
CREATE POLICY "update_tickets" ON support_tickets FOR UPDATE
  TO authenticated USING (
    customer_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('SUPER_ADMIN','ADMIN','SUPPORT','SALES','PROJECT_MANAGER'))
  ) WITH CHECK (
    customer_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('SUPER_ADMIN','ADMIN','SUPPORT','SALES','PROJECT_MANAGER'))
  );

-- ticket_messages
CREATE TABLE IF NOT EXISTS ticket_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  message text NOT NULL,
  is_staff boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE ticket_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_ticket_messages" ON ticket_messages;
CREATE POLICY "select_ticket_messages" ON ticket_messages FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM support_tickets WHERE support_tickets.id = ticket_messages.ticket_id AND support_tickets.customer_id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('SUPER_ADMIN','ADMIN','SUPPORT','SALES','PROJECT_MANAGER'))
  );

DROP POLICY IF EXISTS "insert_ticket_messages" ON ticket_messages;
CREATE POLICY "insert_ticket_messages" ON ticket_messages FOR INSERT
  TO authenticated WITH CHECK (
    auth.uid() = author_id AND (
      EXISTS (SELECT 1 FROM support_tickets WHERE support_tickets.id = ticket_messages.ticket_id AND support_tickets.customer_id = auth.uid())
      OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('SUPER_ADMIN','ADMIN','SUPPORT','SALES','PROJECT_MANAGER'))
    )
  );

-- notifications
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  message text,
  entity_id uuid,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_notifications" ON notifications;
CREATE POLICY "select_own_notifications" ON notifications FOR SELECT
  TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "update_own_notifications" ON notifications;
CREATE POLICY "update_own_notifications" ON notifications FOR UPDATE
  TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "insert_own_notifications" ON notifications;
CREATE POLICY "insert_own_notifications" ON notifications FOR INSERT
  TO authenticated WITH CHECK (user_id = auth.uid());

-- project_files
CREATE TABLE IF NOT EXISTS project_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE SET NULL,
  customer_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_path text NOT NULL,
  file_type text,
  file_size bigint,
  category text NOT NULL DEFAULT 'Project Document',
  uploaded_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE project_files ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_files" ON project_files;
CREATE POLICY "select_files" ON project_files FOR SELECT
  TO authenticated USING (
    customer_id = auth.uid() OR EXISTS (
      SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('SUPER_ADMIN','ADMIN','SALES','PROJECT_MANAGER','SUPPORT')
    )
  );

DROP POLICY IF EXISTS "insert_files_staff" ON project_files;
CREATE POLICY "insert_files_staff" ON project_files FOR INSERT
  TO authenticated WITH CHECK (
    auth.uid() = uploaded_by AND EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('SUPER_ADMIN','ADMIN','SALES','PROJECT_MANAGER','SUPPORT'))
  );

DROP POLICY IF EXISTS "delete_files_staff" ON project_files;
CREATE POLICY "delete_files_staff" ON project_files FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('SUPER_ADMIN','ADMIN','PROJECT_MANAGER'))
  );

-- Indexes
CREATE INDEX IF NOT EXISTS idx_projects_customer ON projects (customer_id);
CREATE INDEX IF NOT EXISTS idx_quotes_customer ON quotes (customer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_customer ON invoices (customer_id);
CREATE INDEX IF NOT EXISTS idx_tickets_customer ON support_tickets (customer_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications (user_id);
CREATE INDEX IF NOT EXISTS idx_milestones_project ON milestones (project_id);
CREATE INDEX IF NOT EXISTS idx_quote_items_quote ON quote_items (quote_id);
CREATE INDEX IF NOT EXISTS idx_payments_invoice ON payments (invoice_id);
CREATE INDEX IF NOT EXISTS idx_ticket_messages_ticket ON ticket_messages (ticket_id);
CREATE INDEX IF NOT EXISTS idx_files_customer ON project_files (customer_id);
