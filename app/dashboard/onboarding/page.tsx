// ============================================
// app/dashboard/onboarding/page.tsx
// Feature 12 — Onboarding IA 5 minutes
// ============================================
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Sparkles, CheckCircle, ChevronRight, Loader2, Building2, AlertCircle } from 'lucide-react'
import { OnboardingResult } from '@/lib/ai/types'

const SECTEURS = [
  'Technologie / SaaS', 'Finance / Fintech', 'Santé', 'RH / Recrutement',
  'Commerce / Retail', 'Industrie', 'Éducation', 'Juridique / Conseil',
  'Marketing / Communication', 'Logistique', 'Immobilier', 'Autre',
]

const TAILLES = [
  { value: '1-9', label: '1–9 employés (TPE)' },
  { value: '10-49', label: '10–49 employés (PE)' },
  { value: '50-249', label: '50–249 employés (PME)' },
  { value: '250+', label: '250+ employés (ETI/GE)' },
]

const RISQUE_COLORS: Record<string, string> = {
  high: 'bg-red-100 text-red-700 border-red-200',
  limited: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  minimal: 'bg-green-100 text-green-700 border-green-200',
}

const RISQUE_LABELS: Record<string, string> = {
  high: 'Risque élevé', limited: 'Risque limité', minimal: 'Risque minimal',
}

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [form, setForm] = useState({
    secteur: '',
    taille: '',
    description_activite: '',
    outils_utilises: '',
  })
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<OnboardingResult | null>(null)
  const [error, setError] = useState('')

  async function handleAnalyze() {
    if (!form.secteur || !form.taille || form.description_activite.length < 20) {
      setError('Remplissez tous les champs (description minimum 20 caractères)')
      return
    }
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/ai/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Erreur analyse')
      }

      const data: OnboardingResult = await res.json()
      setResult(data)
      setStep(2)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setLoading(false)
    }
  }

  function handleComplete() {
    router.push('/dashboard')
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Sparkles className="w-7 h-7 text-blue-600" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Configurez Sentinel en 5 minutes</h1>
        <p className="text-sm text-slate-500 mt-1">
          Claude analyse votre profil et génère votre plan de conformité AI Act personnalisé
        </p>
      </div>

      {/* Steps indicator */}
      <div className="flex items-center justify-center gap-3">
        {['Profil', 'Analyse IA', 'Résultats'].map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
              i < step ? 'bg-blue-600 text-white' :
              i === step ? 'bg-blue-100 text-blue-700 border-2 border-blue-600' :
              'bg-slate-100 text-slate-400'
            }`}>
              {i < step ? <CheckCircle className="w-4 h-4" /> : i + 1}
            </div>
            <span className={`text-sm ${i === step ? 'text-blue-700 font-medium' : 'text-slate-400'}`}>{s}</span>
            {i < 2 && <ChevronRight className="w-4 h-4 text-slate-300" />}
          </div>
        ))}
      </div>

      {/* Step 0 — Formulaire */}
      {step === 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              <Building2 className="w-4 h-4 inline mr-1 text-slate-500" />
              Secteur d'activité *
            </label>
            <div className="grid grid-cols-3 gap-2">
              {SECTEURS.map(s => (
                <button
                  key={s}
                  onClick={() => setForm(f => ({ ...f, secteur: s }))}
                  className={`text-left text-xs px-3 py-2 rounded-lg border transition-colors ${
                    form.secteur === s
                      ? 'border-blue-500 bg-blue-50 text-blue-700 font-medium'
                      : 'border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Taille de l'entreprise *</label>
            <div className="grid grid-cols-2 gap-2">
              {TAILLES.map(t => (
                <button
                  key={t.value}
                  onClick={() => setForm(f => ({ ...f, taille: t.value }))}
                  className={`text-left text-sm px-4 py-2.5 rounded-lg border transition-colors ${
                    form.taille === t.value
                      ? 'border-blue-500 bg-blue-50 text-blue-700 font-medium'
                      : 'border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Décrivez votre activité principale *
            </label>
            <textarea
              value={form.description_activite}
              onChange={e => setForm(f => ({ ...f, description_activite: e.target.value }))}
              rows={4}
              placeholder="Ex : Nous développons un SaaS de gestion RH pour les PME. Nous utilisons de l'IA pour analyser les CV et faire des recommandations de recrutement..."
              className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
            <p className="text-xs text-slate-400 mt-1">{form.description_activite.length} / 20 min</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Outils IA déjà utilisés (optionnel)
            </label>
            <input
              type="text"
              value={form.outils_utilises}
              onChange={e => setForm(f => ({ ...f, outils_utilises: e.target.value }))}
              placeholder="Ex : ChatGPT, Copilot, Gemini, outil interne..."
              className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 px-3 py-2 rounded-lg">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <button
            onClick={() => { setStep(1); handleAnalyze() }}
            disabled={!form.secteur || !form.taille || form.description_activite.length < 20}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            Analyser mon profil avec Claude
          </button>
        </div>
      )}

      {/* Step 1 — Loading */}
      {step === 1 && loading && (
        <div className="bg-white rounded-xl border border-slate-200 p-12 flex flex-col items-center gap-4 text-center">
          <div className="relative">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-blue-600" />
            </div>
            <Loader2 className="w-20 h-20 text-blue-200 animate-spin absolute -top-2 -left-2" />
          </div>
          <div>
            <p className="font-semibold text-slate-900">Claude analyse votre profil…</p>
            <p className="text-sm text-slate-500 mt-1">Identification des obligations AI Act applicables</p>
          </div>
        </div>
      )}

      {/* Step 2 — Résultats */}
      {step === 2 && result && (
        <div className="space-y-4">
          {/* Message d'accueil */}
          <div className="bg-blue-600 text-white rounded-xl p-5">
            <p className="font-semibold flex items-center gap-2 mb-1">
              <Sparkles className="w-4 h-4" /> Diagnostic initial
            </p>
            <p className="text-sm text-blue-100">{result.message_accueil}</p>
          </div>

          {/* Score estimé */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
              <p className="text-3xl font-bold text-slate-900">{result.score_estime}</p>
              <p className="text-xs text-slate-500 mt-0.5">Score estimé /100</p>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium mt-1.5 inline-block ${
                result.niveau_estime === 'critique' ? 'bg-red-100 text-red-700' :
                result.niveau_estime === 'insuffisant' ? 'bg-orange-100 text-orange-700' :
                result.niveau_estime === 'partiel' ? 'bg-yellow-100 text-yellow-700' :
                result.niveau_estime === 'bon' ? 'bg-green-100 text-green-700' :
                'bg-emerald-100 text-emerald-700'
              }`}>
                {result.niveau_estime}
              </span>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <p className="text-sm font-semibold text-slate-700 mb-2">Actions prioritaires</p>
              <ul className="space-y-1.5">
                {result.actions_prioritaires.slice(0, 3).map((a, i) => (
                  <li key={i} className="text-xs text-slate-600 flex items-start gap-1.5">
                    <span className="text-blue-500 font-bold flex-shrink-0">{i + 1}.</span>
                    {a}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Systèmes détectés */}
          {result.systemes_detectes.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <h3 className="text-sm font-semibold text-slate-700 mb-3">
                Systèmes IA probables ({result.systemes_detectes.length} détectés)
              </h3>
              <div className="space-y-2">
                {result.systemes_detectes.map((s, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm">
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${RISQUE_COLORS[s.niveau_risque] || 'bg-slate-100 text-slate-600'}`}>
                      {RISQUE_LABELS[s.niveau_risque] || s.niveau_risque}
                    </span>
                    <span className="text-slate-800 font-medium">{s.titre}</span>
                    <span className="text-slate-400 text-xs">{s.outil_ia}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CTA */}
          <div className="flex gap-3">
            <button
              onClick={handleComplete}
              className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
            >
              <CheckCircle className="w-4 h-4" />
              Accéder au tableau de bord
            </button>
            <button
              onClick={() => router.push('/dashboard/journaux/smart')}
              className="flex-1 border border-blue-200 text-blue-700 py-3 rounded-lg font-medium hover:bg-blue-50 transition-colors flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              Classifier mes systèmes IA
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
