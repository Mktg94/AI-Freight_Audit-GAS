import { GoogleGenAI } from '@google/genai';

export interface DisputeParams {
  companyName: string;
  carrierName: string;
  invoiceNumber: string;
  invoiceDate: string;
  disputedItemsJson: string;
  totalDisputed: number;
}

export async function generateDisputeLetter(params: DisputeParams): Promise<string> {
  const systemPrompt = "You are a professional freight billing dispute specialist. Write a formal dispute letter.";
  const prompt = `Company: ${params.companyName}
Carrier: ${params.carrierName}  
Invoice #: ${params.invoiceNumber}
Invoice Date: ${params.invoiceDate}
Disputed Items:
${params.disputedItemsJson}
Total Disputed: $${params.totalDisputed.toFixed(2)}

Write a professional dispute letter that:
1. Opens formally addressing the carrier's billing department
2. States the purpose clearly in the first paragraph
3. Lists each disputed charge in a formatted table: Description | Billed | Contract Rate | Difference
4. Requests a credit memo or corrected invoice within 15 business days
5. References that charges must align with the signed rate agreement
6. Closes professionally with space for signature

Return only the letter text. No JSON. No markdown formatting.`;

  const geminiKey = process.env.GEMINI_API_KEY;
  if (geminiKey && geminiKey !== "" && geminiKey !== "MY_GEMINI_API_KEY") {
    try {
      const ai = new GoogleGenAI({ apiKey: geminiKey });

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          systemInstruction: systemPrompt,
        }
      });

      const responseText = response.text;
      if (responseText && responseText.trim().length > 0) {
        return responseText.trim();
      }
    } catch (err) {
      console.warn("Dispute generation: Gemini failed, falling back to programmatic template.", err);
    }
  }

  let itemsTable = "Description | Billed | Contract Rate | Difference\n";
  itemsTable += "--------------------------------------------------------\n";
  try {
    const arr = JSON.parse(params.disputedItemsJson);
    if (Array.isArray(arr)) {
      arr.forEach((item: any) => {
        const desc = item.description || item.item_description || "Overbilled Item";
        const billed = Number(item.billed) || Number(item.billed_amount) || 0;
        const expected = Number(item.expected) || Number(item.expected_amount) || 0;
        const diff = billed - expected;
        itemsTable += `${desc} | $${billed.toFixed(2)} | $${expected.toFixed(2)} | $${diff.toFixed(2)}\n`;
      });
    } else {
      itemsTable += `Disputed Line Charges | $${params.totalDisputed.toFixed(2)} | $0.00 | $${params.totalDisputed.toFixed(2)}\n`;
    }
  } catch (e) {
    itemsTable += `Disputed Line Charges | $${params.totalDisputed.toFixed(2)} | -- | $${params.totalDisputed.toFixed(2)}\n`;
  }

  const currentDateStr = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  return `${params.companyName}
${currentDateStr}

Carrier Billing Department
${params.carrierName}

Subject: Billing Dispute for Freight Invoice #${params.invoiceNumber}

To Whom It May Concern,

I am writing on behalf of ${params.companyName} to formally dispute several charges billed on freight invoice #${params.invoiceNumber} (Invoice Date: ${params.invoiceDate || 'N/A'}) issued by ${params.carrierName}. 

Our automated audit has detected rates and surcharges that do not align with our active signed pricing contract agreements. Below is the detailed breakdown of the discrepant charges:

${itemsTable}

Total Disputed Refunding Claim: $${params.totalDisputed.toFixed(2)}

Please review these discrepancies against our signed tariff agreements. We request that you issue a credit memo or a corrected invoice reflecting the contract rates within fifteen (15) business days from the receipt of this letter.

Thank you for your prompt attention to this matter. Please send the revised billing documents or confirmation of credit adjustments directly to our accounts payable group.

Sincerely,

Audit Support Team
${params.companyName}`;
}
