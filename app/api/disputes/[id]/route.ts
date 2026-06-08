import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { initialDisputes } from '@/src/fakeData';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;
    const supabase = createClient();

    // Ensure memory store exists
    if (!(global as any).memoryDisputesStore) {
      (global as any).memoryDisputesStore = [...initialDisputes];
    }

    try {
      // 1. Fetch Dispute from database
      const { data: dispute, error: dErr } = await supabase
        .from('disputes')
        .select('*')
        .eq('id', id)
        .single();

      if (dErr || !dispute) {
        throw new Error(dErr?.message || "Dispute not found in live database.");
      }

      // 2. Fetch Parent Invoice
      const { data: invoice } = await supabase
        .from('invoices')
        .select('*')
        .eq('id', dispute.invoice_id)
        .single();

      // 3. Fetch Disputed Line items
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

    } catch (dbErr: any) {
      console.warn("Dispute detail GET fallback path active:", dbErr.message);

      const memoryDisputes = (global as any).memoryDisputesStore || [];
      const memoryInvoices = (global as any).memoryInvoicesStore || [];
      const memoryLineItems = (global as any).memoryLineItemsStore || [];

      const dispute = memoryDisputes.find((d: any) => d.id === id);
      if (!dispute) {
        return NextResponse.json({ error: "Dispute dossier missing from sandbox." }, { status: 404 });
      }

      const invoice = memoryInvoices.find((i: any) => i.id === dispute.invoice_id);
      const lineItems = memoryLineItems.filter((li: any) => li.invoice_id === dispute.invoice_id && li.status === 'disputed');

      return NextResponse.json({
        success: true,
        dispute,
        invoice: invoice || null,
        lineItems
      });
    }

  } catch (err: any) {
    console.error("GET Dispute details API failure:", err);
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

    // Ensure memory store exists
    if (!(global as any).memoryDisputesStore) {
      (global as any).memoryDisputesStore = [...initialDisputes];
    }

    try {
      // Create updates payload
      const updates: any = {};
      if (dispute_letter_text !== undefined) updates.dispute_letter_text = dispute_letter_text;
      if (carrier_email !== undefined) updates.carrier_email = carrier_email;

      const { data, error } = await supabase
        .from('disputes')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Sync into memory for fallback syncs
      const mIdx = (global as any).memoryDisputesStore.findIndex((d: any) => d.id === id);
      if (mIdx !== -1) {
        (global as any).memoryDisputesStore[mIdx] = {
          ...(global as any).memoryDisputesStore[mIdx],
          ...updates
        };
      }

      return NextResponse.json({
        success: true,
        dispute: data
      });

    } catch (dbErr: any) {
      console.warn("Dispute PATCH falling back to sandbox memory update:", dbErr.message);

      const memoryDisputes = (global as any).memoryDisputesStore || [];
      const disputeIdx = memoryDisputes.findIndex((d: any) => d.id === id);

      if (disputeIdx === -1) {
        return NextResponse.json({ error: "Dispute dossier unlisted." }, { status: 404 });
      }

      if (dispute_letter_text !== undefined) {
        memoryDisputes[disputeIdx].dispute_letter_text = dispute_letter_text;
      }
      if (carrier_email !== undefined) {
        memoryDisputes[disputeIdx].carrier_email = carrier_email;
      }

      return NextResponse.json({
        success: true,
        dispute: memoryDisputes[disputeIdx]
      });
    }

  } catch (err: any) {
    console.error("PATCH Dispute details failure:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
