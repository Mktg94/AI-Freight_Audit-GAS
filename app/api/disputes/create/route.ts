import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateDisputeLetter } from '@/lib/ai/generateDispute';
import { initialDisputes } from '@/src/fakeData';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { invoice_id, carrier_email } = body;

    if (!invoice_id) {
      return NextResponse.json({ error: "Missing invoice_id parameter." }, { status: 400 });
    }

    const emailToUse = carrier_email || "billing-claims@carrier-logistics.com";
    const supabase = createClient();

    // Ensure global store is initialized for sandbox mode
    if (!(global as any).memoryDisputesStore) {
      (global as any).memoryDisputesStore = [...initialDisputes];
    }

    try {
      // 1. Fetch invoice row
      const { data: invoice, error: invErr } = await supabase
        .from('invoices')
        .select('*')
        .eq('id', invoice_id)
        .single();

      if (invErr || !invoice) {
        throw new Error(invErr?.message || "Invoice not found in live database.");
      }

      // 2. Fetch disputed line items
      const { data: lineItems, error: itemsErr } = await supabase
        .from('line_items')
        .select('*')
        .eq('invoice_id', invoice_id)
        .eq('status', 'disputed');

      if (itemsErr) {
        throw new Error(itemsErr.message);
      }

      // 3. Fetch Organization name
      let orgName = "Atlas Global Logistics";
      const { data: org, error: orgErr } = await supabase
        .from('organizations')
        .select('name')
        .eq('id', invoice.org_id)
        .single();
      
      if (!orgErr && org) {
        orgName = org.name;
      }

      // 4. Calculate total disputed amount
      const lineDisputedList = lineItems || [];
      const totalDisputedAmount = lineDisputedList.reduce((acc: number, item: any) => acc + (Number(item.discrepancy) || 0), 0);

      // JSON payload for dispute letter helper
      const disputedItemsJson = JSON.stringify(lineDisputedList.map((item: any) => ({
        description: item.description,
        billed: item.billed_amount,
        expected: item.expected_amount,
        difference: item.discrepancy
      })));

      // Call professional letter generator
      const letterText = await generateDisputeLetter({
        companyName: orgName,
        carrierName: invoice.carrier_name,
        invoiceNumber: invoice.invoice_number,
        invoiceDate: invoice.invoice_date,
        disputedItemsJson,
        totalDisputed: totalDisputedAmount
      });

      // 5. Insert row into disputes table with status = 'draft'
      const newDisputeId = `disp-${Math.random().toString(36).substr(2, 9)}`;
      const newDisputeRow = {
        id: newDisputeId,
        invoice_id: invoice_id,
        org_id: invoice.org_id,
        carrier_name: invoice.carrier_name,
        carrier_email: emailToUse,
        dispute_letter_text: letterText,
        total_disputed_amount: totalDisputedAmount,
        status: 'draft',
        created_at: new Date().toISOString()
      };

      const { error: insertErr } = await supabase
        .from('disputes')
        .insert(newDisputeRow);

      if (insertErr) {
        throw new Error(insertErr.message);
      }

      // Also update parent invoice to 'disputed' state
      await supabase
        .from('invoices')
        .update({ status: 'disputed' })
        .eq('id', invoice_id);

      // Sync manually created disputes to memory just in case
      (global as any).memoryDisputesStore.unshift(newDisputeRow);

      return NextResponse.json({
        success: true,
        disputeId: newDisputeId
      });

    } catch (dbErr: any) {
      console.warn("Dispute Create database path skipped. Sourcing in-memory workspace cluster:", dbErr.message);

      const globalInvoices = (global as any).memoryInvoicesStore || [];
      const globalLines = (global as any).memoryLineItemsStore || [];

      const invoice = globalInvoices.find((i: any) => i.id === invoice_id);
      if (!invoice) {
        return NextResponse.json({ error: "Invoice registry is missing from sandbox files." }, { status: 404 });
      }

      const lineItems = globalLines.filter((li: any) => li.invoice_id === invoice_id && li.status === 'disputed');
      const totalDisputedAmount = lineItems.reduce((acc: number, item: any) => acc + (Number(item.discrepancy) || 0), 0);

      const disputedItemsJson = JSON.stringify(lineItems.map((item: any) => ({
        description: item.description,
        billed: item.billed_amount,
        expected: item.expected_amount,
        difference: item.discrepancy
      })));

      const orgName = "Atlas Global Logistics";
      const letterText = await generateDisputeLetter({
        companyName: orgName,
        carrierName: invoice.carrier_name,
        invoiceNumber: invoice.invoice_number,
        invoiceDate: invoice.invoice_date,
        disputedItemsJson,
        totalDisputed: totalDisputedAmount
      });

      const newDisputeId = `disp-${Math.random().toString(36).substr(2, 9)}`;
      const newDisputeRow: any = {
        id: newDisputeId,
        invoice_id: invoice_id,
        org_id: invoice.org_id || 'org-101',
        carrier_name: invoice.carrier_name,
        carrier_email: emailToUse,
        dispute_letter_text: letterText,
        total_disputed_amount: totalDisputedAmount,
        status: 'draft',
        created_at: new Date().toISOString()
      };

      // Push into memory lists
      (global as any).memoryDisputesStore.unshift(newDisputeRow);

      // Update in global invoices
      const idx = globalInvoices.findIndex((inv: any) => inv.id === invoice_id);
      if (idx !== -1) {
        globalInvoices[idx].status = 'disputed';
      }

      return NextResponse.json({
        success: true,
        disputeId: newDisputeId
      });
    }

  } catch (err: any) {
    console.error("Dispute generation route failure:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
