import crypto from "crypto";
import express from "express";
import multer from "multer";
import { createClient } from "@supabase/supabase-js";
import { extractInvoiceData } from "../lib/ai/extractInvoice";
import { auditLineItems } from "../lib/ai/auditInvoice";
import { generateDisputeLetter } from "../lib/ai/generateDispute";
import { sendEmail } from "../lib/email";
import { inviteEmailHtml, disputeEmailHtml } from "../lib/email-templates";

const uploadRouter = multer({ storage: multer.memoryStorage() });

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Supabase credentials not configured");
  }
  return createClient(supabaseUrl, serviceRoleKey);
}

async function ensureDefaultOrg(supabase: any): Promise<string | null> {
  const { count } = await supabase
    .from("organizations")
    .select("*", { count: "exact", head: true });
  if (count && count > 0) {
    const { data } = await supabase.from("organizations").select("id").limit(1).single();
    return data?.id ?? null;
  }
  try {
    const { data: users } = await supabase.auth.admin.listUsers();
    const firstUser = users?.users?.[0];
    if (!firstUser) return null;
    const { data: org } = await supabase
      .from("organizations")
      .insert({ name: "Default Organization", owner_id: firstUser.id })
      .select()
      .single();
    if (!org) return null;
    await supabase.from("org_members").insert({
      org_id: org.id, user_id: firstUser.id, role: "admin", status: "active",
    });
    return org.id;
  } catch {
    return null;
  }
}

const app = express();
app.use(express.json());

app.get("/api/contracts", async (req, res) => {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("contracts")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    res.json({ success: true, data: data || [] });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to fetch contracts", details: err.message });
  }
});

app.post("/api/contracts", async (req, res) => {
  try {
    const supabase = getSupabaseAdmin();
    const payload = req.body;
    let org_id = payload.org_id;
    if (!org_id) {
      const { data: org } = await supabase
        .from("organizations")
        .select("id")
        .limit(1)
        .single();
      org_id = org?.id;
    }
    if (!org_id) {
      org_id = await ensureDefaultOrg(supabase);
    }
    if (!org_id) {
      return res.status(400).json({ error: "No organization found. Sign up first." });
    }
    const { data, error } = await supabase
      .from("contracts")
      .insert({
        org_id,
        carrier_name: payload.carrier_name,
        effective_date: payload.effective_date,
        expiry_date: payload.expiry_date,
        minimum_charge: Number(payload.minimum_charge) || 0,
        currency: payload.currency || 'USD',
        charge_items: payload.charge_items || [],
      })
      .select()
      .single();
    if (error) throw error;
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to create contract", details: err.message });
  }
});

app.patch("/api/contracts/:id", async (req, res) => {
  try {
    const supabase = getSupabaseAdmin();
    const { id } = req.params;
    const { data, error } = await supabase
      .from("contracts")
      .update(req.body)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to update contract", details: err.message });
  }
});

app.delete("/api/contracts/:id", async (req, res) => {
  try {
    const supabase = getSupabaseAdmin();
    const { id } = req.params;
    const { error } = await supabase.from("contracts").delete().eq("id", id);
    if (error) throw error;
    res.json({ success: true, message: "Contract deleted" });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to delete contract", details: err.message });
  }
});

