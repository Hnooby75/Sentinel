'use client'

// ============================================
// app/dashboard/sav/tickets/page.tsx
// Tickets SAV — vue client
// ============================================
import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, Ticket, Send, Loader2, AlertCircle, Plus } from 'lucide-react'
import Link from 'next/link'
import { SUJETS, STATUT_COLORS, STATUT_LABELS } from '@/lib/tickets'

interface TicketSav {
  id: string
  sujet: string
  categorie: string
  description: string
  statut: string
  created_at: string
  updated_at: string
}

export default function TicketsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [tickets,     setTickets]     = useState<TicketSav[]>([])
  const [loading,     setLoading]     = useState(true)
  const [submitting,  setSubmitting]  = useState(false)
  const [error,       setError]       = useState<string | null>(null)
  const [success,     setSuccess]     = useState(false)
  const [showForm,    setShowForm]    = useState(false)

  // Formulaire
  const sujetParam = searchParams.get('sujet') || ''
  const [sujet,       setSujet]       = useState(sujetParam)
  const [description, setDescription] = useState('')

  async function fetchTickets() {
    try {
      const res = await fetch('/api/sav/tickets')
      if (res.ok) {
        const d = await res.json()
        setTickets(d.tickets || [])
      }
    } catch {
      // silencieux
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTickets()
    // Ouvrir le formulaire si sujet pré-rempli depuis URL
    if (sujetParam) setShowForm(true)
  }, [sujetParam])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!sujet) {
      setError('Veuillez sélectionner un sujet.')
      return
    }
    if (description.trim().length < 20) {
      setError('La description doit faire au moins 20 caractères.')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/sav/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sujet, description: description.trim() }),
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error || 'Erreur lors de la création')
      }
      setSuccess(true)
      setSujet('')
      setDescription('')
      setShowForm(false)
      await fetchTickets()
      setTimeout(() => setSuccess(false), 4000)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erreur')
    } finally {
      setSubmitting(false)
    }
  }

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/sav" className="text-slate-500 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex items-center gap-2">
          <Ticket className="w-5 h-5 text-blue-400" />
          <h1 className="text-xl font-bold text-white">Mes tickets</h1>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="ml-auto flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nouveau ticket
        </button>
      </div>

      {/* Message succès */}
      {success && (
        <div className="flex items-center gap-2 text-sm text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-4 py-3 rounded-xl">
          Ticket créé avec succès. Notre équipe vous répondra sous 48h.
        </div>
      )}

      {/* Formulaire création */}
      {showForm && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="font-semibold text-white mb-5">Créer un ticket</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 px-4 py-3 rounded-xl">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Sujet *</label>
              <select
                value={sujet}
                onChange={e => setSujet(e.target.value)}
                className="w-full rounded-xl bg-slate-800 border border-slate-700 px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500/50"
              >
                <option value="">— Sélectionner un sujet —</option>
                {SUJETS.map(s => (
                  <option key={s.label} value={s.label}>{s.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1.5">
                Description détaillée * <span className="text-slate-600">(min. 20 caractères)</span>
              </label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Décrivez votre problème ou demande en détail..."
                rows={5}
                className="w-full rounded-xl bg-slate-800 border border-slate-700 px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 resize-none transition-colors"
              />
              <p className="text-xs text-slate-600 mt-1">{description.length} / 20 min</p>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold text-sm transition-colors"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {submitting ? 'Envoi...' : 'Créer le ticket'}
              </button>
              <button
                type="button"
                onClick={() => { setShowForm(false); setError(null) }}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 text-sm transition-colors"
              >
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Liste des tickets */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <h2 className="font-semibold text-white">Historique des tickets</h2>
          <span className="text-xs text-slate-500">{tickets.length} ticket{tickets.length !== 1 ? 's' : ''}</span>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 text-slate-500 animate-spin" />
          </div>
        ) : tickets.length === 0 ? (
          <div className="text-center py-12">
            <Ticket className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400 text-sm">Aucun ticket pour l&apos;instant</p>
            <p className="text-slate-600 text-xs mt-1">Cliquez sur &quot;Nouveau ticket&quot; pour en créer un</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800">
            {tickets.map(ticket => (
              <div key={ticket.id} className="px-6 py-4 hover:bg-slate-800/30 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="font-medium text-white text-sm">{ticket.sujet}</p>
                      <span className="text-xs text-slate-500">{ticket.categorie}</span>
                    </div>
                    <p className="text-slate-400 text-sm line-clamp-2">{ticket.description}</p>
                    <p className="text-xs text-slate-600 mt-2">{formatDate(ticket.created_at)}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full border flex-shrink-0 ${STATUT_COLORS[ticket.statut] || STATUT_COLORS.ouvert}`}>
                    {STATUT_LABELS[ticket.statut] || ticket.statut}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
