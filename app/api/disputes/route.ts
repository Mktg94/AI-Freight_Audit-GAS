import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const supabase = createClient();

    const { data: disputes, error: dbErr } = await supabase
      .from('disputes')
      .select('*')
      .order('created_at', { ascending: false });

    if (dbErr) {
      throw new Error(dbErr.message);
    }

    const { data: invoices } = await supabase
      .from('invoices')
      .select('id, invoice_number');

    const invoiceMap = new Map();
    if (invoices) {
      invoices.forEach((inv: any) => invoiceMap.set(inv.id, inv.invoice_number));
    }

    const enrichedDisputes = (disputes || []).map((disp: any) => ({
      ...disp,
      invoice_number: invoiceMap.get(disp.invoice_id) || 'N/A'
    }));

    return NextResponse.json({
      success: true,
      disputes: enrichedDisputes
    });

  } catch (err: any) {
    console.error("GET Disputes List Failure:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
