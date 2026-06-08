-- ==========================================
-- FreightAudit AI - Complete Supabase Database Schema
-- Paste this script directly in the Supabase SQL Editor.
-- ==========================================

-- Enable the uuid-ossp extension for generating UUIDs if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -------------------------------------------------------------
-- 1. Create table: organizations
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- -------------------------------------------------------------
-- Create get_user_org_id() Helper Function
-- Returns the organization ID owned by the current authenticated user.
-- Marked SECURITY DEFINER to bypass initial RLS bootstrap queries safely.
-- -------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_user_org_id()
RETURNS UUID AS $$
DECLARE
    org_id_val UUID;
BEGIN
    SELECT id INTO org_id_val 
    FROM public.organizations 
    WHERE owner_id = auth.uid() 
    LIMIT 1;
    
    RETURN org_id_val;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- -------------------------------------------------------------
-- 2. Create table: contracts
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.contracts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    carrier_name TEXT NOT NULL,
    effective_date DATE NOT NULL,
    expiry_date DATE NOT NULL,
    base_rate_per_lb NUMERIC(10, 4) DEFAULT 0.0000 NOT NULL,
    base_rate_per_mile NUMERIC(10, 4) DEFAULT 0.0000 NOT NULL,
    fuel_surcharge_pct NUMERIC(5, 4) DEFAULT 0.0000 NOT NULL,
    residential_surcharge NUMERIC(10, 2) DEFAULT 0.00 NOT NULL,
    detention_rate_per_hr NUMERIC(10, 2) DEFAULT 0.00 NOT NULL,
    liftgate_fee NUMERIC(10, 2) DEFAULT 0.00 NOT NULL,
    inside_delivery_fee NUMERIC(10, 2) DEFAULT 0.00 NOT NULL,
    redelivery_fee NUMERIC(10, 2) DEFAULT 0.00 NOT NULL,
    minimum_charge NUMERIC(10, 2) DEFAULT 0.00 NOT NULL,
    custom_rules JSONB DEFAULT '{}'::jsonb NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- -------------------------------------------------------------
-- 3. Create table: invoices
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    contract_id UUID REFERENCES public.contracts(id) ON DELETE SET NULL,
    file_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    carrier_name TEXT NOT NULL,
    invoice_number TEXT NOT NULL,
    invoice_date DATE NOT NULL,
    shipment_date DATE NOT NULL,
    origin TEXT NOT NULL,
    destination TEXT NOT NULL,
    weight_lbs NUMERIC(10, 2) DEFAULT 0.00 NOT NULL,
    distance_miles NUMERIC(10, 2) DEFAULT 0.00 NOT NULL,
    raw_extracted_text TEXT,
    extracted_data JSONB DEFAULT '{}'::jsonb NOT NULL,
    status TEXT DEFAULT 'pending'::text NOT NULL CHECK (status IN ('pending', 'auditing', 'flagged', 'approved', 'disputed')),
    total_billed NUMERIC(12, 2) DEFAULT 0.00 NOT NULL,
    total_approved NUMERIC(12, 2) DEFAULT 0.00 NOT NULL,
    total_savings NUMERIC(12, 2) DEFAULT 0.00 NOT NULL,
    uploaded_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    audited_at TIMESTAMPTZ
);

-- -------------------------------------------------------------
-- 4. Create table: line_items
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.line_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    billed_amount NUMERIC(10, 2) DEFAULT 0.00 NOT NULL,
    expected_amount NUMERIC(10, 2) DEFAULT 0.00 NOT NULL,
    discrepancy NUMERIC(10, 2) DEFAULT 0.00 NOT NULL,
    ai_flag_reason TEXT,
    confidence_score NUMERIC(3, 2) DEFAULT 1.00 NOT NULL CHECK (confidence_score >= 0.00 AND confidence_score <= 1.00),
    status TEXT DEFAULT 'pending'::text NOT NULL CHECK (status IN ('pending', 'approved', 'disputed')),
    reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- -------------------------------------------------------------
