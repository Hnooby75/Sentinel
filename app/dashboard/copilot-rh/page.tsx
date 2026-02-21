'use client'

// ============================================
// app/dashboard/copilot-rh/page.tsx
// RH IA — Santé équipe & Conformité
// ============================================
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Users, UserPlus, RefreshCw, Loader2,
  CheckCircle, XCircle, AlertTriangle
} from 'lucide-react'
import { z } from 'zod'

interface HRReport {
  score_sante_rh: number | null
  taux_absenteisme: number | null
  employes_surcharge: number | null
  contrats_a_renouveler: number | null
  risques: Array<{ type: string; description: string; employes_concernes: number }>
  recommandations: Array<{ priorite: string; action: string; delai: string }>
  analyse_texte: string | null
  genere_a: string
}

interface Employe {
  id: string
  prenom: string
  nom: string
  poste: string | null
  departement: string | null
  type_contrat: string
  statut: string
  score_sante: number | null
  risque_turnover: string | null
}

const TYPE_CONTRAT_COLORS: Record<string, string> = {
  cdi:        'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  cdd:        'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  freelance:  'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  stage:      'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  alternance: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
}

function ScoreBar({ score }: { score: number | null }) {
  if (score == null) return <span className="text-xs text-slate-400">—</span>
  const color = score >= 70 ? 'bg-green-500' : score >= 40 ? 'bg-amber-500' : 'bg-red-500'
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-slate-100 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${score}%` }} />
      </div>
      <span className="text-xs text-slate-500 dark:text-slate-400 w-8 text-right">{score}</span>
    </div>
  )
}

export default function CopilotRHPage() {
  const router = useRouter()
  const [rapport, setRapport] = useState<HRReport | null>(null)
  const [employes, setEmployes] = useState<Employe[]>([])
  const [loading, setLoading] = useState(true)
  const [analysing, setAnalysing] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    prenom: '', nom: '', email: '', poste: '', departement: '',
    type_contrat: 'cdi', date_embauche: '', statut: 'actif',
  })

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [hrRes, empRes] = await Promise.all([
        fetch('/api/ai/analyse-hr'),
        fetch('/api/employes'),
      ])
      const hr = await hrRes.json()
      const emp = await empRes.json()
      setRapport(hr.rapport)
      setEmployes(emp.employes || [])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  async function lancerAnalyse() {
    setAnalysing(true)
    setMessage(null)
    try {
      const res = await fetch('/api/ai/analyse-hr', { method: 'POST' })
      const json = await res.json()
      if (json.error) {
        setMessage({ type: 'error', text: json.error })
      } else {
        setMessage({ type: 'success', text: json.cached ? 'Analyse récente (< 1h)' : 'Analyse RH terminée !' })
        await fetchData()
        router.refresh()
      }
    } catch {
      setMessage({ type: 'error', text: 'Erreur lors de l\'analyse' })
    } finally {
      setAnalysing(false)
    }
  }

  async function ajouterEmploye(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch('/api/employes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          date_embauche: form.date_embauche || null,
          email: form.email || null,
          poste: form.poste || null,
          departement: form.departement || null,
        }),
      })
      const json = await res.json()
      if (json.error) {
        setMessage({ type: 'error', text: json.error })
      } else {
        setMessage({ type: 'success', text: 'Employé ajouté !' })
        setShowForm(false)
        setForm({ prenom: '', nom: '', email: '', poste: '', departement: '', type_contrat: 'cdi', date_embauche: '', statut: 'actif' })
        await fetchData()
      }
    } finally {
      setSaving(false)
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
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">RH IA</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
            Santé équipe, conformité et prévisions RH
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            Ajouter
          </button>
          <button
            onClick={lancerAnalyse}
            disabled={analysing}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
          >
            {analysing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            Analyser
          </button>
        </div>
      </div>

      {message && (
        <div className={`flex items-center gap-2 p-3 rounded-lg text-sm border ${
          message.type === 'success'
            ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800'
            : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800'
        }`}>
          {message.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
          {message.text}
        </div>
      )}

      {/* Formulaire ajout employé */}
      {showForm && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
          <h2 className="font-semibold text-slate-900 dark:text-slate-100 mb-4">Nouvel employé</h2>
          <form onSubmit={ajouterEmploye} className="grid grid-cols-2 gap-3">
            {[
              { key: 'prenom', label: 'Prénom', required: true },
              { key: 'nom', label: 'Nom', required: true },
              { key: 'email', label: 'Email', required: false },
              { key: 'poste', label: 'Poste', required: false },
              { key: 'departement', label: 'Département', required: false },
              { key: 'date_embauche', label: 'Date embauche', required: false, type: 'date' },
            ].map(field => (
              <div key={field.key}>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  {field.label}{field.required && <span className="text-red-500 ml-0.5">*</span>}
                </label>
                <input
                  type={field.type || 'text'}
                  required={field.required}
                  value={form[field.key as keyof typeof form]}
                  onChange={e => setForm(prev => ({ ...prev, [field.key]: e.target.value }))}
                  className="w-full px-3 py-1.5 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            ))}
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Type contrat</label>
              <select
                value={form.type_contrat}
                onChange={e => setForm(prev => ({ ...prev, type_contrat: e.target.value }))}
                className="w-full px-3 py-1.5 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
              >
                {['cdi', 'cdd', 'freelance', 'stage', 'alternance'].map(t => (
                  <option key={t} value={t}>{t.toUpperCase()}</option>
                ))}
              </select>
            </div>
            <div className="col-span-2 flex gap-2 justify-end">
              <button type="button" onClick={() => setShowForm(false)}
                className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">
                Annuler
              </button>
              <button type="submit" disabled={saving}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium">
                {saving && <Loader2 className="w-3 h-3 animate-spin" />}
                Enregistrer
              </button>
            </div>
          </form>
        </div>
      )}

      {/* KPIs */}
      {rapport && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-2">Score santé RH</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {rapport.score_sante_rh != null ? `${rapport.score_sante_rh}/100` : '—'}
            </p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-2">Effectif actif</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {employes.filter(e => e.statut === 'actif').length}
            </p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-2">Taux absentéisme</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {rapport.taux_absenteisme != null ? `${rapport.taux_absenteisme}%` : '—'}
            </p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-2">Contrats à renouveler</p>
            <p className={`text-2xl font-bold ${(rapport.contrats_a_renouveler ?? 0) > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-900 dark:text-slate-100'}`}>
              {rapport.contrats_a_renouveler ?? 0}
            </p>
          </div>
        </div>
      )}

      {/* Analyse texte */}
      {rapport?.analyse_texte && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
          <h2 className="font-semibold text-slate-900 dark:text-slate-100 mb-2 text-sm">Analyse RH</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{rapport.analyse_texte}</p>
        </div>
      )}

      {/* Risques RH */}
      {rapport?.risques && rapport.risques.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <h2 className="font-semibold text-slate-900 dark:text-slate-100 text-sm">Risques RH identifiés</h2>
          </div>
          <div className="space-y-2">
            {rapport.risques.map((r, i) => (
              <div key={i} className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-300">{r.type}</p>
                  {r.employes_concernes > 0 && (
                    <span className="text-xs text-amber-600 dark:text-amber-500">{r.employes_concernes} employé(s)</span>
                  )}
                </div>
                <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">{r.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tableau employés */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 dark:border-slate-700">
          <h2 className="font-semibold text-slate-900 dark:text-slate-100">
            Équipe ({employes.length})
          </h2>
        </div>
        {employes.length === 0 ? (
          <div className="py-10 text-center">
            <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm text-slate-500 dark:text-slate-400">Aucun employé enregistré</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-100 dark:border-slate-700">
                  <th className="text-left text-xs font-semibold text-slate-500 dark:text-slate-400 px-4 py-2.5">Employé</th>
                  <th className="text-left text-xs font-semibold text-slate-500 dark:text-slate-400 px-4 py-2.5 hidden sm:table-cell">Poste</th>
                  <th className="text-left text-xs font-semibold text-slate-500 dark:text-slate-400 px-4 py-2.5">Contrat</th>
                  <th className="text-left text-xs font-semibold text-slate-500 dark:text-slate-400 px-4 py-2.5">Santé IA</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-700">
                {employes.map(e => (
                  <tr key={e.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-xs font-bold text-blue-700 dark:text-blue-400">
                          {e.prenom[0]}{e.nom[0]}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                            {e.prenom} {e.nom}
                          </p>
                          {e.departement && (
                            <p className="text-xs text-slate-400">{e.departement}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400 hidden sm:table-cell">
                      {e.poste || '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_CONTRAT_COLORS[e.type_contrat] || ''}`}>
                        {e.type_contrat.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3 w-32">
                      <ScoreBar score={e.score_sante} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
