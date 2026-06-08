import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { initialDisputes } from '@/src/fakeData';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const supabase = createClient();

    if (!(global as any).memoryDisputesStore) {
      (global as any).memoryDisputesStore = [...initialDisputes];
    }

    try {
      // Try to fetch live database disputes
      const { data: disputes, error: dbErr } = await supabase
        .from('disputes')
        .select('*')
        .order('created_at', { ascending: false });

      if (dbErr) {
        throw new Error(dbErr.message);
      }

      // Also get invoice numbers for each dispute
      const { data: invoices, error: invErr } = await supabase
        .from('invoices')
        .select('id, invoice_number');

      const invoiceMap = new Map();
      if (!invErr && invoices) {
        invoices.forEach((inv: any) => invoiceMap.set(inv.id, inv.invoice_number));
      }

      const enrichedDisputes = (disputes || []).map((disp: any) => ({
        ...disp,
        invoice_number: invoiceMap.get(disp.invoice_id) || 'FDX-MOCK'
      }));

      return NextResponse.json({
        success: true,
        disputes: enrichedDisputes
      });

    } catch (dbErr: any) {
      console.warn("Disputes GET fallback to sandbox active.");
      const memoryDisputes = (global as any).memoryDisputesStore || [];
      const memoryInvoices = (global as any).memoryInvoicesStore || [];

      const enrichedDisputes = memoryDisputes.map((disp: any) => {
        const matchingInv = memoryInvoices.find((inv: any) => inv.id === disp.invoice_id);
        return {
          ...disp,
          invoice_number: matchingInv ? matchingInv.invoice_number : 'DHL-8874102'
        };
      });

      return NextResponse.json({
        success: true,
        disputes: enrichedDisputes
      });
    }

  } catch (err: any) {
    console.error("GET Disputes List Failure:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
