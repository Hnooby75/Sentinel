'use client'

// ============================================
// app/dashboard/copilot-finance/page.tsx
// Finance IA — Cashflow & Prévisions
// ============================================
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  TrendingUp, TrendingDown, Minus, AlertTriangle,
  RefreshCw, Loader2, CheckCircle, XCircle
} from 'lucide-react'

interface CashflowPrediction {
  id: string
  prevision_30j: number | null
  prevision_60j: number | null
  prevision_90j: number | null
  tendance: string | null
  niveau_risque: string | null
  analyse_texte: string | null
  anomalies: Array<{ type: string; description: string; impact: string }>
  recommandations: Array<{ priorite: string; action: string; impact: string }>
  genere_a: string
}

interface Alert {
  id: string
  severite: string
  titre: string
  description: string | null
  created_at: string
}

function formatEur(n: number | null) {
  if (n == null) return '—'
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency', currency: 'EUR', maximumFractionDigits: 0,
  }).format(n)
}

const RISQUE_COLORS: Record<string, string> = {
  faible:   'text-green-600 bg-green-100 dark:bg-green-900/20 dark:text-green-400',
  modere:   'text-amber-600 bg-amber-100 dark:bg-amber-900/20 dark:text-amber-400',
  eleve:    'text-orange-600 bg-orange-100 dark:bg-orange-900/20 dark:text-orange-400',
  critique: 'text-red-600 bg-red-100 dark:bg-red-900/20 dark:text-red-400',
}

const PRIORITE_COLORS: Record<string, string> = {
  critique: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  haute:    'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  normale:  'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
}

export default function CopilotFinancePage() {
  const router = useRouter()
  const [prediction, setPrediction] = useState<CashflowPrediction | null>(null)
  const [alertes, setAlertes] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const [analysing, setAnalysing] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/ai/analyse-finance')
      const json = await res.json()
      setPrediction(json.prediction)
      setAlertes(json.alertes || [])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  async function lancerAnalyse() {
    setAnalysing(true)
    setMessage(null)
    try {
      const res = await fetch('/api/ai/analyse-finance', { method: 'POST' })
      const json = await res.json()
      if (json.error) {
        setMessage({ type: 'error', text: json.error })
      } else {
        setMessage({ type: 'success', text: json.cached ? 'Analyse récente — données en cache (< 1h)' : 'Analyse terminée !' })
        await fetchData()
        router.refresh()
      }
    } catch {
      setMessage({ type: 'error', text: 'Erreur lors de l\'analyse' })
    } finally {
      setAnalysing(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Finance IA</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
            Cashflow, prévisions et anomalies détectées
          </p>
        </div>
        <button
          onClick={lancerAnalyse}
          disabled={analysing}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors"
        >
          {analysing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          Analyser maintenant
        </button>
      </div>

      {message && (
        <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${
          message.type === 'success'
            ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800'
            : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'
        }`}>
          {message.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
          {message.text}
        </div>
      )}

      {!prediction ? (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 py-16 text-center">
          <TrendingUp className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-700 dark:text-slate-300">Aucune analyse Finance IA</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 mb-5">
            Cliquez sur "Analyser maintenant" pour générer vos prévisions
          </p>
        </div>
      ) : (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-2">Prévision 30j</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{formatEur(prediction.prevision_30j)}</p>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-2">Prévision 60j</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{formatEur(prediction.prevision_60j)}</p>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-2">Prévision 90j</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{formatEur(prediction.prevision_90j)}</p>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-2">Tendance</p>
              <div className="flex items-center gap-2">
                {prediction.tendance === 'hausse' && <TrendingUp className="w-6 h-6 text-green-500" />}
                {prediction.tendance === 'baisse' && <TrendingDown className="w-6 h-6 text-red-500" />}
                {prediction.tendance === 'stable' && <Minus className="w-6 h-6 text-blue-500" />}
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 capitalize">
                  {prediction.tendance || '—'}
                </span>
              </div>
              {prediction.niveau_risque && (
                <span className={`mt-2 inline-block text-xs px-2 py-0.5 rounded-full font-medium ${RISQUE_COLORS[prediction.niveau_risque]}`}>
                  Risque {prediction.niveau_risque}
                </span>
              )}
            </div>
          </div>

          {/* Analyse texte */}
          {prediction.analyse_texte && (
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
              <h2 className="font-semibold text-slate-900 dark:text-slate-100 mb-2 text-sm">Analyse IA</h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{prediction.analyse_texte}</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-3">
                Généré le {new Date(prediction.genere_a).toLocaleDateString('fr-FR', {
                  day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit',
                })}
              </p>
            </div>
          )}

          {/* Anomalies */}
          {prediction.anomalies && prediction.anomalies.length > 0 && (
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <h2 className="font-semibold text-slate-900 dark:text-slate-100 text-sm">
                  Anomalies détectées ({prediction.anomalies.length})
                </h2>
              </div>
              <div className="space-y-3">
                {prediction.anomalies.map((a, i) => (
                  <div key={i} className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                    <p className="text-sm font-medium text-amber-800 dark:text-amber-300">{a.type}</p>
                    <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">{a.description}</p>
                    {a.impact && <p className="text-xs text-amber-600 dark:text-amber-500 mt-1">Impact : {a.impact}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommandations */}
          {prediction.recommandations && prediction.recommandations.length > 0 && (
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
              <h2 className="font-semibold text-slate-900 dark:text-slate-100 mb-3 text-sm">
                Recommandations IA ({prediction.recommandations.length})
              </h2>
              <div className="space-y-2">
                {prediction.recommandations.map((r, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                    <span className={`text-xs px-1.5 py-0.5 rounded flex-shrink-0 font-medium ${PRIORITE_COLORS[r.priorite] || PRIORITE_COLORS.normale}`}>
                      {r.priorite}
                    </span>
                    <div>
                      <p className="text-sm text-slate-700 dark:text-slate-300">{r.action}</p>
                      {r.impact && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{r.impact}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Alertes */}
          {alertes.length > 0 && (
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
              <h2 className="font-semibold text-slate-900 dark:text-slate-100 mb-3 text-sm">
                Alertes Finance ({alertes.length})
              </h2>
              <div className="space-y-2">
                {alertes.map(a => (
                  <div key={a.id} className={`p-3 rounded-lg border text-sm ${
                    a.severite === 'critical'
                      ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400'
                      : 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400'
                  }`}>
                    <p className="font-medium">{a.titre}</p>
                    {a.description && <p className="text-xs mt-0.5 opacity-80">{a.description}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
