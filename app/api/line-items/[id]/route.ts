import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { status } = body;

    if (!id) {
      return NextResponse.json({ error: "Missing line item ID" }, { status: 400 });
    }

    if (status !== 'approved' && status !== 'disputed') {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
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

    const now = new Date().toISOString();

    const { data: currentLine, error: fetchErr } = await supabase
      .from('line_items')
      .select('invoice_id')
      .eq('id', id)
      .single();

    if (fetchErr || !currentLine) {
      return NextResponse.json({ error: "Line item not found" }, { status: 404 });
    }
    const invoiceId = currentLine.invoice_id;

    const { data: finalItem, error: updateErr } = await supabase
      .from('line_items')
      .update({ status, reviewed_by: userId, reviewed_at: now })
      .eq('id', id)
      .select()
      .single();

    if (updateErr || !finalItem) {
      return NextResponse.json({ error: "Update failed" }, { status: 500 });
    }

    const { data: siblingLines } = await supabase
      .from('line_items')
      .select('billed_amount, expected_amount, status, discrepancy')
      .eq('invoice_id', invoiceId);

    if (siblingLines) {
      let totalApproved = 0;
      let totalSavings = 0;

      siblingLines.forEach((line) => {
        if (line.status === 'approved') {
          totalApproved += line.billed_amount;
        } else if (line.status === 'disputed') {
          totalApproved += line.expected_amount;
          totalSavings += Math.max(0, line.discrepancy);
        } else {
          totalApproved += line.expected_amount;
        }
      });

      const hasUnapprovedFlag = siblingLines.some(l => l.status === 'disputed' || l.discrepancy > 0);
      let finalStatus = 'approved';
      if (siblingLines.some(l => l.status === 'disputed')) {
        finalStatus = 'disputed';
      } else if (hasUnapprovedFlag) {
        finalStatus = 'flagged';
      }

      await supabase
        .from('invoices')
        .update({ total_approved: totalApproved, total_savings: totalSavings, status: finalStatus })
        .eq('id', invoiceId);
    }

    await supabase
      .from('audit_logs')
      .insert({
        org_id: orgId, user_id: userId,
        action: `line_item_reviewed_${status}`,
        entity_type: 'line_item', entity_id: id,
        metadata: {
          line_item_id: id, description: finalItem.description,
          status, evaluated_savings: finalItem.discrepancy, invoice_id: invoiceId
        },
        created_at: now
      });

    return NextResponse.json({ success: true, lineItem: finalItem });

  } catch (err: any) {
    console.error("PATCH LineItem Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
