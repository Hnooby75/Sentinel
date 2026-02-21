'use client'

// ============================================
// app/dashboard/sav/page.tsx
// Chat Support SAV Sentinel — avec optimistic update + feedback erreur
// ============================================
import { useState, useEffect, useRef } from 'react'
import { MessageSquare, Send, Circle, AlertCircle, Ticket, ArrowRight } from 'lucide-react'
import Link from 'next/link'

type Message = {
  id: string
  content: string
  is_from_support: boolean
  created_at: string
  pending?: boolean
  failed?: boolean
}

export default function SavPage() {
  const [messages, setMessages]   = useState<Message[]>([])
  const [input, setInput]         = useState('')
  const [loading, setLoading]     = useState(true)
  const [sending, setSending]     = useState(false)
  const [apiError, setApiError]   = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  async function fetchMessages() {
    try {
      const res = await fetch('/api/sav/messages')
      if (res.ok) {
        const data = await res.json()
        // Remplace les messages (retire les optimistes confirmés)
        setMessages(data.messages || [])
        setApiError(null)
      } else {
        const d = await res.json().catch(() => ({}))
        setApiError(d.error || `Erreur ${res.status} — vérifiez que le SQL marketing.sql a été exécuté dans Supabase.`)
      }
    } catch {
      setApiError('Impossible de contacter le serveur.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMessages()
    const interval = setInterval(fetchMessages, 10000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSend() {
    const content = input.trim()
    if (!content || sending) return

    // ID temporaire pour le message optimiste
    const tempId = `temp-${Date.now()}`
    const tempMsg: Message = {
      id: tempId,
      content,
      is_from_support: false,
      created_at: new Date().toISOString(),
      pending: true,
    }

    // Optimistic update : afficher immédiatement
    setMessages(prev => [...prev, tempMsg])
    setInput('')
    setSending(true)

    try {
      const res = await fetch('/api/sav/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      })

      if (res.ok) {
        // Rafraîchir depuis l'API pour avoir le vrai ID
        await fetchMessages()
      } else {
        const d = await res.json().catch(() => ({}))
        // Marquer le message comme échoué
        setMessages(prev =>
          prev.map(m => m.id === tempId ? { ...m, pending: false, failed: true } : m)
        )
        setApiError(d.error || 'Erreur lors de l\'envoi. Le SQL marketing.sql doit être exécuté dans Supabase.')
      }
    } catch {
      setMessages(prev =>
        prev.map(m => m.id === tempId ? { ...m, pending: false, failed: true } : m)
      )
      setApiError('Impossible de contacter le serveur.')
    } finally {
      setSending(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })

  return (
    <div className="max-w-3xl mx-auto h-[calc(100vh-6rem)] flex flex-col">

      {/* Bandeau tickets */}
      <Link
        href="/dashboard/sav/tickets"
        className="flex-shrink-0 flex items-center justify-between gap-3 px-4 py-3 mb-4 rounded-xl bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/15 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Ticket className="w-4 h-4 text-blue-400 flex-shrink-0" />
          <span className="text-sm text-blue-300 font-medium">Signaler un problème spécifique</span>
          <span className="text-xs text-slate-500">— facturation, technique, site web, etc.</span>
        </div>
        <div className="flex items-center gap-1 text-xs text-blue-400 font-medium flex-shrink-0">
          Créer un ticket
          <ArrowRight className="w-3.5 h-3.5" />
        </div>
      </Link>

      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-slate-800 flex-shrink-0">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
          <MessageSquare className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="font-semibold text-white">Support Sentinel</h1>
          <div className="flex items-center gap-1.5 mt-0.5">
            <Circle className="w-2 h-2 fill-emerald-400 text-emerald-400" />
            <span className="text-xs text-emerald-400">En ligne · Réponse sous 24h</span>
          </div>
        </div>
      </div>

      {/* Alerte erreur API */}
      {apiError && (
        <div className="flex-shrink-0 mt-3 flex items-start gap-2 text-xs text-red-400 bg-red-500/10 border border-red-500/20 px-4 py-3 rounded-xl">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">Erreur de connexion</p>
            <p className="text-red-400/80 mt-0.5">{apiError}</p>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-6 space-y-4">
        {loading ? (
          <div className="flex justify-center pt-12">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center pt-12">
            <MessageSquare className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400 text-sm">Bonjour ! Comment puis-je vous aider ?</p>
            <p className="text-slate-600 text-xs mt-1">Écrivez votre message ci-dessous.</p>
          </div>
        ) : (
          messages.map(msg => (
            <div
              key={msg.id}
              className={`flex ${msg.is_from_support ? 'justify-start' : 'justify-end'}`}
            >
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed transition-opacity ${
                  msg.is_from_support
                    ? 'bg-slate-800 text-slate-200 rounded-tl-sm'
                    : msg.failed
                    ? 'bg-red-600/80 text-white rounded-tr-sm'
                    : 'bg-blue-600 text-white rounded-tr-sm'
                } ${msg.pending ? 'opacity-60' : 'opacity-100'}`}
              >
                <p className="whitespace-pre-wrap">{msg.content}</p>
                <p className={`text-xs mt-1.5 ${msg.is_from_support ? 'text-slate-500' : msg.failed ? 'text-red-200' : 'text-blue-200'}`}>
                  {msg.pending ? 'Envoi...' : msg.failed ? 'Échec — réessayez' : formatTime(msg.created_at)}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex-shrink-0 pt-4 border-t border-slate-800">
        <div className="flex gap-3 items-end">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Écrivez votre message... (Entrée pour envoyer)"
            rows={2}
            className="flex-1 resize-none rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 px-4 py-3 text-sm focus:outline-none focus:border-blue-500 transition-colors"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || sending}
            className="flex-shrink-0 w-10 h-10 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
          >
            {sending
              ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              : <Send className="w-4 h-4 text-white" />
            }
          </button>
        </div>
      </div>
    </div>
  )
}
