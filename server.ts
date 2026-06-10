import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { initialContracts, initialInvoices, initialLineItems, initialAuditLogs } from "./src/fakeData";
import { auditLineItems } from "./lib/ai/auditInvoice";
import multer from "multer";
import { processInvoiceWithVeryfi } from "./lib/ai/veryfi";

const uploadRouter = multer({ storage: multer.memoryStorage() });

let memoryContracts = [...initialContracts];
let memoryInvoices = [...initialInvoices];
let memoryLineItems = [...initialLineItems];
let memoryLogs = [...initialAuditLogs];

// Register in global scope for Next.js routes to read if needed
(global as any).memoryInvoicesStore = memoryInvoices;
(global as any).memoryLineItemsStore = memoryLineItems;
(global as any).memoryLogsStore = memoryLogs;

const app = express();
app.use(express.json());

// ============================================================
// CONTRACTS ENDPOINTS
// ============================================================
app.get("/api/contracts", (req, res) => {
  res.json({ success: true, data: memoryContracts });
});

app.post("/api/contracts", (req, res) => {
  const payload = req.body;
  const newContract = {
    id: `contract-mock-${Math.random().toString(36).substr(2, 9)}`,
    org_id: 'org-101-auth-alpha',
    carrier_name: payload.carrier_name,
    effective_date: payload.effective_date,
    expiry_date: payload.expiry_date,
    base_rate_per_lb: Number(payload.base_rate_per_lb) || 0.12,
    base_rate_per_mile: Number(payload.base_rate_per_mile) || 1.5,
    minimum_charge: Number(payload.minimum_charge) || 120,
    fuel_surcharge_pct: Number(payload.fuel_surcharge_pct) || 0.14,
    residential_surcharge: Number(payload.residential_surcharge) || 75,
    liftgate_fee: Number(payload.liftgate_fee) || 65,
    detention_rate_per_hr: Number(payload.detention_rate_per_hr) || 50,
    inside_delivery_fee: Number(payload.inside_delivery_fee) || 90,
    redelivery_fee: Number(payload.redelivery_fee) || 50,
    custom_rules: payload.custom_rules || [],
    created_at: new Date().toISOString()
  };
  memoryContracts.unshift(newContract);
  res.json({ success: true, data: newContract });
});

app.patch("/api/contracts/:id", (req, res) => {
  const { id } = req.params;
  const payload = req.body;
  const idx = memoryContracts.findIndex((c: any) => c.id === id);
  if (idx !== -1) {
    memoryContracts[idx] = { ...memoryContracts[idx], ...payload, id };
    res.json({ success: true, data: memoryContracts[idx] });
  } else {
    res.status(404).json({ error: "Carrier agreement not found" });
  }
});

app.delete("/api/contracts/:id", (req, res) => {
  const { id } = req.params;
  const lengthBefore = memoryContracts.length;
  memoryContracts = memoryContracts.filter((c: any) => c.id !== id);
  if (memoryContracts.length < lengthBefore) {
    res.json({ success: true, message: "Carrier agreement purged" });
  } else {
    res.status(404).json({ error: "Agreement terms not found" });
  }
});

