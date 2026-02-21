// ============================================
// app/dashboard/financier/page.tsx
// Module 5 — Solidité financière : KPIs + graphiques SVG
// ============================================
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getUtilisateur } from '@/lib/supabase/getUtilisateur'
import { TrendingUp, TrendingDown, Minus, Plus, AlertTriangle } from 'lucide-react'
import { MiniLineChart } from '@/components/ui/MiniLineChart'
import { MiniBarChart } from '@/components/ui/MiniBarChart'
import { ScoreGauge } from '@/components/ui/ScoreGauge'

function formatEur(n: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)
}

function formatMois(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('fr-FR', { month: 'short' })
}

const NIVEAU_COLORS: Record<string, string> = {
  fragile: 'text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400',
  correct: 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 dark:text-yellow-400',
  solide: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400',
  excellent: 'text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400',
}

export default async function FinancierPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const utilisateur = await getUtilisateur(user.id)
  if (!utilisateur) return null

  const [{ data: flux }, { data: indicateur }] = await Promise.all([
    supabase
      .from('flux_financiers')
      .select('*')
      .eq('entreprise_id', utilisateur.entreprise_id)
      .order('mois', { ascending: false })
      .limit(12),
    supabase
      .from('indicateurs_financiers')
      .select('*')
      .eq('entreprise_id', utilisateur.entreprise_id)
      .order('calcule_a', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  const dernierFlux = flux?.[0]
  const hasData = (flux?.length ?? 0) > 0

  // Préparer les données graphiques (flux du plus ancien au plus récent)
  const fluxChrono = flux ? [...flux].reverse() : []

  // Données pour MiniLineChart — CA mensuel
  const caData = fluxChrono.map(f => ({
    label: formatMois(f.mois),
    value: Number(f.ca_mensuel),
  }))

  // Données pour MiniBarChart — CA vs Charges
  const chargesData = fluxChrono.map(f => ({
    label: formatMois(f.mois),
    value: Number(f.ca_mensuel),
    value2: Number(f.charges_fixes) + Number(f.charges_variables),
  }))

  // Runway arc SVG
  const runway = indicateur?.runway_mois ?? 0
  const runwayMax = 12
  const runwayColor = runway >= 6 ? '#22c55e' : runway >= 3 ? '#f59e0b' : '#ef4444'
  const runwayCirc = 2 * Math.PI * 40
  const runwayOffset = runwayCirc - (Math.min(runway, runwayMax) / runwayMax) * runwayCirc

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Solidité financière</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">Pilotez votre trésorerie en temps réel</p>
        </div>
        <Link
          href="/dashboard/financier/saisie"
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors"
        >
          <Plus className="w-4 h-4" />
          Saisir le mois
        </Link>
      </div>

      {!hasData ? (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 py-16 text-center">
          <TrendingUp className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-700 dark:text-slate-300">Aucune donnée financière</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 mb-5">
            Saisissez vos données mensuelles pour calculer votre score de solidité
          </p>
          <Link href="/dashboard/financier/saisie"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors">
            <Plus className="w-4 h-4" />
            Saisir mon premier mois
          </Link>
        </div>
      ) : (
        <>
          {/* KPIs redesignés */}
          {indicateur && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {/* Score solidité avec jauge */}
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 flex flex-col items-center">
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-2">Score solidité</p>
                <ScoreGauge score={indicateur.score_solidite ?? 50} size={80} />
                <div className={`text-xs px-2 py-0.5 rounded-full inline-block mt-2 font-medium capitalize ${NIVEAU_COLORS[indicateur.niveau || 'correct']}`}>
                  {indicateur.niveau}
                </div>
              </div>

              {/* Runway arc SVG */}
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 flex flex-col items-center">
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-2">Runway</p>
                <div className="relative w-20 h-20">
                  <svg className="w-20 h-20 -rotate-90" viewBox="0 0 96 96">
                    <circle cx="48" cy="48" r="40" fill="none" stroke="#e2e8f0" className="dark:stroke-slate-700" strokeWidth="8" />
                    <circle
                      cx="48" cy="48" r="40" fill="none"
                      stroke={runwayColor} strokeWidth="8"
                      strokeDasharray={runwayCirc}
                      strokeDashoffset={runwayOffset}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-lg font-bold text-slate-900 dark:text-slate-100">
                      {runway > 0 ? runway : '—'}
                    </span>
                    <span className="text-xs text-slate-400">mois</span>
                  </div>
                </div>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">de trésorerie</p>
              </div>

              {/* Ratio charges */}
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-2">Ratio charges</p>
                <div className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                  {indicateur.ratio_charges ? `${Math.round(Number(indicateur.ratio_charges))}%` : '—'}
                </div>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">du CA</p>
                {indicateur.ratio_charges && (
                  <div className="mt-2 bg-slate-100 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.min(100, Number(indicateur.ratio_charges))}%`,
                        backgroundColor: Number(indicateur.ratio_charges) > 80 ? '#ef4444' : Number(indicateur.ratio_charges) > 60 ? '#f59e0b' : '#22c55e',
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Tendance CA */}
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-2">Tendance CA</p>
                <div className="flex items-center gap-2 mt-2">
                  {indicateur.tendance_ca === 'hausse' && <TrendingUp className="w-7 h-7 text-green-500" />}
                  {indicateur.tendance_ca === 'baisse' && <TrendingDown className="w-7 h-7 text-red-500" />}
                  {indicateur.tendance_ca === 'stable' && <Minus className="w-7 h-7 text-blue-500" />}
                  {!indicateur.tendance_ca && <span className="text-slate-400 dark:text-slate-500 text-sm">—</span>}
                  <span className="text-base font-semibold text-slate-700 dark:text-slate-300 capitalize">
                    {indicateur.tendance_ca || 'Insuffisant'}
                  </span>
                </div>
                {dernierFlux && (
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
                    CA : {formatEur(Number(dernierFlux.ca_mensuel))}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Graphiques SVG */}
          {fluxChrono.length >= 2 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Évolution CA */}
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
                <h2 className="font-semibold text-slate-900 dark:text-slate-100 mb-1 text-sm">Évolution CA</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                  {fluxChrono.length} derniers mois
                </p>
                <MiniLineChart data={caData} height={90} color="#3b82f6" />
                <div className="flex justify-between mt-2 pt-2 border-t border-slate-100 dark:border-slate-700">
                  <div>
                    <p className="text-xs text-slate-400 dark:text-slate-500">Min</p>
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      {formatEur(Math.min(...caData.map(d => d.value)))}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-400 dark:text-slate-500">Max</p>
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      {formatEur(Math.max(...caData.map(d => d.value)))}
                    </p>
                  </div>
                </div>
              </div>

              {/* CA vs Charges */}
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
                <h2 className="font-semibold text-slate-900 dark:text-slate-100 mb-1 text-sm">CA vs Charges</h2>
                <div className="flex items-center gap-4 mb-3">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-sm bg-blue-500" />
                    <span className="text-xs text-slate-500 dark:text-slate-400">CA</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-sm bg-amber-500" />
                    <span className="text-xs text-slate-500 dark:text-slate-400">Charges</span>
                  </div>
                </div>
                <MiniBarChart data={chargesData} height={90} color="#3b82f6" color2="#f59e0b" />
                {(() => {
                  const lastCA = chargesData[chargesData.length - 1]?.value ?? 0
                  const lastCharges = chargesData[chargesData.length - 1]?.value2 ?? 0
                  const marge = lastCA - lastCharges
                  return (
                    <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-700">
                      <p className="text-xs text-slate-400 dark:text-slate-500">Marge nette (dernier mois)</p>
                      <p className={`text-sm font-semibold ${marge >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {formatEur(marge)}
                      </p>
                    </div>
                  )
                })()}
              </div>
            </div>
          )}

          {/* Dernier mois */}
          {dernierFlux && (
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-slate-900 dark:text-slate-100">Dernières données saisies</h2>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {new Date(dernierFlux.mois).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">CA mensuel</p>
                  <p className="text-lg font-bold text-slate-900 dark:text-slate-100">{formatEur(Number(dernierFlux.ca_mensuel))}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Charges fixes</p>
                  <p className="text-lg font-semibold text-slate-700 dark:text-slate-300">{formatEur(Number(dernierFlux.charges_fixes))}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Charges variables</p>
                  <p className="text-lg font-semibold text-slate-700 dark:text-slate-300">{formatEur(Number(dernierFlux.charges_variables))}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Trésorerie</p>
                  <p className={`text-lg font-bold ${Number(dernierFlux.tresorerie) > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {formatEur(Number(dernierFlux.tresorerie))}
                  </p>
                </div>
              </div>
              {dernierFlux.notes && (
                <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700">
                  <p className="text-xs text-slate-500 dark:text-slate-400">{dernierFlux.notes}</p>
                </div>
              )}
            </div>
          )}

          {/* Historique */}
          {flux && flux.length > 1 && (
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-700">
                <h2 className="font-semibold text-slate-900 dark:text-slate-100">Historique mensuel</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-100 dark:border-slate-700">
                      <th className="text-left text-xs font-semibold text-slate-500 dark:text-slate-400 px-4 py-2.5">Mois</th>
                      <th className="text-right text-xs font-semibold text-slate-500 dark:text-slate-400 px-4 py-2.5">CA</th>
                      <th className="text-right text-xs font-semibold text-slate-500 dark:text-slate-400 px-4 py-2.5 hidden sm:table-cell">Charges</th>
                      <th className="text-right text-xs font-semibold text-slate-500 dark:text-slate-400 px-4 py-2.5">Trésorerie</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-700">
                    {flux.slice(1).map((f: any) => (
                      <tr key={f.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                        <td className="px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300">
                          {new Date(f.mois).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })}
                        </td>
                        <td className="px-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 text-right font-medium">
                          {formatEur(Number(f.ca_mensuel))}
                        </td>
                        <td className="px-4 py-2.5 text-sm text-slate-600 dark:text-slate-400 text-right hidden sm:table-cell">
                          {formatEur(Number(f.charges_fixes) + Number(f.charges_variables))}
                        </td>
                        <td className={`px-4 py-2.5 text-sm text-right font-medium ${Number(f.tresorerie) > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                          {formatEur(Number(f.tresorerie))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {flux && flux.length === 1 && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl px-5 py-4 flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
              <p className="text-sm text-blue-800 dark:text-blue-200">
                Saisissez au moins 2 mois pour voir les graphiques de tendance.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
