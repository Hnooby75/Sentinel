'use client'

// ============================================
// app/admin/notifications/page.tsx
// Envoi de notifications SAV aux clients
// ============================================
import { useState, useEffect } from 'react'
import { Bell, Send, Users, Building2, ChevronDown } from 'lucide-react'

type Entreprise = { id: string; nom: string; plan: string }
type NotifHistory = {
  id: string
  content: string
  created_at: string
  entreprise_id: string | null
}

export default function AdminNotificationsPage() {
  const [entreprises, setEntreprises] = useState<Entreprise[]>([])
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [cible, setCible] = useState<'all' | 'plan' | 'entreprise'>('all')
  const [selectedPlan, setSelectedPlan] = useState('pro')
  const [selectedEntreprise, setSelectedEntreprise] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [history, setHistory] = useState<NotifHistory[]>([])
  const [loadingHistory, setLoadingHistory] = useState(true)

  useEffect(() => {
    // Charger entreprises
    fetch('/api/admin/sav')
      .then(r => r.json())
      .then(d => setEntreprises((d.conversations || []).map((c: { entreprise_id: string; nom: string; plan: string }) => ({
        id: c.entreprise_id, nom: c.nom, plan: c.plan
      }))))

    // Charger historique (derniers 20 messages support)
    fetchHistory()
  }, [])

  async function fetchHistory() {
    setLoadingHistory(true)
    const res = await fetch('/api/admin/sav')
    if (res.ok) {
      const data = await res.json()
      const convs: { entreprise_id: string }[] = data.conversations || []
      // Charger quelques messages support récents (broadcast = null ou ciblé)
      // Simplification : afficher l'historique via une liste statique des derniers envois
      setHistory([])
    }
    setLoadingHistory(false)
  }

  async function handleSend() {
    const content = message.trim()
    if (!content || sending) return
    setSending(true)

    const fullContent = title.trim() ? `**${title.trim()}**\n\n${content}` : content

    try {
      if (cible === 'all') {
        // Envoyer à toutes les entreprises
        await Promise.all(
          entreprises.map(e =>
            fetch(`/api/admin/sav/${e.id}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ content: fullContent }),
            })
          )
        )
      } else if (cible === 'plan') {
        const targets = entreprises.filter(e => e.plan === selectedPlan)
        await Promise.all(
          targets.map(e =>
            fetch(`/api/admin/sav/${e.id}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ content: fullContent }),
            })
          )
        )
      } else if (cible === 'entreprise' && selectedEntreprise) {
        await fetch(`/api/admin/sav/${selectedEntreprise}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: fullContent }),
        })
      }

      setTitle('')
      setMessage('')
      setSent(true)
      setTimeout(() => setSent(false), 3000)
    } finally {
      setSending(false)
    }
  }

  const nbDestinataires =
    cible === 'all'
      ? entreprises.length
      : cible === 'plan'
      ? entreprises.filter(e => e.plan === selectedPlan).length
      : selectedEntreprise
      ? 1
      : 0

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Notifications</h1>
        <p className="text-slate-400 text-sm mt-1">Envoyer des messages SAV ciblés aux clients</p>
      </div>

      {/* Formulaire */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 space-y-5">
        <h2 className="font-semibold flex items-center gap-2">
          <Bell className="w-4 h-4 text-amber-400" />
          Nouvelle notification
        </h2>

        {/* Titre */}
        <div>
          <label className="text-xs text-slate-400 mb-1 block">Titre (optionnel)</label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Ex : Maintenance planifiée"
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
          />
        </div>

        {/* Message */}
        <div>
          <label className="text-xs text-slate-400 mb-1 block">Message *</label>
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="Votre message aux clients..."
            rows={4}
            className="w-full resize-none bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
          />
        </div>

        {/* Cible */}
        <div>
          <label className="text-xs text-slate-400 mb-2 block">Destinataires</label>
          <div className="flex flex-wrap gap-2">
            {[
              { val: 'all', label: 'Tous les clients', icon: Users },
              { val: 'plan', label: 'Par plan', icon: ChevronDown },
              { val: 'entreprise', label: 'Entreprise spécifique', icon: Building2 },
            ].map(opt => (
              <button
                key={opt.val}
                onClick={() => setCible(opt.val as typeof cible)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                  cible === opt.val
                    ? 'border-amber-500 bg-amber-500/10 text-amber-400'
                    : 'border-slate-700 text-slate-400 hover:border-slate-600'
                }`}
              >
                <opt.icon className="w-3.5 h-3.5" />
                {opt.label}
              </button>
            ))}
          </div>

          {cible === 'plan' && (
            <select
              value={selectedPlan}
              onChange={e => setSelectedPlan(e.target.value)}
              className="mt-3 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
            >
              <option value="trial">Trial</option>
              <option value="starter">Starter</option>
              <option value="pro">Pro</option>
              <option value="enterprise">Enterprise</option>
            </select>
          )}

          {cible === 'entreprise' && (
            <select
              value={selectedEntreprise}
              onChange={e => setSelectedEntreprise(e.target.value)}
              className="mt-3 w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
            >
              <option value="">Sélectionner une entreprise...</option>
              {entreprises.map(e => (
                <option key={e.id} value={e.id}>{e.nom} ({e.plan})</option>
              ))}
            </select>
          )}
        </div>

        {/* Résumé + bouton */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800">
          <p className="text-sm text-slate-400">
            {nbDestinataires} destinataire{nbDestinataires !== 1 ? 's' : ''}
          </p>
          <button
            onClick={handleSend}
            disabled={!message.trim() || sending || nbDestinataires === 0}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed text-black font-semibold text-sm transition-colors"
          >
            <Send className="w-4 h-4" />
            {sending ? 'Envoi...' : sent ? 'Envoyé !' : 'Envoyer'}
          </button>
        </div>
      </div>
    </div>
  )
}
