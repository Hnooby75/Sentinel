'use client'

// ============================================
// app/admin/sav/page.tsx
// Panel admin — Chat SAV toutes entreprises
// ============================================
import { useState, useEffect, useRef } from 'react'
import { MessageSquare, Send, CheckCheck, Building2 } from 'lucide-react'

type Conversation = {
  entreprise_id: string
  nom: string
  plan: string
  non_lus: number
  dernier_message: { content: string; created_at: string; is_from_support: boolean } | null
}

type Message = {
  id: string
  content: string
  is_from_support: boolean
  created_at: string
}

export default function AdminSavPage() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)

  async function fetchConversations() {
    const res = await fetch('/api/admin/sav')
    if (res.ok) {
      const data = await res.json()
      setConversations(data.conversations || [])
    }
    setLoading(false)
  }

  async function fetchMessages(eid: string) {
    const res = await fetch(`/api/admin/sav/${eid}`)
    if (res.ok) {
      const data = await res.json()
      setMessages(data.messages || [])
      // Mettre à jour non_lus localement
      setConversations(prev =>
        prev.map(c => c.entreprise_id === eid ? { ...c, non_lus: 0 } : c)
      )
    }
  }

  useEffect(() => {
    fetchConversations()
    const interval = setInterval(fetchConversations, 5000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (!selected) return
    fetchMessages(selected)
    const interval = setInterval(() => fetchMessages(selected), 5000)
    return () => clearInterval(interval)
  }, [selected])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSend() {
    if (!selected || !input.trim() || sending) return
    setSending(true)
    const content = input.trim()
    setInput('')

    const res = await fetch(`/api/admin/sav/${selected}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    })
    if (res.ok) {
      await fetchMessages(selected)
    }
    setSending(false)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })

  const selectedConv = conversations.find(c => c.entreprise_id === selected)

  const sortedConversations = [...conversations].sort((a, b) => {
    if (b.non_lus !== a.non_lus) return b.non_lus - a.non_lus
    const ta = a.dernier_message?.created_at || ''
    const tb = b.dernier_message?.created_at || ''
    return tb.localeCompare(ta)
  })

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Chat SAV</h1>
        <p className="text-slate-400 text-sm mt-1">Support client — toutes les conversations</p>
      </div>

      <div className="flex gap-4 h-[calc(100vh-12rem)]">
        {/* Liste conversations */}
        <div className="w-72 flex-shrink-0 rounded-2xl border border-slate-800 bg-slate-900 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : sortedConversations.length === 0 ? (
            <div className="text-center py-8 px-4">
              <MessageSquare className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="text-slate-500 text-sm">Aucun message</p>
            </div>
          ) : (
            sortedConversations.map(conv => (
              <button
                key={conv.entreprise_id}
                onClick={() => setSelected(conv.entreprise_id)}
                className={`w-full text-left px-4 py-3 border-b border-slate-800 hover:bg-slate-800/50 transition-colors ${
                  selected === conv.entreprise_id ? 'bg-slate-800' : ''
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-sm text-white truncate flex-1 mr-2">{conv.nom}</span>
                  {conv.non_lus > 0 && (
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold">
                      {conv.non_lus}
                    </span>
                  )}
                </div>
                <span className="text-xs text-slate-500 capitalize">{conv.plan}</span>
                {conv.dernier_message && (
                  <p className="text-xs text-slate-500 mt-1 truncate">
                    {conv.dernier_message.is_from_support ? '↳ ' : ''}{conv.dernier_message.content}
                  </p>
                )}
              </button>
            ))
          )}
        </div>

        {/* Zone de chat */}
        <div className="flex-1 rounded-2xl border border-slate-800 bg-slate-900 flex flex-col overflow-hidden">
          {!selected ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
              <Building2 className="w-12 h-12 text-slate-700 mb-4" />
              <p className="text-slate-400">Sélectionnez une conversation</p>
            </div>
          ) : (
            <>
              {/* Header conversation */}
              <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-800 flex-shrink-0">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white text-sm font-bold">
                  {selectedConv?.nom[0]}
                </div>
                <div>
                  <p className="font-medium text-white">{selectedConv?.nom}</p>
                  <p className="text-xs text-slate-500 capitalize">{selectedConv?.plan}</p>
                </div>
                <div className="ml-auto">
                  <CheckCheck className="w-4 h-4 text-slate-600" />
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
                {messages.length === 0 ? (
                  <div className="text-center pt-8">
                    <p className="text-slate-500 text-sm">Aucun message dans cette conversation.</p>
                  </div>
                ) : (
                  messages.map(msg => (
                    <div key={msg.id} className={`flex ${msg.is_from_support ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${
                        msg.is_from_support
                          ? 'bg-amber-600 text-white rounded-tr-sm'
                          : 'bg-slate-800 text-slate-200 rounded-tl-sm'
                      }`}>
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                        <p className={`text-xs mt-1 ${msg.is_from_support ? 'text-amber-200' : 'text-slate-500'}`}>
                          {formatTime(msg.created_at)}
                        </p>
                      </div>
                    </div>
                  ))
                )}
                <div ref={bottomRef} />
              </div>

              {/* Input réponse */}
              <div className="flex-shrink-0 px-5 pb-5 pt-3 border-t border-slate-800">
                <div className="flex gap-3 items-end">
                  <textarea
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Répondre au client... (Entrée pour envoyer)"
                    rows={2}
                    className="flex-1 resize-none rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 px-4 py-2.5 text-sm focus:outline-none focus:border-amber-500 transition-colors"
                  />
                  <button
                    onClick={handleSend}
                    disabled={!input.trim() || sending}
                    className="flex-shrink-0 w-10 h-10 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
                  >
                    <Send className="w-4 h-4 text-black" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
