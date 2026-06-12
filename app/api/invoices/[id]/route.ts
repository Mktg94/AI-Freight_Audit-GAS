import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json({ error: "Missing invoice ID" }, { status: 400 });
    }

    const supabase = createClient();

    const { data: invoice, error: invErr } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', id)
      .single();

    if (invErr || !invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    const { data: lineItems, error: itemsErr } = await supabase
      .from('line_items')
      .select('*')
      .eq('invoice_id', id)
      .order('created_at', { ascending: true });

    const { data: contract } = await supabase
      .from('contracts')
      .select('*')
      .eq('id', invoice.contract_id)
      .single();

    return NextResponse.json({
      success: true,
      invoice,
      lineItems: lineItems || [],
      contract: contract || null
    });

  } catch (err: any) {
    console.error("GET Invoice Details Route Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
