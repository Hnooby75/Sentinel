'use client'

// ============================================
// app/admin/sav/tickets/page.tsx
// Tickets SAV — vue super_admin
// ============================================
import { useState, useEffect, useCallback } from 'react'
import { Ticket, Loader2, AlertCircle, Save, Check } from 'lucide-react'
import { STATUT_COLORS, STATUT_LABELS } from '@/lib/tickets'

interface TicketAdmin {
  id: string
  sujet: string
  categorie: string
  description: string
  statut: string
  notes_admin: string | null
  created_at: string
  entreprises: { nom: string } | null
}

type GroupedTickets = Record<string, TicketAdmin[]>

const STATUTS = ['ouvert', 'en_attente', 'résolu', 'clôturé']

export default function AdminTicketsPage() {
  const [tickets,   setTickets]   = useState<TicketAdmin[]>([])
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState<string | null>(null)

  // État local pour les éditions
  const [editing, setEditing] = useState<Record<string, { statut: string; notes: string; saving: boolean; saved: boolean }>>({})

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/sav/tickets')
      if (!res.ok) { const d = await res.json(); throw new Error(d.error) }
      const d = await res.json()
      const data = (d.tickets || []) as TicketAdmin[]
      setTickets(data)
      // Initialiser l'état local d'édition
      const init: typeof editing = {}
      data.forEach(t => {
        init[t.id] = { statut: t.statut, notes: t.notes_admin || '', saving: false, saved: false }
      })
      setEditing(init)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erreur')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  async function handleSave(ticketId: string) {
    const state = editing[ticketId]
    if (!state) return

    setEditing(prev => ({ ...prev, [ticketId]: { ...prev[ticketId], saving: true } }))
    try {
      const res = await fetch(`/api/admin/sav/tickets?id=${ticketId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ statut: state.statut, notes_admin: state.notes || null }),
      })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error) }
      setEditing(prev => ({ ...prev, [ticketId]: { ...prev[ticketId], saving: false, saved: true } }))
      // Mettre à jour le ticket local
      setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, statut: state.statut, notes_admin: state.notes || null } : t))
      setTimeout(() => {
        setEditing(prev => ({ ...prev, [ticketId]: { ...prev[ticketId], saved: false } }))
      }, 3000)
    } catch {
      setEditing(prev => ({ ...prev, [ticketId]: { ...prev[ticketId], saving: false } }))
    }
  }

  // Grouper par catégorie
  const grouped: GroupedTickets = {}
  tickets.forEach(t => {
    if (!grouped[t.categorie]) grouped[t.categorie] = []
    grouped[t.categorie].push(t)
  })

  const categories = Object.keys(grouped).sort()

  const openCount = (cats: TicketAdmin[]) => cats.filter(t => t.statut === 'ouvert').length

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
    </div>
  )

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Ticket className="w-6 h-6 text-amber-400" />
        <h1 className="text-2xl font-bold text-white">Tickets SAV</h1>
        <span className="ml-auto text-sm text-slate-400">
          {tickets.length} ticket{tickets.length !== 1 ? 's' : ''} · {tickets.filter(t => t.statut === 'ouvert').length} ouvert{tickets.filter(t => t.statut === 'ouvert').length !== 1 ? 's' : ''}
        </span>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 px-4 py-3 rounded-xl">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {tickets.length === 0 && !error && (
        <div className="text-center py-16 text-slate-500">
          <Ticket className="w-10 h-10 mx-auto mb-3 text-slate-700" />
          <p>Aucun ticket SAV pour l&apos;instant</p>
        </div>
      )}

      {/* Sections par catégorie */}
      {categories.map(categorie => {
        const cats = grouped[categorie]
        const open = openCount(cats)
        return (
          <div key={categorie} className="rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden">
            {/* En-tête catégorie */}
            <div className="px-6 py-4 border-b border-slate-800 flex items-center gap-3 bg-slate-800/50">
              <h2 className="font-semibold text-white">{categorie}</h2>
              {open > 0 && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  {open} ouvert{open !== 1 ? 's' : ''}
                </span>
              )}
              <span className="ml-auto text-xs text-slate-500">{cats.length} ticket{cats.length !== 1 ? 's' : ''}</span>
            </div>

            {/* Tableau des tickets */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-800 text-xs text-slate-500">
                    <th className="text-left px-5 py-3">Entreprise</th>
                    <th className="text-left px-5 py-3">Sujet</th>
                    <th className="text-left px-5 py-3">Description</th>
                    <th className="text-left px-5 py-3">Statut</th>
                    <th className="text-left px-5 py-3">Date</th>
                    <th className="text-left px-5 py-3">Notes admin</th>
                    <th className="px-5 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {cats.map(ticket => {
                    const state = editing[ticket.id]
                    if (!state) return null
                    return (
                      <tr key={ticket.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="px-5 py-4 font-medium text-white whitespace-nowrap">
                          {(ticket.entreprises as unknown as { nom: string } | null)?.nom || '—'}
                        </td>
                        <td className="px-5 py-4 text-slate-300 whitespace-nowrap">{ticket.sujet}</td>
                        <td className="px-5 py-4 text-slate-400 max-w-xs">
                          <p className="line-clamp-2 text-xs">{ticket.description}</p>
                        </td>
                        <td className="px-5 py-4">
                          <select
                            value={state.statut}
                            onChange={e => setEditing(prev => ({
                              ...prev,
                              [ticket.id]: { ...prev[ticket.id], statut: e.target.value, saved: false }
                            }))}
                            className={`text-xs px-2 py-1 rounded-lg border bg-transparent focus:outline-none ${STATUT_COLORS[state.statut] || STATUT_COLORS.ouvert}`}
                          >
                            {STATUTS.map(s => (
                              <option key={s} value={s}>{STATUT_LABELS[s] || s}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-5 py-4 text-slate-500 text-xs whitespace-nowrap">{formatDate(ticket.created_at)}</td>
                        <td className="px-5 py-4">
                          <input
                            value={state.notes}
                            onChange={e => setEditing(prev => ({
                              ...prev,
                              [ticket.id]: { ...prev[ticket.id], notes: e.target.value, saved: false }
                            }))}
                            placeholder="Note interne..."
                            className="w-40 rounded-lg bg-slate-800 border border-slate-700 px-2 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500/50"
                          />
                        </td>
                        <td className="px-5 py-4">
                          <button
                            onClick={() => handleSave(ticket.id)}
                            disabled={state.saving}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 text-xs font-medium transition-all disabled:opacity-60"
                          >
                            {state.saving
                              ? <Loader2 className="w-3 h-3 animate-spin" />
                              : state.saved
                              ? <Check className="w-3 h-3" />
                              : <Save className="w-3 h-3" />
                            }
                            {state.saving ? '' : state.saved ? 'OK' : 'Sauver'}
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )
      })}
    </div>
  )
}