app.post("/api/invoices/upload", uploadRouter.single("file"), async (req, res) => {
  try {
    const supabase = getSupabaseAdmin();
    const file = req.file;
    const contract_id = req.body.contract_id;
    let org_id = req.body.org_id;

    if (!file) {
      return res.status(400).json({ success: false, step: "upload", error: "Missing invoice PDF file" });
    }
    if (!contract_id) {
      return res.status(400).json({ success: false, step: "upload", error: "Missing contract id" });
    }
    if (!org_id) {
      const { data: org } = await supabase
        .from("organizations")
        .select("id")
        .limit(1)
        .single();
      org_id = org?.id ?? await ensureDefaultOrg(supabase);
    }
    if (!org_id) {
      return res.status(400).json({ success: false, step: "upload", error: "No organization found. Sign up first." });
    }

    let extractedInvoice: any;
    try {
      extractedInvoice = await extractInvoiceData(file.buffer, file.mimetype);
    } catch (err: any) {
      console.error("Gemini extraction failed:", err.message);
      return res.status(500).json({
        success: false,
        step: "extraction",
        error: `Extraction failed: ${err.message}`,
      });
    }

    let invoice: any;
    try {
      const fileName = `${org_id}/${Date.now()}_${file.originalname}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("invoices")
        .upload(fileName, file.buffer, { contentType: file.mimetype });
      if (uploadError) throw new Error(`Storage upload failed: ${uploadError.message}`);

      const { data: urlData } = supabase.storage.from("invoices").getPublicUrl(fileName);

      const { data: invoiceData, error: invoiceError } = await supabase
        .from("invoices")
        .insert({
          org_id,
          contract_id,
          file_name: file.originalname,
          file_url: urlData.publicUrl,
          carrier_name: extractedInvoice.carrier_name,
          invoice_number: extractedInvoice.invoice_number,
          invoice_date: extractedInvoice.invoice_date,
          shipment_date: extractedInvoice.shipment_date,
          origin: extractedInvoice.origin,
          destination: extractedInvoice.destination,
          weight_lbs: extractedInvoice.weight_lbs,
          distance_miles: extractedInvoice.distance_miles,
          extracted_data: extractedInvoice,
          status: "auditing",
          total_billed: extractedInvoice.total_billed,
          total_approved: 0,
          total_savings: 0,
          uploaded_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (invoiceError) throw new Error(`Invoice creation failed: ${invoiceError.message}`);
      invoice = invoiceData;
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        step: "storage",
        error: err.message,
      });
    }

    let contract: any;
    try {
      const { data: contractData, error: contractError } = await supabase
        .from("contracts")
        .select("*")
        .eq("id", contract_id)
        .single();
      if (contractError) throw new Error(`Contract fetch failed: ${contractError.message}`);
      contract = contractData;
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        step: "contract",
        error: err.message,
      });
    }

    let auditResults: any[];
    try {
      auditResults = await auditLineItems(
        (extractedInvoice.line_items || []).map((li: any) => ({
          description: li.description || "Line Item",
          billed_amount: Number(li.billed_amount) || 0,
          quantity: Number(li.quantity) || 1,
          unit: li.unit || "unit",
        })),
        contract
      );
    } catch (err: any) {
      console.error("Gemini audit failed:", err.message);
      return res.status(500).json({
        success: false,
        step: "audit",
        error: `Audit failed: ${err.message}`,
      });
    }

    try {
      const lineItemRows = auditResults.map((result: any) => ({
        invoice_id: invoice.id,
        description: result.description || "Line Item",
        billed_amount: Number(result.billed_amount) || 0,
        expected_amount: Number(result.expected_amount) || 0,
        discrepancy: Number(result.discrepancy) || 0,
        ai_flag_reason: result.flag_reason || "",
        confidence_score: Number(result.confidence_score) || 0.5,
        status: "pending" as const,
        created_at: new Date().toISOString(),
      }));

      const { error: lineItemsError } = await supabase
        .from("line_items")
        .insert(lineItemRows);
      if (lineItemsError) throw new Error(`Line items insert failed: ${lineItemsError.message}`);

      const totalApproved = auditResults.reduce(
        (sum: number, r: any) => sum + (Number(r.expected_amount) || 0),
        0
      );
      const totalSavings = Math.max(0, (extractedInvoice.total_billed || 0) - totalApproved);
      const hasFlags = auditResults.some(
        (r: any) => r.status !== "correct" && r.status !== undefined
      );

      const { error: updateError } = await supabase
        .from("invoices")
        .update({
          total_approved: totalApproved,
          total_savings: totalSavings,
          status: hasFlags ? "flagged" : "approved",
          audited_at: new Date().toISOString(),
        })
        .eq("id", invoice.id);
      if (updateError) throw new Error(`Invoice update failed: ${updateError.message}`);

      await supabase.from("audit_logs").insert({
        org_id,
        user_id: req.body.user_id || "system",
        action: "invoice_uploaded",
        entity_type: "invoice",
        entity_id: invoice.id,
        metadata: {
          line_items_count: lineItemRows.length,
          flags_count: auditResults.filter((r: any) => r.status !== "correct").length,
        },
      });

      return res.json({
        success: true,
        invoiceId: invoice.id,
        data: { invoice, lineItems: lineItemRows },
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        step: "save",
        error: err.message,
      });
    }
  } catch (err: any) {
    console.error("Upload error:", err);
    return res.status(500).json({
      success: false,
      step: "unknown",
      error: err.message || "Upload failed",
    });
  }
});

app.post("/api/invoices/detect-multi", (_req, res) => {
  res.json({ isMultiInvoice: false, estimatedCount: 1, previewData: [] });
});

app.post("/api/invoices/batch-upload", uploadRouter.array("files"), async (req, res) => {
  try {
    const supabase = getSupabaseAdmin();
    const files = req.files as Express.Multer.File[];
    const contract_id = req.body.contract_id;
    const user_id = req.body.user_id;
    let org_id = req.body.org_id;

    if (!files || files.length === 0) {
      return res.status(400).json({ error: "No invoice files provided" });
    }
    if (!contract_id) {
      return res.status(400).json({ error: "Missing contract id" });
    }
    if (!org_id) {
      if (user_id) {
        const { data: userOrgs } = await supabase
          .from("organizations")
          .select("id")
          .eq("owner_id", user_id)
          .limit(1);
        if (userOrgs && userOrgs.length > 0) {
          org_id = userOrgs[0].id;
        } else {
          const { data: anyOrg } = await supabase
            .from("organizations")
            .select("id")
            .limit(1)
            .maybeSingle();
          if (anyOrg) {
            await supabase.from("organizations").update({ owner_id: user_id }).eq("id", anyOrg.id);
            org_id = anyOrg.id;
          } else {
            const { data: newOrg } = await supabase
              .from("organizations")
              .insert({ name: "My Organization", owner_id: user_id })
              .select()
              .single();
            org_id = newOrg?.id || null;
          }
        }
      } else {
        const { data: org } = await supabase
          .from("organizations")
          .select("id")
          .limit(1)
          .single();
        org_id = org?.id ?? await ensureDefaultOrg(supabase);
      }
    }
    if (!org_id) {
      return res.status(400).json({ error: "No organization found." });
    }
    const batchId = crypto.randomUUID();
    const invoiceIds: string[] = [];
    console.log(`[batch-upload] org_id=${org_id} batchId=${batchId} files=${files.length}`);

    // Create invoice_batches record
    try {
      await supabase.from("invoice_batches").insert({
        id: batchId,
        org_id,
        file_name: files.length > 1 ? `${files.length} Files Batch` : files[0].originalname,
        status: "processing",
        total_count: files.length,
        completed_count: 0,
        invoice_ids: [],
      });
    } catch (batchErr: any) {
      console.warn("Failed to create batch record:", batchErr.message);
    }

    for (const file of files) {
      try {
        let extractedInvoice: any;
        try {
          extractedInvoice = await extractInvoiceData(file.buffer, file.mimetype);
        } catch (extractErr: any) {
          console.warn(`AI extraction failed for ${file.originalname}, using defaults:`, extractErr.message);
          extractedInvoice = {};
        }

        const fileName = `${org_id}/${Date.now()}_${file.originalname}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("invoices")
          .upload(fileName, file.buffer, { contentType: file.mimetype });
        if (uploadError) {
          console.warn("Storage upload failed, skipping:", uploadError.message);
          continue;
        }

        const { data: urlData } = supabase.storage.from("invoices").getPublicUrl(fileName);

        const { data: invoice, error: invoiceError } = await supabase
          .from("invoices")
          .insert({
            org_id,
            contract_id,
            file_name: file.originalname,
            file_url: urlData.publicUrl,
            carrier_name: extractedInvoice.carrier_name || "Unknown Carrier",
            invoice_number: extractedInvoice.invoice_number || `INV-${Date.now()}`,
            invoice_date: extractedInvoice.invoice_date || new Date().toISOString().split("T")[0],
            shipment_date: extractedInvoice.shipment_date || new Date().toISOString().split("T")[0],
            origin: extractedInvoice.origin || "Origin N/A",
            destination: extractedInvoice.destination || "Destination N/A",
            weight_lbs: extractedInvoice.weight_lbs || 0,
            distance_miles: extractedInvoice.distance_miles || 0,
            extracted_data: extractedInvoice,
            status: "auditing",
            total_billed: extractedInvoice.total_billed || 0,
            total_approved: 0,
            total_savings: 0,
            batch_id: batchId,
            uploaded_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (invoiceError) {
          console.warn("Invoice creation failed, skipping:", invoiceError.message);
          continue;
        }

        // Run audit against contract
        try {
          const { data: contractData } = await supabase
            .from("contracts")
            .select("*")
            .eq("id", contract_id)
            .single();

          if (contractData && extractedInvoice.line_items && extractedInvoice.line_items.length > 0) {
            const auditResults = await auditLineItems(extractedInvoice.line_items, contractData);

            let totalApproved = 0;
            const lineItemInserts = auditResults.map((item, idx) => {
              totalApproved += item.expected_amount;
              return {
                invoice_id: invoice.id,
                description: item.description,
                billed_amount: item.billed_amount,
                expected_amount: item.expected_amount,
                discrepancy: item.discrepancy,
                ai_flag_reason: item.flag_reason || null,
                confidence_score: item.confidence_score,
                status: item.status === "overcharged" || item.status === "suspicious" || item.status === "not_in_contract" ? "disputed" : "approved",
                created_at: new Date().toISOString(),
              };
            });

            await supabase.from("line_items").insert(lineItemInserts);

            const totalSavings = Math.max(0, (extractedInvoice.total_billed || 0) - totalApproved);
            const finalStatus = totalSavings > 0 ? "flagged" : "approved";

            await supabase
              .from("invoices")
              .update({
                status: finalStatus,
                total_approved: totalApproved,
                total_savings: totalSavings,
                audited_at: new Date().toISOString(),
              })
              .eq("id", invoice.id);
          } else {
            await supabase
              .from("invoices")
              .update({ status: "pending" })
              .eq("id", invoice.id);
          }
        } catch (auditErr: any) {
          console.warn(`Audit failed for ${file.originalname}:`, auditErr.message);
        }

        invoiceIds.push(invoice.id);
      } catch (err: any) {
        console.warn(`Failed to process ${file.originalname}:`, err.message);
      }
    }

    // Update batch status to completed
    try {
      await supabase
        .from("invoice_batches")
        .update({
          status: "completed",
          completed_count: invoiceIds.length,
          invoice_ids: invoiceIds,
        })
        .eq("id", batchId);
    } catch (updateErr: any) {
      console.warn("Failed to update batch status:", updateErr.message);
    }

    console.log(`[batch-upload] result: ${invoiceIds.length} invoices created, ids=${JSON.stringify(invoiceIds)}`);
    res.json({ success: true, batchId, invoiceIds });
  } catch (err: any) {
    console.error("Batch upload error:", err);
    res.status(500).json({ error: "Batch upload failed", details: err.message });
  }
});

app.get("/api/debug/setup-org", async (req, res) => {
  try {
    const admin = getSupabaseAdmin();
    const userId = req.query.userId as string;

    if (!userId) {
      const { data: { users }, error: listErr } = await admin.auth.admin.listUsers();
      if (listErr) throw listErr;
      const firstUser = users?.[0];
      if (!firstUser) throw new Error("No auth users found. Pass ?userId= as query param.");
      return res.redirect(`/api/debug/setup-org?userId=${firstUser.id}`);
    }

    const { data: existingForUser } = await admin
      .from("organizations")
      .select("id")
      .eq("owner_id", userId)
      .limit(1);

    if (existingForUser && existingForUser.length > 0) {
      return res.json({ orgId: existingForUser[0].id, message: "Org already exists for this user" });
    }

    const { data: anyOrg } = await admin
      .from("organizations")
      .select("id")
      .limit(1)
      .maybeSingle();

    if (anyOrg) {
      await admin.from("organizations").update({ owner_id: userId }).eq("id", anyOrg.id);
      return res.json({ orgId: anyOrg.id, message: "Updated existing org owner to your user ID" });
    }

    const { data: newOrg, error: createErr } = await admin
      .from("organizations")
      .insert({ name: "My Organization", owner_id: userId })
      .select()
      .single();
    if (createErr) throw createErr;

    res.json({ orgId: newOrg.id, message: "Created new org for your user" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/debug/check-invoice/:invoiceId", async (req, res) => {
  try {
    const supabase = getSupabaseAdmin();
    const { invoiceId } = req.params;
    const { data, error } = await supabase
      .from("invoices")
      .select("id, org_id, batch_id, file_name, carrier_name")
      .eq("id", invoiceId)
      .single();
    if (error) throw error;
    res.json({ found: true, invoice: data });
  } catch (err: any) {
    res.json({ found: false, error: err.message });
  }
});

app.get("/api/debug/invoices/:batchId", async (req, res) => {
  try {
    const supabase = getSupabaseAdmin();
    const { batchId } = req.params;
    const { data, error } = await supabase
      .from("invoices")
      .select("id, org_id, batch_id, file_name, carrier_name")
      .eq("batch_id", batchId);
    if (error) throw error;
    res.json({ count: data?.length || 0, invoices: data });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/invoices/batch/:batchId/status", async (req, res) => {
  try {
    const supabase = getSupabaseAdmin();
    const { batchId } = req.params;
    const { data, error } = await supabase
      .from("invoices")
      .select("*")
      .eq("batch_id", batchId);
    if (error) throw error;
    const invoices = data || [];
    const allDone = invoices.every((inv: any) => inv.status !== "auditing");
    res.json({
      status: allDone ? "completed" : "processing",
      completedCount: invoices.filter((inv: any) => inv.status !== "auditing").length,
      totalCount: invoices.length,
      invoiceIds: invoices.map((inv: any) => inv.id),
      failedFiles: [],
    });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to get batch status", details: err.message });
  }
});

app.get("/api/invoices/:id/status", async (req, res) => {
  try {
    const supabase = getSupabaseAdmin();
    const { id } = req.params;
    const { data, error } = await supabase
      .from("invoices")
      .select("status")
      .eq("id", id)
      .single();
    if (error) throw error;
    res.json({ status: data.status });
  } catch (err: any) {
    res.status(404).json({ error: "Invoice not found" });
  }
});

app.get("/api/invoices/:id", async (req, res) => {
  try {
    const supabase = getSupabaseAdmin();
    const { id } = req.params;

    const { data: invoice, error: invError } = await supabase
      .from("invoices")
      .select("*")
      .eq("id", id)
      .single();
    if (invError) throw invError;

    const { data: lineItems } = await supabase
      .from("line_items")
      .select("*")
      .eq("invoice_id", id);

    const { data: contract } = invoice.contract_id
      ? await supabase.from("contracts").select("*").eq("id", invoice.contract_id).single()
      : { data: null };

    res.json({ success: true, invoice, lineItems: lineItems || [], contract });
  } catch (err: any) {
    res.status(404).json({ error: "Invoice not found" });
  }
});

app.patch("/api/line-items/:id", express.json(), async (req, res) => {
  try {
    const supabase = getSupabaseAdmin();
    const { id } = req.params;
    const { status, approval_reason, approval_notes } = req.body;

    if (status !== "approved" && status !== "disputed") {
      return res.status(400).json({ error: "Invalid status" });
    }

    const updatePayload: any = {
      status,
      reviewed_at: new Date().toISOString(),
    };
    if (req.body.user_id) {
      updatePayload.reviewed_by = req.body.user_id;
    }
    if (approval_reason) updatePayload.approval_reason = approval_reason;
    if (approval_notes) updatePayload.approval_notes = approval_notes;

    const { data: updatedItem, error: updateError } = await supabase
      .from("line_items")
      .update(updatePayload)
      .eq("id", id)
      .select()
      .single();
    if (updateError) throw updateError;

    const invoiceId = updatedItem.invoice_id;
    const { data: siblings } = await supabase
      .from("line_items")
      .select("*")
      .eq("invoice_id", invoiceId);

    let totalApproved = 0;
    let totalSavings = 0;
    (siblings || []).forEach((line: any) => {
      if (line.status === "approved") totalApproved += Number(line.billed_amount) || 0;
      else if (line.status === "disputed") {
        totalApproved += Number(line.expected_amount) || 0;
        totalSavings += Math.max(0, Number(line.discrepancy) || 0);
      } else {
        totalApproved += Number(line.expected_amount) || 0;
      }
    });

    const hasDisputedItems = (siblings || []).some((l: any) => l.status === "disputed");
    const hasFlaggedItems = (siblings || []).some((l: any) => l.status === "disputed" || Number(l.discrepancy) > 0);
    const finalStatus = hasFlaggedItems ? "flagged" : "approved";

    await supabase
      .from("invoices")
      .update({
        total_approved: totalApproved,
        total_savings: totalSavings,
        status: finalStatus,
        audited_at: new Date().toISOString(),
      })
      .eq("id", invoiceId);

    const { data: freshInvoice } = await supabase
      .from("invoices")
      .select("*")
      .eq("id", invoiceId)
      .single();

    res.json({ success: true, lineItem: updatedItem, invoice: freshInvoice });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to update line item", details: err.message });
  }
});

app.post("/api/invoices/:id/approve-clean", async (req, res) => {
  try {
    const supabase = getSupabaseAdmin();
    const { id } = req.params;

    const { data: cleanItems, error: fetchError } = await supabase
      .from("line_items")
      .select("*")
      .eq("invoice_id", id)
      .eq("status", "pending")
      .eq("discrepancy", 0);
    if (fetchError) throw fetchError;

    const cleanIds = (cleanItems || []).map((item: any) => item.id);
    if (cleanIds.length > 0) {
      const updateBody: any = {
        status: "approved",
        reviewed_at: new Date().toISOString(),
      };
      if (req.body.user_id) updateBody.reviewed_by = req.body.user_id;

      const { error: updateError } = await supabase
        .from("line_items")
        .update(updateBody)
        .in("id", cleanIds);
      if (updateError) throw updateError;
    }

    const { data: siblings } = await supabase
      .from("line_items")
      .select("*")
      .eq("invoice_id", id);

    let totalApproved = 0;
    let totalSavings = 0;
    (siblings || []).forEach((line: any) => {
      if (line.status === "approved") totalApproved += Number(line.billed_amount) || 0;
      else if (line.status === "disputed") {
        totalApproved += Number(line.expected_amount) || 0;
        totalSavings += Math.max(0, Number(line.discrepancy) || 0);
      } else {
        totalApproved += Number(line.expected_amount) || 0;
      }
    });

    const hasFlaggedItems = (siblings || []).some((l: any) => l.status === "disputed" || Number(l.discrepancy) > 0);
    const finalStatus = hasFlaggedItems ? "flagged" : "approved";

    await supabase
      .from("invoices")
      .update({
        total_approved: totalApproved,
        total_savings: totalSavings,
        status: finalStatus,
        audited_at: new Date().toISOString(),
      })
      .eq("id", id);

    const { data: refreshedInvoice } = await supabase
      .from("invoices")
      .select("*")
      .eq("id", id)
      .single();

    res.json({ success: true, approvedCount: cleanIds.length, invoice: refreshedInvoice });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to approve clean items", details: err.message });
  }
});

function performRulesBasedAudit(invoice: any, contract: any) {
  const chargeItems: Array<{ name: string; rate: number; rate_type: string }> = contract.charge_items || [];
  const minCharge = Number(contract.minimum_charge) || 0;
  const discrepancies: any[] = [];
  const rawItems = invoice.extracted_data?.line_items || [];

  const findMatchingCharge = (desc: string): { name: string; rate: number; rate_type: string } | null => {
    const dl = desc.toLowerCase();
    for (const ci of chargeItems) {
      const cl = ci.name.toLowerCase();
      if (dl.includes(cl)) return ci;
      if (cl.includes("detention") && (dl.includes("detention") || dl.includes("waiting") || dl.includes("standby"))) return ci;
      if (cl.includes("residential") && dl.includes("residential")) return ci;
      if (cl.includes("liftgate") && (dl.includes("liftgate") || dl.includes("lift-gate"))) return ci;
      if (cl.includes("fuel") && dl.includes("fuel")) return ci;
      if (cl.includes("base") && (dl.includes("base") || dl.includes("freight"))) return ci;
      if (cl.includes("inside") && dl.includes("inside")) return ci;
      if (cl.includes("redelivery") && (dl.includes("redeliv") || dl.includes("re-deliv"))) return ci;
    }
    return null;
  };

  rawItems.forEach((item: any) => {
    const desc = item.description || "";
    const billed = Number(item.billed_amount) || 0;

    const matched = findMatchingCharge(desc);

    if (!matched) {
      const diff = billed > 0 ? billed : 0;
      discrepancies.push({
        item_description: item.description,
        billed,
        expected: 0,
        difference: diff,
        type: billed > 0 ? "not_in_contract" : "correct",
        reason: billed > 0
          ? `Charge '${item.description}' ($${billed.toFixed(2)}) is not defined in the contract.`
          : "No charge reported for this item.",
      });
      return;
    }

    if (matched.rate_type === "Not Allowed") {
      discrepancies.push({
        item_description: item.description,
        billed,
        expected: 0,
        difference: billed,
        type: "overcharged",
        reason: `${matched.name} is marked "Not Allowed" in the contract. Billed: $${billed.toFixed(2)}.`,
      });
      return;
    }

    let expected = 0;
    if (matched.rate_type === "Flat fee per occurrence") {
      expected = matched.rate;
    } else if (matched.rate_type === "Percentage of base freight charge") {
      const baseItem = rawItems.find((ri: any) => {
        const rd = (ri.description || "").toLowerCase();
        return rd.includes("base") || rd.includes("freight");
      });
      const baseAmount = baseItem ? Number(baseItem.billed_amount) || 0 : expected;
      expected = baseAmount * (matched.rate / 100);
    } else if (matched.rate_type.startsWith("Per ")) {
      expected = matched.rate * (Number(item.quantity) || 1);
    } else {
      expected = matched.rate;
    }

    const diff = Math.max(0, billed - expected);
    discrepancies.push({
      item_description: item.description,
      billed,
      expected,
      difference: diff,
      type: diff > 1.0 ? "overcharged" : "correct",
      reason: diff > 1.0
        ? `${matched.name} contracted at $${matched.rate} (${matched.rate_type}). Billed: $${billed.toFixed(2)}.`
        : `Matches negotiated rate ($${matched.rate} ${matched.rate_type}).`,
    });
  });

  const calculated_total_expected = discrepancies.reduce((sum: number, d: any) => sum + (Number(d.expected) || 0), 0);
  const overchargedLogs = discrepancies.filter((d: any) => d.type === "overcharged" || d.type === "not_in_contract");
  const total_discrepancy = overchargedLogs.reduce((sum: number, item: any) => sum + item.difference, 0);

  return {
    invoice_id: invoice.id,
    status: total_discrepancy > 5.0 ? "flagged" : "passed",
    calculated_base_rate: 0,
    calculated_fuel_surcharge: 0,
    calculated_accessorial_fees: 0,
    calculated_total_expected,
    total_discrepancy,
    confidence_score: 0.98,
    reason_summary: total_discrepancy > 0
      ? `Rules audit flagged total overcharges of $${total_discrepancy.toFixed(2)} across ${overchargedLogs.length} line item(s).`
      : "All charges match contract terms.",
    discrepancies,
  };
}

app.post("/api/audit", async (req, res) => {
  try {
    const { invoice, contract } = req.body;
    if (!invoice || !contract) {
      return res.status(400).json({ error: "Missing invoice or contract" });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "" || apiKey === "MY_GEMINI_API_KEY") {
      console.log("No Gemini API key. Running rules-based audit.");
      return res.json(performRulesBasedAudit(invoice, contract));
    }

    const supabase = getSupabaseAdmin();
    const { data: contractData } = await supabase
      .from("contracts")
      .select("*")
      .eq("id", contract.id || contract.contract_id)
      .single();
    const resolvedContract = contractData || contract;

    const lineItems = invoice.line_items || invoice.extracted_data?.line_items || [];
    const auditResults = await auditLineItems(
      lineItems.map((li: any) => ({
        description: li.description || "Line Item",
        billed_amount: Number(li.billed_amount) || 0,
        quantity: Number(li.quantity) || 1,
        unit: li.unit || "unit",
      })),
      resolvedContract
    );

    const calculated_total_expected = auditResults.reduce((sum: number, r: any) => sum + (Number(r.expected_amount) || 0), 0);
    const total_discrepancy = auditResults.reduce((sum: number, r: any) => sum + (Number(r.discrepancy) || 0), 0);
    const flaggedItems = auditResults.filter((r: any) => r.status !== "correct");

    res.json({
      invoice_id: invoice.id,
      status: flaggedItems.length > 0 ? "flagged" : "passed",
      calculated_base_rate: 0,
      calculated_fuel_surcharge: 0,
      calculated_accessorial_fees: 0,
      calculated_total_expected,
      total_discrepancy,
      confidence_score: 0.95,
      reason_summary: flaggedItems.length > 0
        ? `Gemini audit flagged ${flaggedItems.length} item(s) totaling $${total_discrepancy.toFixed(2)}.`
        : "All items match contract terms.",
      discrepancies: auditResults.map((r: any) => ({
        item_description: r.description,
        billed: r.billed_amount,
        expected: r.expected_amount,
        difference: r.discrepancy,
        type: r.status === "correct" ? "correct" : r.status,
        reason: r.flag_reason,
      })),
    });
  } catch (err: any) {
    console.error("Audit error:", err);
    res.status(500).json({ error: "Audit failed", details: err.message });
  }
});

app.get("/api/disputes/:id", async (req, res) => {
  try {
    const supabase = getSupabaseAdmin();
    const { id } = req.params;
    const { data: dispute, error } = await supabase
      .from("disputes")
      .select("*")
      .eq("id", id)
      .single();
    if (error || !dispute) return res.status(404).json({ error: "Dispute not found" });

    const { data: invoice } = await supabase
      .from("invoices")
      .select("*")
      .eq("id", dispute.invoice_id)
      .single();

    const { data: lineItems } = await supabase
      .from("line_items")
      .select("*")
      .eq("invoice_id", dispute.invoice_id)
      .eq("status", "disputed");

    res.json({ success: true, dispute, invoice: invoice || null, lineItems: lineItems || [] });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.patch("/api/disputes/:id", async (req, res) => {
  try {
    const supabase = getSupabaseAdmin();
    const { id } = req.params;
    const { data, error } = await supabase
      .from("disputes")
      .update(req.body)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    if (!data) return res.status(404).json({ error: "Dispute not found" });
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/disputes/create", async (req, res) => {
  try {
    const { invoice_id } = req.body;
    const supabase = getSupabaseAdmin();

    const { data: invoice, error: invError } = await supabase
      .from("invoices")
      .select("*")
      .eq("id", invoice_id)
      .single();
    if (invError || !invoice) {
      return res.status(404).json({ error: "Invoice not found" });
    }

    const { data: existing } = await supabase
      .from("disputes")
      .select("*")
      .eq("invoice_id", invoice_id)
      .neq("status", "rejected")
      .limit(1);
    if (existing && existing.length > 0) {
      return res.json({ success: true, data: existing[0], disputeId: existing[0].id, reused: true });
    }

    const { data: lineItems } = await supabase
      .from("line_items")
      .select("*")
      .eq("invoice_id", invoice_id)
      .eq("status", "disputed");

    const items = lineItems || [];
    const totalDisputed = items.reduce((sum: number, li: any) => sum + (Number(li.discrepancy) || 0), 0);

    const { data: orgData } = await supabase
      .from("organizations")
      .select("name")
      .eq("id", invoice.org_id)
      .single();

    const disputeLetter = await generateDisputeLetter({
      companyName: orgData?.name || "Our Company",
      carrierName: invoice.carrier_name || "Carrier",
      invoiceNumber: invoice.invoice_number || "N/A",
      invoiceDate: invoice.invoice_date || "",
      disputedItems: items.map((li: any) => ({
        description: li.description,
        billed_amount: Number(li.billed_amount) || 0,
        expected_amount: Number(li.expected_amount) || 0,
        discrepancy: Number(li.discrepancy) || 0,
        flag_reason: li.ai_flag_reason || "",
      })),
      totalDisputed,
    });

    const { data: newDispute, error: insertErr } = await supabase
      .from("disputes")
      .insert({
        invoice_id,
        org_id: invoice.org_id,
        carrier_name: invoice.carrier_name || "",
        carrier_email: req.body.carrier_email || "",
        dispute_letter_text: disputeLetter,
        total_disputed_amount: totalDisputed,
        status: "draft",
      })
      .select()
      .single();

    if (insertErr) throw insertErr;

    await supabase
      .from("invoices")
      .update({ status: "disputed" })
      .eq("id", invoice_id);

    res.json({ success: true, data: newDispute, disputeId: newDispute.id });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to create dispute", details: err.message });
  }
});

app.post("/api/disputes/:id/send", async (req, res) => {
  try {
    const supabase = getSupabaseAdmin();
    const { id } = req.params;

    const { data: dispute, error: fetchErr } = await supabase
      .from("disputes")
      .select("*")
      .eq("id", id)
      .single();
    if (fetchErr || !dispute) return res.status(404).json({ error: "Dispute not found" });

    // Fetch invoice number for display
    let invoiceNumber = dispute.invoice_id;
    try {
      const { data: inv } = await supabase
        .from("invoices")
        .select("invoice_number")
        .eq("id", dispute.invoice_id)
        .single();
      if (inv?.invoice_number) invoiceNumber = inv.invoice_number;
    } catch (_) {}

    // Send email via Gmail SMTP if app password is configured
    if (process.env.GMAIL_APP_PASSWORD && dispute.carrier_email) {
      try {
        await sendEmail({
          to: dispute.carrier_email,
          subject: `Billing Dispute Notice — Invoice #${invoiceNumber}`,
          html: disputeEmailHtml(
            invoiceNumber,
            dispute.carrier_name || 'N/A',
            dispute.total_disputed_amount || 0,
            dispute.dispute_letter_text || '',
            dispute.id
          ),
        });
      } catch (emailErr: any) {
        console.warn("Email send failed (continuing):", emailErr.message);
      }
    }

    const { data: updated, error: updateErr } = await supabase
      .from("disputes")
      .update({ status: "sent", sent_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();
    if (updateErr) throw updateErr;

    res.json({ success: true, data: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/disputes/:id/resolve", async (req, res) => {
  try {
    const supabase = getSupabaseAdmin();
    const { id } = req.params;
    const resolutionAmount = Number(req.body.resolution_amount) || 0;
    const resolutionOutcome = req.body.resolution_outcome || 'full_credit';
    const resolutionNotes = req.body.resolution_notes || '';
    const resolvedBy = req.body.resolved_by || null;

    const { data: dispute, error: fetchErr } = await supabase
      .from("disputes")
      .select("*")
      .eq("id", id)
      .single();
    if (fetchErr || !dispute) return res.status(404).json({ error: "Dispute not found" });

    const { error: updateErr } = await supabase
      .from("disputes")
      .update({
        status: "resolved",
        resolved_at: new Date().toISOString(),
        resolution_amount: resolutionAmount,
        resolution_outcome: resolutionOutcome,
        resolution_notes: resolutionNotes,
        resolved_by: resolvedBy,
      })
      .eq("id", id);
    if (updateErr) throw updateErr;

    const { data: invoice } = await supabase
      .from("invoices")
      .select("*")
      .eq("id", dispute.invoice_id)
      .single();

    if (invoice) {
      const totalApproved = Math.max(0, (invoice.total_billed || 0) - resolutionAmount);
      await supabase
        .from("invoices")
        .update({
          status: "approved",
          total_approved: totalApproved,
          total_savings: resolutionAmount,
          resolved_by: resolvedBy,
        })
        .eq("id", dispute.invoice_id);
    }

    res.json({ success: true, disputeId: id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/invoices/:id/approve", async (req, res) => {
  try {
    const supabase = getSupabaseAdmin();
    const { id } = req.params;

    const { data: invoice, error: fetchErr } = await supabase
      .from("invoices")
      .select("*")
      .eq("id", id)
      .single();
    if (fetchErr || !invoice) return res.status(404).json({ error: "Invoice not found" });

    const savings = Math.max(0, (invoice.total_billed || 0) - (invoice.total_approved || 0));

    const { data: updated, error: updateErr } = await supabase
      .from("invoices")
      .update({
        status: "approved",
        total_savings: savings,
        audited_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();
    if (updateErr) throw updateErr;

    res.json({ success: true, data: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/team/members", async (req, res) => {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("org_member_details")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    const members = (data || []).map((m: any) => ({
      id: m.id,
      org_id: m.org_id,
      user_id: m.user_id,
      full_name: m.full_name || m.user_full_name || m.email || "Unknown",
      email: m.email || "",
      role: m.role,
      status: m.status,
      created_at: m.created_at,
    }));

    res.json({ success: true, data: members });
  } catch (err: any) {
    console.warn("Failed to fetch team members:", err.message);
    res.json({ success: true, data: [] });
  }
});

// app.get("/api/team/members", async (req, res) => {
//   try {
//     const supabase = getSupabaseAdmin();

//     const { data, error } = await supabase
//       .from("org_members")
//       .select("*")
//       .order("created_at", { ascending: false });

//     if (error) throw error;

//     const members = data.map((m: any) => ({
//       id: m.id,
//       org_id: m.org_id,
//       user_id: m.user_id,
//       role: m.role,
//       status: m.status,
//       created_at: m.created_at,
//     }));

//     res.json({ success: true, data: members });
//   } catch (err: any) {
//     console.warn("Failed to fetch team members:", err.message);
//     res.status(500).json({ success: false, data: [] });
//   }
// });


app.patch("/api/team/:memberId", async (req, res) => {
  try {
    const supabase = getSupabaseAdmin();
    const { memberId } = req.params;
    const { role, status } = req.body;

    const updates: any = {};
    if (role) updates.role = role;
    if (status) updates.status = status;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: "Nothing to update." });
    }

    const { data, error } = await supabase
      .from("org_members")
      .update(updates)
      .eq("id", memberId)
      .select()
      .single();
    if (error) throw error;
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to update member", details: err.message });
  }
});

app.delete("/api/team/:memberId", async (req, res) => {
  try {
    const supabase = getSupabaseAdmin();
    const { memberId } = req.params;
    const hard = req.query.hard === "true";

    console.log("🗑️ DELETE member:", memberId, "hard:", hard);

    // Get current member status
    const { data: member, error: fetchError } = await supabase
      .from("org_members")
      .select("status, user_id")
      .eq("id", memberId)
      .maybeSingle();

    if (fetchError) {
      console.error("❌ Fetch error:", fetchError);
      return res.status(500).json({ error: "Database error", details: fetchError.message });
    }

    if (!member) {
      console.log("❌ Member not found:", memberId);
      return res.status(404).json({ error: "Member not found." });
    }

    console.log("📋 Member status:", member.status, "user_id:", member.user_id);

    // Hard delete for invited members or when ?hard=true
    if (hard || member.status === "invited" || !member.user_id) {
      const { error } = await supabase
        .from("org_members")
        .delete()
        .eq("id", memberId);

      if (error) throw error;
      console.log("✅ Hard deleted:", memberId);
      return res.json({ success: true, deleted: true });
    }

    // Suspend for active members (keep audit trail)
    const { data, error } = await supabase
      .from("org_members")
      .update({ status: "suspended" })
      .eq("id", memberId)
      .select()
      .single();
    if (error) throw error;
    console.log("✅ Suspended:", memberId);
    res.json({ success: true, data });
  } catch (err: any) {
    console.error("❌ Delete error:", err);
    res.status(500).json({ error: "Failed to remove member", details: err.message });
  }
});

// app.post("/api/team/invite", async (req, res) => {
//   try {
//     const supabase = getSupabaseAdmin();
//     const { email, role } = req.body;
//     if (!email || !role) {
//       return res.status(400).json({ error: "Missing email or role" });
//     }

//     const { data: existingUser } = await supabase
//       .from("auth.users")
//       .select("id")
//       .eq("email", email)
//       .maybeSingle();

//     const userId = existingUser?.id || `pending-${Date.now()}`;
//     const { data: orgData } = await supabase
//       .from("organizations")
//       .select("id, seat_limit")
//       .limit(1)
//       .single();

//     if (!orgData) {
//       return res.status(400).json({ error: "No organization found" });
//     }

//     const { count } = await supabase
//       .from("org_members")
//       .select("*", { count: "exact", head: true })
//       .eq("org_id", orgData.id)
//       .neq("status", "suspended");

//     if (count !== null && count >= (orgData.seat_limit || 10)) {
//       return res.status(403).json({ error: "seat_limit_reached", limit: orgData.seat_limit });
//     }

//     const { data, error } = await supabase
//       .from("org_members")
//       .insert({
//         org_id: orgData.id,
//         user_id: userId,
//         role,
//         status: "invited",
//       })
//       .select()
//       .single();

//     if (error) throw error;
//     res.json({ success: true, data });
//   } catch (err: any) {
//     res.status(500).json({ error: "Failed to invite member", details: err.message });
//   }
// });


app.post("/api/team/invite", async (req, res) => {
  try {
    const supabase = getSupabaseAdmin();
    const { email, role } = req.body;

    if (!email || !role) {
      return res.status(400).json({ error: "Missing email or role" });
    }

    // 1. Get organization
    const { data: orgData, error: orgError } = await supabase
      .from("organizations")
      .select("id, seat_limit")
      .limit(1)
      .maybeSingle();

    if (orgError || !orgData) {
      return res.status(400).json({ error: "No organization found" });
    }

    const orgId = orgData.id;
    const seatLimit = orgData.seat_limit ?? 10;

    // 2. Seat limit check — count only active members (status = 'active')
    const { count, error: countError } = await supabase
      .from("org_members")
      .select("*", { count: "exact", head: true })
      .eq("org_id", orgId)
      .eq("status", "active");

    if (countError) {
      return res.status(500).json({
        error: "Failed to count members",
        details: countError.message,
      });
    }

    if (count !== null && count >= seatLimit) {
      return res.status(403).json({
        error: "seat_limit_reached",
        limit: seatLimit,
      });
    }

    // 3. Check if email already has an entry in this org
    const { data: existingMember } = await supabase
      .from("org_members")
      .select("id, status")
      .eq("org_id", orgId)
      .eq("email", email.toLowerCase().trim())
      .maybeSingle();

    if (existingMember) {
      if (existingMember.status === "active") {
        return res.status(409).json({ error: "This user is already a member of your organization." });
      }
      // Re-send invite for invited or suspended users
      const token = `inv-${Math.random().toString(36).substring(2, 11)}`;
      const { error: updateError } = await supabase
        .from("org_members")
        .update({
          status: "invited",
          invite_token: token,
          role,
          invited_at: new Date().toISOString(),
          invite_expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        })
        .eq("id", existingMember.id);

      if (updateError) throw updateError;

      await sendExpressInviteEmail(email, role, token, orgId);

      return res.json({ success: true, token, resent: true });
    }

    // 4. Create invite with email + token (no user_id needed)
    const token = `inv-${Math.random().toString(36).substring(2, 11)}`;

    const { error: insertError } = await supabase
      .from("org_members")
      .insert({
        org_id: orgId,
        email: email.toLowerCase().trim(),
        invite_token: token,
        role,
        status: "invited",
        invite_expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      });

    if (insertError) {
      if (insertError.code === "23505") {
        return res.status(409).json({ error: "An invitation for this email already exists." });
      }
      throw insertError;
    }

    // 5. Send email
    await sendExpressInviteEmail(email, role, token, orgId);

    return res.json({ success: true, token });
  } catch (err: any) {
    console.error("Invite error:", err);
    return res.status(500).json({
      error: "Unexpected server error",
      details: err.message,
    });
  }
});

async function sendExpressInviteEmail(email: string, role: string, token: string, orgId: string) {
  const inviteLink = `${process.env.APP_URL || "http://localhost:3000"}/auth/accept-invite?token=${token}&email=${encodeURIComponent(email)}`;

  console.log("\n========================================");
  console.log("📨 INVITE GENERATED");
  console.log("   To:", email);
  console.log("   Role:", role);
  console.log("   Token:", token);
  console.log("   Link:", inviteLink);
  console.log("========================================\n");

  const sent = await sendEmail({
    to: email,
    subject: "You're invited to join FreightAudit AI",
    html: inviteEmailHtml(role, token, inviteLink),
  });

  if (sent) {
    console.log("✅ Invite email sent successfully to", email);
  } else {
    console.log("⚠️ GMAIL_APP_PASSWORD not configured — copy the invite link above to share manually.");
  }
}


app.get("/api/team/accept-invite", async (req, res) => {
  try {
    const supabase = getSupabaseAdmin();
    const token = req.query.token as string;
    const email = req.query.email as string;

    if (!token) {
      return res.status(400).json({ error: "Missing invite token." });
    }

    const { data: invite } = await supabase
      .from("org_members")
      .select(`
        id, org_id, email, role, status, invited_at, invite_expires_at,
        organizations:org_id ( name )
      `)
      .eq("invite_token", token)
      .eq("status", "invited")
      .maybeSingle();

    if (!invite) {
      return res.status(404).json({ error: "Invite not found or already accepted." });
    }

    if (invite.invite_expires_at && new Date(invite.invite_expires_at) < new Date()) {
      return res.status(410).json({ error: "This invitation has expired." });
    }

    if (email && invite.email !== email.toLowerCase().trim()) {
      return res.status(400).json({ error: "Email mismatch." });
    }

    res.json({
      success: true,
      invite: {
        org_name: (invite.organizations as any)?.name || "Your Organization",
        email: invite.email,
        role: invite.role
      }
    });
  } catch (err: any) {
    console.error("Error validating invite:", err);
    res.status(500).json({ error: "Failed to validate invitation." });
  }
});

app.post("/api/team/accept-invite", async (req, res) => {
  try {
    const supabase = getSupabaseAdmin();
    const { token, full_name, password } = req.body;

    if (!token || !full_name || !password) {
      return res.status(400).json({ error: "Missing required fields: token, full_name, password." });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters." });
    }

    // Find invite by token
    const { data: invite } = await supabase
      .from("org_members")
      .select("id, org_id, email, role, status")
      .eq("invite_token", token)
      .eq("status", "invited")
      .maybeSingle();

    if (!invite) {
      return res.status(404).json({ error: "Invite not found or already accepted." });
    }

    if (!invite.email) {
      return res.status(400).json({ error: "Invite has no associated email." });
    }

    // Create the auth user (bypasses email confirmation with service_role key)
    let authUserId: string | null = null;
    const { data: authData, error: createError } = await supabase.auth.admin.createUser({
      email: invite.email,
      password,
      email_confirm: true,
      user_metadata: { full_name }
    });

    if (createError) {
      if (createError.code === 'email_exists') {
        // User already has an auth account — fetch their existing ID
        const { data: existingUsers } = await supabase.auth.admin.listUsers();
        const existing = existingUsers?.users?.find(u => u.email === invite.email);
        if (existing) {
          authUserId = existing.id;
        } else {
          return res.status(409).json({ error: "An account with this email already exists." });
        }
      } else {
        throw createError;
      }
    } else if (authData?.user) {
      authUserId = authData.user.id;
    }

    if (!authUserId) {
      return res.status(500).json({ error: "Failed to create or find user account." });
    }

    // Update password and metadata on existing account
    if (createError?.code === 'email_exists') {
      await supabase.auth.admin.updateUserById(authUserId, { password, user_metadata: { full_name } });
    }

    // Link the user to the org_members row
    const { error: updateError } = await supabase
      .from("org_members")
      .update({
        user_id: authUserId,
        full_name,
        status: "active",
        invite_token: null,
        invited_at: new Date().toISOString()
      })
      .eq("id", invite.id);

    if (updateError) {
      console.error("Failed to link user to org:", updateError);
      return res.json({
        success: true,
        warning: "Account created but failed to link to organization. Please contact support."
      });
    }

    res.json({
      success: true,
      message: "Account created and linked to organization successfully."
    });
  } catch (err: any) {
    console.error("Accept invite error:", err);
    res.status(500).json({
      error: "Failed to accept invite",
      details: err.message,
    });
  }
});

app.get("/api/team/my-role", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Missing authorization header." });
    }
    const token = authHeader.slice(7);

    // Verify the token and get the user
    const supabase = getSupabaseAdmin();
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      return res.status(401).json({ error: "Invalid or expired token." });
    }

    // Find org
    const { data: org } = await supabase
      .from("organizations")
      .select("id, owner_id")
      .limit(1)
      .maybeSingle();

    if (!org) {
      return res.json({ success: true, data: { role: "admin", org_id: null } });
    }

    // Look up role in org_members
    const { data: member } = await supabase
      .from("org_members")
      .select("role")
      .eq("org_id", org.id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (member?.role) {
      return res.json({ success: true, data: { role: member.role, org_id: org.id } });
    }

    // Fallback: check if user is org owner
    if (org.owner_id === user.id) {
      return res.json({ success: true, data: { role: "admin", org_id: org.id } });
    }

    // Not found anywhere — still allow access with minimal role
    return res.json({ success: true, data: { role: "operations_coordinator", org_id: org.id } });
  } catch (err: any) {
    console.error("Error fetching role:", err);
    res.status(500).json({ error: "Failed to fetch role." });
  }
});

app.get("/api/settings/organization", async (req, res) => {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("organizations")
      .select("*")
      .limit(1)
      .single();
    if (error) {
      return res.json({
        success: true,
        data: {
          name: "My Organization",
          seat_limit: 3,
          invoice_limit_per_month: 100,
          invoices_used_this_month: 0,
          plan: "Starter",
          billing_reset_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        },
      });
    }
    res.json({ success: true, data });
  } catch (err: any) {
    res.json({
      success: true,
      data: {
        name: "My Organization",
        seat_limit: 3,
        invoice_limit_per_month: 100,
        invoices_used_this_month: 0,
        plan: "Starter",
      },
    });
  }
});

app.patch("/api/settings/organization", async (req, res) => {
  try {
    const supabase = getSupabaseAdmin();
    const { name, plan } = req.body;
    const updates: any = {};
    if (name) updates.name = name;
    if (plan) {
      updates.plan = plan;
      const lowerPlan = plan.toLowerCase();
      if (lowerPlan === "starter") {
        updates.seat_limit = 3;
        updates.invoice_limit_per_month = 100;
      } else if (lowerPlan === "professional") {
        updates.seat_limit = 10;
        updates.invoice_limit_per_month = 500;
      } else if (lowerPlan === "enterprise") {
        updates.seat_limit = 999;
        updates.invoice_limit_per_month = 99999;
      }
    }

    const { data, error } = await supabase
      .from("organizations")
      .update(updates)
      .neq("id", "00000000-0000-0000-0000-000000000000")
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to update organization", details: err.message });
  }
});

app.get("/api/settings/integrations", (_req, res) => {
  res.json({
    success: true,
    data: {
      email_connected: !!process.env.GMAIL_APP_PASSWORD,
      email_configured: !!process.env.GMAIL_APP_PASSWORD,
      gemini_connected: !!process.env.GEMINI_API_KEY,
      gemini_api_key: process.env.GEMINI_API_KEY || "",
    },
  });
});

app.patch("/api/settings/integrations", (req, res) => {
  const { gemini_api_key } = req.body;
  if (gemini_api_key !== undefined) {
    process.env.GEMINI_API_KEY = gemini_api_key;
  }
  res.json({
    success: true,
    data: {
      email_connected: !!process.env.GMAIL_APP_PASSWORD,
      email_configured: !!process.env.GMAIL_APP_PASSWORD,
      gemini_connected: !!process.env.GEMINI_API_KEY,
      gemini_api_key: process.env.GEMINI_API_KEY || "",
    },
  });
});

export default app;
