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