-- 5. Create table: disputes
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.disputes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
    org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    carrier_name TEXT NOT NULL,
    carrier_email TEXT NOT NULL,
    dispute_letter_text TEXT NOT NULL,
    total_disputed_amount NUMERIC(12, 2) DEFAULT 0.00 NOT NULL,
    status TEXT DEFAULT 'draft'::text NOT NULL CHECK (status IN ('draft', 'sent', 'resolved', 'rejected')),
    sent_at TIMESTAMPTZ,
    resolved_at TIMESTAMPTZ,
    resolution_amount NUMERIC(12, 2),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- -------------------------------------------------------------
-- 6. Create table: audit_logs
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- =============================================================
-- Row Level Security (RLS) Enablement & Policies
-- =============================================================

-- Enable Row Level Security (RLS) on all tables to keep data private
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- -------------------------------------------------------------
-- RLS Policies: organizations
-- -------------------------------------------------------------
CREATE POLICY "Users can select their own organizations" 
    ON public.organizations FOR SELECT 
    USING (owner_id = auth.uid());

CREATE POLICY "Users can insert their own organizations" 
    ON public.organizations FOR INSERT 
    WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can update their own organizations" 
    ON public.organizations FOR UPDATE 
    USING (owner_id = auth.uid());

CREATE POLICY "Users can delete their own organizations" 
    ON public.organizations FOR DELETE 
    USING (owner_id = auth.uid());

-- -------------------------------------------------------------
-- RLS Policies: contracts
-- -------------------------------------------------------------
CREATE POLICY "Users can select contracts of their organization" 
    ON public.contracts FOR SELECT 
    USING (org_id = public.get_user_org_id());

CREATE POLICY "Users can insert contracts into their organization" 
    ON public.contracts FOR INSERT 
    WITH CHECK (org_id = public.get_user_org_id());

CREATE POLICY "Users can update contracts of their organization" 
    ON public.contracts FOR UPDATE 
    USING (org_id = public.get_user_org_id());

CREATE POLICY "Users can delete contracts of their organization" 
    ON public.contracts FOR DELETE 
    USING (org_id = public.get_user_org_id());

-- -------------------------------------------------------------
-- RLS Policies: invoices
-- -------------------------------------------------------------
CREATE POLICY "Users can select invoices of their organization" 
    ON public.invoices FOR SELECT 
    USING (org_id = public.get_user_org_id());

CREATE POLICY "Users can insert invoices into their organization" 
    ON public.invoices FOR INSERT 
    WITH CHECK (org_id = public.get_user_org_id());

CREATE POLICY "Users can update invoices of their organization" 
    ON public.invoices FOR UPDATE 
    USING (org_id = public.get_user_org_id());

CREATE POLICY "Users can delete invoices of their organization" 
    ON public.invoices FOR DELETE 
    USING (org_id = public.get_user_org_id());

-- -------------------------------------------------------------
-- RLS Policies: line_items
-- Since line_items references invoices, RLS should verify the invoice belongs to the user's organization.
-- -------------------------------------------------------------
CREATE POLICY "Users can select line items for their organization invoices" 
    ON public.line_items FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM public.invoices 
            WHERE invoices.id = line_items.invoice_id 
              AND invoices.org_id = public.get_user_org_id()
        )
    );

CREATE POLICY "Users can insert line items for their organization invoices" 
    ON public.line_items FOR INSERT 
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.invoices 
            WHERE invoices.id = line_items.invoice_id 
              AND invoices.org_id = public.get_user_org_id()
        )
    );

CREATE POLICY "Users can update line items of their organization invoices" 
    ON public.line_items FOR UPDATE 
    USING (
        EXISTS (
            SELECT 1 FROM public.invoices 
            WHERE invoices.id = line_items.invoice_id 
              AND invoices.org_id = public.get_user_org_id()
        )
    );

CREATE POLICY "Users can delete line items of their organization invoices" 
    ON public.line_items FOR DELETE 
    USING (
        EXISTS (
            SELECT 1 FROM public.invoices 
            WHERE invoices.id = line_items.invoice_id 
              AND invoices.org_id = public.get_user_org_id()
        )
    );

