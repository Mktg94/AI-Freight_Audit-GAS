import { generateGeminiContent } from './geminiClient'

export interface DisputeParams {
  companyName: string
  carrierName: string
  invoiceNumber: string
  invoiceDate: string
  disputedItems: Array<{
    description: string
    billed_amount: number
    expected_amount: number
    discrepancy: number
    flag_reason: string
  }>
  totalDisputed: number
}

export async function generateDisputeLetter(params: DisputeParams): Promise<string> {
  const prompt = `You are a professional freight billing dispute specialist.
Write a formal dispute letter.

Company: ${params.companyName}
Carrier: ${params.carrierName}
Invoice #: ${params.invoiceNumber}
Invoice Date: ${params.invoiceDate}
Disputed Items: ${JSON.stringify(params.disputedItems, null, 2)}
Total Disputed: $${params.totalDisputed.toFixed(2)}

Write a professional dispute letter that:
1. Opens formally addressing the carrier's billing department
2. States the purpose clearly in the first paragraph
3. Lists each disputed charge with: description, billed amount,
   contract/expected amount, and the difference
4. References that charges must align with the signed rate agreement
5. Requests a credit memo or corrected invoice within 15 business days
6. Closes professionally with space for signature

Return ONLY the letter text. No JSON, no markdown formatting,
no code blocks — just the plain letter text ready to send as an email.`

  return generateGeminiContent(prompt, false)
}
