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

    const brevoKey = process.env.BREVO_API_KEY;
    if (brevoKey) {
      try {
        await fetch('https://api.brevo.com/v3/smtp/email', {
          method: 'POST',
          headers: {
            'api-key': brevoKey,
            'content-type': 'application/json'
          },
          body: JSON.stringify({
            sender: { name: 'AI Freight Audit', email: 'mikeabrsh21@gmail.com' },
            to: [{ email: dispute.carrier_email || 'claims@carrier-trucking.com' }],
            subject: `OFFICIAL BILLING DISPUTE — Invoice #${dispute.invoice_id}`,
            htmlContent: `
              <!DOCTYPE html>
              <html>
              <head><meta charset="utf-8"></head>
              <body style="margin:0;padding:0;background-color:#F3F4F6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
                <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#F3F4F6;padding:40px 16px;">
                  <tr>
                    <td align="center">
                      <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
                        <tr>
                          <td style="background:linear-gradient(135deg,#DC2626,#991B1B);padding:32px 40px;text-align:center;">
                            <h1 style="color:#ffffff;font-size:22px;font-weight:700;margin:0 0 4px 0;">Official Billing Dispute</h1>
                            <p style="color:rgba(255,255,255,0.7);font-size:11px;font-weight:600;letter-spacing:2px;text-transform:uppercase;margin:0;">FreightAudit AI</p>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding:32px 40px;">
                            <table width="100%" cellpadding="0" cellspacing="0" style="background:#FEF2F2;border:1px solid #FECACA;border-radius:12px;padding:20px;margin-bottom:24px;">
                              <tr>
                                <td style="padding-bottom:10px;">
                                  <p style="color:#991B1B;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin:0 0 4px 0;">Dispute Summary</p>
                                  <p style="color:#7F1D1D;font-size:13px;margin:0;"><strong>Invoice:</strong> #${dispute.invoice_id}</p>
                                  <p style="color:#7F1D1D;font-size:13px;margin:4px 0 0 0;"><strong>Carrier:</strong> ${dispute.carrier_name || 'N/A'}</p>
                                  <p style="color:#7F1D1D;font-size:13px;margin:4px 0 0 0;"><strong>Disputed Amount:</strong> $${Number(dispute.total_disputed_amount || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
                                  <p style="color:#7F1D1D;font-size:13px;margin:4px 0 0 0;"><strong>Date:</strong> ${new Date().toLocaleDateString('en-US', {year:'numeric',month:'long',day:'numeric'})}</p>
                                </td>
                              </tr>
                            </table>
                            <h2 style="color:#111827;font-size:16px;font-weight:700;margin:0 0 12px 0;">Dispute Letter</h2>
                            <div style="background:#F9FAFB;border-radius:12px;padding:24px;border-left:4px solid #DC2626;line-height:1.8;color:#374151;font-size:13px;white-space:pre-wrap;">
                              ${dispute.dispute_letter_text.replace(/\n/g, '<br>')}
                            </div>
                            <p style="color:#9CA3AF;font-size:12px;line-height:1.5;margin:20px 0 0 0;text-align:center;">
                              This is an official billing dispute generated by FreightAudit AI.
                            </p>
                          </td>
                        </tr>
                        <tr>
                          <td style="background:#F9FAFB;padding:20px 40px;text-align:center;border-top:1px solid #E5E7EB;">
                            <p style="color:#9CA3AF;font-size:11px;margin:0;">AI Freight Audit &bull; Automated Billing Protection</p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </body>
              </html>
            `
          })
        });
      } catch (mailErr: any) {
        console.warn("Brevo client failed:", mailErr.message);
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
