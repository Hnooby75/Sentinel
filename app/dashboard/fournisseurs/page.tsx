// ============================================
// app/dashboard/fournisseurs/page.tsx
// Feature 9 — Supplier Risk Scanner
// ============================================
'use client'

import { useState, useEffect } from 'react'
import { Shield, Plus, AlertTriangle, CheckCircle, Loader2, ExternalLink, Calendar, X, Filter } from 'lucide-react'

interface SupplierAssessment {
  id: string
  supplier_name: string
  supplier_url: string | null
  risk_score: number
  summary: string
  findings: string[]
  recommendations: string[]
  ai_usage_detected: Array<{ description: string; risk_level: string; source: string }>
  policy_analysis: { has_ai_policy: boolean; gdpr_compliant_claims: boolean; transparency_level: string; certifications: string[] }
  last_scanned_at: string
}

type FilterLevel = 'tous' | 'critique' | 'eleve' | 'modere' | 'faible'

function getRiskLevel(score: number): FilterLevel {
  if (score < 25) return 'critique'
  if (score < 40) return 'eleve'
  if (score < 70) return 'modere'
  return 'faible'
}

function getRiskColor(score: number) {
  if (score >= 70) return { color: 'text-emerald-700 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-900/30', label: 'Conforme' }
  if (score >= 40) return { color: 'text-yellow-700 dark:text-yellow-400', bg: 'bg-yellow-100 dark:bg-yellow-900/30', label: 'Attention' }
  if (score >= 25) return { color: 'text-orange-700 dark:text-orange-400', bg: 'bg-orange-100 dark:bg-orange-900/30', label: 'Élevé' }
  return { color: 'text-red-700 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-900/30', label: 'Critique' }
}

const FILTER_LABELS: Record<FilterLevel, string> = {
  tous: 'Tous',
  critique: 'Critique',
  eleve: 'Élevé',
  modere: 'Modéré',
  faible: 'Conforme',
}

