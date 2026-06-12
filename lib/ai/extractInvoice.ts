import { generateGeminiContent, parseGeminiJSON } from './geminiClient'

export interface ExtractedLineItem {
  description: string
  billed_amount: number
  quantity: number
  unit: string
}

export interface ExtractedInvoice {
  carrier_name: string | null
  invoice_number: string | null
  invoice_date: string | null
  shipment_date: string | null
  origin: string | null
  destination: string | null
  weight_lbs: number | null
  distance_miles: number | null
  pro_number: string | null
  line_items: ExtractedLineItem[]
  total_billed: number
}

export async function extractInvoiceData(
  fileBuffer: Buffer,
  mimeType: string = 'application/pdf'
): Promise<ExtractedInvoice> {
  const base64Data = fileBuffer.toString('base64')

  const prompt = `You are a freight invoice data extraction specialist.
Read this freight invoice document carefully and extract ALL data.

Return ONLY valid JSON with this exact structure, no markdown formatting:
{
  "carrier_name": "string or null",
  "invoice_number": "string or null",
  "invoice_date": "YYYY-MM-DD or null",
  "shipment_date": "YYYY-MM-DD or null",
  "origin": "string or null (city, state)",
  "destination": "string or null (city, state)",
  "weight_lbs": number or null,
  "distance_miles": number or null,
  "pro_number": "string or null",
  "line_items": [
    {
      "description": "string (exact charge description from invoice)",
      "billed_amount": number,
      "quantity": number,
      "unit": "string (e.g. 'lbs', 'hrs', 'flat', 'pallets')"
    }
  ],
  "total_billed": number
}

Extract EVERY line item including base freight charges, fuel surcharges,
and all accessorial charges (detention, liftgate, residential delivery,
inside delivery, redelivery attempts, oversize/overweight fees, hazmat
surcharges, and any other fees listed).

Be precise with decimal numbers. Return ONLY the JSON object, nothing else.`

  const genAI = new (await import('@google/genai')).GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! })

  const result = await genAI.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: [
      {
        inlineData: {
          mimeType: mimeType,
          data: base64Data
        }
      },
      { text: prompt }
    ],
    config: { responseMimeType: 'application/json' }
  })

  const responseText = result.text || ''
  return parseGeminiJSON<ExtractedInvoice>(responseText)
}