// ============================================================
// INVOICE UPLOAD / AUDIT ENDPOINTS
// ============================================================
app.post("/api/invoices/upload", uploadRouter.single('file'), async (req, res) => {
  try {
    const file = req.file;
    const contract_id = req.body.contract_id;

    if (!file) {
      return res.status(400).json({ error: "Missing invoice PDF file in payload" });
    }
    if (!contract_id) {
      return res.status(400).json({ error: "Missing contract id for reference comparison" });
    }

    let extracted: any;
    try {
      extracted = await processInvoiceWithVeryfi(file.buffer, file.originalname);
    } catch (ocrErr: any) {
      console.warn("Veryfi extraction failed, using fallback mock data:", ocrErr.message);
      extracted = {
        carrier_name: "FedEx Freight",
        invoice_number: `INV-${Date.now()}`,
        invoice_date: new Date().toISOString().split('T')[0],
        shipment_date: new Date().toISOString().split('T')[0],
        origin: "Memphis TN, USA",
        destination: "Dallas TX, USA",
        weight_lbs: 2500,
        distance_miles: 540,
        line_items: [
          { description: "Base Transit LTL Freight", billed_amount: 675.00, quantity: 1, unit: "flat" },
          { description: "Fuel Surcharge", billed_amount: 162.00, quantity: 1, unit: "flat" },
        ],
        total_billed: 1100.00,
      };
    }

    const insertedInvoice: any = {
      id: `inv-mock-${Math.random().toString(36).substr(2, 9)}`,
      org_id: 'org-101',
      contract_id: contract_id,
      file_name: file.originalname,
      file_url: '#',
      carrier_name: extracted.carrier_name,
      invoice_number: extracted.invoice_number,
      invoice_date: extracted.invoice_date || new Date().toISOString().split('T')[0],
      shipment_date: extracted.shipment_date || new Date().toISOString().split('T')[0],
      origin: extracted.origin,
      destination: extracted.destination,
      weight_lbs: extracted.weight_lbs || 2500,
      distance_miles: extracted.distance_miles || 540,
      status: 'auditing',
      total_billed: extracted.total_billed || 1100.00,
      total_approved: 0,
      total_savings: 0,
      uploaded_at: new Date().toISOString(),
      raw_extracted_text: "",
      extracted_data: extracted
    };

    const contract = memoryContracts.find(c => c.id === contract_id) || memoryContracts[0];
    const auditResults = await auditLineItems(extracted.line_items, contract);

    let totalApproved = 0;
    const lineItemInserts = auditResults.map((auditLine, idx) => {
      totalApproved += auditLine.expected_amount;
      return {
        id: `li-live-${Date.now()}-${idx}`,
        invoice_id: insertedInvoice.id,
        description: auditLine.description,
        billed_amount: auditLine.billed_amount,
        expected_amount: auditLine.expected_amount,
        discrepancy: auditLine.discrepancy,
        ai_flag_reason: auditLine.discrepancy > 0 ? auditLine.flag_reason : undefined,
        confidence_score: auditLine.confidence_score,
        status: auditLine.discrepancy > 0 ? 'disputed' as const : 'approved' as const,
        created_at: new Date().toISOString()
      };
    });

    const totalSavings = Math.max(0, insertedInvoice.total_billed - totalApproved);
    const finalStatus = totalSavings > 0 ? 'flagged' : 'approved';

    insertedInvoice.status = finalStatus;
    insertedInvoice.total_approved = totalApproved;
    insertedInvoice.total_savings = totalSavings;
    insertedInvoice.audited_at = new Date().toISOString();

    memoryLogs.unshift({
      id: `log-${Date.now()}`,
      org_id: 'org-101',
      user_id: 'usr-mock',
      action: `Audited invoice uploaded successfully: ${insertedInvoice.invoice_number}`,
      entity_type: 'invoice',
      entity_id: insertedInvoice.id,
      metadata: insertedInvoice,
      created_at: new Date().toISOString()
    });

    memoryInvoices.unshift(insertedInvoice);
    memoryLineItems = [...lineItemInserts, ...memoryLineItems];

    (global as any).memoryInvoicesStore = memoryInvoices;
    (global as any).memoryLineItemsStore = memoryLineItems;
    (global as any).memoryLogsStore = memoryLogs;

    return res.json({
      success: true,
      invoiceId: insertedInvoice.id,
      data: { invoice: insertedInvoice, lineItems: lineItemInserts }
    });

  } catch (err: any) {
    console.error("Express upload api failure:", err);
    res.status(500).json({ error: "Express backend pipeline upload failed", details: err.message });
  }
});

// Detect multi-invoice PDF (stub)
app.post("/api/invoices/detect-multi", uploadRouter.single('file'), (req, res) => {
  res.json({ isMultiInvoice: false, estimatedCount: 1, previewData: [] });
});

