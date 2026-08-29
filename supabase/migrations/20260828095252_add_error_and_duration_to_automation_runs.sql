/*
# Add error_message and duration_ms to automation_runs

1. Modified Tables
- `automation_runs`: add `error_message` (text, nullable) to store failure details
- `automation_runs`: add `duration_ms` (integer, nullable) to store execution duration in milliseconds
2. Security
- No security changes. RLS already enabled on this table.
3. Notes
- Both columns are nullable so existing run records remain valid.
*/

ALTER TABLE automation_runs ADD COLUMN IF NOT EXISTS error_message text;
ALTER TABLE automation_runs ADD COLUMN IF NOT EXISTS duration_ms integer;
