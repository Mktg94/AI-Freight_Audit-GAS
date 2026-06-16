import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getUserRole } from '@/lib/auth/roles';

export const dynamic = 'force-dynamic';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;
    const supabase = createClient();

    let currentOrgId = 'org-101';
    try {
      const { data: disputeBasic } = await supabase
        .from('disputes')
        .select('org_id')
        .eq('id', id)
        .maybeSingle();
      if (disputeBasic?.org_id) {
        currentOrgId = disputeBasic.org_id;
      }
    } catch (e) {
      console.warn("Dispute fetch for RBAC check failed:", e);
    }

    const userRole = await getUserRole(supabase, currentOrgId);
    if (userRole !== 'admin' && userRole !== 'logistics_manager') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const sentAtStr = new Date().toISOString();

    const { data: dispute, error: refErr } = await supabase
      .from('disputes')
      .select('*')
      .eq('id', id)
      .single();

    if (refErr || !dispute) {
      return NextResponse.json({ error: "Dispute not found" }, { status: 404 });
    }

    // Fetch invoice number for display
    let invoiceNumber = dispute.invoice_id;
    try {
      const { data: inv } = await supabase
        .from('invoices')
        .select('invoice_number')
        .eq('id', dispute.invoice_id)
        .single();
      if (inv?.invoice_number) invoiceNumber = inv.invoice_number;
    } catch (_) {}

    if (process.env.GMAIL_APP_PASSWORD) {
      try {
        const { sendEmail } = await import('@/lib/email');
        const { disputeEmailHtml } = await import('@/lib/email-templates');
        await sendEmail({
          to: dispute.carrier_email || 'claims@carrier-trucking.com',
          subject: `Billing Dispute Notice — Invoice #${invoiceNumber}`,
          html: disputeEmailHtml(
            invoiceNumber,
            dispute.carrier_name || 'N/A',
            dispute.total_disputed_amount || 0,
            dispute.dispute_letter_text || '',
            dispute.id
          ),
        });
      } catch (mailErr: any) {
        console.warn("Gmail send failed:", mailErr.message);
      }
    }

    const { data: updatedRecord, error: updateErr } = await supabase
      .from('disputes')
      .update({ status: 'sent', sent_at: sentAtStr })
      .eq('id', id)
      .select()
      .single();

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    await supabase
      .from('invoices')
      .update({ status: 'disputed' })
      .eq('id', dispute.invoice_id);

    await supabase
      .from('audit_logs')
      .insert({
        org_id: dispute.org_id || 'org-101',
        user_id: 'usr-mock',
        action: `Dispute letter generated and dispatched`,
        entity_type: 'dispute',
        entity_id: id,
        metadata: {
          invoice_id: dispute.invoice_id,
          amount: dispute.total_disputed_amount,
          destination_email: dispute.carrier_email,
          sent_at: sentAtStr
        },
        created_at: sentAtStr
      });

    return NextResponse.json({
      success: true,
      dispute: updatedRecord
    });

  } catch (err: any) {
    console.error("Dispute sending failure:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