// Batch upload (creates a batch and processes sequentially)
app.post("/api/invoices/batch-upload", uploadRouter.array('files'), async (req, res) => {
  try {
    const files = req.files as Express.Multer.File[];
    const contract_id = req.body.contract_id;

    if (!files || files.length === 0) {
      return res.status(400).json({ error: "No invoice files provided" });
    }
    if (!contract_id) {
      return res.status(400).json({ error: "Missing contract id" });
    }

    const batchId = `batch-${Date.now()}`;
    const invoiceIds: string[] = [];

    for (const file of files) {
      let extracted: any;
      try {
        extracted = await processInvoiceWithVeryfi(file.buffer, file.originalname);
      } catch (ocrErr: any) {
        console.warn("Veryfi extraction failed in batch, using fallback:", ocrErr.message);
        extracted = {
          carrier_name: "FedEx Freight",
          invoice_number: `INV-${Date.now()}`,
          invoice_date: new Date().toISOString().split('T')[0],
          shipment_date: new Date().toISOString().split('T')[0],
          origin: "Memphis TN, USA",
          destination: "Dallas TX, USA",
          weight_lbs: 2500,
          distance_miles: 540,
          line_items: [
            { description: "Base Transit LTL Freight", billed_amount: 675.00, quantity: 1, unit: "flat" },
            { description: "Fuel Surcharge", billed_amount: 162.00, quantity: 1, unit: "flat" },
          ],
          total_billed: 1100.00,
        };
      }
      const insertedInvoice: any = {
        id: `inv-mock-${Math.random().toString(36).substr(2, 9)}`,
        org_id: 'org-101',
        contract_id,
        file_name: file.originalname,
        file_url: '#',
        carrier_name: extracted.carrier_name,
        invoice_number: extracted.invoice_number || `INV-${Date.now()}`,
        invoice_date: extracted.invoice_date || new Date().toISOString().split('T')[0],
        shipment_date: extracted.shipment_date || new Date().toISOString().split('T')[0],
        origin: extracted.origin || "Memphis TN, USA",
        destination: extracted.destination || "Dallas TX, USA",
        weight_lbs: extracted.weight_lbs || 2500,
        distance_miles: extracted.distance_miles || 540,
        status: 'auditing' as const,
        total_billed: extracted.total_billed || 1100.00,
        total_approved: 0,
        total_savings: 0,
        batch_id: batchId,
        uploaded_at: new Date().toISOString(),
        raw_extracted_text: "",
        extracted_data: extracted
      };

      const contract = memoryContracts.find(c => c.id === contract_id) || memoryContracts[0];
      const auditResults = await auditLineItems(extracted.line_items, contract);

      let totalApproved = 0;
      const lineItemInserts = auditResults.map((auditLine, idx) => {
        totalApproved += auditLine.expected_amount;
        return {
          id: `li-live-${Date.now()}-${idx}`,
          invoice_id: insertedInvoice.id,
          description: auditLine.description,
          billed_amount: auditLine.billed_amount,
          expected_amount: auditLine.expected_amount,
          discrepancy: auditLine.discrepancy,
          ai_flag_reason: auditLine.discrepancy > 0 ? auditLine.flag_reason : undefined,
          confidence_score: auditLine.confidence_score,
          status: auditLine.discrepancy > 0 ? 'disputed' as const : 'approved' as const,
          created_at: new Date().toISOString()
        };
      });

      const totalSavings = Math.max(0, insertedInvoice.total_billed - totalApproved);
      insertedInvoice.status = totalSavings > 0 ? 'flagged' : 'approved';
      insertedInvoice.total_approved = totalApproved;
      insertedInvoice.total_savings = totalSavings;
      insertedInvoice.audited_at = new Date().toISOString();

      memoryInvoices.unshift(insertedInvoice);
      memoryLineItems = [...lineItemInserts, ...memoryLineItems];
      invoiceIds.push(insertedInvoice.id);

      memoryLogs.unshift({
        id: `log-${Date.now()}`,
        org_id: 'org-101',
        user_id: 'usr-mock',
        action: `Batch uploaded invoice: ${insertedInvoice.invoice_number}`,
        entity_type: 'invoice',
        entity_id: insertedInvoice.id,
        metadata: { batchId },
        created_at: new Date().toISOString()
      });
    }

    (global as any).memoryInvoicesStore = memoryInvoices;
    (global as any).memoryLineItemsStore = memoryLineItems;
    (global as any).memoryLogsStore = memoryLogs;

    res.json({ success: true, batchId, invoiceIds });
  } catch (err: any) {
    console.error("Batch upload error:", err);
    res.status(500).json({ error: "Batch upload failed", details: err.message });
  }
});

// Batch status polling
app.get("/api/invoices/batch/:batchId/status", (req, res) => {
  const { batchId } = req.params;
  const batchInvoices = memoryInvoices.filter((inv: any) => inv.batch_id === batchId);
  const allDone = batchInvoices.every((inv: any) => inv.status !== 'auditing');
  res.json({
    batchId,
    total: batchInvoices.length,
    completed: batchInvoices.filter((inv: any) => inv.status !== 'auditing').length,
    status: allDone ? 'completed' : 'processing',
    invoices: batchInvoices
  });
});

app.get("/api/invoices/:id/status", (req, res) => {
  const { id } = req.params;
  const inv = memoryInvoices.find((i: any) => i.id === id);
  if (inv) {
    res.json({ status: inv.status, invoice: inv });
  } else {
    res.status(404).json({ error: "Invoice not found or processed yet" });
  }
});

