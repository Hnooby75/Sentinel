// ============================================
// app/dashboard/cockpit/page.tsx
// Vue Dirigeant — tableau de bord exécutif
// ============================================
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getUtilisateur } from '@/lib/supabase/getUtilisateur'
import { createClient as createAdminClient } from '@/lib/supabase/admin'
import {
  TrendingUp, Users, Target, Workflow,
  AlertTriangle, Layers, RefreshCw, ArrowRight,
  CheckCircle, Clock, Zap
} from 'lucide-react'

function formatEur(n: number) {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency', currency: 'EUR', maximumFractionDigits: 0,
  }).format(n)
}

const SEVERITE_COLORS: Record<string, string> = {
  critical: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400',
  warning:  'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400',
  info:     'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400',
}

const MODULE_LABELS: Record<string, string> = {
  finance: 'Finance', rh: 'RH', crm: 'CRM', operations: 'Opérations',
}

export default async function CockpitPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const utilisateur = await getUtilisateur(user.id)
  if (!utilisateur) return null

  const db = createAdminClient()
  const eid = utilisateur.entreprise_id

  const [
    cashflowRes,
    hrRes,
    crmRes,
    tachesRes,
    alertesRes,
    stratRes,
  ] = await Promise.all([
    db.from('ai_cashflow_predictions').select('*').eq('entreprise_id', eid)
      .order('genere_a', { ascending: false }).limit(1).maybeSingle(),
    db.from('ai_hr_reports').select('*').eq('entreprise_id', eid)
      .order('genere_a', { ascending: false }).limit(1).maybeSingle(),
    db.from('ai_sales_predictions').select('*').eq('entreprise_id', eid)
      .order('genere_a', { ascending: false }).limit(1).maybeSingle(),
    db.from('taches').select('*').eq('entreprise_id', eid)
      .in('statut', ['a_faire', 'en_cours', 'bloquee'])
      .order('score_impact', { ascending: false, nullsFirst: false })
      .limit(5),
    db.from('ai_alerts').select('*').eq('entreprise_id', eid)
      .eq('resolu', false).order('created_at', { ascending: false }).limit(10),
    db.from('ai_strategy_reports').select('*').eq('entreprise_id', eid)
      .eq('type_rapport', 'quotidien').order('genere_a', { ascending: false }).limit(1).maybeSingle(),
  ])

  const cashflow   = cashflowRes.data
  const hr         = hrRes.data
  const crm        = crmRes.data
  const taches     = tachesRes.data || []
  const alertes    = alertesRes.data || []
  const strategie  = stratRes.data

  const alertesCritiques = alertes.filter(a => a.severite === 'critical')

  const prenom = (utilisateur as unknown as { prenom?: string }).prenom || 'Dirigeant'

  const scoreCards = [
    {
      label: 'Finance IA',
      href: '/dashboard/copilot-finance',
      icon: TrendingUp,
      color: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      value: cashflow ? (cashflow.niveau_risque === 'faible' ? '✅ Sain' : cashflow.niveau_risque === 'modere' ? '⚠️ Modéré' : '🔴 Risque') : '—',
      sub: cashflow?.prevision_30j != null ? `Prév. 30j : ${formatEur(Number(cashflow.prevision_30j))}` : 'Pas encore analysé',
    },
    {
      label: 'RH IA',
      href: '/dashboard/copilot-rh',
      icon: Users,
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-50 dark:bg-emerald-900/20',
      value: hr?.score_sante_rh != null ? `${hr.score_sante_rh}/100` : '—',
      sub: hr?.contrats_a_renouveler ? `${hr.contrats_a_renouveler} contrat(s) à renouveler` : 'Pas encore analysé',
    },
    {
      label: 'CRM & Ventes',
      href: '/dashboard/copilot-crm',
      icon: Target,
      color: 'text-purple-600 dark:text-purple-400',
      bg: 'bg-purple-50 dark:bg-purple-900/20',
      value: crm?.revenu_prevu_30j != null ? formatEur(Number(crm.revenu_prevu_30j)) : '—',
      sub: crm?.nb_deals_prevus != null ? `${crm.nb_deals_prevus} deal(s) prévus` : 'Pas encore analysé',
    },
    {
      label: 'Opérations',
      href: '/dashboard/copilot-operations',
      icon: Workflow,
      color: 'text-orange-600 dark:text-orange-400',
      bg: 'bg-orange-50 dark:bg-orange-900/20',
      value: strategie?.score_productivite != null ? `${strategie.score_productivite}/100` : '—',
      sub: strategie?.taches_bloquees != null ? `${strategie.taches_bloquees} tâche(s) bloquée(s)` : 'Pas encore analysé',
    },
  ]

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Bonjour {prenom} — Vue Dirigeant
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
            {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-slate-400" />
          <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">Cockpit</span>
        </div>
      </div>

      {/* Row 1 — Score cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {scoreCards.map(card => (
          <Link
            key={card.label}
            href={card.href}
            className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 hover:shadow-md transition-shadow group"
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`p-2 rounded-lg ${card.bg}`}>
                <card.icon className={`w-4 h-4 ${card.color}`} />
              </div>
              <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors" />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-1">{card.label}</p>
            <p className="text-xl font-bold text-slate-900 dark:text-slate-100">{card.value}</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{card.sub}</p>
          </Link>
        ))}
      </div>

      {/* Row 2 — Alertes critiques */}
      {alertesCritiques.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2 px-5 py-3 border-b border-slate-100 dark:border-slate-700">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            <h2 className="font-semibold text-slate-900 dark:text-slate-100">
              Alertes critiques ({alertesCritiques.length})
            </h2>
          </div>
          <div className="p-4 space-y-2">
            {alertesCritiques.map(alerte => (
              <div
                key={alerte.id}
                className={`flex items-start gap-3 p-3 rounded-lg border ${SEVERITE_COLORS[alerte.severite]}`}
              >
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold uppercase">
                      {MODULE_LABELS[alerte.module] || alerte.module}
                    </span>
                    <span className="text-sm font-medium">{alerte.titre}</span>
                  </div>
                  {alerte.description && (
                    <p className="text-xs mt-0.5 opacity-80">{alerte.description}</p>
                  )}
                </div>
                <span className="text-xs opacity-60 flex-shrink-0">
                  {new Date(alerte.created_at).toLocaleDateString('fr-FR')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Row 3 — Synthèse executive */}
      {strategie?.synthese_executive && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" />
              <h2 className="font-semibold text-slate-900 dark:text-slate-100">Synthèse executive IA</h2>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-400 dark:text-slate-500">
                <Clock className="w-3 h-3 inline mr-1" />
                {new Date(strategie.genere_a).toLocaleDateString('fr-FR', {
                  day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit',
                })}
              </span>
              <Link
                href="/dashboard/copilot-operations"
                className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 hover:underline"
              >
                <RefreshCw className="w-3 h-3" />
                Actualiser
              </Link>
            </div>
          </div>
          <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
            {strategie.synthese_executive}
          </p>
        </div>
      )}

      {/* Row 4 — Top 5 tâches prioritaires */}
      {taches.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 dark:border-slate-700">
            <h2 className="font-semibold text-slate-900 dark:text-slate-100">Top 5 tâches prioritaires</h2>
            <Link
              href="/dashboard/copilot-operations"
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
            >
              Voir tout <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y divide-slate-50 dark:divide-slate-700">
            {taches.map(t => (
              <div key={t.id} className="flex items-center gap-4 px-5 py-3">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                  t.statut === 'bloquee' ? 'bg-red-500' :
                  t.statut === 'en_cours' ? 'bg-blue-500' : 'bg-slate-300'
                }`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">{t.titre}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {t.module_origine && (
                      <span className="text-xs text-slate-400">{t.module_origine}</span>
                    )}
                    {t.echeance && (
                      <span className={`text-xs ${
                        new Date(t.echeance) < new Date()
                          ? 'text-red-500 font-medium'
                          : 'text-slate-400'
                      }`}>
                        {new Date(t.echeance).toLocaleDateString('fr-FR')}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {t.score_impact != null && (
                    <span className="text-xs text-slate-500 dark:text-slate-400">Impact: {t.score_impact}</span>
                  )}
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    t.statut === 'bloquee' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                    t.statut === 'en_cours' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                    'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                  }`}>
                    {t.statut.replace('_', ' ')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Row 5 — Navigation modules */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Finance IA', href: '/dashboard/copilot-finance', icon: TrendingUp, desc: 'Cashflow & prévisions' },
          { label: 'RH IA', href: '/dashboard/copilot-rh', icon: Users, desc: 'Équipe & conformité' },
          { label: 'CRM & Ventes', href: '/dashboard/copilot-crm', icon: Target, desc: 'Pipeline & leads' },
          { label: 'Opérations', href: '/dashboard/copilot-operations', icon: Workflow, desc: 'Tâches & stratégie' },
        ].map(item => (
          <Link
            key={item.href}
            href={item.href}
            className="bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-200 dark:border-slate-600 p-4 hover:bg-white dark:hover:bg-slate-700 hover:shadow-sm transition-all group"
          >
            <item.icon className="w-5 h-5 text-slate-400 group-hover:text-blue-500 mb-2 transition-colors" />
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{item.label}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{item.desc}</p>
            <div className="flex items-center gap-1 mt-3">
              <span className="text-xs text-blue-600 dark:text-blue-400">Ouvrir</span>
              <ArrowRight className="w-3 h-3 text-blue-600 dark:text-blue-400" />
            </div>
          </Link>
        ))}
      </div>

      {/* État vide si aucune analyse */}
      {!cashflow && !hr && !crm && !strategie && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6 text-center">
          <CheckCircle className="w-8 h-8 text-blue-500 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-blue-900 dark:text-blue-200 mb-1">
            Tableau de bord prêt
          </h3>
          <p className="text-sm text-blue-700 dark:text-blue-300 mb-4">
            Lancez votre première analyse IA pour remplir le cockpit avec vos données réelles.
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Link href="/dashboard/copilot-finance"
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-lg font-medium transition-colors">
              Analyser Finance
            </Link>
            <Link href="/dashboard/copilot-rh"
              className="bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-400 text-sm px-4 py-2 rounded-lg font-medium border border-blue-200 dark:border-blue-700 hover:bg-blue-50 transition-colors">
              Analyser RH
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
