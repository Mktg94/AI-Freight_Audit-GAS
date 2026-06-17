import { generateGeminiContent, parseGeminiJSON } from './geminiClient'
import type { Contract } from '@/types'
import type { ExtractedLineItem } from './extractInvoice'
import { stripContractPII, stripInvoicePII } from './stripPII'

export interface AuditResultItem {
  description: string
  billed_amount: number
  expected_amount: number
  discrepancy: number
  status: 'correct' | 'overcharged' | 'undercharged' | 'not_in_contract' | 'suspicious'
  confidence_score: number
  flag_reason: string
}

/**
 * Data minimization — only send what is needed for rate verification.
 *
 * Before building the prompt, PII is stripped from both the invoice and
 * contract objects. Only charge descriptions, amounts, and contract rates
 * are sent to Gemini — no company names, personal details, or internal
 * metadata.
 */
export async function auditLineItems(
  rawLineItems: ExtractedLineItem[],
  rawContract: Contract,
  rawInvoice?: any
): Promise<AuditResultItem[]> {
  const safeContract = stripContractPII(rawContract)

  const lineItems = rawInvoice
    ? stripInvoicePII(rawInvoice).line_items
    : rawLineItems.map(li => ({
        description: li.description,
        billed_amount: li.billed_amount,
        quantity: li.quantity,
        unit: li.unit,
      }))

  const prompt = `You are a freight billing auditor. Compare each invoice
line item against the contract's charge items.

SMART MATCHING:
- Match invoice line items to contract charge items by *meaning and
  context*, not exact wording. For example:
  - "Waiting Time" ↔ Driver Standby / Detention
  - "Handling Fee" ↔ Inside Delivery / Handling
  - "Residential Surcharge" ↔ Residential Delivery
  - "GST/HST" or "VAT" ↔ Tax (match as not_in_contract unless a tax
    charge item exists)
  - "LTL Base" / "Freight Charge" ↔ Base Freight
  - If the same charge item matches multiple invoice lines, apply its
    rate to each separately.
  - If an invoice line could match multiple charge items, pick the best
    semantic fit and explain in flag_reason.
- If no charge item name matches semantically, flag as "not_in_contract".

CRITICAL RULES:
- "Not Allowed" rate_type means this charge should NEVER appear on the
  invoice. If a match is found, flag as "overcharged" with confidence 0.9+.
- "Percentage of base freight charge": calculate as rate% of the Base
  Freight / Freight Charge line item's billed_amount. If no base freight
  line exists, flag as "suspicious".
- "Percentage of cargo value": apply the rate% to the total cargo value
  if available; otherwise flag as "suspicious".
- "Flat fee per occurrence": expected_amount is the agreed flat rate.
- For unit-based rate types (Per lb, Per kg, Per mile, Per km, Per hour,
  Per CBM): expected_amount = rate × quantity. If quantity is not
  available on the line item, flag as "suspicious".
- For items not explicitly covered by the contract, flag as
  "not_in_contract" with confidence 0.7.
- Only flag clear, calculable discrepancies — do not flag items where the
  expected amount cannot be determined.
- Calculate expected_amount and discrepancy yourself.
  discrepancy = billed_amount - expected_amount.

Contract rates:
${JSON.stringify(safeContract, null, 2)}

Invoice line items:
${JSON.stringify(lineItems, null, 2)}

Return ONLY a valid JSON array (no markdown, no explanation) with this
structure for EVERY line item in the same order as provided:
[
  {
    "description": "string (same as input)",
    "billed_amount": number (same as input),
    "expected_amount": number,
    "discrepancy": number,
    "status": "correct" | "overcharged" | "undercharged" | "not_in_contract" | "suspicious",
    "confidence_score": number between 0.0 and 1.0,
    "flag_reason": "string — for flagged items, cite the exact contract
      charge item and rate vs billed rate. For correct items, briefly
      confirm the match."
  }
]`

  const text = await generateGeminiContent(prompt, true)
  return parseGeminiJSON<AuditResultItem[]>(text)
}