app.get("/api/invoices/:id", (req, res) => {
  const { id } = req.params;
  const invoice = memoryInvoices.find((i: any) => i.id === id);
  if (!invoice) {
    return res.status(404).json({ error: "Freight bill not found" });
  }

  const lineItems = memoryLineItems.filter(li => li.invoice_id === id);
  const contract = memoryContracts.find(c => c.id === invoice.contract_id || c.carrier_name === invoice.carrier_name) || memoryContracts[0];

  return res.json({ success: true, invoice, lineItems, contract });
});

app.patch("/api/line-items/:id", express.json(), (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!id) return res.status(400).json({ error: "Missing line item ID" });
  if (status !== 'approved' && status !== 'disputed') {
    return res.status(400).json({ error: "Invalid status: must be 'approved' or 'disputed'" });
  }

  const now = new Date().toISOString();
  const itemIndex = memoryLineItems.findIndex(li => li.id === id);

  if (itemIndex !== -1) {
    const item = memoryLineItems[itemIndex];
    const invoiceId = item.invoice_id;

    const updatedLineItem = { ...item, status, reviewed_by: "usr-mock", reviewed_at: now };
    memoryLineItems[itemIndex] = updatedLineItem;

    const siblings = memoryLineItems.filter(li => li.invoice_id === invoiceId);
    let totalApproved = 0, totalSavings = 0;
    siblings.forEach(line => {
      if (line.status === 'approved') totalApproved += line.billed_amount;
      else if (line.status === 'disputed') { totalApproved += line.expected_amount; totalSavings += Math.max(0, line.discrepancy); }
      else totalApproved += line.expected_amount;
    });

    let finalStatus: string = 'approved';
    if (siblings.some(l => l.status === 'disputed')) finalStatus = 'disputed';
    else if (siblings.some(l => l.status === 'disputed' || l.discrepancy > 0)) finalStatus = 'flagged';

    const invoiceIndex = memoryInvoices.findIndex((inv: any) => inv.id === invoiceId);
    if (invoiceIndex !== -1) {
      memoryInvoices[invoiceIndex] = { ...memoryInvoices[invoiceIndex], total_approved: totalApproved, total_savings: totalSavings, status: finalStatus as any, audited_at: now };
    }

    memoryLogs.unshift({
      id: `log-${Date.now()}`, org_id: "org-101", user_id: "usr-mock",
      action: `Reviewed freight bill item: "${item.description}" marked as ${status}`,
      entity_type: "line_item", entity_id: id,
      metadata: { line_item_id: id, status, invoice_id: invoiceId }, created_at: now
    });

    (global as any).memoryLineItemsStore = memoryLineItems;
    (global as any).memoryInvoicesStore = memoryInvoices;
    (global as any).memoryLogsStore = memoryLogs;

    return res.json({ success: true, lineItem: updatedLineItem });
  } else {
    return res.status(404).json({ error: "Line item not found" });
  }
});

app.post("/api/invoices/:id/approve-clean", (req, res) => {
  const { id } = req.params;
  if (!id) return res.status(400).json({ error: "Missing invoice ID" });

  const now = new Date().toISOString();
  const cleanPendingInStore = memoryLineItems.filter(li => li.invoice_id === id && li.status === 'pending' && li.discrepancy === 0);
  const approvedCount = cleanPendingInStore.length;

  cleanPendingInStore.forEach(item => {
    item.status = 'approved';
    item.reviewed_by = "usr-mock";
    item.reviewed_at = now;
  });

  const siblings = memoryLineItems.filter(li => li.invoice_id === id);
  let totalApproved = 0, totalSavings = 0;
  siblings.forEach(line => {
    if (line.status === 'approved') totalApproved += line.billed_amount;
    else if (line.status === 'disputed') { totalApproved += line.expected_amount; totalSavings += Math.max(0, line.discrepancy); }
    else totalApproved += line.expected_amount;
  });

  let finalStatus: string = 'approved';
  if (siblings.some(l => l.status === 'disputed')) finalStatus = 'disputed';
  else if (siblings.some(l => l.status === 'disputed' || l.discrepancy > 0)) finalStatus = 'flagged';

  const invoiceIndex = memoryInvoices.findIndex((inv: any) => inv.id === id);
  if (invoiceIndex !== -1) {
    memoryInvoices[invoiceIndex] = { ...memoryInvoices[invoiceIndex], total_approved: totalApproved, total_savings: totalSavings, status: finalStatus as any, audited_at: now };
  }

  if (approvedCount > 0) {
    memoryLogs.unshift({
      id: `log-${Date.now()}`, org_id: "org-101", user_id: "usr-mock",
      action: `Bulk approved clean items count: ${approvedCount} on freight bill #${id}`,
      entity_type: "invoice", entity_id: id,
      metadata: { invoice_id: id, approved_count: approvedCount }, created_at: now
    });
  }

  (global as any).memoryLineItemsStore = memoryLineItems;
  (global as any).memoryInvoicesStore = memoryInvoices;
  (global as any).memoryLogsStore = memoryLogs;

  return res.json({ success: true, approvedCount });
});

