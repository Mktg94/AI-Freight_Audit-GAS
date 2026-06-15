-- ==========================================
-- FreightAudit AI - Migration: Invite System + Org Members Fixes
-- Safe to run on existing data. Does NOT drop/recreate tables.
-- ==========================================

-- =============================================
-- 1. Fix get_user_org_id() — also check org_members for non-owner staff
-- =============================================
CREATE OR REPLACE FUNCTION public.get_user_org_id()
RETURNS UUID AS $$
DECLARE
    org_id_val UUID;
BEGIN
    -- First check if user is owner
    SELECT id INTO org_id_val 
    FROM public.organizations 
    WHERE owner_id = auth.uid() 
    LIMIT 1;
    
    -- If not owner, check org_members
    IF org_id_val IS NULL THEN
        SELECT org_id INTO org_id_val
        FROM public.org_members
        WHERE user_id = auth.uid() AND status = 'active'
        LIMIT 1;
    END IF;
    
    RETURN org_id_val;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- 2. Create get_user_role() helper function
-- =============================================
CREATE OR REPLACE FUNCTION public.get_user_role(org_id UUID)
RETURNS TEXT AS $$
DECLARE
    user_role TEXT;
BEGIN
    SELECT role INTO user_role
    FROM public.org_members
    WHERE org_id = get_user_role.org_id 
      AND user_id = auth.uid() 
      AND status = 'active';
    
    RETURN user_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- 3. Alter org_members — make user_id nullable, add invite columns
-- =============================================
ALTER TABLE public.org_members 
    ALTER COLUMN user_id DROP NOT NULL;

ALTER TABLE public.org_members
    ADD COLUMN IF NOT EXISTS email TEXT,
    ADD COLUMN IF NOT EXISTS invite_token TEXT,
    ADD COLUMN IF NOT EXISTS invited_at TIMESTAMPTZ DEFAULT now(),
    ADD COLUMN IF NOT EXISTS invite_expires_at TIMESTAMPTZ DEFAULT (now() + interval '7 days'),
    ADD COLUMN IF NOT EXISTS invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS full_name TEXT;

-- Backfill email for existing rows where email is NULL
UPDATE public.org_members om
SET email = u.email
FROM auth.users u
WHERE om.user_id = u.id AND om.email IS NULL;

-- =============================================
-- 4. Update constraints — from (org_id, user_id) to (org_id, email)
-- =============================================
ALTER TABLE public.org_members DROP CONSTRAINT IF EXISTS org_members_org_id_user_id_key;

-- Create partial unique index for invited-by-email (user_id IS NULL)
CREATE UNIQUE INDEX IF NOT EXISTS org_members_active_invite_idx 
    ON public.org_members(org_id, email) 
    WHERE status = 'invited' AND user_id IS NULL;

-- Create unique index for active members by user_id
CREATE UNIQUE INDEX IF NOT EXISTS org_members_active_user_idx 
    ON public.org_members(org_id, user_id) 
    WHERE user_id IS NOT NULL;

-- =============================================
-- 5. Update org_member_details view — LEFT JOIN for nullable user_id
-- =============================================
CREATE OR REPLACE VIEW public.org_member_details AS
SELECT 
    om.id,
    om.org_id,
    om.user_id,
    om.role,
    om.status,
    om.email,
    om.invite_token,
    om.invited_at,
    om.invite_expires_at,
    om.invited_by,
    om.full_name,
    om.created_at,
    u.email as user_email,
    u.raw_user_meta_data->>'full_name' as user_full_name
FROM public.org_members om
LEFT JOIN auth.users u ON om.user_id = u.id;

GRANT SELECT ON public.org_member_details TO authenticated;

-- =============================================
-- 6. Update RLS policies for org_members
-- =============================================
DROP POLICY IF EXISTS "Admin can modify organization members of their organization" ON public.org_members;
CREATE POLICY "Admin can modify organization members of their organization"
    ON public.org_members FOR ALL
    USING (org_id = public.get_user_org_id())
    WITH CHECK (
        public.get_user_role(org_id) = 'admin' 
        OR EXISTS (SELECT 1 FROM public.organizations WHERE id = org_id AND owner_id = auth.uid())
    );

-- =============================================
-- 7. organizations: add stripe_customer_id if missing
-- =============================================
ALTER TABLE public.organizations
    ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;

-- =============================================
-- 8. invoice_batches: add uploaded_by if missing
-- =============================================
ALTER TABLE public.invoice_batches
    ADD COLUMN IF NOT EXISTS uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS original_file_url TEXT,
    ADD COLUMN IF NOT EXISTS total_pages INTEGER,
    ADD COLUMN IF NOT EXISTS detected_invoice_count INTEGER,
    ADD COLUMN IF NOT EXISTS split_result JSONB,
    ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

-- =============================================
-- 9. Update invoice_batches status check to include split_preview
-- =============================================
ALTER TABLE public.invoice_batches 
    DROP CONSTRAINT IF EXISTS invoice_batches_status_check;

ALTER TABLE public.invoice_batches
    ADD CONSTRAINT invoice_batches_status_check 
    CHECK (status IN ('splitting', 'split_preview', 'processing', 'completed', 'failed'));

-- =============================================
-- 10. invoices: add source column if missing
-- =============================================
ALTER TABLE public.invoices
    ADD COLUMN IF NOT EXISTS batch_id UUID REFERENCES public.invoice_batches(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'Single Upload';
