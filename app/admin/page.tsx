// ============================================
// app/admin/page.tsx
// Vue d'ensemble — tous les clients
// ============================================
import Link from 'next/link'
import { createClient as createAdminClient } from '@/lib/supabase/admin'
import { Users, TrendingUp, Globe, AlertCircle, ChevronRight, DollarSign, Clock } from 'lucide-react'
import CleanupButton from './CleanupButton'

const PLAN_PRICES: Record<string, number> = {
  starter: 79, pro: 149, enterprise: 499,
}

const planColors: Record<string, string> = {
  trial:      'text-amber-400 bg-amber-500/10 border-amber-500/20',
  starter:    'text-blue-400 bg-blue-500/10 border-blue-500/20',
  pro:        'text-purple-400 bg-purple-500/10 border-purple-500/20',
  enterprise: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
}

export default async function AdminPage() {
  const db = createAdminClient()

  const [entreprisesRes, utilisateursCountRes, sitesRes] = await Promise.all([
    db.from('entreprises').select('id, nom, plan, plan_actif, trial_expires_at, created_at'),
    db.from('utilisateurs').select('*', { count: 'exact', head: true }).eq('actif', true),
    db.from('sites_clients').select('entreprise_id, statut'),
  ])

  const entreprises = entreprisesRes.data  || []
  const sites       = sitesRes.data        || []

  const now   = new Date()
  const in7j  = new Date(now.getTime() + 7 * 24 * 3600 * 1000)

  const mrr = entreprises
    .filter(e => e.plan_actif && PLAN_PRICES[e.plan])
    .reduce((sum, e) => sum + (PLAN_PRICES[e.plan] || 0), 0)

  const trialsExpirantBientot = entreprises.filter(e =>
    e.plan === 'trial' && e.trial_expires_at &&
    new Date(e.trial_expires_at) > now &&
    new Date(e.trial_expires_at) <= in7j
  )

  const stats = {
    total:        entreprises.length,
    actifs:       entreprises.filter(e => e.plan_actif).length,
    trial:        entreprises.filter(e => e.plan === 'trial' && !e.plan_actif).length,
    avecSite:     sites.filter(s => s.statut === 'en_ligne').length,
    totalUsers:   utilisateursCountRes.count ?? 0,
    mrr,
  }

  // 10 derniers inscrits
  const recents = [...entreprises]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 10)

  return (
    <div className="space-y-8 max-w-5xl">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Vue d&apos;ensemble</h1>
          <p className="text-slate-400 text-sm mt-1">Panel d&apos;administration Sentinel</p>
        </div>
        <CleanupButton />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[
          { label: 'Total clients',   value: stats.total,      icon: Users,        color: 'text-white' },
          { label: 'Plans actifs',    value: stats.actifs,     icon: TrendingUp,   color: 'text-emerald-400' },
          { label: 'En trial',        value: stats.trial,      icon: AlertCircle,  color: 'text-amber-400' },
          { label: 'Sites en ligne',  value: stats.avecSite,   icon: Globe,        color: 'text-blue-400' },
          { label: 'Utilisateurs',    value: stats.totalUsers, icon: Users,        color: 'text-purple-400' },
          { label: 'MRR estimé',      value: `${stats.mrr} €`, icon: DollarSign,   color: 'text-emerald-300' },
        ].map(s => (
          <div key={s.label} className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <s.icon className={`w-5 h-5 mb-3 ${s.color}`} />
            <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
            <p className="text-xs text-slate-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Alerte trials expirant bientôt */}
      {trialsExpirantBientot.length > 0 && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-5">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4 text-amber-400" />
            <h2 className="font-semibold text-amber-400">
              {trialsExpirantBientot.length} trial{trialsExpirantBientot.length > 1 ? 's' : ''} expirant dans moins de 7 jours
            </h2>
          </div>
          <div className="space-y-2">
            {trialsExpirantBientot.map(e => (
              <div key={e.id} className="flex items-center justify-between text-sm">
                <span className="text-white">{e.nom}</span>
                <div className="flex items-center gap-3">
                  <span className="text-amber-400 text-xs">
                    Expire le {new Date(e.trial_expires_at!).toLocaleDateString('fr-FR')}
                  </span>
                  <Link href={`/admin/clients/${e.id}`} className="text-xs text-amber-400 hover:underline">
                    Gérer →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Derniers inscrits */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <h2 className="font-semibold">Derniers clients inscrits</h2>
          <Link href="/admin/clients" className="text-xs text-amber-400 hover:underline flex items-center gap-1">
            Voir tous <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-800 text-xs text-slate-500">
              <th className="text-left px-6 py-3">Entreprise</th>
              <th className="text-left px-6 py-3">Plan</th>
              <th className="text-left px-6 py-3">Statut</th>
              <th className="text-left px-6 py-3">Inscrit le</th>
              <th className="px-6 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {recents.map(e => {
              const trialExpire = e.trial_expires_at && new Date(e.trial_expires_at) < now
              return (
                <tr key={e.id} className="hover:bg-slate-800/50 transition-colors">
                  <td className="px-6 py-3 font-medium text-white">{e.nom}</td>
                  <td className="px-6 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full border capitalize ${planColors[e.plan] || planColors.trial}`}>
                      {e.plan}
                    </span>
                  </td>
                  <td className="px-6 py-3">
                    {e.plan_actif ? (
                      <span className="text-xs text-emerald-400">Actif</span>
                    ) : trialExpire ? (
                      <span className="text-xs text-red-400">Trial expiré</span>
                    ) : (
                      <span className="text-xs text-amber-400">Trial</span>
                    )}
                  </td>
                  <td className="px-6 py-3 text-slate-400">
                    {new Date(e.created_at).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-6 py-3 text-right">
                    <Link href={`/admin/clients/${e.id}`} className="text-xs text-amber-400 hover:underline">
                      Gérer →
                    </Link>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