// ============================================================
// AI AUDIT ENDPOINT
// ============================================================
function performRulesBasedAudit(invoice: any, contract: any) {
  const weight = Number(invoice.weight_lbs) || 0;
  const distance = Number(invoice.distance_miles) || 0;
  const contractBaseLb = Number(contract.base_rate_per_lb) || 0.15;
  const contractBaseMile = Number(contract.base_rate_per_mile) || 1.85;
  const fuelPct = Number(contract.fuel_surcharge_pct) || 0.12;
  const minCharge = Number(contract.minimum_charge) || 150.0;

  const wtCalcRating = weight * contractBaseLb;
  const distCalcRating = distance * contractBaseMile;
  let expectedBase = Math.max(wtCalcRating, distCalcRating);
  if (expectedBase < minCharge) expectedBase = minCharge;

  const expectedFuel = Math.round(expectedBase * fuelPct * 100) / 100;
  let expectedAccessorial = 0;
  const discrepancies: any[] = [];
  const rawItems = invoice.extracted_data?.line_items || [];

  rawItems.forEach((item: any) => {
    const desc = item.description.toLowerCase();
    const billed = Number(item.billed) || 0;

    if (desc.includes("base") || desc.includes("freight") || desc.includes("shipping") || desc.includes("haul")) {
      const diff = Math.max(0, billed - expectedBase);
      discrepancies.push({
        item_description: item.description, billed, expected: expectedBase, difference: diff,
        type: diff > 2.0 ? "overcharged" : "correct",
        reason: diff > 2.0 ? `Billed base rating $${billed.toFixed(2)} exceeds contract formula (Max of weight/mileage rating, minimum $${minCharge.toFixed(2)}). Expected: $${expectedBase.toFixed(2)}.` : "Rated correctly under contract guidelines."
      });
    } else if (desc.includes("fuel")) {
      const diff = Math.max(0, billed - expectedFuel);
      discrepancies.push({
        item_description: item.description, billed, expected: expectedFuel, difference: diff,
        type: diff > 2.0 ? "overcharged" : "correct",
        reason: diff > 2.0 ? `Billed fuel surcharge $${billed.toFixed(2)} exceeds contractual cap of ${fuelPct * 100}% on calculated base. Expected: $${expectedFuel.toFixed(2)}.` : "Matches fuel percentage surcharge terms."
      });
    } else {
      let contractFee = 0, feeName = "";
      if (desc.includes("residential")) { contractFee = Number(contract.residential_surcharge) || 0; feeName = "Residential Surcharge"; }
      else if (desc.includes("liftgate") || desc.includes("lift-gate")) { contractFee = Number(contract.liftgate_fee) || 0; feeName = "Liftgate Accessory Fee"; }
      else if (desc.includes("inside")) { contractFee = Number(contract.inside_delivery_fee) || 0; feeName = "Inside Delivery Fee"; }
      else if (desc.includes("redeliv") || desc.includes("re-deliv")) { contractFee = Number(contract.redelivery_fee) || 0; feeName = "Redelivery Surcharge"; }
      else if (desc.includes("detention") || desc.includes("waiting")) { contractFee = Number(contract.detention_rate_per_hr) || 0; feeName = "Detention Charge"; }

      expectedAccessorial += contractFee;
      if (contractFee === 0 && billed > 0) {
        discrepancies.push({ item_description: item.description, billed, expected: 0, difference: billed, type: "not_in_contract", reason: `Accessorial charge '${item.description}' ($${billed.toFixed(2)}) is not approved or defined in the active carrier contract.` });
      } else {
        const diff = Math.max(0, billed - contractFee);
        discrepancies.push({ item_description: item.description, billed, expected: contractFee, difference: diff, type: diff > 1.0 ? "overcharged" : "correct", reason: diff > 1.0 ? `Contract fee list rates ${feeName} flat at $${contractFee.toFixed(2)}. Carrier billed: $${billed.toFixed(2)}.` : `Accessorial rate matches negotiated schedule ($${contractFee.toFixed(2)}).` });
      }
    }
  });

  const calculated_total_expected = expectedBase + expectedFuel + expectedAccessorial;
  const overchargedLogs = discrepancies.filter(d => d.type === "overcharged" || d.type === "not_in_contract");
  const total_discrepancy = overchargedLogs.reduce((sum, item) => sum + item.difference, 0);

  return {
    invoice_id: invoice.id,
    status: total_discrepancy > 5.0 ? "flagged" : "passed",
    calculated_base_rate: expectedBase, calculated_fuel_surcharge: expectedFuel,
    calculated_accessorial_fees: expectedAccessorial, calculated_total_expected,
    total_discrepancy, confidence_score: 0.98,
    reason_summary: total_discrepancy > 0
      ? `Contracts audit flagged total overcharges of $${total_discrepancy.toLocaleString('en-US', {minimumFractionDigits: 2})} scattered across ${overchargedLogs.length} billing line item(s).`
      : "Auditor comparison successful. Billed invoice rates perfectly match contract base, fuel multiplier, and accessorial brackets.",
    discrepancies
  };
}

