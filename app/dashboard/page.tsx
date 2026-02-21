import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@/lib/supabase/admin'
import { getUtilisateur } from '@/lib/supabase/getUtilisateur'
import { headers } from 'next/headers'
import {
  Shield, TrendingUp, FileText, AlertTriangle,
  CheckCircle, Clock, Plus, ArrowRight, Users,
  AlertCircle, ClipboardList, FileSignature, Sparkles,
  Zap, BarChart2, TrendingDown, Lightbulb
} from 'lucide-react'

// Jauge de score (inline server-renderable SVG)
function ScoreGaugeSVG({ score }: { score: number }) {
  const color = score >= 70 ? '#22c55e' : score >= 50 ? '#f59e0b' : '#ef4444'
  const label =
    score >= 85 ? 'Excellent' :
    score >= 70 ? 'Bon' :
    score >= 50 ? 'Partiel' :
    score >= 25 ? 'Insuffisant' : 'Critique'
  const circumference = 2 * Math.PI * 54
  const offset = circumference - (score / 100) * circumference

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-36 h-36">
        <svg className="w-36 h-36 -rotate-90" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="54" fill="none" stroke="#e2e8f0" className="dark:stroke-slate-700" strokeWidth="12" />
          <circle
            cx="60" cy="60" r="54" fill="none"
            stroke={color} strokeWidth="12"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-1000"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-slate-900 dark:text-slate-100">{score}</span>
          <span className="text-xs text-slate-500 dark:text-slate-400">/100</span>
        </div>
      </div>
      <div className="mt-2 px-3 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: color + '20', color }}>
        {label}
      </div>
    </div>
  )
}

// Mini module gauge
function ModuleGauge({ value, href, label, icon: Icon }: { value: number; href: string; label: string; icon: any }) {
  const v = value ?? 50
  const color = v >= 70 ? '#22c55e' : v >= 50 ? '#f59e0b' : '#ef4444'
  const badge = v >= 70 ? 'Bon' : v >= 50 ? 'Partiel' : 'Critique'
  const circumf = 2 * Math.PI * 20

  return (
    <Link href={href} className="flex flex-col items-center gap-2 p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:shadow-md hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-200 group card-hover">
      <div className="relative w-14 h-14">
        <svg className="w-14 h-14 -rotate-90" viewBox="0 0 48 48">
          <circle cx="24" cy="24" r="20" fill="none" stroke="#e2e8f0" className="dark:stroke-slate-700" strokeWidth="5" />
          <circle cx="24" cy="24" r="20" fill="none"
            stroke={color} strokeWidth="5"
            strokeDasharray={circumf}
            strokeDashoffset={circumf * (1 - v / 100)}
            strokeLinecap="round" />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{v}</span>
        </div>
      </div>
      <div className="text-center">
        <div className="flex items-center justify-center gap-1 mb-1">
          <Icon className="w-3 h-3 text-slate-400" />
          <span className="text-xs font-medium text-slate-600 dark:text-slate-300 group-hover:text-slate-800 dark:group-hover:text-white leading-tight">{label}</span>
        </div>
        <span className="text-xs px-1.5 py-0.5 rounded-full font-medium" style={{ backgroundColor: color + '20', color }}>
          {badge}
        </span>
      </div>
    </Link>
  )
}

const RISQUE_COLORS: Record<string, string> = {
  inacceptable: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  eleve: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  limite: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
  faible: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  non_classe: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
}

const RISQUE_LABELS: Record<string, string> = {
  inacceptable: 'Inacceptable', eleve: 'Élevé',
  limite: 'Limité', faible: 'Faible', non_classe: 'Non classé',
}

