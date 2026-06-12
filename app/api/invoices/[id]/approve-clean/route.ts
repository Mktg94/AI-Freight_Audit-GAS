import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json({ error: "Missing invoice ID" }, { status: 400 });
    }

    const supabase = createClient();

    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = user.id;

    const { data: orgs } = await supabase
      .from('organizations')
      .select('id')
      .eq('owner_id', userId)
      .limit(1);
    if (!orgs || orgs.length === 0) {
      return NextResponse.json({ error: "No organization found" }, { status: 404 });
    }
    const orgId = orgs[0].id;

    let approvedCount = 0;
    const now = new Date().toISOString();

    const { data: currentInvoice, error: invFetchErr } = await supabase
      .from('invoices')
      .select('id, total_billed')
      .eq('id', id)
      .single();

    if (invFetchErr || !currentInvoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    const { data: cleanPendingRows } = await supabase
      .from('line_items')
      .select('id')
      .eq('invoice_id', id)
      .eq('status', 'pending')
      .eq('discrepancy', 0);

    if (cleanPendingRows && cleanPendingRows.length > 0) {
      approvedCount = cleanPendingRows.length;
      const cleanIds = cleanPendingRows.map(r => r.id);

      const { error: updateErr } = await supabase
        .from('line_items')
        .update({ status: 'approved', reviewed_by: userId, reviewed_at: now })
        .in('id', cleanIds);

      if (updateErr) {
        return NextResponse.json({ error: updateErr.message }, { status: 500 });
      }
    }

    const { data: allRows } = await supabase
      .from('line_items')
      .select('billed_amount, expected_amount, status, discrepancy')
      .eq('invoice_id', id);

    if (allRows) {
      let totalApproved = 0;
      let totalSavings = 0;

      allRows.forEach((line) => {
        if (line.status === 'approved') {
          totalApproved += line.billed_amount;
        } else if (line.status === 'disputed') {
          totalApproved += line.expected_amount;
          totalSavings += Math.max(0, line.discrepancy);
        } else {
          totalApproved += line.expected_amount;
        }
      });

      const hasUnapprovedFlag = allRows.some(l => l.status === 'disputed' || l.discrepancy > 0);
      let finalStatus = 'approved';
      if (allRows.some(l => l.status === 'disputed')) {
        finalStatus = 'disputed';
      } else if (hasUnapprovedFlag) {
        finalStatus = 'flagged';
      }

      await supabase
        .from('invoices')
        .update({
          total_approved: totalApproved, total_savings: totalSavings,
          status: finalStatus, audited_at: now
        })
        .eq('id', id);
    }

    if (approvedCount > 0) {
      await supabase
        .from('audit_logs')
        .insert({
          org_id: orgId, user_id: userId,
          action: 'invoice_bulk_approve_clean_items',
          entity_type: 'invoice', entity_id: id,
          metadata: { invoice_id: id, approved_count: approvedCount },
          created_at: now
        });
    }

    return NextResponse.json({ success: true, approvedCount });

  } catch (err: any) {
    console.error("Approve Clean Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
