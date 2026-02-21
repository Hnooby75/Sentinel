// ============================================
// app/dashboard/journaux/smart/page.tsx
// Feature 3 — Assistant IA de classification intelligente
// ============================================
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Sparkles, CheckCircle, AlertTriangle, AlertCircle, Info, ChevronRight, Loader2 } from 'lucide-react'
import { ClassificationResult, RISK_LEVEL_CONFIG, OPERATOR_STATUS_CONFIG } from '@/lib/ai/types'

const STEPS = ['Description', 'Analyse IA', 'Résultat']

export default function SmartClassifyPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ClassificationResult | null>(null)
  const [error, setError] = useState('')

  async function handleAnalyze() {
    if (description.trim().length < 10) {
      setError('Décrivez le système IA en au moins 10 caractères.')
      return
    }
    setError('')
    setLoading(true)
    setStep(1)

    try {
      const res = await fetch('/api/ai/classify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Erreur classification')
      }

      const data: ClassificationResult = await res.json()
      setResult(data)
      setStep(2)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
      setStep(0)
    } finally {
      setLoading(false)
    }
  }

  async function handleCreateJournal() {
    if (!result) return
    // Redirige vers le formulaire de création avec les données pré-remplies
    const params = new URLSearchParams({
      categorie: result.suggested_category,
      niveau: result.risk_level,
    })
    router.push(`/dashboard/journaux/nouveau?${params.toString()}`)
  }

  const riskConfig = result ? RISK_LEVEL_CONFIG[result.risk_level] : null
  const operatorConfig = result ? OPERATOR_STATUS_CONFIG[result.operator_status] : null

  const RiskIcon = result?.risk_level === 'unacceptable' || result?.risk_level === 'high'
    ? AlertCircle
    : result?.risk_level === 'limited'
    ? AlertTriangle
    : CheckCircle

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/dashboard/journaux" className="text-slate-400 hover:text-slate-600 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-blue-500" />
            Classification intelligente
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Décrivez votre système IA en langage naturel — Claude l'analyse selon l'AI Act
          </p>
        </div>
      </div>

      {/* Progress steps */}
      <div className="flex items-center gap-2">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
              i < step ? 'bg-blue-600 text-white' :
              i === step ? 'bg-blue-100 text-blue-700 border-2 border-blue-600' :
              'bg-slate-100 text-slate-400'
            }`}>
              {i < step ? <CheckCircle className="w-4 h-4" /> : i + 1}
            </div>
            <span className={`text-sm font-medium ${i === step ? 'text-blue-700' : 'text-slate-400'}`}>{s}</span>
            {i < STEPS.length - 1 && <ChevronRight className="w-4 h-4 text-slate-300 mx-1" />}
          </div>
        ))}
      </div>

      {/* Step 0 — Description */}
      {step === 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Décrivez le système IA à analyser
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={6}
              placeholder="Ex : Nous utilisons ChatGPT pour rédiger des offres d'emploi et pré-sélectionner les CV des candidats en fonction de critères définis par nos RH. L'outil donne un score de pertinence à chaque candidature..."
              className="w-full px-4 py-3 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
            <p className="text-xs text-slate-400 mt-1">{description.length} caractères — minimum 10</p>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 px-3 py-2 rounded-lg">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 px-3 py-2 rounded-lg">
            <Info className="w-4 h-4 flex-shrink-0 text-blue-500" />
            Claude analyse la description et classe automatiquement le système selon le Règlement UE 2024/1689 (AI Act).
            Plus vous êtes précis, plus la classification est fiable.
          </div>

          <button
            onClick={handleAnalyze}
            disabled={description.trim().length < 10}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            Analyser avec l'IA
          </button>
        </div>
      )}

      {/* Step 1 — Loading */}
      {step === 1 && loading && (
        <div className="bg-white rounded-xl border border-slate-200 p-12 flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-blue-600" />
            </div>
            <Loader2 className="w-20 h-20 text-blue-300 animate-spin absolute -top-2 -left-2" />
          </div>
          <div className="text-center">
            <p className="font-semibold text-slate-900">Analyse en cours…</p>
            <p className="text-sm text-slate-500 mt-1">Claude évalue le système selon l'AI Act</p>
          </div>
        </div>
      )}

      {/* Step 2 — Result */}
      {step === 2 && result && riskConfig && operatorConfig && (
        <div className="space-y-4">
          {/* Risk badge */}
          <div className={`bg-white rounded-xl border-2 ${riskConfig.border} p-6`}>
            <div className="flex items-start gap-4">
              <div className={`p-3 rounded-xl ${riskConfig.bg}`}>
                <RiskIcon className={`w-7 h-7 ${riskConfig.color}`} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-2xl font-bold ${riskConfig.color}`}>
                    Risque {riskConfig.label}
                  </span>
                  <span className="text-sm text-slate-400">
                    Confiance : {result.confidence}%
                  </span>
                </div>
                <p className="text-slate-600 text-sm mt-2">{result.rationale}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                    Statut : {operatorConfig.label}
                  </span>
                  {result.transparency_required && (
                    <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">
                      Transparence requise
                    </span>
                  )}
                  {result.human_oversight_required && (
                    <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
                      Supervision humaine
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Articles + Documentation */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <h3 className="text-sm font-semibold text-slate-700 mb-2">Articles applicables</h3>
              <div className="space-y-1">
                {result.ai_act_articles.map(art => (
                  <span key={art} className="inline-block text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded mr-1 mb-1">
                    {art}
                  </span>
                ))}
              </div>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <h3 className="text-sm font-semibold text-slate-700 mb-2">Documents requis</h3>
              <ul className="space-y-1">
                {result.required_documentation.slice(0, 4).map((doc, i) => (
                  <li key={i} className="text-xs text-slate-600 flex items-start gap-1">
                    <CheckCircle className="w-3 h-3 text-slate-400 mt-0.5 flex-shrink-0" />
                    {doc}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Plan d'action */}
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Plan d'action recommandé</h3>
            <div className="space-y-2">
              {result.action_plan.slice(0, 4).map((item, i) => (
                <div key={i} className="flex items-start gap-3 text-sm">
                  <span className={`text-xs px-1.5 py-0.5 rounded font-medium flex-shrink-0 mt-0.5 ${
                    item.priority === 'critical' ? 'bg-red-100 text-red-700' :
                    item.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                    item.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-slate-100 text-slate-600'
                  }`}>
                    {item.priority.toUpperCase()}
                  </span>
                  <div>
                    <p className="text-slate-700">{item.action}</p>
                    <p className="text-xs text-slate-400">{item.deadline} · Effort : {item.effort}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={handleCreateJournal}
              className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Créer le journal avec ces données
            </button>
            <button
              onClick={() => { setStep(0); setResult(null) }}
              className="px-4 py-3 border border-slate-300 rounded-lg text-sm text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Nouvelle analyse
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
