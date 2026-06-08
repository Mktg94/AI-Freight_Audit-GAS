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
      return NextResponse.json({ error: "Invalid status: must be 'approved' or 'disputed'" }, { status: 400 });
    }

    const supabase = createClient();
    let userId = 'usr-mock';
    let orgId = 'org-101-auth-alpha';

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        userId = user.id;
        const { data: orgs } = await supabase
          .from('organizations')
          .select('id')
          .eq('owner_id', user.id)
          .limit(1);
        if (orgs && orgs.length > 0) {
          orgId = orgs[0].id;
        }
      }
    } catch (authErr) {
      console.warn("Auth check ignored or running in offline sandbox environment");
    }

    const now = new Date().toISOString();
    let updatedLineItem: any = null;
    let invoiceId = '';

    // Standard database update
    try {
      // 1. Fetch current line item status and its invoice dependency
      const { data: currentLine, error: fetchErr } = await supabase
        .from('line_items')
        .select('invoice_id')
        .eq('id', id)
        .single();

      if (fetchErr || !currentLine) {
        throw new Error(fetchErr?.message || "Line item does not exist inside permanent database.");
      }
      invoiceId = currentLine.invoice_id;

      // 2. Perform the PATCH update
      const { data: finalItem, error: updateErr } = await supabase
        .from('line_items')
        .update({
          status: status,
          reviewed_by: userId,
          reviewed_at: now
        })
        .eq('id', id)
        .select()
        .single();

      if (updateErr || !finalItem) {
        throw updateErr;
      }
      updatedLineItem = finalItem;

      // 3. Query all sibling lines to do exact mathematical recalculation
      const { data: siblingLines, error: linesErr } = await supabase
        .from('line_items')
        .select('billed_amount, expected_amount, status, discrepancy')
        .eq('invoice_id', invoiceId);

      if (!linesErr && siblingLines) {
        let totalApproved = 0;
        let totalSavings = 0;
        let totalBilled = 0;

        siblingLines.forEach((line) => {
          totalBilled += line.billed_amount;
          if (line.status === 'approved') {
            totalApproved += line.billed_amount; // Billed is fully approved
          } else if (line.status === 'disputed') {
            totalApproved += line.expected_amount; // Only approve expected contractual limit
            totalSavings += Math.max(0, line.discrepancy);
          } else {
            // Still pending or auditing: count expected, but no savings officially captured yet
            totalApproved += line.expected_amount;
          }
        });

        // Ensure status reflects whether we have any lingering disputes or corrections
        // If there is ANY active dispute, status remains 'flagged' or 'disputed'. If all Approved, status is 'approved'
        const hasUnapprovedFlag = siblingLines.some(l => l.status === 'disputed' || l.discrepancy > 0);
        let finalStatus = 'approved';
        if (siblingLines.some(l => l.status === 'disputed')) {
          finalStatus = 'disputed';
        } else if (hasUnapprovedFlag) {
          finalStatus = 'flagged';
        }

        // Apply recalculations dynamically to main invoice row
        await supabase
          .from('invoices')
          .update({
            total_approved: totalApproved,
            total_savings: totalSavings,
            status: finalStatus
          })
          .eq('id', invoiceId);
      }

      // 4. Create action audit log entry
      await supabase
        .from('audit_logs')
        .insert({
          org_id: orgId,
          user_id: userId,
          action: `line_item_reviewed_${status}`,
          entity_type: 'line_item',
          entity_id: id,
          metadata: {
            line_item_id: id,
            description: updatedLineItem.description,
            status: status,
            evaluated_savings: updatedLineItem.discrepancy,
            invoice_id: invoiceId
          },
          created_at: now
        });

    } catch (dbErr: any) {
      console.warn("Express / Server database fallback active path. Running sandbox memory update.");
      // Read sandbox memory from global stores
      const globalLines = (global as any).memoryLineItemsStore || [];
      const globalInvoices = (global as any).memoryInvoicesStore || [];
      const globalLogs = (global as any).memoryLogsStore || [];

      const lineIndex = globalLines.findIndex((li: any) => li.id === id);
      if (lineIndex !== -1) {
        const item = globalLines[lineIndex];
        invoiceId = item.invoice_id;

        // Perform in-memory updates
        updatedLineItem = {
          ...item,
          status,
          reviewed_by: userId,
          reviewed_at: now
        };
        globalLines[lineIndex] = updatedLineItem;

        // Query siblings in-memory
        const siblings = globalLines.filter((li: any) => li.invoice_id === invoiceId);
        let totalApproved = 0;
        let totalSavings = 0;
        let totalBilled = 0;

        siblings.forEach((line: any) => {
          totalBilled += line.billed_amount;
          if (line.status === 'approved') {
            totalApproved += line.billed_amount;
          } else if (line.status === 'disputed') {
            totalApproved += line.expected_amount;
            totalSavings += Math.max(0, line.discrepancy);
          } else {
            totalApproved += line.expected_amount;
          }
        });

        const hasUnapprovedFlag = siblings.some((l: any) => l.status === 'disputed' || l.discrepancy > 0);
        let finalStatus = 'approved';
        if (siblings.some((l: any) => l.status === 'disputed')) {
          finalStatus = 'disputed';
        } else if (hasUnapprovedFlag) {
          finalStatus = 'flagged';
        }

        // Apply back to the memory invoices store
        const invoiceIndex = globalInvoices.findIndex((inv: any) => inv.id === invoiceId);
        if (invoiceIndex !== -1) {
          globalInvoices[invoiceIndex] = {
            ...globalInvoices[invoiceIndex],
            total_approved: totalApproved,
            total_savings: totalSavings,
            status: finalStatus,
            audited_at: now
          };
        }

        // Insert new audit log in-memory
        globalLogs.unshift({
          id: `log-${Date.now()}`,
          org_id: orgId,
          user_id: userId,
          action: `Reviewed invoice item: "${updatedLineItem.description}" marked as ${status}`,
          entity_type: 'line_item',
          entity_id: id,
          metadata: {
            line_item_id: id,
            status: status,
            invoice_id: invoiceId
          },
          created_at: now
        });
      } else {
        return NextResponse.json({ error: `Line item with ID ${id} not found in sandbox.` }, { status: 404 });
      }
    }

    return NextResponse.json({
      success: true,
      lineItem: updatedLineItem
    });

  } catch (err: any) {
    console.error("PATCH LineItem Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
