// ============================================
// app/admin/marketing/page.tsx
// Panel admin — Vue missions marketing
// ============================================
import { createClient as createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'
import { Megaphone, Users, Clock, Activity, ChevronRight } from 'lucide-react'

type Mission = {
  id: string
  statut: string
  heures_allouees_par_mois: number
  date_debut: string | null
  updated_at: string
  heures_utilisees_ce_mois: number
  entreprise: { id: string; nom: string; plan: string } | null
  agent: { id: string; prenom: string; nom: string; role: string; photo_url: string | null } | null
}

const statutColors: Record<string, string> = {
  active: 'bg-emerald-500/20 text-emerald-400',
  pause: 'bg-amber-500/20 text-amber-400',
  terminee: 'bg-slate-500/20 text-slate-400',
}

export default async function AdminMarketingPage() {
  const db = createAdminClient()
  const now = new Date()
  const moisDebut = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`

  const [missionsRes, agentsRes, heuresRes] = await Promise.all([
    db
      .from('marketing_missions')
      .select(`
        id, statut, heures_allouees_par_mois, date_debut, updated_at,
        entreprise:entreprises(id, nom, plan),
        agent:agents_sentinel(id, prenom, nom, role, photo_url)
      `)
      .order('updated_at', { ascending: false }),
    db.from('agents_sentinel').select('id').eq('actif', true),
    db.from('heures_marketing').select('mission_id, heures_utilisees').gte('mois', moisDebut),
  ])

  const rawMissions = missionsRes.data || []
  const heures = heuresRes.data || []

  const heuresMap: Record<string, number> = {}
  heures.forEach(h => {
    heuresMap[h.mission_id] = (heuresMap[h.mission_id] || 0) + h.heures_utilisees
  })

  const missions: Mission[] = rawMissions.map(m => ({
    ...m,
    entreprise: Array.isArray(m.entreprise) ? (m.entreprise[0] ?? null) : (m.entreprise as Mission['entreprise']),
    agent: Array.isArray(m.agent) ? (m.agent[0] ?? null) : (m.agent as Mission['agent']),
    heures_utilisees_ce_mois: heuresMap[m.id] || 0,
  }))

  const stats = {
    missions_actives: missions.filter(m => m.statut === 'active').length,
    total_agents: agentsRes.data?.length || 0,
    heures_totales: heures.reduce((s, h) => s + h.heures_utilisees, 0),
  }

  return (
    <div className="space-y-8 max-w-6xl">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Marketing</h1>
          <p className="text-slate-400 text-sm mt-1">Missions et agents dédiés</p>
        </div>
        <Link
          href="/admin/marketing/agents"
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-black text-sm font-semibold transition-colors"
        >
          <Users className="w-4 h-4" />
          Gérer les agents
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Missions actives', value: stats.missions_actives, icon: Activity, color: 'text-emerald-400' },
          { label: 'Agents actifs', value: stats.total_agents, icon: Users, color: 'text-blue-400' },
          { label: 'Heures ce mois', value: `${stats.heures_totales.toFixed(1)}h`, icon: Clock, color: 'text-purple-400' },
        ].map(s => (
          <div key={s.label} className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <s.icon className={`w-5 h-5 mb-3 ${s.color}`} />
            <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
            <p className="text-xs text-slate-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tableau missions */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <h2 className="font-semibold flex items-center gap-2">
            <Megaphone className="w-4 h-4 text-amber-400" />
            Missions en cours ({missions.length})
          </h2>
        </div>

        {missions.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <Megaphone className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>Aucune mission créée</p>
            <p className="text-xs mt-1">Assignez un agent à un client via la page client.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-xs text-slate-500">
                <th className="text-left px-6 py-3">Entreprise</th>
                <th className="text-left px-6 py-3">Agent</th>
                <th className="text-left px-6 py-3">Heures</th>
                <th className="text-left px-6 py-3">Statut</th>
                <th className="text-left px-6 py-3">Mise à jour</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {missions.map(m => {
                const pct = m.heures_allouees_par_mois > 0
                  ? Math.min((m.heures_utilisees_ce_mois / m.heures_allouees_par_mois) * 100, 100)
                  : 0
                return (
                  <tr key={m.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-6 py-3">
                      <p className="font-medium text-white">{m.entreprise?.nom ?? '—'}</p>
                      <p className="text-xs text-slate-500 capitalize">{m.entreprise?.plan}</p>
                    </td>
                    <td className="px-6 py-3">
                      {m.agent ? (
                        <div>
                          <p className="text-white">{m.agent.prenom} {m.agent.nom}</p>
                          <p className="text-xs text-slate-500 capitalize">{m.agent.role.replace('_', ' ')}</p>
                        </div>
                      ) : (
                        <span className="text-slate-500 italic text-xs">Non assigné</span>
                      )}
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-white font-medium">{m.heures_utilisees_ce_mois.toFixed(1)}</span>
                        <span className="text-slate-500">/ {m.heures_allouees_par_mois}h</span>
                      </div>
                      <div className="w-20 h-1.5 bg-slate-700 rounded-full mt-1.5 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </td>
                    <td className="px-6 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${statutColors[m.statut] || statutColors.active}`}>
                        {m.statut}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-slate-400 text-xs">
                      {new Date(m.updated_at).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-6 py-3 text-right">
                      {m.entreprise && (
                        <Link
                          href={`/admin/clients/${m.entreprise.id}`}
                          className="text-xs text-amber-400 hover:underline flex items-center gap-1 justify-end"
                        >
                          Gérer <ChevronRight className="w-3 h-3" />
                        </Link>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
