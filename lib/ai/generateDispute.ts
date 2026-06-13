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

function buildStaticLetter(params: DisputeParams): string {
  const items = params.disputedItems.map((item, i) => {
    return `${i + 1}. ${item.description || "Charge"} — Billed: $${item.billed_amount.toFixed(2)}, Contract: $${item.expected_amount.toFixed(2)}, Overcharge: $${item.discrepancy.toFixed(2)}. Reason: ${item.flag_reason || "Rate mismatch"}`;
  }).join("\n");

  return `Dear ${params.carrierName} Accounts Payable Department,

We are writing to formally dispute the following charges on Invoice #${params.invoiceNumber} (${params.invoiceDate}).

After auditing the billed amounts against our signed rate agreement, we identified the following discrepancies:

${items}

Total amount in dispute: $${params.totalDisputed.toFixed(2)}

These charges must align with the terms of our signed contract. Please review and issue a credit memo or corrected invoice within 15 business days.

Sincerely,
${params.companyName}
Freight Audit Department`;
}

export async function generateDisputeLetter(params: DisputeParams): Promise<string> {
  if (!params.disputedItems || params.disputedItems.length === 0) {
    return buildStaticLetter(params);
  }

  const prompt = `You are a professional freight billing dispute specialist.
Write a formal dispute letter. You MUST use ONLY the ACTUAL VALUES provided below — do NOT invent examples or use placeholders.

Company: ${params.companyName}
Carrier: ${params.carrierName}
Invoice #: ${params.invoiceNumber}
Invoice Date: ${params.invoiceDate}
Total Disputed: $${params.totalDisputed.toFixed(2)}

Disputed line items (use these EXACT values, do NOT replace with "[X.XX]" or "[e.g. ...]"):
${params.disputedItems.map((item, i) =>
  `Item ${i + 1}: ${item.description || "Charge"} - Billed: $${item.billed_amount.toFixed(2)}, Contract: $${item.expected_amount.toFixed(2)}, Difference: $${item.discrepancy.toFixed(2)}. Reason: ${item.flag_reason || "Rate mismatch"}`
).join("\n")}

Write a professional dispute letter that:
1. Opens formally addressing the carrier's billing department
2. States the purpose clearly in the first paragraph — disputing $${params.totalDisputed.toFixed(2)} on Invoice #${params.invoiceNumber}
3. Lists EACH disputed charge with the EXACT dollar amounts from the data above (billed, contract/expected amount, and the difference)
4. References that charges must align with the signed rate agreement
5. Requests a credit memo or corrected invoice within 15 business days
6. Closes professionally with space for signature

CRITICAL: Every dollar amount in the letter MUST come from the data above. Never use placeholders like "[X.XX]" or "[e.g. ...]". Use the real numbers provided.

Return ONLY the letter text. No JSON, no markdown formatting,
no code blocks — just the plain letter text ready to send as an email.`

  const letter = await generateGeminiContent(prompt, false);

  const placeholderPattern = /\[(e\.g\.[^\]]*|X\.XX|Y\.YY|Z\.ZZ|amount|description|date|name)\]/gi;
  if (placeholderPattern.test(letter)) {
    return buildStaticLetter(params);
  }

  return letter;
}
