import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;
    const supabase = createClient();

    const { data: dispute, error: dErr } = await supabase
      .from('disputes')
      .select('*')
      .eq('id', id)
      .single();

    if (dErr || !dispute) {
      return NextResponse.json({ error: "Dispute not found" }, { status: 404 });
    }

    const { data: invoice } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', dispute.invoice_id)
      .single();

    const { data: lineItems } = await supabase
      .from('line_items')
      .select('*')
      .eq('invoice_id', dispute.invoice_id)
      .eq('status', 'disputed');

    return NextResponse.json({
      success: true,
      dispute,
      invoice: invoice || null,
      lineItems: lineItems || []
    });

  } catch (err: any) {
    console.error("GET Dispute details failure:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;
    const body = await request.json();
    const { dispute_letter_text, carrier_email } = body;

    const supabase = createClient();

    const updates: any = {};
    if (dispute_letter_text !== undefined) updates.dispute_letter_text = dispute_letter_text;
    if (carrier_email !== undefined) updates.carrier_email = carrier_email;

    const { data, error } = await supabase
      .from('disputes')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      dispute: data
    });

  } catch (err: any) {
    console.error("PATCH Dispute failure:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