app.post("/api/audit", async (req, res) => {
  try {
    const { invoice, contract } = req.body;
    if (!invoice || !contract) return res.status(400).json({ error: "Missing invoice or contract context data" });

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey === "") {
      console.log("No Gemini API key supplied or using placeholder. Running rule-oriented auditing engine.");
      return res.json(performRulesBasedAudit(invoice, contract));
    }

    console.log(`Calling Gemini API server-side for invoice: ${invoice.invoice_number}`);
    const ai = new GoogleGenAI({ apiKey });

    const prompt = `You are an expert freight audit specialist at FreightAudit AI. Compare the freight invoice against the carrier contract terms to identify errors, duplicates, or overcharges.

INVOICE DATA:
${JSON.stringify(invoice, null, 2)}

CONTRACT RATE SHEET:
${JSON.stringify(contract, null, 2)}

Perform the following audit checks:
1. Base Rate per LB: Billed base rate vs contractual rate ($${contract.base_rate_per_lb} per lb).
2. Base Rate per Mile: Billed mileage rate vs contractual rate ($${contract.base_rate_per_mile} per mile).
3. Fuel Surcharge %: Billed fuel surcharge percentage vs contract stipulated percentage (${contract.fuel_surcharge_pct * 100}%).
4. Acccessorial Surcharges: Verify flat/hourly items:
   - Residential fee: $${contract.residential_surcharge}
   - Liftgate fee: $${contract.liftgate_fee}
   - Inside Delivery fee: $${contract.inside_delivery_fee}
   - Redelivery fee: $${contract.redelivery_fee}
   - Detention rate/hr: $${contract.detention_rate_per_hr}
   - Minimum Charge: $${contract.minimum_charge}
5. Custom rules: ${JSON.stringify(contract.custom_rules || {})}

Identify any differences. Output a STRICT valid JSON object matching our type structure EXACTLY, with no markdown codeblocks, no surrounding text, and no backticks.

Expected structure:
{
  "invoice_id": "${invoice.id}",
  "status": "passed" | "flagged",
  "calculated_base_rate": number,
  "calculated_fuel_surcharge": number,
  "calculated_accessorial_fees": number,
  "calculated_total_expected": number,
  "total_discrepancy": number,
  "confidence_score": number (value between 0.0 and 1.0),
  "reason_summary": "English summary of the errors found",
  "discrepancies": [
    { "item_description": "the fee/charge audited", "billed": number, "expected": number, "difference": number, "type": "correct" | "overcharged" | "undercharged" | "not_in_contract" | "suspicious", "reason": "specific explanation of the billing error based on contract terms" }
  ]
}`;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: { responseMimeType: 'application/json' }
      });

      const text = response.text || '';
      const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
      return res.json(JSON.parse(cleanedText));
    } catch (geminiError: any) {
      console.error("Gemini runtime call failed, fallback activated:", geminiError.message);
      return res.json(performRulesBasedAudit(invoice, contract));
    }
  } catch (err: any) {
    console.error("Endpoint handling failure:", err);
    res.status(500).json({ error: "Audit logic failed", details: err.message });
  }
});

// ============================================================
// DISPUTES ENDPOINTS
// ============================================================
let memoryDisputes: any[] = [];

app.get("/api/disputes/:id", (req, res) => {
  const { id } = req.params;
  const dispute = memoryDisputes.find(d => d.id === id);
  if (!dispute) return res.status(404).json({ error: "Dispute not found" });

  const invoice = memoryInvoices.find((inv: any) => inv.id === dispute.invoice_id);
  const lineItems = memoryLineItems.filter(li => li.invoice_id === dispute.invoice_id);
  const contract = memoryContracts.find(c => c.id === invoice?.contract_id) || null;

  res.json({ success: true, dispute, invoice, lineItems, contract });
});

