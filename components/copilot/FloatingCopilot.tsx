// ============================================
// components/copilot/FloatingCopilot.tsx
// Copilote flottant — accessible depuis tout le dashboard
// ============================================
'use client'

import { useState, useRef, useEffect } from 'react'
import { MessageCircle, X, Send, Bot, User, Loader2, Sparkles } from 'lucide-react'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

export default function FloatingCopilot() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [unread, setUnread] = useState(0)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setUnread(0)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [open])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendMessage() {
    const text = input.trim()
    if (!text || loading) return

    setInput('')
    setLoading(true)
    setMessages(prev => [...prev, { role: 'user', content: text }])

    try {
      const res = await fetch('/api/ai/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      })

      const data = await res.json()

      if (!res.ok) {
        setMessages(prev => [...prev, { role: 'assistant', content: `Erreur : ${data.error || 'Problème serveur'}` }])
        return
      }

      setMessages(prev => [...prev, { role: 'assistant', content: data.response }])
      if (!open) setUnread(n => n + 1)
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Erreur réseau — veuillez réessayer.' }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Panel - Enhanced */}
      {open && (
        <div className="fixed bottom-24 right-6 w-96 sm:w-[420px] bg-white dark:bg-slate-800 border-2 border-blue-200 dark:border-blue-800 rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden animate-scale-in"
          style={{ height: '560px', maxHeight: 'calc(100vh - 8rem)' }}>
          {/* Header - Enhanced */}
          <div className="flex items-center gap-3 px-5 py-4 border-b border-blue-100 dark:border-blue-900 bg-gradient-to-r from-blue-600 via-blue-500 to-purple-600 text-white">
            <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm shadow-lg">
              <Sparkles className="w-5 h-5 animate-pulse-soft" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold">Copilote Compliance IA</p>
              <p className="text-xs text-blue-100 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-emerald-300 rounded-full animate-pulse" />
                Expert AI Act · Accès données temps réel
              </p>
            </div>
            <button 
              onClick={() => setOpen(false)} 
              className="text-white/80 hover:text-white hover:bg-white/10 p-1.5 rounded-lg transition-all duration-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages - Enhanced */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-900/50">
            {messages.length === 0 && (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-2xl flex items-center justify-center">
                  <Bot className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1">Comment puis-je vous aider ?</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Je connais l'AI Act et j'ai accès à toutes vos données</p>
                <div className="space-y-2">
                  {[
                    "Fais-moi un diagnostic complet",
                    "Quels sont mes risques prioritaires ?",
                    "Analyse ma conformité AI Act"
                  ].map((suggestion, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setInput(suggestion)
                        setTimeout(() => sendMessage(), 100)
                      }}
                      className="w-full text-left text-xs text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 px-3 py-2 rounded-lg transition-all duration-200"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center ${
                  msg.role === 'assistant' ? 'bg-blue-100' : 'bg-slate-200'
                }`}>
                  {msg.role === 'assistant'
                    ? <Bot className="w-3 h-3 text-blue-600" />
                    : <User className="w-3 h-3 text-slate-600" />
                  }
                </div>
                <div className={`max-w-[85%] rounded-xl px-3 py-2 text-xs leading-relaxed whitespace-pre-wrap ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-50 text-slate-800 border border-slate-200'
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex gap-2">
                <div className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center bg-blue-100">
                  <Bot className="w-3 h-3 text-blue-600" />
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
                  <Loader2 className="w-3 h-3 animate-spin text-slate-400" />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input - Enhanced */}
          <div className="border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
              placeholder="Posez votre question sur l'AI Act, vos risques, conformité…"
              className="flex-1 text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 outline-none bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 focus:border-blue-400 dark:focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-900/50 transition-all"
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || loading}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-2.5 rounded-xl hover:from-blue-700 hover:to-purple-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 disabled:shadow-none"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 text-center px-4 pb-2">
            Entrée pour envoyer · Expert AI Act & RGPD
          </p>
        </div>
      )}

      {/* FAB */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-4 right-4 w-12 h-12 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors z-50 flex items-center justify-center"
        title="Copilote Compliance"
      >
        {open ? <X className="w-5 h-5" /> : <MessageCircle className="w-5 h-5" />}
        {!open && unread > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
            {unread}
          </span>
        )}
      </button>
    </>
  )
}