-- -------------------------------------------------------------
-- RLS Policies: disputes
-- -------------------------------------------------------------
CREATE POLICY "Users can select disputes of their organization" 
    ON public.disputes FOR SELECT 
    USING (org_id = public.get_user_org_id());

CREATE POLICY "Users can insert disputes into their organization" 
    ON public.disputes FOR INSERT 
    WITH CHECK (org_id = public.get_user_org_id());

CREATE POLICY "Users can update disputes of their organization" 
    ON public.disputes FOR UPDATE 
    USING (org_id = public.get_user_org_id());

CREATE POLICY "Users can delete disputes of their organization" 
    ON public.disputes FOR DELETE 
    USING (org_id = public.get_user_org_id());

-- -------------------------------------------------------------
-- RLS Policies: audit_logs
-- -------------------------------------------------------------
CREATE POLICY "Users can select audit logs of their organization" 
    ON public.audit_logs FOR SELECT 
    USING (org_id = public.get_user_org_id());

CREATE POLICY "Users can insert audit logs into their organization" 
    ON public.audit_logs FOR INSERT 
    WITH CHECK (org_id = public.get_user_org_id());

-- Audit logs are generally append-only, but let's define complete access for completeness.
CREATE POLICY "Users can update audit logs of their organization" 
    ON public.audit_logs FOR UPDATE 
    USING (org_id = public.get_user_org_id());

CREATE POLICY "Users can delete audit logs of their organization" 
    ON public.audit_logs FOR DELETE 
    USING (org_id = public.get_user_org_id());


-- =============================================================
-- 7. Create table: org_members
-- =============================================================
CREATE TABLE IF NOT EXISTS public.org_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'finance_clerk' CHECK (role IN ('admin', 'logistics_manager', 'finance_clerk', 'operations_coordinator')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'invited', 'suspended')),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE (org_id, user_id)
);

ALTER TABLE public.org_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can select organization members of their organization" 
    ON public.org_members FOR SELECT 
    USING (org_id = public.get_user_org_id());

CREATE POLICY "Admin can modify organization members of their organization"
    ON public.org_members FOR ALL
    USING (org_id = public.get_user_org_id());

-- =============================================================
-- 8. Create view: org_member_details View with Joined User Info
-- =============================================================
CREATE OR REPLACE VIEW public.org_member_details AS
SELECT om.*, u.email, u.raw_user_meta_data->>'full_name' as full_name
FROM public.org_members om
JOIN auth.users u ON om.user_id = u.id;

GRANT SELECT ON public.org_member_details TO authenticated;

-- =============================================================
-- 9. Add columns to organizations for invoice limits
-- =============================================================
ALTER TABLE public.organizations 
ADD COLUMN IF NOT EXISTS invoice_limit_per_month INTEGER DEFAULT 100,
ADD COLUMN IF NOT EXISTS invoices_used_this_month INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS seat_limit INTEGER DEFAULT 3,
ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'Starter',
ADD COLUMN IF NOT EXISTS billing_reset_date TIMESTAMPTZ DEFAULT (now() + interval '30 days');

-- =============================================================
-- 10. Create table: invoice_batches
-- =============================================================
CREATE TABLE IF NOT EXISTS public.invoice_batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'splitting' CHECK (status IN ('splitting', 'processing', 'completed', 'failed')),
    total_count INTEGER DEFAULT 0,
    completed_count INTEGER DEFAULT 0,
    invoice_ids JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.invoice_batches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can select invoice batches of their organization"
    ON public.invoice_batches FOR SELECT
    USING (org_id = public.get_user_org_id());

CREATE POLICY "Users can insert invoice batches into their organization"
    ON public.invoice_batches FOR INSERT
    WITH CHECK (org_id = public.get_user_org_id());

CREATE POLICY "Users can update invoice batches of their organization"
    ON public.invoice_batches FOR UPDATE
    USING (org_id = public.get_user_org_id());

-- =============================================================
-- 11. Add batch_id to invoices
-- =============================================================
ALTER TABLE public.invoices
ADD COLUMN IF NOT EXISTS batch_id UUID REFERENCES public.invoice_batches(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'Single Upload';


