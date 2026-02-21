'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Search, Users, Globe, ChevronRight, Loader2 } from 'lucide-react'

interface Client {
  id: string
  nom: string
  plan: string
  plan_actif: boolean
  trial_expires_at: string | null
  created_at: string
  nb_utilisateurs: number
  admin_email: string
  trial_expire: boolean
  site: { statut: string; url: string | null } | null
}

const planColors: Record<string, string> = {
  trial:        'text-amber-400 bg-amber-500/10 border-amber-500/20',
  solo:         'text-blue-400 bg-blue-500/10 border-blue-500/20',
  presence:     'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
  croissance:   'text-purple-400 bg-purple-500/10 border-purple-500/20',
  acceleration: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
}

export default function ClientsPage() {
  const [clients, setClients]   = useState<Client[]>([])
  const [loading, setLoading]   = useState(true)
  const [search,  setSearch]    = useState('')
  const [filter,  setFilter]    = useState<'all' | 'actif' | 'trial' | 'expire'>('all')

  useEffect(() => {
    fetch('/api/admin/clients')
      .then(r => r.json())
      .then(d => setClients(d.clients || []))
      .finally(() => setLoading(false))
  }, [])

  const filtered = clients.filter(c => {
    const matchSearch = !search || c.nom.toLowerCase().includes(search.toLowerCase()) || c.admin_email.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'all'    ? true
      : filter === 'actif'  ? c.plan_actif && c.plan !== 'trial'
      : filter === 'trial'  ? c.plan === 'trial' && !c.trial_expire
      : filter === 'expire' ? c.trial_expire
      : true
    return matchSearch && matchFilter
  })

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Clients</h1>
        <p className="text-slate-400 text-sm mt-1">{clients.length} entreprises enregistrées</p>
      </div>

      {/* Filtres */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher un client..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
          />
        </div>
        {(['all', 'actif', 'trial', 'expire'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-2 rounded-xl text-xs font-medium transition-all ${
              filter === f
                ? 'bg-amber-500 text-black'
                : 'text-slate-400 border border-slate-800 hover:text-white'
            }`}
          >
            {{ all: 'Tous', actif: 'Actifs', trial: 'Trial', expire: 'Expirés' }[f]}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-sm">Aucun client trouvé</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-xs text-slate-500">
                <th className="text-left px-6 py-3">Entreprise</th>
                <th className="text-left px-6 py-3">Contact admin</th>
                <th className="text-left px-6 py-3">Plan</th>
                <th className="text-left px-6 py-3">Site</th>
                <th className="text-left px-6 py-3">Utilisateurs</th>
                <th className="text-left px-6 py-3">Inscrit le</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filtered.map(c => (
                <tr key={c.id} className="hover:bg-slate-800/50 transition-colors">
                  <td className="px-6 py-3 font-medium text-white">{c.nom}</td>
                  <td className="px-6 py-3 text-slate-400 text-xs">{c.admin_email || '—'}</td>
                  <td className="px-6 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full border capitalize ${planColors[c.plan] || planColors.trial}`}>
                      {c.plan}
                    </span>
                  </td>
                  <td className="px-6 py-3">
                    {c.site ? (
                      <span className={`text-xs ${c.site.statut === 'en_ligne' ? 'text-emerald-400' : 'text-slate-500'}`}>
                        {c.site.statut === 'en_ligne' ? '● En ligne' : '○ ' + c.site.statut}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-600">—</span>
                    )}
                  </td>
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-1 text-slate-400">
                      <Users className="w-3 h-3" />
                      {c.nb_utilisateurs}
                    </div>
                  </td>
                  <td className="px-6 py-3 text-slate-400 text-xs">
                    {new Date(c.created_at).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-6 py-3 text-right">
                    <Link
                      href={`/admin/clients/${c.id}`}
                      className="inline-flex items-center gap-1 text-xs text-amber-400 hover:underline"
                    >
                      Gérer <ChevronRight className="w-3 h-3" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
