// ============================================
// lib/ai/anthropic.ts
// Client IA — Groq (Llama 3.3, gratuit)
// ============================================
import Groq from 'groq-sdk'

export const MODELS = {
  fast: 'llama-3.1-8b-instant',       // Classification, tâches rapides (8B)
  smart: 'llama-3.3-70b-versatile',   // Copilote, génération de docs (70B)
} as const

let _client: Groq | null = null

function getClient(): Groq {
  if (!process.env.GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY manquante — ajoutez-la dans .env.local (console.groq.com)')
  }
  if (!_client) {
    _client = new Groq({ apiKey: process.env.GROQ_API_KEY })
  }
  return _client
}

type Message = { role: 'user' | 'assistant'; content: string }

/**
 * Génère une réponse texte simple (non-streaming)
 */
export async function complete(params: {
  model: string
  system?: string
  messages: Message[]
  max_tokens?: number
}): Promise<string> {
  const client = getClient()

  const msgs: Groq.Chat.Completions.ChatCompletionMessageParam[] = []
  if (params.system) {
    msgs.push({ role: 'system', content: params.system })
  }
  msgs.push(...params.messages)

  const completion = await client.chat.completions.create({
    model: params.model,
    max_tokens: params.max_tokens ?? 2048,
    messages: msgs,
  })

  return completion.choices[0]?.message?.content ?? ''
}

/**
 * Génère une réponse en streaming (SSE)
 * Retourne un async iterable de chunks Groq
 */
export async function streamCompletion(params: {
  model: string
  system?: string
  messages: Message[]
  max_tokens?: number
}) {
  const client = getClient()

  const msgs: Groq.Chat.Completions.ChatCompletionMessageParam[] = []
  if (params.system) {
    msgs.push({ role: 'system', content: params.system })
  }
  msgs.push(...params.messages)

  return client.chat.completions.create({
    model: params.model,
    max_tokens: params.max_tokens ?? 2048,
    messages: msgs,
    stream: true,
  })
}
