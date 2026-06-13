import { GoogleGenAI } from '@google/genai'

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! })

export function getGeminiModel(jsonMode: boolean = true) {
  return {
    generateContent: (params: any) => genAI.models.generateContent({
      model: process.env.GEMINI_MODEL_NAME || 'gemini-2.5-flash',
      contents: params.contents || params,
      config: jsonMode ? { responseMimeType: 'application/json', ...params.config } : params.config
    })
  }
}

export function parseGeminiJSON<T>(responseText: string): T {
  const cleaned = responseText
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/g, '')
    .trim()

  try {
    return JSON.parse(cleaned) as T
  } catch (err) {
    console.error('Failed to parse Gemini JSON response:', cleaned.slice(0, 500))
    throw new Error('Gemini returned invalid JSON')
  }
}

export async function generateGeminiContent(prompt: string, jsonMode: boolean = true): Promise<string> {
  const response = await genAI.models.generateContent({
    model: process.env.GEMINI_MODEL_NAME || 'gemini-2.5-flash',
    contents: prompt,
    config: jsonMode ? { responseMimeType: 'application/json' } : undefined
  })
  return response.text || ''
}
