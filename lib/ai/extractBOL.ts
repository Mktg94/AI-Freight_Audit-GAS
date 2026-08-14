import { parseGeminiJSON, callGeminiWithRetry, getGeminiModel } from './geminiClient'

export interface ExtractedBOL {
  bol_number: string | null
  po_number: string | null
  pro_number: string | null
  ship_date: string | null
  shipper_name: string | null
  consignee_name: string | null
  origin_address: string | null
  destination_address: string | null
  actual_weight_lbs: number | null
  dimensions: {
    length_in: number | null
    width_in: number | null
    height_in: number | null
  } | null
  requested_services: string[]
  special_instructions: string | null
}

export async function extractBOLData(
  fileBuffer: Buffer,
  mimeType: string = 'application/pdf'
): Promise<ExtractedBOL> {
  const base64Data = fileBuffer.toString('base64')

  const prompt = `You are a Bill of Lading (BOL) and shipping document extraction specialist.
Read this Bill of Lading / Shipping Order / Manifest document carefully and extract key operational details.

Return ONLY valid JSON with this exact structure, no markdown formatting:
{
  "bol_number": "string or null",
  "po_number": "string or null",
  "pro_number": "string or null",
  "ship_date": "YYYY-MM-DD or null",
  "shipper_name": "string or null",
  "consignee_name": "string or null",
  "origin_address": "string or null (city, state, zip)",
  "destination_address": "string or null (city, state, zip)",
  "actual_weight_lbs": number or null (total actual shipped weight in lbs. If in kg, convert to lbs by multiplying by 2.20462),
  "dimensions": {
    "length_in": number or null,
    "width_in": number or null,
    "height_in": number or null
  },
  "requested_services": [
    "string (list any special requested services or checkboxes checked on BOL, e.g. 'liftgate', 'residential', 'inside_delivery', 'appointment', 'hazmat')"
  ],
  "special_instructions": "string or null"
}

Be exact with numerical values. Return ONLY the JSON object, nothing else.`

  const model = getGeminiModel(true)

  const result = await callGeminiWithRetry(
    () => model.generateContent({
      contents: [
        {
          inlineData: {
            mimeType: mimeType,
            data: base64Data
          }
        },
        { text: prompt }
      ]
    }),
    'extractBOLData'
  )

  const responseText = result.text || ''
  return parseGeminiJSON<ExtractedBOL>(responseText)
}
