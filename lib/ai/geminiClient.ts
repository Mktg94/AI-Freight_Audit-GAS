import { GoogleGenAI } from '@google/genai'

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! })

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

function isRetryableError(err: any): boolean {
  const msg = err?.message || ''
  const code = err?.code || err?.status
  return code === 429 || code === 503 || msg.includes('429') || msg.includes('503') || msg.includes('UNAVAILABLE') || msg.includes('RESOURCE_EXHAUSTED')
}

async function callGeminiWithRetry(fn: () => Promise<any>, label: string, maxRetries = 3): Promise<any> {
  let lastError: any
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (err: any) {
      lastError = err
      if (!isRetryableError(err)) throw err
      if (attempt < maxRetries) {
        const delay = Math.min(1000 * Math.pow(2, attempt), 8000)
        console.warn(`[Gemini retry] ${label} attempt ${attempt}/${maxRetries} failed (${err.message}), retrying in ${delay}ms`)
        await sleep(delay)
      }
    }
  }
  console.error(`[Gemini retry] ${label} exhausted ${maxRetries} retries`)
  throw lastError
}

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
  return callGeminiWithRetry(
    () => genAI.models.generateContent({
      model: process.env.GEMINI_MODEL_NAME || 'gemini-2.5-flash',
      contents: prompt,
      config: jsonMode ? { responseMimeType: 'application/json' } : undefined
    }).then(r => r.text || ''),
    'generateGeminiContent'
  )
}

export { callGeminiWithRetry, sleep }
