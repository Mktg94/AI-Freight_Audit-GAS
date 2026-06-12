import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateDisputeLetter } from '@/lib/ai/generateDispute';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { invoice_id, carrier_email } = body;

    if (!invoice_id) {
      return NextResponse.json({ error: "Missing invoice_id" }, { status: 400 });
    }

    const emailToUse = carrier_email || "";
    const supabase = createClient();

    // Auth
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch invoice
    const { data: invoice, error: invErr } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', invoice_id)
      .single();

    if (invErr || !invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    // Fetch disputed line items
    const { data: lineItems, error: itemsErr } = await supabase
      .from('line_items')
      .select('*')
      .eq('invoice_id', invoice_id)
      .eq('status', 'disputed');

    if (itemsErr) {
      return NextResponse.json({ error: itemsErr.message }, { status: 500 });
    }

    // Fetch organization
    let orgName = "Your Company";
    const { data: org } = await supabase
      .from('organizations')
      .select('name')
      .eq('id', invoice.org_id)
      .single();
    if (org) {
      orgName = org.name;
    }

    // Calculate total disputed amount
    const lineDisputedList = lineItems || [];
    const totalDisputedAmount = lineDisputedList.reduce(
      (acc: number, item: any) => acc + (Number(item.discrepancy) || 0), 0
    );

    // Build audit details string
    const auditDetails = lineDisputedList.map((item: any) =>
      `${item.description}: billed $${item.billed_amount}, expected $${item.expected_amount}, difference $${item.discrepancy}`
    ).join('\n');

    // Generate dispute letter
    const letterText = await generateDisputeLetter(
      invoice.carrier_name,
      invoice.invoice_number,
      auditDetails,
      totalDisputedAmount
    );

    // Create dispute record
    const newDisputeRow = {
      invoice_id: invoice_id,
      org_id: invoice.org_id,
      carrier_name: invoice.carrier_name,
      carrier_email: emailToUse,
      dispute_letter_text: letterText,
      total_disputed_amount: totalDisputedAmount,
      status: 'draft',
      created_at: new Date().toISOString()
    };

    const { data: insertedDispute, error: insertErr } = await supabase
      .from('disputes')
      .insert(newDisputeRow)
      .select()
      .single();

    if (insertErr || !insertedDispute) {
      return NextResponse.json({ error: "Failed to create dispute" }, { status: 500 });
    }

    // Update invoice status
    await supabase
      .from('invoices')
      .update({ status: 'disputed' })
      .eq('id', invoice_id);

    return NextResponse.json({
      success: true,
      disputeId: insertedDispute.id
    });

  } catch (err: any) {
    console.error("Dispute creation error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
