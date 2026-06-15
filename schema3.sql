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