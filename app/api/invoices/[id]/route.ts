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

    try {
      // 1. Fetch main invoice row
      const { data: invoice, error: invErr } = await supabase
        .from('invoices')
        .select('*')
        .eq('id', id)
        .single();

      if (invErr || !invoice) {
        throw new Error(invErr?.message || "Invoice document is missing.");
      }

      // 2. Fetch associated line items
      const { data: lineItems, error: itemsErr } = await supabase
        .from('line_items')
        .select('*')
        .eq('invoice_id', id)
        .order('created_at', { ascending: true });

      // 3. Fetch matched contract agreement
      const { data: contract, error: contractErr } = await supabase
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

    } catch (dbErr: any) {
      console.warn("Next database fallback path. Sourcing live sandbox memory stores.");
      
      const globalLines = (global as any).memoryLineItemsStore || [];
      const globalInvoices = (global as any).memoryInvoicesStore || [];
      const globalContracts = (global as any).memoryContractsStore || [];

      const invoice = globalInvoices.find((i: any) => i.id === id);
      if (!invoice) {
        return NextResponse.json({ error: "Invoice not found in system storage." }, { status: 404 });
      }

      const lineItems = globalLines.filter((li: any) => li.invoice_id === id);
      const contract = globalContracts.find((c: any) => c.id === invoice.contract_id || c.carrier_name === invoice.carrier_name) || null;

      return NextResponse.json({
        success: true,
        invoice,
        lineItems,
        contract
      });
    }

  } catch (err: any) {
    console.error("GET Invoice Details Route Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
