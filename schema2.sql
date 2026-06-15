Add the following tables and columns to the existing FreightAudit AI schema:

1. ALTER TABLE organizations to add:
   - plan (text, default 'starter') — values: starter | professional | enterprise
   - seat_limit (int, default 3)
   - invoice_limit_per_month (int, default 100)
   - invoices_used_this_month (int, default 0)
   - billing_reset_date (date)
   - stripe_customer_id (text, nullable)

2. CREATE TABLE org_members:
   - id (uuid, pk, default gen_random_uuid())
   - org_id (uuid, fk organizations, on delete cascade)
   - user_id (uuid, fk auth.users, on delete cascade)
   - role (text, not null) — values: admin | logistics_manager | finance_clerk | operations_coordinator
   - invited_by (uuid, fk auth.users)
   - status (text, default 'active') — active | invited | suspended
   - joined_at (timestamptz, default now())
   - UNIQUE(org_id, user_id)

3. CREATE TABLE invoice_batches:
   - id (uuid, pk, default gen_random_uuid())
   - org_id (uuid, fk organizations)
   - uploaded_by (uuid, fk auth.users)
   - original_file_name (text)
   - original_file_url (text)
   - total_pages (int)
   - detected_invoice_count (int)
   - status (text, default 'splitting') — splitting | split_preview | processing | completed | failed
   - split_result (jsonb) — stores Veryfi splitter response
   - invoice_ids (uuid[]) — array of invoice IDs created from this batch
   - created_at (timestamptz, default now())
   - completed_at (timestamptz)

4. ALTER TABLE invoices to add:
   - batch_id (uuid, fk invoice_batches, nullable) — null for single uploads

5. UPDATE RLS policies:
   For org_members: users can SELECT their own org's members.
   Only admin role can INSERT/UPDATE/DELETE org_members.
   For invoice_batches: same org_id restriction as invoices.

6. Create a helper function:
   get_user_role(org_id uuid) RETURNS text
   Returns the role of auth.uid() in the given org from org_members table.
   Used in RLS policies and application logic.