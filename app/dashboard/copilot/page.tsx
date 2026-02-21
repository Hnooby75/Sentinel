// ============================================
// app/dashboard/copilot/page.tsx
// Copilote Compliance avec historique persistant
// ============================================
'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Send, Sparkles, Bot, User, Loader2, Plus, Copy, Check, Database, Trash2, MessageSquare } from 'lucide-react'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface Conversation {
  id: string
  titre: string
  created_at: string
  updated_at: string
}

const SUGGESTED_QUESTIONS = [
  "Fais-moi un diagnostic complet de la santé de mon entreprise",
  "Quels sont mes risques les plus urgents à traiter en priorité ?",
  "Analyse ma conformité AI Act et dis-moi ce que je dois faire",
  "J'ai des factures en retard, quelle stratégie de relance adopter ?",
  "Mes contrats présentent-ils des risques ? Que faire ?",
]

const FOLLOW_UP_SUGGESTIONS: Record<string, string[]> = {
  default: [
    "Peux-tu approfondir ce point ?",
    "Quelles sont les prochaines étapes concrètes ?",
  ],
  conformite: [
    "Comment améliorer mon score rapidement ?",
    "Quels articles de l'AI Act me concernent ?",
  ],
  finance: [
    "Comment optimiser ma trésorerie ?",
    "Quels indicateurs surveiller en priorité ?",
  ],
}

