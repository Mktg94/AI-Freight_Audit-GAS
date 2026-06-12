import { generateGeminiContent, parseGeminiJSON } from './geminiClient'
import type { Contract } from '@/types'
import type { ExtractedLineItem } from './extractInvoice'

export interface AuditResultItem {
  description: string
  billed_amount: number
  expected_amount: number
  discrepancy: number
  status: 'correct' | 'overcharged' | 'undercharged' | 'not_in_contract' | 'suspicious'
  confidence_score: number
  flag_reason: string
}

export async function auditLineItems(
  lineItems: ExtractedLineItem[],
  contract: Contract
): Promise<AuditResultItem[]> {
  const contractSummary = {
    carrier_name: contract.carrier_name,
    base_rate_per_lb: contract.base_rate_per_lb,
    base_rate_per_mile: contract.base_rate_per_mile,
    minimum_charge: contract.minimum_charge,
    fuel_surcharge_pct: contract.fuel_surcharge_pct,
    residential_surcharge: contract.residential_surcharge,
    liftgate_fee: contract.liftgate_fee,
    detention_rate_per_hr: contract.detention_rate_per_hr,
    inside_delivery_fee: contract.inside_delivery_fee,
    redelivery_fee: contract.redelivery_fee,
    custom_rules: contract.custom_rules
  }

  const prompt = `You are a freight billing auditor. Compare each invoice
line item against the contract rates provided.

CRITICAL RULES:
- Fuel surcharge is calculated as a percentage of the BASE FREIGHT CHARGE
  only, never the total invoice amount.
- Custom rules with type "Not Allowed" mean this charge should NEVER appear.
  If found on the invoice, flag as "not_in_contract" with confidence 0.9+.
- For items not explicitly covered by the contract, flag as "not_in_contract"
  with confidence 0.7.
- Only flag clear, calculable discrepancies — do not flag items where the
  expected amount cannot be determined from the contract.
- Calculate expected_amount and discrepancy yourself using the contract
  rates. discrepancy = billed_amount - expected_amount.

Contract rates:
${JSON.stringify(contractSummary, null, 2)}

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
      rate vs billed rate. For correct items, briefly confirm the match."
  }
]`

  const text = await generateGeminiContent(prompt, true)
  return parseGeminiJSON<AuditResultItem[]>(text)
}