export default function FournisseursPage() {
  const [assessments, setAssessments] = useState<SupplierAssessment[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [filter, setFilter] = useState<FilterLevel>('tous')
  const [modalId, setModalId] = useState<string | null>(null)
  const [form, setForm] = useState({ supplier_name: '', supplier_url: '', description: '' })
  const [error, setError] = useState('')

  useEffect(() => {
    loadAssessments()
  }, [])

  async function loadAssessments() {
    try {
      const r = await fetch('/api/fournisseurs')
      if (r.ok) {
        const data = await r.json()
        setAssessments(data.data || [])
      }
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  async function handleScan() {
    if (!form.supplier_name || !form.description) {
      setError('Nom et description requis')
      return
    }
    setError('')
    setScanning(true)

    try {
      const res = await fetch('/api/ai/scan-supplier', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Erreur analyse')
      }

      const result = await res.json()
      setAssessments(prev => [{
        ...result,
        supplier_name: form.supplier_name,
        supplier_url: form.supplier_url || null,
        last_scanned_at: new Date().toISOString()
      }, ...prev])
      setForm({ supplier_name: '', supplier_url: '', description: '' })
      setShowForm(false)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setScanning(false)
    }
  }

  const filtered = filter === 'tous'
    ? assessments
    : assessments.filter(a => getRiskLevel(a.risk_score) === filter)

  const avgScore = assessments.length > 0
    ? Math.round(assessments.reduce((s, a) => s + a.risk_score, 0) / assessments.length)
    : null

  const modalSupplier = assessments.find(a => a.id === modalId)

  // Count per level for distribution
  const counts = {
    critique: assessments.filter(a => getRiskLevel(a.risk_score) === 'critique').length,
    eleve: assessments.filter(a => getRiskLevel(a.risk_score) === 'eleve').length,
    modere: assessments.filter(a => getRiskLevel(a.risk_score) === 'modere').length,
    faible: assessments.filter(a => getRiskLevel(a.risk_score) === 'faible').length,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Shield className="w-6 h-6 text-blue-500" />
            Supplier Risk Scanner
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Évaluez la conformité IA de vos fournisseurs via Claude
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Scanner un fournisseur
        </button>
      </div>

      {/* Stats */}
      {assessments.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{assessments.length}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Fournisseurs évalués</p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {avgScore !== null ? `${avgScore}/100` : '—'}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Score moyen</p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">
              {counts.critique + counts.eleve}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">À risque (&lt;40)</p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{counts.faible}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Conformes (≥70)</p>
          </div>
        </div>
      )}

      {/* Formulaire scan */}
      {showForm && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 space-y-4">
          <h2 className="font-semibold text-slate-800 dark:text-slate-100">Analyser un nouveau fournisseur</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Nom du fournisseur *</label>
              <input
                type="text"
                value={form.supplier_name}
                onChange={e => setForm(f => ({ ...f, supplier_name: e.target.value }))}
                placeholder="Ex : Salesforce, HubSpot..."
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">URL (optionnel)</label>
              <input
                type="url"
                value={form.supplier_url}
                onChange={e => setForm(f => ({ ...f, supplier_url: e.target.value }))}
                placeholder="https://..."
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
              Description / Informations disponibles *
            </label>
            <textarea
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              rows={4}
              placeholder="Décrivez ce que fait ce fournisseur, quels outils IA il utilise, ce que vous savez de sa politique de données..."
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>
          {error && (
            <p className="text-sm text-red-600 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4" /> {error}
            </p>
          )}
          <div className="flex gap-3">
            <button
              onClick={handleScan}
              disabled={scanning}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {scanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
              {scanning ? 'Analyse en cours…' : "Lancer l'analyse IA"}
            </button>
            <button onClick={() => setShowForm(false)} className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200">
              Annuler
            </button>
          </div>
        </div>
      )}

      {/* Filtres */}
      {assessments.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="w-4 h-4 text-slate-400" />
          {(['tous', 'critique', 'eleve', 'modere', 'faible'] as FilterLevel[]).map(level => {
            const count = level === 'tous' ? assessments.length : counts[level as keyof typeof counts]
            return (
              <button
                key={level}
                onClick={() => setFilter(level)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  filter === level
                    ? 'bg-blue-600 text-white'
                    : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
                }`}
              >
                {FILTER_LABELS[level]} ({count})
              </button>
            )
          })}
        </div>
      )}

      {/* Results table */}
      {loading ? (
        <div className="flex items-center justify-center h-32">
          <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
        </div>
      ) : assessments.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-12 text-center">
          <Shield className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="font-medium text-slate-500 dark:text-slate-400">Aucun fournisseur analysé</p>
          <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
            Analysez vos fournisseurs pour évaluer leur conformité IA
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-8 text-center">
          <p className="text-sm text-slate-500 dark:text-slate-400">Aucun fournisseur dans cette catégorie</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-100 dark:border-slate-700">
                  <th className="text-left text-xs font-semibold text-slate-500 dark:text-slate-400 px-4 py-3">Fournisseur</th>
                  <th className="text-center text-xs font-semibold text-slate-500 dark:text-slate-400 px-4 py-3">Score</th>
                  <th className="text-center text-xs font-semibold text-slate-500 dark:text-slate-400 px-4 py-3 hidden sm:table-cell">Findings</th>
                  <th className="text-center text-xs font-semibold text-slate-500 dark:text-slate-400 px-4 py-3 hidden sm:table-cell">Politique IA</th>
                  <th className="text-left text-xs font-semibold text-slate-500 dark:text-slate-400 px-4 py-3 hidden md:table-cell">Dernier scan</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-700">
                {filtered.map(a => {
                  const riskCfg = getRiskColor(a.risk_score)
                  return (
                    <tr key={a.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm text-slate-900 dark:text-slate-100">{a.supplier_name}</span>
                          {a.supplier_url && (
                            <a href={a.supplier_url} target="_blank" rel="noopener noreferrer"
                              className="text-slate-400 hover:text-blue-600 transition-colors">
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">{a.summary}</p>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className={`inline-flex flex-col items-center`}>
                          <span className={`text-base font-bold ${riskCfg.color}`}>{a.risk_score}</span>
                          <span className={`text-xs px-1.5 py-0.5 rounded-full ${riskCfg.bg} ${riskCfg.color}`}>
                            {riskCfg.label}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center hidden sm:table-cell">
                        <span className="text-sm text-slate-700 dark:text-slate-300 font-medium">{a.findings?.length ?? 0}</span>
                      </td>
                      <td className="px-4 py-3 text-center hidden sm:table-cell">
                        {a.policy_analysis?.has_ai_policy ? (
                          <CheckCircle className="w-4 h-4 text-green-500 mx-auto" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-red-400 mx-auto" />
                        )}
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(a.last_scanned_at).toLocaleDateString('fr-FR')}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setModalId(a.id)}
                          className="text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2.5 py-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium"
                        >
                          Voir
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal détail */}
      {modalId && modalSupplier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={() => setModalId(null)}>
          <div
            className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-start justify-between p-5 border-b border-slate-100 dark:border-slate-700">
              <div>
                <h2 className="font-bold text-lg text-slate-900 dark:text-slate-100">{modalSupplier.supplier_name}</h2>
                {modalSupplier.supplier_url && (
                  <a href={modalSupplier.supplier_url} target="_blank" rel="noopener noreferrer"
                    className="text-xs text-blue-500 hover:underline flex items-center gap-1 mt-0.5">
                    <ExternalLink className="w-3 h-3" />
                    {modalSupplier.supplier_url}
                  </a>
                )}
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className={`text-2xl font-bold ${getRiskColor(modalSupplier.risk_score).color}`}>
                    {modalSupplier.risk_score}/100
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${getRiskColor(modalSupplier.risk_score).bg} ${getRiskColor(modalSupplier.risk_score).color}`}>
                    {getRiskColor(modalSupplier.risk_score).label}
                  </span>
                </div>
                <button onClick={() => setModalId(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal body */}
            <div className="p-5 space-y-4">
              {/* Summary */}
              <p className="text-sm text-slate-600 dark:text-slate-400">{modalSupplier.summary}</p>

              {/* Policy badges */}
              {modalSupplier.policy_analysis && (
                <div className="flex gap-2 flex-wrap">
                  <span className={`text-xs px-2 py-1 rounded-lg flex items-center gap-1 ${
                    modalSupplier.policy_analysis.has_ai_policy
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                      : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                  }`}>
                    {modalSupplier.policy_analysis.has_ai_policy ? <CheckCircle className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                    Politique IA
                  </span>
                  <span className={`text-xs px-2 py-1 rounded-lg flex items-center gap-1 ${
                    modalSupplier.policy_analysis.gdpr_compliant_claims
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                  }`}>
                    {modalSupplier.policy_analysis.gdpr_compliant_claims ? <CheckCircle className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                    RGPD
                  </span>
                  {modalSupplier.policy_analysis.transparency_level && (
                    <span className="text-xs px-2 py-1 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
                      Transparence : {modalSupplier.policy_analysis.transparency_level}
                    </span>
                  )}
                </div>
              )}

              {/* Findings */}
              {modalSupplier.findings?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-2">Points relevés ({modalSupplier.findings.length})</p>
                  <ul className="space-y-1.5">
                    {modalSupplier.findings.map((f, i) => (
                      <li key={i} className="text-xs text-slate-600 dark:text-slate-400 flex items-start gap-2 bg-slate-50 dark:bg-slate-700/50 rounded-lg px-3 py-2">
                        <AlertTriangle className="w-3 h-3 text-yellow-500 flex-shrink-0 mt-0.5" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Recommandations */}
              {modalSupplier.recommendations?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-2">Recommandations ({modalSupplier.recommendations.length})</p>
                  <ul className="space-y-1.5">
                    {modalSupplier.recommendations.map((r, i) => (
                      <li key={i} className="text-xs text-slate-600 dark:text-slate-400 flex items-start gap-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg px-3 py-2">
                        <CheckCircle className="w-3 h-3 text-blue-500 flex-shrink-0 mt-0.5" />
                        {r}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Scan date */}
              <p className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1 pt-2 border-t border-slate-100 dark:border-slate-700">
                <Calendar className="w-3 h-3" />
                Scanné le {new Date(modalSupplier.last_scanned_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
