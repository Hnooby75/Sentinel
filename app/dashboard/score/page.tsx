import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getUtilisateur } from '@/lib/supabase/getUtilisateur'
import { ArrowRight, RefreshCw, CheckCircle, AlertTriangle, XCircle, Info, Sparkles, Package, TrendingUp } from 'lucide-react'

function ScoreBar({ label, score, poids }: { label: string; score: number; poids: number }) {
  const color = score >= 70 ? '#22c55e' : score >= 50 ? '#f59e0b' : '#ef4444'
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">{label}</span>
          <span className="text-xs text-slate-400 ml-2">Poids : {poids}%</span>
        </div>
        <span className="text-sm font-bold" style={{ color }}>{score}/100</span>
      </div>
      <div className="h-2.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${score}%`, backgroundColor: color }}
        />
      </div>
    </div>
  )
}

function getImpactPts(priorite: string): number {
  if (priorite === 'urgente') return 15
  if (priorite === 'haute') return 10
  return 5
}

function RecommandationCard({ rec, index }: { rec: any; index: number }) {
  const styles: Record<string, { border: string; icon: any; iconColor: string; badge: string }> = {
    urgente: { border: 'border-l-red-500', icon: XCircle, iconColor: 'text-red-500', badge: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' },
    haute: { border: 'border-l-orange-400', icon: AlertTriangle, iconColor: 'text-orange-500', badge: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300' },
    normale: { border: 'border-l-blue-400', icon: Info, iconColor: 'text-blue-500', badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
    info: { border: 'border-l-slate-300', icon: CheckCircle, iconColor: 'text-slate-400', badge: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400' },
  }
  const style = styles[rec.priorite] || styles.info
  const Icon = style.icon
  const impact = getImpactPts(rec.priorite)

  return (
    <div className={`bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 border-l-4 ${style.border} rounded-r-xl px-5 py-4`}>
      <div className="flex items-start gap-3">
        <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${style.iconColor}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">{rec.titre}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${style.badge}`}>
              {rec.priorite.charAt(0).toUpperCase() + rec.priorite.slice(1)}
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
              +{impact} pts estimés
            </span>
            {rec.impact_score && (
              <span className="text-xs text-slate-400">+{rec.impact_score} pts potentiels</span>
            )}
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400">{rec.description}</p>
          {rec.action && (
            <Link href="/dashboard/journaux"
              className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium mt-2">
              {rec.action} <ArrowRight className="w-3 h-3" />
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}

// Historique graphe SVG inline (barres)
function HistoriqueGraphe({ data }: { data: { score_global: number; calcule_a: string }[] }) {
  if (!data || data.length === 0) return null

  // On prend les 6 derniers, du plus ancien au plus récent
  const items = [...data].reverse().slice(-6)
  const maxScore = 100
  const barWidth = 32
  const barGap = 12
  const chartHeight = 80
  const totalWidth = items.length * (barWidth + barGap) - barGap

  return (
    <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-700">
      <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">Historique des scores</h3>
      <div className="overflow-x-auto">
        <svg width={totalWidth} height={chartHeight + 28} className="min-w-full">
          {items.map((item, i) => {
            const x = i * (barWidth + barGap)
            const barH = Math.round((item.score_global / maxScore) * chartHeight)
            const barY = chartHeight - barH
            const color = item.score_global >= 70 ? '#22c55e' : item.score_global >= 50 ? '#f59e0b' : '#ef4444'
            const dateLabel = new Date(item.calcule_a).toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' })
            return (
              <g key={i}>
                {/* Background bar */}
                <rect x={x} y={0} width={barWidth} height={chartHeight} rx={4}
                  fill="currentColor" className="text-slate-100 dark:text-slate-700" />
                {/* Score bar */}
                <rect x={x} y={barY} width={barWidth} height={barH} rx={4}
                  fill={color} opacity={0.85} />
                {/* Score label */}
                <text x={x + barWidth / 2} y={barY - 4}
                  textAnchor="middle" fontSize="10" fontWeight="600"
                  fill={color}>
                  {item.score_global}
                </text>
                {/* Date label */}
                <text x={x + barWidth / 2} y={chartHeight + 16}
                  textAnchor="middle" fontSize="9"
                  fill="currentColor" className="text-slate-400 dark:text-slate-500">
                  {dateLabel}
                </text>
              </g>
            )
          })}
        </svg>
      </div>
    </div>
  )
}

export default async function ScorePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const utilisateur = await getUtilisateur(user.id)
  if (!utilisateur) return null

  const adminClient = createAdminClient()

  const [scoreRes, historiqueRes] = await Promise.all([
    adminClient
      .from('scores_conformite')
      .select('*')
      .eq('entreprise_id', utilisateur.entreprise_id)
      .order('calcule_a', { ascending: false })
      .limit(1)
      .maybeSingle(),
    adminClient
      .from('scores_conformite')
      .select('score_global, calcule_a')
      .eq('entreprise_id', utilisateur.entreprise_id)
      .order('calcule_a', { ascending: false })
      .limit(6),
  ])

  const score = scoreRes.data
  const historique = historiqueRes.data || []
  const recommandations = (score?.recommandations as any[]) || []

  // Progress banner: score actuel > score précédent
  const scoreCurrent = historique[0]?.score_global ?? null
  const scorePrevious = historique[1]?.score_global ?? null
  const progression = scoreCurrent !== null && scorePrevious !== null ? scoreCurrent - scorePrevious : null

  const NIVEAU_CONFIG = {
    excellent: { label: 'Excellent', color: '#22c55e', desc: 'Votre organisation est un exemple de conformité AI Act' },
    bon: { label: 'Bon', color: '#84cc16', desc: 'Bonne maîtrise globale, quelques points à améliorer' },
    partiel: { label: 'Partiel', color: '#f59e0b', desc: 'Des progrès notables mais des lacunes importantes subsistent' },
    insuffisant: { label: 'Insuffisant', color: '#f97316', desc: 'Risque significatif en cas de contrôle réglementaire' },
    critique: { label: 'Critique', color: '#ef4444', desc: 'Action immédiate requise — exposition réglementaire élevée' },
  }

  const niveau = score?.niveau_conformite as keyof typeof NIVEAU_CONFIG || 'critique'
  const niveauConfig = NIVEAU_CONFIG[niveau]

  return (
    <div className="max-w-4xl mx-auto space-y-6 page-enter">
      {/* Header */}
      <div className="flex items-center justify-between animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Score de conformité</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
            Dernière évaluation : {score ? new Date(score.calcule_a).toLocaleDateString('fr-FR', {
              day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
            }) : 'Jamais calculé'}
          </p>
        </div>
        <form action="/api/score" method="POST">
          <button
            type="submit"
            className="flex items-center gap-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 btn-press hover:shadow-sm"
          >
            <RefreshCw className="w-4 h-4" />
            Recalculer
          </button>
        </form>
      </div>

      {/* Progress banner */}
      {progression !== null && progression > 0 && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl px-5 py-3 flex items-center gap-3 animate-fade-in">
          <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
          <p className="text-sm font-semibold text-green-800 dark:text-green-200">
            ↑ +{progression} pts ce mois — continuez ainsi !
          </p>
        </div>
      )}

      {/* Score principal */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-8">
        <div className="flex flex-col md:flex-row items-center gap-8">
          {/* Jauge */}
          <div className="flex flex-col items-center flex-shrink-0">
            <div className="relative w-40 h-40">
              <svg className="w-40 h-40 -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="50" fill="none" stroke="#e2e8f0" className="dark:stroke-slate-700" strokeWidth="14" />
                <circle
                  cx="60" cy="60" r="50" fill="none"
                  stroke={niveauConfig.color} strokeWidth="14"
                  strokeDasharray={2 * Math.PI * 50}
                  strokeDashoffset={2 * Math.PI * 50 - ((score?.score_global ?? 0) / 100) * 2 * Math.PI * 50}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-black text-slate-900 dark:text-slate-100">{score?.score_global ?? 0}</span>
                <span className="text-sm text-slate-400">/100</span>
              </div>
            </div>
            <div className="mt-3 px-4 py-1.5 rounded-full text-sm font-bold"
              style={{ backgroundColor: niveauConfig.color + '20', color: niveauConfig.color }}>
              {niveauConfig.label}
            </div>
          </div>

          {/* Sous-scores */}
          <div className="flex-1 w-full space-y-4">
            <ScoreBar label="Documentation" score={score?.score_documentation ?? 0} poids={30} />
            <ScoreBar label="Classification des risques" score={score?.score_classification ?? 0} poids={30} />
            <ScoreBar label="Mesures de mitigation" score={score?.score_mitigation ?? 0} poids={25} />
            <ScoreBar label="Gouvernance" score={score?.score_gouvernance ?? 0} poids={15} />
          </div>
        </div>

        {/* Description niveau */}
        <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-700 flex items-start gap-3">
          <Info className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-slate-600 dark:text-slate-400">{niveauConfig.desc}</p>
        </div>

        {/* Historique graphe SVG */}
        {historique.length >= 2 && <HistoriqueGraphe data={historique} />}
      </div>

      {/* Recommandations avec impact estimé */}
      {recommandations.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            Plan d'action ({recommandations.length} recommandation{recommandations.length > 1 ? 's' : ''})
          </h2>
          {recommandations.map((rec: any, i: number) => (
            <RecommandationCard key={i} rec={rec} index={i} />
          ))}
        </div>
      )}

      {/* Score parfait */}
      {(!score || score.score_global === 0) && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 py-12 text-center">
          <p className="text-slate-500 dark:text-slate-400 text-sm mb-4">
            Déclarez des usages IA pour obtenir votre score de conformité
          </p>
          <Link href="/dashboard/journaux/nouveau"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors">
            Déclarer un premier usage
          </Link>
        </div>
      )}

      {/* Raccourcis IA */}
      {score && score.score_global > 0 && (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-xl p-5 flex items-center justify-between">
            <div>
              <h3 className="font-bold">Prêt pour un audit ?</h3>
              <p className="text-blue-200 text-xs mt-1">
                Générez votre rapport de conformité AI Act officiel
              </p>
            </div>
            <Link href="/dashboard/rapports/generer"
              className="flex items-center gap-2 bg-white text-blue-700 px-3 py-2 rounded-lg text-xs font-semibold hover:bg-blue-50 transition-colors flex-shrink-0">
              <Package className="w-4 h-4" />
              Générer
            </Link>
          </div>
          <div className="bg-gradient-to-br from-purple-600 to-purple-700 text-white rounded-xl p-5 flex items-center justify-between">
            <div>
              <h3 className="font-bold">Classifier avec l'IA</h3>
              <p className="text-purple-200 text-xs mt-1">
                Analysez et classez vos systèmes selon l'AI Act
              </p>
            </div>
            <Link href="/dashboard/journaux/smart"
              className="flex items-center gap-2 bg-white text-purple-700 px-3 py-2 rounded-lg text-xs font-semibold hover:bg-purple-50 transition-colors flex-shrink-0">
              <Sparkles className="w-4 h-4" />
              Lancer
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