// Map recommendation titre to module href
function getModuleHref(rec: any): string {
  const titre = (rec.titre || '').toLowerCase()
  if (titre.includes('facture') || titre.includes('impay')) return '/dashboard/impayes'
  if (titre.includes('obligation') || titre.includes('rgpd') || titre.includes('dpia')) return '/dashboard/obligations'
  if (titre.includes('contrat')) return '/dashboard/contrats'
  if (titre.includes('financ') || titre.includes('trésor')) return '/dashboard/financier'
  return '/dashboard/score'
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const utilisateur = await getUtilisateur(user.id)
  if (!utilisateur) return null

  // Admin client pour toutes les queries data (bypass RLS — sécurité maintenue par entreprise_id)
  const admin = createAdminClient()

  // Déclencher les alertes auto (fire-and-forget, non bloquant)
  // Vérifie via alertes_envoyees si déjà envoyé ce mois → 0 doublon
  const reqHeaders = await headers()
  const cookieHeader = reqHeaders.get('cookie') || ''
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  fetch(`${baseUrl}/api/alertes/auto`, {
    method: 'POST',
    headers: { 'Cookie': cookieHeader },
  }).catch(() => { /* silencieux */ })

  const [
    journauxRes, scoreRes, rapportsRes, membresRes, scoreGlobalRes,
    obligationsRes, impayesRes, contratsRes, scoresHistRes,
  ] = await Promise.all([
    admin.from('journaux_usage_ia')
      .select('id, niveau_risque, statut, created_at')
      .eq('entreprise_id', utilisateur.entreprise_id),
    admin.from('scores_conformite')
      .select('*')
      .eq('entreprise_id', utilisateur.entreprise_id)
      .order('calcule_a', { ascending: false })
      .limit(1)
      .maybeSingle(),
    admin.from('rapports')
      .select('id')
      .eq('entreprise_id', utilisateur.entreprise_id),
    admin.from('utilisateurs')
      .select('id')
      .eq('entreprise_id', utilisateur.entreprise_id)
      .eq('actif', true),
    admin.from('scores_globaux')
      .select('*')
      .eq('entreprise_id', utilisateur.entreprise_id)
      .order('calcule_a', { ascending: false })
      .limit(2),
    // Urgences
    admin.from('obligations')
      .select('id')
      .eq('entreprise_id', utilisateur.entreprise_id)
      .eq('statut', 'en_retard'),
    admin.from('factures')
      .select('id')
      .eq('entreprise_id', utilisateur.entreprise_id)
      .in('statut', ['en_retard', 'contentieux']),
    admin.from('analyses_contrats')
      .select('id')
      .eq('entreprise_id', utilisateur.entreprise_id)
      .eq('niveau_risque', 'critique'),
    // Scores for delta
    admin.from('scores_conformite')
      .select('score_global, calcule_a')
      .eq('entreprise_id', utilisateur.entreprise_id)
      .order('calcule_a', { ascending: false })
      .limit(2),
  ])

  const journaux = journauxRes.data || []
  const score = scoreRes.data
  const scoreGlobal = score?.score_global ?? 0
  const recommandations = (score?.recommandations as any[]) ?? []
  const scoresGlobauxList = scoreGlobalRes.data || []
  const scoreGlobalData = scoresGlobauxList[0] || null

  // Delta score vs mois précédent
  const scoresHist = scoresHistRes.data || []
  const scoreCurrent = scoresHist[0]?.score_global ?? null
  const scorePrevious = scoresHist[1]?.score_global ?? null
  const scoreDelta = scoreCurrent !== null && scorePrevious !== null ? scoreCurrent - scorePrevious : null

  // Priorité de la semaine = recommandation #1
  const priorityRec = recommandations[0] ?? null

  const urgences = {
    obligations: obligationsRes.data?.length ?? 0,
    impayes: impayesRes.data?.length ?? 0,
    contrats: contratsRes.data?.length ?? 0,
  }
  const totalUrgences = urgences.obligations + urgences.impayes + urgences.contrats

  const stats = {
    total: journaux.length,
    risqueEleve: journaux.filter(j => j.niveau_risque === 'eleve').length,
    nonClasses: journaux.filter(j => j.niveau_risque === 'non_classe').length,
    aRevoir: journaux.filter(j => j.statut === 'a_revoir').length,
    rapports: rapportsRes.data?.length ?? 0,
    membres: membresRes.data?.length ?? 1,
  }

  const { data: derniersJournaux } = await admin
    .from('journaux_usage_ia')
    .select('id, titre, outil_ia, niveau_risque, created_at')
    .eq('entreprise_id', utilisateur.entreprise_id)
    .order('created_at', { ascending: false })
    .limit(5)

  const isTrialExpiringSoon = utilisateur.entreprise?.trial_expires_at
    && new Date(utilisateur.entreprise.trial_expires_at) < new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)

  const synthese =
    scoreGlobal >= 85 ? 'Votre entreprise est en excellente posture de conformité.' :
    scoreGlobal >= 70 ? 'Bonne conformité globale — quelques axes à améliorer.' :
    scoreGlobal >= 50 ? 'Conformité partielle — des actions prioritaires sont recommandées.' :
    'Niveau critique — agissez rapidement sur vos risques prioritaires.'

  // Empty state: no journals, no obligations, no factures
  const isEmpty = journaux.length === 0 && obligationsRes.data?.length === 0 && impayesRes.data?.length === 0

  return (
    <div className="max-w-7xl mx-auto space-y-6 page-enter">
      {/* Header */}
      <div className="flex items-center justify-between animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Bonjour, {utilisateur.prenom} 👋
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
            Tableau de bord conformité — {utilisateur.entreprise?.nom}
          </p>
        </div>
        <Link
          href="/dashboard/journaux/nouveau"
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-150 btn-press hover:shadow-md hover:shadow-blue-500/25"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Déclarer un usage IA</span>
          <span className="sm:hidden">Déclarer</span>
        </Link>
      </div>

      {/* Alerte trial */}
      {isTrialExpiringSoon && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">Votre essai expire bientôt</p>
              <p className="text-xs text-amber-600 dark:text-amber-400">Passez à un plan payant pour ne pas perdre vos données</p>
            </div>
          </div>
          <Link href="/dashboard/parametres/abonnement"
            className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors flex-shrink-0">
            Choisir un plan
          </Link>
        </div>
      )}

      {/* Bannière priorité de la semaine */}
      {priorityRec && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-300 dark:border-amber-700 rounded-xl px-5 py-4 flex items-center justify-between gap-4 animate-fade-in">
          <div className="flex items-center gap-3 min-w-0">
            <Lightbulb className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wide mb-0.5">Priorité de la semaine</p>
              <p className="text-sm font-semibold text-amber-900 dark:text-amber-200 truncate">{priorityRec.titre}</p>
              {priorityRec.description && (
                <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5 line-clamp-1">{priorityRec.description}</p>
              )}
            </div>
          </div>
          <Link
            href={getModuleHref(priorityRec)}
            className="flex-shrink-0 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors flex items-center gap-1.5"
          >
            Traiter <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      )}

      {/* Empty state guidé */}
      {isEmpty ? (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 p-12 text-center animate-fade-in">
          <Shield className="w-12 h-12 text-blue-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">Bienvenue sur Sentinel !</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mb-8 max-w-md mx-auto">
            Commencez par ces 3 étapes pour obtenir votre score de conformité et une analyse complète de votre entreprise.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
            {[
              {
                step: 1,
                label: 'Déclarer un usage IA',
                desc: 'Enregistrez les outils IA utilisés dans votre entreprise',
                href: '/dashboard/journaux/nouveau',
                color: 'blue',
              },
              {
                step: 2,
                label: 'Ajouter une obligation',
                desc: 'Suivez vos obligations RGPD, fiscales et réglementaires',
                href: '/dashboard/obligations/nouveau',
                color: 'purple',
              },
              {
                step: 3,
                label: 'Calculer mon score',
                desc: 'Obtenez votre diagnostic de conformité personnalisé',
                href: '/dashboard/score',
                color: 'green',
              },
            ].map(({ step, label, desc, href, color }) => {
              const colorCls: Record<string, string> = {
                blue: 'border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300',
                purple: 'border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300',
                green: 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300',
              }
              return (
                <Link key={step} href={href}
                  className={`rounded-xl border-2 p-5 text-left transition-all duration-200 hover:scale-[1.02] hover:shadow-md ${colorCls[color]}`}>
                  <div className="w-8 h-8 rounded-full bg-white/60 dark:bg-slate-800/60 flex items-center justify-center text-sm font-bold mb-3 border border-current">
                    {step}
                  </div>
                  <p className="text-sm font-semibold mb-1">{label}</p>
                  <p className="text-xs opacity-75 leading-relaxed">{desc}</p>
                  <ArrowRight className="w-4 h-4 mt-3 opacity-60" />
                </Link>
              )
            })}
          </div>
        </div>
      ) : (
        <>
          {/* SECTION 1 — Hero Score Global */}
          <div className="bg-gradient-to-br from-white to-blue-50/30 dark:from-slate-800 dark:to-slate-800/50 rounded-2xl border-2 border-blue-200 dark:border-blue-800 shadow-xl shadow-blue-500/10 p-8 animate-slide-up delay-75">
            <div className="flex flex-col sm:flex-row items-center gap-8">
              <ScoreGaugeSVG score={scoreGlobal} />
              <div className="flex-1 text-center sm:text-left space-y-3">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 flex-wrap">
                    <Shield className="w-6 h-6 text-blue-500" />
                    Score de santé globale
                    {/* Delta score vs mois précédent */}
                    {scoreDelta !== null && (
                      <span className={`flex items-center gap-1 text-base font-bold px-2.5 py-1 rounded-full ${
                        scoreDelta > 0
                          ? 'text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-900/30'
                          : scoreDelta < 0
                          ? 'text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900/30'
                          : 'text-slate-500 bg-slate-100 dark:bg-slate-700'
                      }`}>
                        {scoreDelta > 0 ? (
                          <TrendingUp className="w-4 h-4" />
                        ) : scoreDelta < 0 ? (
                          <TrendingDown className="w-4 h-4" />
                        ) : null}
                        {scoreDelta > 0 ? '+' : ''}{scoreDelta} pts
                      </span>
                    )}
                  </h2>
                  <p className="text-sm text-slate-600 dark:text-slate-300 mt-2 font-medium">{synthese}</p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
                  <div className="bg-white/60 dark:bg-slate-800/60 rounded-xl p-4 border border-slate-200 dark:border-slate-700 text-center">
                    <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">{stats.total}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">Usages IA</p>
                  </div>
                  <div className="bg-white/60 dark:bg-slate-800/60 rounded-xl p-4 border border-slate-200 dark:border-slate-700 text-center">
                    <p className={`text-3xl font-bold ${stats.risqueEleve > 0 ? 'text-orange-600 dark:text-orange-400' : 'text-green-600 dark:text-green-400'}`}>{stats.risqueEleve}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">Risques élevés</p>
                  </div>
                  <div className="bg-white/60 dark:bg-slate-800/60 rounded-xl p-4 border border-slate-200 dark:border-slate-700 text-center">
                    <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">{stats.membres}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">Membres</p>
                  </div>
                  <div className="bg-white/60 dark:bg-slate-800/60 rounded-xl p-4 border border-slate-200 dark:border-slate-700 text-center">
                    <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">{stats.rapports}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">Rapports</p>
                  </div>
                </div>
                <Link href="/dashboard/score"
                  className="mt-4 inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium">
                  Voir le score détaillé <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          </div>

          {/* SECTION 2 — Urgences */}
          {totalUrgences > 0 && (
            <div className="animate-slide-up delay-150">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Actions urgentes ({totalUrgences})</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {urgences.obligations > 0 && (
                  <Link href="/dashboard/obligations"
                    className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 card-hover">
                    <div className="flex items-center gap-2 mb-1">
                      <ClipboardList className="w-5 h-5 text-red-600 dark:text-red-400" />
                      <span className="text-2xl font-bold text-red-700 dark:text-red-300">{urgences.obligations}</span>
                    </div>
                    <p className="text-sm font-medium text-red-700 dark:text-red-300">Obligation{urgences.obligations > 1 ? 's' : ''} en retard</p>
                    <p className="text-xs text-red-500 dark:text-red-400 mt-0.5 flex items-center gap-1">
                      Voir les obligations <ArrowRight className="w-3 h-3" />
                    </p>
                  </Link>
                )}
                {urgences.impayes > 0 && (
                  <Link href="/dashboard/impayes"
                    className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl p-4 card-hover">
                    <div className="flex items-center gap-2 mb-1">
                      <AlertCircle className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                      <span className="text-2xl font-bold text-orange-700 dark:text-orange-300">{urgences.impayes}</span>
                    </div>
                    <p className="text-sm font-medium text-orange-700 dark:text-orange-300">Facture{urgences.impayes > 1 ? 's' : ''} impayée{urgences.impayes > 1 ? 's' : ''}</p>
                    <p className="text-xs text-orange-500 dark:text-orange-400 mt-0.5 flex items-center gap-1">
                      Voir les impayés <ArrowRight className="w-3 h-3" />
                    </p>
                  </Link>
                )}
                {urgences.contrats > 0 && (
                  <Link href="/dashboard/contrats"
                    className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4 card-hover">
                    <div className="flex items-center gap-2 mb-1">
                      <FileSignature className="w-5 h-5 text-yellow-700 dark:text-yellow-400" />
                      <span className="text-2xl font-bold text-yellow-800 dark:text-yellow-300">{urgences.contrats}</span>
                    </div>
                    <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300">Contrat{urgences.contrats > 1 ? 's' : ''} critique{urgences.contrats > 1 ? 's' : ''}</p>
                    <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-0.5 flex items-center gap-1">
                      Voir les contrats <ArrowRight className="w-3 h-3" />
                    </p>
                  </Link>
                )}
              </div>
            </div>
          )}

          {/* SECTION 3 — Grille scores modules */}
          {scoreGlobalData && (
            <div className="animate-slide-up delay-200">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <BarChart2 className="w-5 h-5 text-blue-500" />
                    Scores par module
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Vue d'ensemble de votre santé opérationnelle</p>
                </div>
                <Link href="/dashboard/score" className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold flex items-center gap-1 hover:gap-2 transition-all">
                  Score détaillé <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                <ModuleGauge label="Conformité IA" value={scoreGlobalData.score_conformite_ia ?? 50} href="/dashboard/score" icon={Shield} />
                <ModuleGauge label="Impayés" value={scoreGlobalData.score_impayes ?? 50} href="/dashboard/impayes" icon={AlertCircle} />
                <ModuleGauge label="Obligations" value={scoreGlobalData.score_obligations ?? 50} href="/dashboard/obligations" icon={ClipboardList} />
                <ModuleGauge label="Financier" value={scoreGlobalData.score_financier ?? 50} href="/dashboard/financier" icon={TrendingUp} />
                <ModuleGauge label="Contrats" value={scoreGlobalData.score_contractuel ?? 50} href="/dashboard/contrats" icon={FileSignature} />
              </div>
            </div>
          )}

          {/* SECTION 4 — Quick Actions */}
          <div className="animate-slide-up delay-300">
            <div className="mb-4">
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 mb-1">
                <Zap className="w-5 h-5 text-amber-500" />
                Actions rapides
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Accès direct aux fonctionnalités principales</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: 'Déclarer un usage IA', href: '/dashboard/journaux/nouveau', icon: FileText, color: 'blue' },
                { label: 'Ajouter obligation', href: '/dashboard/obligations/nouveau', icon: ClipboardList, color: 'purple' },
                { label: 'Analyser contrat', href: '/dashboard/contrats/nouveau', icon: FileSignature, color: 'green' },
                { label: 'Copilote IA', href: '/dashboard/copilot', icon: Sparkles, color: 'amber' },
              ].map(({ label, href, icon: Icon, color }) => {
                const colors: Record<string, string> = {
                  blue: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-700 dark:text-blue-300',
                  purple: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800 hover:bg-purple-100 dark:hover:bg-purple-900/30 text-purple-700 dark:text-purple-300',
                  green: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 hover:bg-green-100 dark:hover:bg-green-900/30 text-green-700 dark:text-green-300',
                  amber: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-900/30 text-amber-700 dark:text-amber-300',
                }
                return (
                  <Link key={href} href={href}
                    className={`group flex flex-col items-start gap-3 p-5 rounded-xl border-2 transition-all duration-200 btn-press hover:scale-[1.02] hover:shadow-lg ${colors[color]}`}>
                    <div className="flex items-center gap-3 w-full">
                      <div className="p-2 rounded-lg bg-white/50 dark:bg-slate-800/50 group-hover:scale-110 transition-transform">
                        <Icon className="w-5 h-5 flex-shrink-0" />
                      </div>
                      <span className="text-sm font-semibold leading-tight flex-1">{label}</span>
                    </div>
                    <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                  </Link>
                )
              })}
            </div>
          </div>

          {/* SECTION 5 — Activité récente + Recommandations */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Derniers journaux */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-700">
                <h2 className="font-semibold text-slate-900 dark:text-slate-100">Derniers usages déclarés</h2>
                <Link href="/dashboard/journaux" className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium">
                  Voir tout →
                </Link>
              </div>
              <div className="divide-y divide-slate-50 dark:divide-slate-700">
                {derniersJournaux && derniersJournaux.length > 0 ? (
                  derniersJournaux.map(j => (
                    <Link key={j.id} href={`/dashboard/journaux/${j.id}`}
                      className="flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">{j.titre}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{j.outil_ia}</p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium flex-shrink-0 ${RISQUE_COLORS[j.niveau_risque]}`}>
                        {RISQUE_LABELS[j.niveau_risque]}
                      </span>
                    </Link>
                  ))
                ) : (
                  <div className="px-5 py-10 text-center">
                    <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm text-slate-500 dark:text-slate-400">Aucun usage déclaré</p>
                    <Link href="/dashboard/journaux/nouveau"
                      className="text-xs text-blue-600 dark:text-blue-400 hover:underline mt-1 inline-block font-medium">
                      Déclarer votre premier usage IA
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* Recommandations */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-700">
                <h2 className="font-semibold text-slate-900 dark:text-slate-100">Plan d'action prioritaire</h2>
                <Link href="/dashboard/score" className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium">
                  Score détaillé →
                </Link>
              </div>
              <div className="divide-y divide-slate-50 dark:divide-slate-700">
                {recommandations.length > 0 ? (
                  recommandations.slice(0, 5).map((rec: any, i: number) => {
                    const priorityColors: Record<string, string> = {
                      urgente: 'bg-red-500',
                      haute: 'bg-orange-400',
                      normale: 'bg-blue-400',
                      info: 'bg-slate-300',
                    }
                    return (
                      <div key={i} className="flex gap-3 px-5 py-3.5">
                        <div className={`w-1.5 rounded-full flex-shrink-0 mt-1 self-stretch ${priorityColors[rec.priorite]}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{rec.titre}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{rec.description}</p>
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <div className="px-5 py-10 text-center">
                    <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Aucune action urgente</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Continuez à maintenir votre conformité</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