app.patch("/api/disputes/:id", (req, res) => {
  const { id } = req.params;
  const idx = memoryDisputes.findIndex(d => d.id === id);
  if (idx === -1) return res.status(404).json({ error: "Dispute not found" });
  memoryDisputes[idx] = { ...memoryDisputes[idx], ...req.body };
  res.json({ success: true, data: memoryDisputes[idx] });
});

app.post("/api/disputes/create", async (req, res) => {
  try {
    const { invoice_id, carrier_name, carrier_email, line_item_ids } = req.body;
    const invoice = memoryInvoices.find((inv: any) => inv.id === invoice_id);
    if (!invoice) return res.status(404).json({ error: "Invoice not found" });

    const items = memoryLineItems.filter(li => li.invoice_id === invoice_id && li.status === 'disputed');
    const totalDisputed = items.reduce((sum, li) => sum + li.discrepancy, 0);

    const { generateDisputeLetter } = await import('./lib/ai/generateDispute');
    const disputeLetter = await generateDisputeLetter({
      companyName: "Atlas Global Logistics",
      carrierName: carrier_name || invoice.carrier_name,
      invoiceNumber: invoice.invoice_number,
      invoiceDate: invoice.invoice_date,
      disputedItemsJson: JSON.stringify(items.map(li => ({
        description: li.description,
        billed: li.billed_amount,
        expected: li.expected_amount,
        difference: li.discrepancy
      }))),
      totalDisputed
    });

    const dispute: any = {
      id: `disp-${Date.now()}`,
      invoice_id,
      org_id: 'org-101',
      carrier_name: carrier_name || invoice.carrier_name,
      carrier_email: carrier_email || '',
      dispute_letter_text: disputeLetter,
      total_disputed_amount: totalDisputed,
      status: 'draft',
      created_at: new Date().toISOString()
    };

    memoryDisputes.unshift(dispute);
    memoryLogs.unshift({
      id: `log-${Date.now()}`, org_id: "org-101", user_id: "usr-mock",
      action: `Created dispute for invoice ${invoice.invoice_number}`,
      entity_type: "dispute", entity_id: dispute.id,
      metadata: { invoice_id, amount: totalDisputed }, created_at: new Date().toISOString()
    });

    res.json({ success: true, data: dispute });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to create dispute", details: err.message });
  }
});

app.post("/api/disputes/:id/send", async (req, res) => {
  const { id } = req.params;
  const idx = memoryDisputes.findIndex(d => d.id === id);
  if (idx === -1) return res.status(404).json({ error: "Dispute not found" });

  memoryDisputes[idx].status = 'sent';
  memoryDisputes[idx].sent_at = new Date().toISOString();

  memoryLogs.unshift({
    id: `log-${Date.now()}`, org_id: "org-101", user_id: "usr-mock",
    action: `Dispute sent for invoice ${memoryDisputes[idx].invoice_id}`,
    entity_type: "dispute", entity_id: id,
    metadata: { dispute_id: id }, created_at: new Date().toISOString()
  });

  res.json({ success: true, data: memoryDisputes[idx] });
});

// ============================================================
// TEAM & SETTINGS ENDPOINTS
// ============================================================
let memoryOrganization = {
  id: "org-101",
  name: "Atlas Global Logistics",
  seat_limit: 10,
  invoice_limit_per_month: 100,
  invoices_used_this_month: 3,
  plan: "Growth",
};
let memoryIntegrations = {
  resend_api_key: process.env.RESEND_API_KEY || "",
  anthropic_api_key: process.env.ANTHROPIC_API_KEY || "",
};

let memoryTeamMembers = [
  { id: "member-1", org_id: "org-101", user_id: "user-alpha", full_name: "Atlas Audit User", email: "audit@atlaslogistics.com", role: "admin", status: "active", created_at: "2026-06-01T08:00:00Z" },
  { id: "member-2", org_id: "org-101", user_id: "user-beta", full_name: "Sarah Connor", email: "sarah.connor@atlaslogistics.com", role: "logistics_manager", status: "active", created_at: "2026-06-03T09:30:00Z" },
  { id: "member-3", org_id: "org-101", user_id: "user-gamma", full_name: "John Doe", email: "john.doe@atlaslogistics.com", role: "finance_clerk", status: "invited", created_at: "2026-06-05T14:15:00Z" }
];

(global as any).memoryOrganization = memoryOrganization;
(global as any).memoryTeamMembers = memoryTeamMembers;

app.get("/api/team/members", (req, res) => {
  res.json({ success: true, data: memoryTeamMembers });
});

