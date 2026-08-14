import { generateGeminiContent, parseGeminiJSON } from './geminiClient'
import type { Contract } from '@/types'
import type { ExtractedLineItem } from './extractInvoice'
import type { ExtractedBOL } from './extractBOL'
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
  rawInvoice?: any,
  rawBOL?: ExtractedBOL | null
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

  const bolContext = rawBOL ? `
Bill of Lading (BOL) Shipping Manifest Context:
- BOL Number: ${rawBOL.bol_number || 'N/A'}
- Actual Shipped Weight: ${rawBOL.actual_weight_lbs ? `${rawBOL.actual_weight_lbs} lbs` : 'Not specified'}
- Dimensions (L×W×H): ${rawBOL.dimensions ? `${rawBOL.dimensions.length_in}×${rawBOL.dimensions.width_in}×${rawBOL.dimensions.height_in} in` : 'Not specified'}
- Requested Services on BOL: ${rawBOL.requested_services?.length ? rawBOL.requested_services.join(', ') : 'Standard Freight (No Special Accessorials Requested)'}
` : ''

  const prompt = `You are an expert freight billing auditor performing a 3-Way Match Audit (Contract ↔ Invoice ↔ Bill of Lading). Compare each invoice line item against the contract's charge items and the Bill of Lading (BOL) shipping document.

SMART MATCHING:
- Match invoice line items to contract charge items by *meaning and context*, not exact wording. For example:
  - "Waiting Time" ↔ Driver Standby / Detention
  - "Handling Fee" ↔ Inside Delivery / Handling
  - "Residential Surcharge" ↔ Residential Delivery
  - "LTL Base" / "Freight Charge" ↔ Base Freight
- If no charge item name matches semantically, flag as "not_in_contract".

${rawBOL ? `
3-WAY BOL CROSS-REFERENCE RULES:
1. WEIGHT DISCREPANCY: If invoice billed weight exceeds BOL actual_weight_lbs (by > 5%), flag the weight/freight line item as "overcharged" or "suspicious" with flag_reason stating the exact weight difference (e.g., "Weight Discrepancy: Billed X lbs on invoice but BOL proves actual shipped weight was Y lbs").
2. UNREQUESTED ACCESSORIALS: If the invoice charges for accessorial fees (e.g., "Liftgate Fee", "Residential Delivery", "Inside Delivery", "Appointment Fee") BUT those services are NOT listed in the BOL's Requested Services, flag that line item as "suspicious" or "overcharged" with flag_reason stating "Unrequested Accessorial: Charge appears on invoice but service was not requested on Bill of Lading".
` : ''}

CRITICAL RULES:
- "Not Allowed" rate_type means this charge should NEVER appear on the invoice. If a match is found, flag as "overcharged" with confidence 0.9+.
- "Percentage of base freight charge": calculate as rate% of the Base Freight / Freight Charge line item's billed_amount. If no base freight line exists, flag as "suspicious".
- "Flat fee per occurrence": expected_amount is the agreed flat rate.
- For unit-based rate types (Per lb, Per kg, Per mile, Per km, Per hour, Per CBM): expected_amount = rate × quantity.
- Calculate expected_amount and discrepancy yourself. discrepancy = billed_amount - expected_amount.

Contract rates:
${JSON.stringify(safeContract, null, 2)}

${bolContext}

Invoice line items:
${JSON.stringify(lineItems, null, 2)}

Return ONLY a valid JSON array (no markdown, no explanation) with this structure for EVERY line item in the same order as provided:
[
  {
    "description": "string (same as input)",
    "billed_amount": number (same as input),
    "expected_amount": number,
    "discrepancy": number,
    "status": "correct" | "overcharged" | "undercharged" | "not_in_contract" | "suspicious",
    "confidence_score": number between 0.0 and 1.0,
    "flag_reason": "string — cite exact contract rate and/or BOL discrepancies vs billed charges."
  }
] `

  const text = await generateGeminiContent(prompt, true)
  return parseGeminiJSON<AuditResultItem[]>(text)
}

