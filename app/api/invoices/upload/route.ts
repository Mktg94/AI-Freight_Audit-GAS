import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { extractWithVeryfi, structureFreightInvoice, extractInvoiceData } from '@/lib/ai/extractInvoice';
import { auditInvoice } from '@/lib/ai/auditInvoice';
import { checkInvoiceLimit, incrementInvoiceCount } from '@/lib/auth/planLimits';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const contractId = formData.get('contract_id') as string;

    if (!file) {
      return NextResponse.json({ error: "Missing invoice PDF file" }, { status: 400 });
    }
    if (!contractId) {
      return NextResponse.json({ error: "Missing contract_id" }, { status: 400 });
    }

    const supabase = createClient();

    // Auth detection
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = user.id;

    // Get org
    const { data: orgs } = await supabase
      .from('organizations')
      .select('id')
      .eq('owner_id', userId)
      .limit(1);
    if (!orgs || orgs.length === 0) {
      return NextResponse.json({ error: "No organization found" }, { status: 404 });
    }
    const orgId = orgs[0].id;

    // Check invoice limit
    const limitCheck = await checkInvoiceLimit(orgId);
    if (!limitCheck.allowed) {
      return NextResponse.json({
        error: 'limit_exceeded', type: 'invoice',
        used: limitCheck.used, limit: limitCheck.limit, plan: limitCheck.plan
      }, { status: 429 });
    }

    // Read file buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload PDF to Supabase Storage
    const bucketName = 'invoices';
    const timestamp = Date.now();
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const storagePath = `${orgId}/${timestamp}_${cleanFileName}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(storagePath, file, { cacheControl: '3600', upsert: false });

    if (uploadError || !uploadData) {
      return NextResponse.json({ error: "Failed to upload file to storage" }, { status: 500 });
    }

    const { data: { publicUrl } } = supabase.storage
      .from(bucketName)
      .getPublicUrl(storagePath);
    const fileUrl = publicUrl;

    // AI Extraction: Veryfi OCR then Gemini structuring
    let extracted;
    try {
      const veryfiResult = await extractWithVeryfi(buffer, file.name);
      const ocrText = veryfiResult.ocr_text || veryfiResult.raw_text || JSON.stringify(veryfiResult);
      extracted = await structureFreightInvoice(veryfiResult, ocrText);
    } catch (veryfiErr: any) {
      // Fallback: direct Gemini from raw PDF text
      const pdfText = buffer.toString('utf-8').replace(/\0/g, '');
      if (pdfText.trim().length < 20) {
        throw new Error(`Veryfi extraction failed and PDF contains insufficient text: ${veryfiErr.message}`);
      }
      extracted = await extractInvoiceData(pdfText);
    }

    // Fetch contract
    const { data: selectedContract, error: contractErr } = await supabase
      .from('contracts')
      .select('*')
      .eq('id', contractId)
      .single();

    if (contractErr || !selectedContract) {
      return NextResponse.json({ error: "Contract not found" }, { status: 404 });
    }

    // Create invoice row
    const invoicePayload = {
      org_id: orgId,
      contract_id: contractId,
      file_name: file.name,
      file_url: fileUrl,
      carrier_name: extracted.carrier_name,
      invoice_number: extracted.invoice_number,
      invoice_date: extracted.invoice_date || new Date().toISOString().split('T')[0],
      shipment_date: extracted.shipment_date || new Date().toISOString().split('T')[0],
      origin: extracted.origin,
      destination: extracted.destination,
      weight_lbs: extracted.weight_lbs,
      distance_miles: extracted.distance_miles,
      status: 'auditing' as const,
      total_billed: extracted.total_billed,
      total_approved: 0,
      total_savings: 0,
      uploaded_at: new Date().toISOString(),
      raw_extracted_text: JSON.stringify(extracted),
      extracted_data: extracted
    };

    const { data: insertedInvoice, error: invErr } = await supabase
      .from('invoices')
      .insert(invoicePayload)
      .select()
      .single();

    if (invErr || !insertedInvoice) {
      return NextResponse.json({ error: "Failed to create invoice record" }, { status: 500 });
    }

    // AI audit: compare invoice line items against contract terms
    const contractTermsStr = JSON.stringify(selectedContract, null, 2);
    const auditResults = await auditInvoice(extracted, contractTermsStr);

    // Map audit results to line items
    let totalApproved = 0;
    const lineItemInserts = auditResults.line_items.map((auditLine, idx) => {
      totalApproved += auditLine.expected;
      return {
        invoice_id: insertedInvoice.id,
        description: auditLine.description,
        billed_amount: auditLine.billed,
        expected_amount: auditLine.expected,
        discrepancy: auditLine.difference,
        ai_flag_reason: auditLine.difference > 0 ? auditLine.reason : null,
        confidence_score: auditLine.status === 'match' ? 0.95 : 0.85,
        status: (auditLine.difference > 0 ? 'disputed' : 'approved') as const
      };
    });

    const totalSavings = Math.max(0, insertedInvoice.total_billed - totalApproved);
    const finalStatus: 'flagged' | 'approved' = totalSavings > 0 ? 'flagged' : 'approved';

    // Insert line items and update invoice
    const { error: liErr } = await supabase
      .from('line_items')
      .insert(lineItemInserts);

    if (liErr) {
      return NextResponse.json({ error: "Failed to insert line items" }, { status: 500 });
    }

    const { data: finalInv, error: updateErr } = await supabase
      .from('invoices')
      .update({
        status: finalStatus,
        total_approved: totalApproved,
        total_savings: totalSavings,
        carrier_notes: auditResults.carrier_notes,
        audited_at: new Date().toISOString()
      })
      .eq('id', insertedInvoice.id)
      .select()
      .single();

    // Add audit log
    await supabase
      .from('audit_logs')
      .insert({
        org_id: orgId,
        user_id: userId,
        action: 'invoice_uploaded',
        entity_type: 'invoice',
        entity_id: insertedInvoice.id,
        metadata: {
          invoice_id: insertedInvoice.id,
          invoice_number: insertedInvoice.invoice_number,
          carrier_name: insertedInvoice.carrier_name,
          total_savings: totalSavings,
          status: finalStatus
        },
        created_at: new Date().toISOString()
      });

    // Increment invoice usage counter
    await incrementInvoiceCount(orgId, 1);

    return NextResponse.json({
      success: true,
      invoiceId: insertedInvoice.id,
      data: {
        invoice: finalInv || insertedInvoice,
        lineItems: lineItemInserts
      }
    });

  } catch (err: any) {
    console.error("Upload Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