// Simple inline markdown parser → React elements
function parseMarkdown(text: string): React.ReactNode[] {
  const lines = text.split('\n')
  const result: React.ReactNode[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    if (line.startsWith('### ')) {
      result.push(<h3 key={i} className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-3 mb-1">{parseInline(line.slice(4))}</h3>)
    } else if (line.startsWith('## ')) {
      result.push(<h2 key={i} className="text-base font-bold text-slate-900 dark:text-slate-100 mt-3 mb-1">{parseInline(line.slice(3))}</h2>)
    } else if (line.startsWith('# ')) {
      result.push(<h1 key={i} className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-3 mb-1">{parseInline(line.slice(2))}</h1>)
    } else if (line.match(/^[-*] /)) {
      const items: React.ReactNode[] = []
      while (i < lines.length && lines[i].match(/^[-*] /)) {
        items.push(<li key={i} className="ml-2 flex items-start gap-2"><span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0" /><span>{parseInline(lines[i].slice(2))}</span></li>)
        i++
      }
      result.push(<ul key={`list-${i}`} className="space-y-0.5 my-1.5">{items}</ul>)
      continue
    } else if (line.match(/^\d+\. /)) {
      const items: React.ReactNode[] = []
      let num = 1
      while (i < lines.length && lines[i].match(/^\d+\. /)) {
        items.push(<li key={i} className="ml-2 flex items-start gap-2"><span className="flex-shrink-0 text-blue-500 font-semibold text-xs mt-0.5">{num}.</span><span>{parseInline(lines[i].replace(/^\d+\. /, ''))}</span></li>)
        i++
        num++
      }
      result.push(<ol key={`ol-${i}`} className="space-y-0.5 my-1.5">{items}</ol>)
      continue
    } else if (line.match(/^---+$/)) {
      result.push(<hr key={i} className="border-slate-200 dark:border-slate-600 my-2" />)
    } else if (line.trim() === '') {
      result.push(<div key={i} className="h-1" />)
    } else {
      result.push(<p key={i} className="leading-relaxed">{parseInline(line)}</p>)
    }
    i++
  }
  return result
}

function parseInline(text: string): React.ReactNode {
  const parts: React.ReactNode[] = []
  let remaining = text
  let key = 0

  while (remaining.length > 0) {
    const boldMatch = remaining.match(/^(.*?)\*\*(.+?)\*\*/)
    if (boldMatch) {
      if (boldMatch[1]) parts.push(<span key={key++}>{boldMatch[1]}</span>)
      parts.push(<strong key={key++} className="font-semibold">{boldMatch[2]}</strong>)
      remaining = remaining.slice(boldMatch[0].length)
      continue
    }
    const italicMatch = remaining.match(/^(.*?)\*(.+?)\*/)
    if (italicMatch) {
      if (italicMatch[1]) parts.push(<span key={key++}>{italicMatch[1]}</span>)
      parts.push(<em key={key++}>{italicMatch[2]}</em>)
      remaining = remaining.slice(italicMatch[0].length)
      continue
    }
    const codeMatch = remaining.match(/^(.*?)`(.+?)`/)
    if (codeMatch) {
      if (codeMatch[1]) parts.push(<span key={key++}>{codeMatch[1]}</span>)
      parts.push(<code key={key++} className="bg-slate-100 dark:bg-slate-700 text-blue-600 dark:text-blue-400 px-1 py-0.5 rounded text-xs font-mono">{codeMatch[2]}</code>)
      remaining = remaining.slice(codeMatch[0].length)
      continue
    }
    parts.push(<span key={key++}>{remaining}</span>)
    break
  }
  return parts.length === 1 ? parts[0] : <>{parts}</>
}

function MarkdownMessage({ content }: { content: string }) {
  return <div className="text-sm space-y-0.5">{parseMarkdown(content)}</div>
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { /* ignore */ }
  }
  return (
    <button onClick={handleCopy} className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-300" title="Copier">
      {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  )
}

function getFollowUpSuggestions(lastMessage: string): string[] {
  const lower = lastMessage.toLowerCase()
  if (lower.includes('conformité') || lower.includes('ai act') || lower.includes('score')) return FOLLOW_UP_SUGGESTIONS.conformite
  if (lower.includes('financ') || lower.includes('trésorerie') || lower.includes('impayé')) return FOLLOW_UP_SUGGESTIONS.finance
  return FOLLOW_UP_SUGGESTIONS.default
}

export default function CopilotPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeConvId, setActiveConvId] = useState<string | null>(null)
  const [loadingConvs, setLoadingConvs] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Charger la liste des conversations
  const loadConversations = useCallback(async () => {
    try {
      const res = await fetch('/api/copilot/conversations')
      if (res.ok) {
        const data = await res.json()
        setConversations(data.data || [])
        return data.data || []
      }
    } catch { /* ignore */ } finally {
      setLoadingConvs(false)
    }
    return []
  }, [])

  // Charger une conversation existante
  const loadConversation = useCallback(async (convId: string) => {
    try {
      const res = await fetch(`/api/copilot/conversations/${convId}`)
      if (res.ok) {
        const data = await res.json()
        setMessages(data.messages || [])
        setActiveConvId(convId)
      }
    } catch { /* ignore */ }
  }, [])

  // Au montage : charger les conversations et ouvrir la plus récente
  useEffect(() => {
    loadConversations().then((convs: Conversation[]) => {
      if (convs.length > 0) {
        loadConversation(convs[0].id)
      }
    })
  }, [loadConversations, loadConversation])

  // Auto-save après chaque réponse
  const saveConversation = useCallback(async (msgs: Message[], convId: string) => {
    try {
      const titre = msgs[0]?.content?.slice(0, 40) || 'Nouvelle conversation'
      await fetch(`/api/copilot/conversations/${convId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: msgs, titre }),
      })
      // Rafraîchir la liste
      setConversations(prev => prev.map(c =>
        c.id === convId ? { ...c, titre, updated_at: new Date().toISOString() } : c
      ).sort((a, b) => b.updated_at.localeCompare(a.updated_at)))
    } catch { /* ignore */ }
  }, [])

  async function createNewConversation() {
    try {
      const res = await fetch('/api/copilot/conversations', { method: 'POST' })
      if (res.ok) {
        const data = await res.json()
        setConversations(prev => [data, ...prev])
        setActiveConvId(data.id)
        setMessages([])
        setInput('')
        return data.id
      }
    } catch { /* ignore */ }
    return null
  }

  async function deleteConversation(convId: string, e: React.MouseEvent) {
    e.stopPropagation()
    try {
      await fetch(`/api/copilot/conversations/${convId}`, { method: 'DELETE' })
      setConversations(prev => prev.filter(c => c.id !== convId))
      if (activeConvId === convId) {
        setMessages([])
        setActiveConvId(null)
      }
    } catch { /* ignore */ }
  }

  async function sendMessage(text?: string) {
    const messageText = text || input.trim()
    if (!messageText || loading) return

    setInput('')
    setLoading(true)

    let convId = activeConvId
    if (!convId) {
      convId = await createNewConversation()
      if (!convId) { setLoading(false); return }
    }

    const newMessages: Message[] = [...messages, { role: 'user', content: messageText }]
    setMessages(newMessages)

    try {
      const res = await fetch('/api/ai/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: messageText }),
      })
      const data = await res.json()

      if (!res.ok) {
        const errorMessages: Message[] = [...newMessages, { role: 'assistant', content: `Erreur : ${data.error || 'Problème serveur.'}` }]
        setMessages(errorMessages)
        await saveConversation(errorMessages, convId)
        return
      }

      const finalMessages: Message[] = [...newMessages, { role: 'assistant', content: data.response }]
      setMessages(finalMessages)
      await saveConversation(finalMessages, convId)
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Erreur réseau — vérifiez que le serveur est démarré.' }])
    } finally {
      setLoading(false)
      textareaRef.current?.focus()
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  async function newConversation() {
    const convId = await createNewConversation()
    if (convId) setSidebarOpen(false)
  }

  const lastAssistantMessage = [...messages].reverse().find(m => m.role === 'assistant')
  const followUpSuggestions = lastAssistantMessage && !loading
    ? getFollowUpSuggestions(lastAssistantMessage.content)
    : []

  return (
    <div className="flex h-[calc(100vh-7rem)] gap-4">
      {/* Sidebar conversations — desktop */}
      <aside className="hidden md:flex w-56 flex-col bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden flex-shrink-0">
        <div className="px-3 py-3 border-b border-slate-100 dark:border-slate-700">
          <button
            onClick={newConversation}
            className="w-full flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm font-semibold transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nouvelle conversation
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {loadingConvs ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
            </div>
          ) : conversations.length === 0 ? (
            <div className="text-xs text-slate-400 dark:text-slate-500 text-center py-6 px-2">
              Aucune conversation
            </div>
          ) : (
            conversations.map(conv => (
              <button
                key={conv.id}
                onClick={() => loadConversation(conv.id)}
                className={`group w-full text-left px-3 py-2.5 rounded-lg transition-all text-xs flex items-start gap-2 ${
                  activeConvId === conv.id
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{conv.titre}</p>
                  <p className="text-slate-400 dark:text-slate-500 mt-0.5">
                    {new Date(conv.updated_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                  </p>
                </div>
                <button
                  onClick={(e) => deleteConversation(conv.id, e)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-300 hover:text-red-400 flex-shrink-0 p-0.5"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </button>
            ))
          )}
        </div>
      </aside>

      {/* Zone chat principale */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-blue-500" />
              Copilote Compliance
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Expert AI Act · Répond selon votre contexte · Cite les articles applicables
            </p>
            <div className="flex items-center gap-1.5 mt-2">
              <Database className="w-3.5 h-3.5 text-emerald-500" />
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-full">
                Accès à vos données · 10 modules · Temps réel
              </span>
            </div>
          </div>
          {messages.length > 0 && (
            <button
              onClick={newConversation}
              className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 border-2 border-slate-300 dark:border-slate-600 px-4 py-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-blue-400 dark:hover:border-blue-500 transition-all duration-200 font-medium"
            >
              <Plus className="w-4 h-4" />
              Nouvelle
            </button>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto bg-gradient-to-b from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 rounded-2xl border-2 border-slate-200 dark:border-slate-700 shadow-xl p-6 space-y-5">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-8 text-center">
              <div className="relative">
                <div className="bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 p-6 rounded-3xl shadow-xl">
                  <Bot className="w-12 h-12 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-emerald-400 rounded-full animate-pulse shadow-lg" />
              </div>
              <div className="space-y-2">
                <h2 className="font-bold text-slate-800 dark:text-slate-100 text-2xl">Comment puis-je vous aider ?</h2>
                <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md leading-relaxed">
                  Je suis votre expert en conformité AI Act. J'ai accès à toutes vos données d'entreprise en temps réel pour vous donner des recommandations précises et personnalisées.
                </p>
              </div>
              <div className="grid gap-3 w-full max-w-2xl">
                {SUGGESTED_QUESTIONS.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(q)}
                    className="group text-left text-sm text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 dark:hover:from-blue-900/20 dark:hover:to-purple-900/20 hover:text-blue-700 dark:hover:text-blue-300 border-2 border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600 px-5 py-3.5 rounded-xl transition-all duration-200 hover:scale-[1.02] hover:shadow-md font-medium"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-blue-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                      {q}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map((msg, i) => (
                <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${
                    msg.role === 'assistant' ? 'bg-blue-100 dark:bg-blue-900/50' : 'bg-slate-200 dark:bg-slate-700'
                  }`}>
                    {msg.role === 'assistant'
                      ? <Bot className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      : <User className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                    }
                  </div>
                  <div className={`max-w-[80%] group relative ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col`}>
                    <div className={`rounded-xl px-4 py-3 ${
                      msg.role === 'user'
                        ? 'bg-blue-600 text-white text-sm leading-relaxed'
                        : 'bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-600'
                    }`}>
                      {msg.role === 'assistant'
                        ? <MarkdownMessage content={msg.content} />
                        : <p className="text-sm leading-relaxed">{msg.content}</p>
                      }
                    </div>
                    {msg.role === 'assistant' && (
                      <div className="flex items-center gap-1 mt-1 px-1">
                        <CopyButton text={msg.content} />
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {followUpSuggestions.length > 0 && (
                <div className="flex gap-2 flex-wrap pl-11">
                  {followUpSuggestions.map((q, i) => (
                    <button
                      key={i}
                      onClick={() => sendMessage(q)}
                      className="text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 px-3 py-1.5 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}

          {loading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center bg-blue-100 dark:bg-blue-900/50">
                <Bot className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-3 flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                <span className="text-sm text-slate-400 dark:text-slate-500">Analyse en cours…</span>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="mt-4 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl p-4 flex gap-3 items-end shadow-lg">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Posez votre question sur l'AI Act, RGPD, vos obligations, risques, conformité…"
            rows={3}
            className="flex-1 resize-none text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 outline-none bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 focus:border-blue-400 dark:focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-900/50 transition-all"
          />
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || loading}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-3 rounded-xl hover:from-blue-700 hover:to-purple-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 flex-shrink-0 shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 disabled:shadow-none"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </button>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 text-center flex items-center justify-center gap-2">
          <span>Entrée pour envoyer</span>
          <span>·</span>
          <span>Shift+Entrée pour nouvelle ligne</span>
          <span>·</span>
          <span className="text-amber-600 dark:text-amber-400 font-medium">Ne remplace pas un conseil juridique</span>
        </p>
      </div>
    </div>
  )
}
