import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { initialDisputes } from '@/src/fakeData';
import { getUserRole } from '@/lib/auth/roles';

export const dynamic = 'force-dynamic';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;
    const supabase = createClient();

    // Check permissions
    // 1. Fetch Dispute details to get organization ID
    let currentOrgId = 'org-101';
    try {
      const { data: disputeBasic } = await supabase
        .from('disputes')
        .select('org_id')
        .eq('id', id)
        .maybeSingle();
      if (disputeBasic?.org_id) {
        currentOrgId = disputeBasic.org_id;
      }
    } catch (e) {
      console.warn("Dispute fetch for RBAC check failed, using fallback org_id:", e);
    }

    const userRole = await getUserRole(supabase, currentOrgId);
    if (userRole !== 'admin' && userRole !== 'logistics_manager') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Ensure memory store exists
    if (!(global as any).memoryDisputesStore) {
      (global as any).memoryDisputesStore = [...initialDisputes];
    }


    const sentAtStr = new Date().toISOString();

    try {
      // 1. Fetch Dispute details to ensure it exists
      const { data: dispute, error: refErr } = await supabase
        .from('disputes')
        .select('*')
        .eq('id', id)
        .single();

      if (refErr || !dispute) {
        throw new Error(refErr?.message || "Dispute not registered in database.");
      }

      // 2. Mock and dispatch optional Resend email if configured
      const resendKey = process.env.RESEND_API_KEY;
      if (resendKey && resendKey !== "" && resendKey !== "MY_RESEND_API_KEY") {
        try {
          console.log(`Resend transmission queued: sending dispute letter to ${dispute.carrier_email || 'carrier'}`);
          // Dynamic import of Resend to avoid compile weight when inactive
          const { Resend } = await import('resend');
          const resendClient = new Resend(resendKey);

          await resendClient.emails.send({
            from: 'FreightAudit AI Claims <audit@freightauditing.com>',
            to: dispute.carrier_email || 'claims@carrier-trucking.com',
            subject: `OFFICIAL BILLING DISPUTE: Freight Invoice #${dispute.invoice_id}`,
            text: dispute.dispute_letter_text,
            headers: {
              'X-Entity-ID': dispute.id
            }
          });
        } catch (mailErr: any) {
          console.warn("Resend client failed, continuing with database status update:", mailErr.message);
        }
      } else {
        console.log(`[SANDBOX SMTP EMAIL] Transmission bypassed (no RESEND_API_KEY set). 
          To: ${dispute.carrier_email || 'carrier'}
          Subject: OFFICIAL BILLING DISPUTE
          Content preview: ${dispute.dispute_letter_text.substr(0, 150)}...`);
      }

      // 3. Update dispute row in database to status = 'sent'
      const { data: updatedRecord, error: updateErr } = await supabase
        .from('disputes')
        .update({
          status: 'sent',
          sent_at: sentAtStr
        })
        .eq('id', id)
        .select()
        .single();

      if (updateErr) {
        throw new Error(updateErr.message);
      }

      // Update related invoice status to reflects 'disputed'
      await supabase
        .from('invoices')
        .update({ status: 'disputed' })
        .eq('id', dispute.invoice_id);

      // Create general audit logging event
      const logInsert = {
        id: `log-${Date.now()}`,
        org_id: dispute.org_id || 'org-101',
        user_id: 'usr-mock',
        action: `Dispute letter generated and dispatched`,
        entity_type: 'dispute',
        entity_id: id,
        metadata: {
          invoice_id: dispute.invoice_id,
          amount: dispute.total_disputed_amount,
          destination_email: dispute.carrier_email,
          sent_at: sentAtStr
        },
        created_at: sentAtStr
      };

      await supabase
        .from('audit_logs')
        .insert(logInsert);

      // Sync into memory for fallback syncs
      const currentMemory = (global as any).memoryDisputesStore || [];
      const mIdx = currentMemory.findIndex((d: any) => d.id === id);
      if (mIdx !== -1) {
        currentMemory[mIdx] = {
          ...currentMemory[mIdx],
          status: 'sent',
          sent_at: sentAtStr
        };
      }

      const currentLogs = (global as any).memoryLogsStore || [];
      currentLogs.unshift(logInsert);

      return NextResponse.json({
        success: true,
        dispute: updatedRecord
      });

    } catch (dbErr: any) {
      console.warn("Dispute Send falling back to sandbox memory updates:", dbErr.message);

      const memoryDisputes = (global as any).memoryDisputesStore || [];
      const disputesIdx = memoryDisputes.findIndex((d: any) => d.id === id);

      if (disputesIdx === -1) {
        return NextResponse.json({ error: "Dispute ledger item not found." }, { status: 404 });
      }

      // Simulate sending logs
      memoryDisputes[disputesIdx].status = 'sent';
      memoryDisputes[disputesIdx].sent_at = sentAtStr;

      // Update in memory invoices status too
      const memoryInvoices = (global as any).memoryInvoicesStore || [];
      const invoiceIdx = memoryInvoices.findIndex((inv: any) => inv.id === memoryDisputes[disputesIdx].invoice_id);
      if (invoiceIdx !== -1) {
        memoryInvoices[invoiceIdx].status = 'disputed';
      }

      // Log the sending event
      const currentLogs = (global as any).memoryLogsStore || [];
      const auditLog = {
        id: `log-${Date.now()}`,
        org_id: memoryDisputes[disputesIdx].org_id || 'org-101',
        user_id: 'usr-mock',
        action: `Dispute letter generated and dispatched`,
        entity_type: 'dispute',
        entity_id: id,
        metadata: {
          invoice_id: memoryDisputes[disputesIdx].invoice_id,
          amount: memoryDisputes[disputesIdx].total_disputed_amount,
          destination_email: memoryDisputes[disputesIdx].carrier_email,
          sent_at: sentAtStr
        },
        created_at: sentAtStr
      };
      currentLogs.unshift(auditLog);
      
      // Update global logs store
      (global as any).memoryLogsStore = currentLogs;

      return NextResponse.json({
        success: true,
        dispute: memoryDisputes[disputesIdx]
      });
    }

  } catch (err: any) {
    console.error("Dispute sending failure:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
