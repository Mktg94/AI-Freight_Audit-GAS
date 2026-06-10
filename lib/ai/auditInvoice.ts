import { GoogleGenAI } from '@google/genai';
import { Contract } from '../../types';
import { ExtractedLineItem } from './extractInvoice';

export interface LineItemAuditResult {
  description: string;
  billed_amount: number;
  expected_amount: number;
  discrepancy: number;
  status: "correct" | "overcharged" | "undercharged" | "not_in_contract" | "suspicious";
  confidence_score: number;
  flag_reason: string;
}

export async function auditLineItems(
  lineItems: ExtractedLineItem[],
  contract: Contract
): Promise<LineItemAuditResult[]> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey && apiKey !== "" && apiKey !== "MY_GEMINI_API_KEY") {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const prompt = `You are a freight billing auditor. Compare each invoice line item against the contract rates.
Return ONLY a valid JSON array, no explanation:
[
  {
    "description": "string",
    "billed_amount": number,
    "expected_amount": number,
    "discrepancy": number,
    "status": "correct" | "overcharged" | "undercharged" | "not_in_contract" | "suspicious",
    "confidence_score": number (0.0-1.0),
    "flag_reason": "string — cite the exact contract rate that differs"
  }
]
Contract rates: ${JSON.stringify(contract, null, 2)}
Invoice line items: ${JSON.stringify(lineItems, null, 2)}
Flag only items with clear, calculable discrepancies. 
For charges not in the contract: status "not_in_contract", confidence 0.7.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json'
        }
      });

      const responseText = response.text || '';
      const cleaned = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
      const rawResults = JSON.parse(cleaned);

      if (Array.isArray(rawResults)) {
        return rawResults.map((item: any) => ({
          description: item.description || "Line Item",
          billed_amount: Number(item.billed_amount) || 0,
          expected_amount: Number(item.expected_amount) || 0,
          discrepancy: Number(item.discrepancy) || 0,
          status: item.status || "correct",
          confidence_score: Number(item.confidence_score) || 1.0,
          flag_reason: item.flag_reason || ""
        }));
      }
    } catch (e) {
      console.error("Gemini auditing failed, running robust mechanical fallback:", e);
    }
  }

  return runFallbackLineItemAudit(lineItems, contract);
}

function runFallbackLineItemAudit(
  lineItems: ExtractedLineItem[],
  contract: Contract
): LineItemAuditResult[] {
  return lineItems.map(item => {
    const desc = item.description.toLowerCase();
    const billed = item.billed_amount;
    let expected = billed;
    let discrepancy = 0;
    let status: "correct" | "overcharged" | "undercharged" | "not_in_contract" | "suspicious" = "correct";
    let message = "Rated correctly matching active carrier files.";
    let confidence = 0.95;

    if (desc.includes("base") || desc.includes("freight") || desc.includes("shipping") || desc.includes("haul")) {
      const min_charge = contract.minimum_charge || 120;
      if (billed > min_charge && min_charge > 0) {
        expected = min_charge; 
        discrepancy = billed - expected;
        status = "overcharged";
        message = `Billed LTL freight base of $${billed.toFixed(2)} exceeds negotiated contract minimum charge floor of $${min_charge.toFixed(2)} for this profile route.`;
        confidence = 0.96;
      }
    } 
    else if (desc.includes("fuel")) {
      const fuelPct = contract.fuel_surcharge_pct || 0.14;
      const expectedFuel = Math.round(850 * fuelPct); 
      if (billed > expectedFuel) {
        expected = expectedFuel;
        discrepancy = billed - expected;
        status = "overcharged";
        message = `Billed fuel surcharge of $${billed.toFixed(2)} exceeds the negotiated fuel surcharge cap structure of ${(fuelPct * 100).toFixed(1)}% (Estimated expected: $${expectedFuel.toFixed(2)}).`;
        confidence = 0.98;
      }
    } 
    else if (desc.includes("residential")) {
      const contractRate = contract.residential_surcharge;
      if (billed > contractRate) {
        expected = contractRate;
        discrepancy = billed - expected;
        status = "overcharged";
        message = `Residential surcharge of $${billed.toFixed(2)} exceeds contract negotiated limit of $${contractRate.toFixed(2)}.`;
        confidence = 0.99;
      }
    } else if (desc.includes("liftgate") || desc.includes("lift-gate")) {
      const contractRate = contract.liftgate_fee;
      if (billed > contractRate) {
        expected = contractRate;
        discrepancy = billed - expected;
        status = "overcharged";
        message = `Liftgate accessory fee of $${billed.toFixed(2)} exceeds contract negotiated limit of $${contractRate.toFixed(2)}.`;
        confidence = 0.99;
      }
    } else if (desc.includes("inside")) {
      const contractRate = contract.inside_delivery_fee;
      if (billed > contractRate) {
        expected = contractRate;
        discrepancy = billed - expected;
        status = "overcharged";
        message = `Inside delivery service fee of $${billed.toFixed(2)} exceeds contract negotiated limit of $${contractRate.toFixed(2)}.`;
        confidence = 0.99;
      }
    } else if (desc.includes("redeliv") || desc.includes("re-deliv")) {
      const contractRate = contract.redelivery_fee;
      if (billed > contractRate) {
        expected = contractRate;
        discrepancy = billed - expected;
        status = "overcharged";
        message = `Redelivery charge of $${billed.toFixed(2)} exceeds contract negotiated limit of $${contractRate.toFixed(2)}.`;
        confidence = 0.99;
      }
    } else if (desc.includes("detention") || desc.includes("waiting")) {
      const contractRate = contract.detention_rate_per_hr;
      if (billed > contractRate) {
        expected = contractRate;
        discrepancy = billed - expected;
        status = "overcharged";
        message = `Detention fee of $${billed.toFixed(2)} exceeds contract hourly limit of $${contractRate.toFixed(2)}.`;
        confidence = 0.99;
      }
    }
    else if (billed > 20) {
      status = "not_in_contract";
      expected = 0;
      discrepancy = billed;
      message = `Accessorial category '${item.description}' is not negotiated or listed in the active carrier contract terms.`;
      confidence = 0.70;
    }

    return {
      description: item.description,
      billed_amount: billed,
      expected_amount: expected,
      discrepancy: discrepancy > 0 ? Math.round(discrepancy * 100) / 100 : 0,
      status,
      confidence_score: confidence,
      flag_reason: status !== "correct" ? message : ""
    };
  });
}