app.post("/api/team/invite", (req, res) => {
  const { email, role } = req.body;
  const requestorRole = req.headers['x-simulated-role'] || req.query.role || 'admin';
  if (requestorRole !== 'admin') return res.status(403).json({ error: 'Forbidden. Admin credentials required.' });
  if (!email || !role) return res.status(400).json({ error: 'Missing required parameters email or role.' });

  const activeCount = memoryTeamMembers.filter(m => m.status !== 'suspended').length;
  if (activeCount >= memoryOrganization.seat_limit) return res.status(403).json({ error: 'seat_limit_reached', limit: memoryOrganization.seat_limit });

  const newMember = {
    id: `member-${Math.random().toString(36).substring(2, 9)}`,
    org_id: memoryOrganization.id, user_id: `user-${Math.random().toString(36).substring(2, 9)}`,
    full_name: email.split('@')[0], email, role, status: 'invited',
    created_at: new Date().toISOString()
  };

  memoryTeamMembers.push(newMember);
  console.log(`[EMAIL SEND] Inviting ${email} with org ${memoryOrganization.id}`);
  res.json({ success: true, data: newMember });
});

app.patch("/api/team/:memberId", (req, res) => {
  const { memberId } = req.params;
  const { role } = req.body;
  const requestorRole = req.headers['x-simulated-role'] || req.query.role || 'admin';
  if (requestorRole !== 'admin') return res.status(403).json({ error: 'Forbidden. Admin credentials required.' });
  const idx = memoryTeamMembers.findIndex(m => m.id === memberId);
  if (idx === -1) return res.status(404).json({ error: 'Member not found' });
  memoryTeamMembers[idx].role = role;
  res.json({ success: true, data: memoryTeamMembers[idx] });
});

app.delete("/api/team/:memberId", (req, res) => {
  const { memberId } = req.params;
  const requestorRole = req.headers['x-simulated-role'] || req.query.role || 'admin';
  if (requestorRole !== 'admin') return res.status(403).json({ error: 'Forbidden. Admin credentials required.' });
  const idx = memoryTeamMembers.findIndex(m => m.id === memberId);
  if (idx === -1) return res.status(404).json({ error: 'Member not found' });
  memoryTeamMembers[idx].status = 'suspended';
  res.json({ success: true, data: memoryTeamMembers[idx] });
});

app.get("/api/settings/organization", (req, res) => {
  res.json({ success: true, data: memoryOrganization });
});

app.patch("/api/settings/organization", (req, res) => {
  const { name, plan } = req.body;
  let updated = false;
  if (name) { memoryOrganization.name = name; updated = true; }
  if (plan) {
    memoryOrganization.plan = plan;
    const lowerPlan = plan.toLowerCase();
    if (lowerPlan === 'starter') { memoryOrganization.seat_limit = 3; memoryOrganization.invoice_limit_per_month = 100; }
    else if (lowerPlan === 'professional') { memoryOrganization.seat_limit = 10; memoryOrganization.invoice_limit_per_month = 500; }
    else if (lowerPlan === 'enterprise') { memoryOrganization.seat_limit = 999; memoryOrganization.invoice_limit_per_month = 99999; }
    updated = true;
  }
  if (updated) res.json({ success: true, data: memoryOrganization });
  else res.status(400).json({ error: "No updated field provided" });
});

app.get("/api/settings/integrations", (req, res) => {
  res.json({ success: true, data: { resend_connected: !!memoryIntegrations.resend_api_key, anthropic_connected: !!memoryIntegrations.anthropic_api_key, resend_api_key: memoryIntegrations.resend_api_key, anthropic_api_key: memoryIntegrations.anthropic_api_key } });
});

app.patch("/api/settings/integrations", (req, res) => {
  const { resend_api_key, anthropic_api_key } = req.body;
  if (resend_api_key !== undefined) memoryIntegrations.resend_api_key = resend_api_key;
  if (anthropic_api_key !== undefined) memoryIntegrations.anthropic_api_key = anthropic_api_key;
  res.json({ success: true, data: { resend_connected: !!memoryIntegrations.resend_api_key, anthropic_connected: !!memoryIntegrations.anthropic_api_key, resend_api_key: memoryIntegrations.resend_api_key, anthropic_api_key: memoryIntegrations.anthropic_api_key } });
});

// ============================================================
// VITE / STATIC FILE SERVING (local dev & production only)
// ============================================================
async function startServer() {
  const PORT = Number(process.env.PORT) || 3000;

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server starting on port ${PORT}`);
  });
}

if (!process.env.VERCEL) {
  startServer();
}

export default app;
