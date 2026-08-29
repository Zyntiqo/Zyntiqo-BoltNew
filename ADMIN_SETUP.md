# Zyntiqo Pro — Admin Setup Guide

## First Admin Bootstrap

When a new user signs up through the Zyntiqo portal, they are automatically
assigned the `CUSTOMER` role. To access the admin panel at `/app`, a user
must have a staff role (`SUPER_ADMIN`, `ADMIN`, `SALES`, `PROJECT_MANAGER`,
or `SUPPORT`).

### How to Promote the First Admin

**Important:** This must be done manually in the Supabase dashboard or via
a SQL query. There is no UI for self-promotion — this is a security measure
to prevent customers from escalating their own privileges.

#### Option A: Supabase Dashboard SQL Editor

1. Sign up for an account at `/signup` (this creates your auth user and
   profile with role `CUSTOMER`).
2. Go to your Supabase project's SQL Editor.
3. Run the following SQL (replace the email with yours):

```sql
UPDATE profiles
SET role = 'SUPER_ADMIN'
WHERE email = 'your-email@example.com';
```

4. Log out and log back in. You will be redirected to `/app` (the admin
   panel) instead of `/portal` (the customer portal).

#### Option B: Using the Supabase MCP execute_sql tool

```sql
UPDATE profiles SET role = 'ADMIN' WHERE email = 'your-email@example.com';
```

### Role Hierarchy

| Role             | Access Level                                              |
|-----------------|----------------------------------------------------------|
| SUPER_ADMIN      | Full access to all admin features and data               |
| ADMIN            | Full admin access, can manage all resources              |
| SALES            | CRM, pipeline, quotes, invoices, meetings, customers    |
| PROJECT_MANAGER  | Projects, milestones, tasks, meetings                   |
| SUPPORT          | Support tickets, customer profiles, meetings             |
| CUSTOMER         | Customer portal only — projects, quotes, invoices, support|

### Promoting Other Staff Members

Once you have a SUPER_ADMIN or ADMIN account, you can promote other users
via the Supabase SQL Editor:

```sql
UPDATE profiles SET role = 'SALES' WHERE email = 'salesperson@example.com';
```

### Security Notes

- The `profiles` table RLS policy only allows users to update their own
  profile, and the `role` column cannot be changed by the user through
  the frontend — there is no UI field for it.
- Role changes must be done via direct database access (SQL Editor or
  MCP tool).
- The `handle_new_user` database trigger always sets new signups to
  `CUSTOMER` role — there is no way to sign up as staff.
