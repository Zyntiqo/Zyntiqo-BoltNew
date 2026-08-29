ALTER TABLE leads ADD COLUMN IF NOT EXISTS email_status text DEFAULT 'pending';
