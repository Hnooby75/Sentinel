'use client'

// ============================================
// app/dashboard/copilot-operations/page.tsx
// Opérations IA — Tâches & Stratégie
// ============================================
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Workflow, Plus, RefreshCw, Loader2,
  CheckCircle, XCircle, AlertTriangle, Zap
} from 'lucide-react'
import { ScoreGauge } from '@/components/ui/ScoreGauge'

interface StrategyReport {
  score_productivite: number | null
  taches_bloquees: number | null
  goulots: Array<{ module: string; description: string; impact: string }>
  synthese_executive: string | null
  actions_prioritaires: Array<{ priorite: number; action: string; module: string; delai: string; impact: string }>
  genere_a: string
}

interface Tache {
  id: string
  titre: string
  statut: string
  priorite: string
  priorite_ia: string | null
  score_impact: number | null
  module_origine: string | null
  echeance: string | null
  assigne_a: string | null
}

const STATUT_COLORS: Record<string, string> = {
  a_faire:  'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
  en_cours: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  bloquee:  'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  terminee: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  annulee:  'bg-slate-100 text-slate-400 dark:bg-slate-700 dark:text-slate-500',
}

const PRIORITE_COLORS: Record<string, string> = {
  critique: 'text-red-600 dark:text-red-400',
  haute:    'text-orange-600 dark:text-orange-400',
  normale:  'text-blue-600 dark:text-blue-400',
  faible:   'text-slate-500 dark:text-slate-400',
}

export default function CopilotOperationsPage() {
  const router = useRouter()
  const [rapport, setRapport] = useState<StrategyReport | null>(null)
  const [taches, setTaches] = useState<Tache[]>([])
  const [loading, setLoading] = useState(true)
  const [analysing, setAnalysing] = useState(false)
  const [generatingReport, setGeneratingReport] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    titre: '', description: '', priorite: 'normale', echeance: '', module_origine: '',
  })

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [opsRes, tachesRes] = await Promise.all([
        fetch('/api/ai/analyse-operations'),
        fetch('/api/taches'),
      ])
      const ops = await opsRes.json()
      const tachesData = await tachesRes.json()
      setRapport(ops.rapport)
      setTaches(tachesData.taches || [])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  async function lancerAnalyse() {
    setAnalysing(true)
    setMessage(null)
    try {
      const res = await fetch('/api/ai/analyse-operations', { method: 'POST' })
      const json = await res.json()
      if (json.error) setMessage({ type: 'error', text: json.error })
      else {
        setMessage({ type: 'success', text: json.cached ? 'Cache < 1h' : 'Analyse opérations terminée !' })
        await fetchData()
        router.refresh()
      }
    } catch { setMessage({ type: 'error', text: 'Erreur analyse' }) }
    finally { setAnalysing(false) }
  }

  async function genererRapportHebdo() {
    setGeneratingReport(true)
    setMessage(null)
    try {
      const res = await fetch('/api/ai/analyse-operations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'hebdomadaire' }),
      })
      const json = await res.json()
      if (json.error) setMessage({ type: 'error', text: json.error })
      else setMessage({ type: 'success', text: 'Rapport hebdomadaire généré !' })
    } finally { setGeneratingReport(false) }
  }

  async function creerTache(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch('/api/taches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          echeance: form.echeance || null,
          description: form.description || null,
          module_origine: form.module_origine || null,
        }),
      })
      const json = await res.json()
      if (json.error) setMessage({ type: 'error', text: json.error })
      else {
        setMessage({ type: 'success', text: 'Tâche créée !' })
        setShowForm(false)
        setForm({ titre: '', description: '', priorite: 'normale', echeance: '', module_origine: '' })
        await fetchData()
      }
    } finally { setSaving(false) }
  }

  async function changerStatutTache(id: string, statut: string) {
    await fetch(`/api/taches/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ statut }),
    })
    await fetchData()
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 text-blue-500 animate-spin" /></div>
  }

  const tachesActives = taches.filter(t => t.statut !== 'terminee' && t.statut !== 'annulee')
  const tachesBloquees = taches.filter(t => t.statut === 'bloquee')

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Opérations IA</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">Tâches, goulots et stratégie</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors">
            <Plus className="w-4 h-4" /> Tâche
          </button>
          <button onClick={genererRapportHebdo} disabled={generatingReport}
            className="flex items-center gap-1.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors">
            {generatingReport ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
            Rapport hebdo
          </button>
          <button onClick={lancerAnalyse} disabled={analysing}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors">
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

      {/* Formulaire tâche */}
      {showForm && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
          <h2 className="font-semibold text-slate-900 dark:text-slate-100 mb-4">Nouvelle tâche</h2>
          <form onSubmit={creerTache} className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Titre<span className="text-red-500 ml-0.5">*</span></label>
              <input type="text" required value={form.titre} onChange={e => setForm(p => ({ ...p, titre: e.target.value }))}
                className="w-full px-3 py-1.5 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Priorité</label>
              <select value={form.priorite} onChange={e => setForm(p => ({ ...p, priorite: e.target.value }))}
                className="w-full px-3 py-1.5 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100">
                {['critique', 'haute', 'normale', 'faible'].map(pr => <option key={pr} value={pr}>{pr.charAt(0).toUpperCase() + pr.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Échéance</label>
              <input type="datetime-local" value={form.echeance} onChange={e => setForm(p => ({ ...p, echeance: e.target.value }))}
                className="w-full px-3 py-1.5 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Module</label>
              <input type="text" placeholder="finance, rh, crm..." value={form.module_origine} onChange={e => setForm(p => ({ ...p, module_origine: e.target.value }))}
                className="w-full px-3 py-1.5 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="col-span-2 flex gap-2 justify-end">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">Annuler</button>
              <button type="submit" disabled={saving} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium">
                {saving && <Loader2 className="w-3 h-3 animate-spin" />} Créer
              </button>
            </div>
          </form>
        </div>
      )}

      {/* KPIs + Score */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 flex flex-col items-center">
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-2">Productivité</p>
          <ScoreGauge score={rapport?.score_productivite ?? 0} size={80} />
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-2">Tâches actives</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{tachesActives.length}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-2">Tâches bloquées</p>
          <p className={`text-2xl font-bold ${tachesBloquees.length > 0 ? 'text-red-600 dark:text-red-400' : 'text-slate-900 dark:text-slate-100'}`}>
            {tachesBloquees.length}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-2">Goulots détectés</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            {rapport?.goulots?.length ?? 0}
          </p>
        </div>
      </div>

      {/* Synthèse executive */}
      {rapport?.synthese_executive && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-4 h-4 text-amber-500" />
            <h2 className="font-semibold text-slate-900 dark:text-slate-100 text-sm">Synthèse executive IA</h2>
            <span className="text-xs text-slate-400 dark:text-slate-500 ml-auto">
              {new Date(rapport.genere_a).toLocaleDateString('fr-FR', {
                day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit',
              })}
            </span>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{rapport.synthese_executive}</p>
        </div>
      )}

      {/* Goulots */}
      {rapport?.goulots && rapport.goulots.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <h2 className="font-semibold text-slate-900 dark:text-slate-100 text-sm">Goulots détectés</h2>
          </div>
          <div className="space-y-2">
            {rapport.goulots.map((g, i) => (
              <div key={i} className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase">{g.module}</span>
                  <span className="text-sm text-amber-800 dark:text-amber-300">{g.description}</span>
                </div>
                <p className="text-xs text-amber-600 dark:text-amber-500 mt-1">Impact : {g.impact}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions prioritaires IA */}
      {rapport?.actions_prioritaires && rapport.actions_prioritaires.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
          <h2 className="font-semibold text-slate-900 dark:text-slate-100 mb-3 text-sm">Actions prioritaires IA</h2>
          <div className="space-y-2">
            {rapport.actions_prioritaires.map((a, i) => (
              <div key={i} className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                <span className="w-6 h-6 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center font-bold flex-shrink-0">
                  {a.priorite}
                </span>
                <div className="flex-1">
                  <p className="text-sm text-slate-700 dark:text-slate-300">{a.action}</p>
                  <div className="flex items-center gap-3 mt-1">
                    {a.module && <span className="text-xs text-slate-500">{a.module}</span>}
                    {a.delai && <span className="text-xs text-blue-600 dark:text-blue-400">{a.delai}</span>}
                  </div>
                </div>
                {a.impact && <p className="text-xs text-slate-400 flex-shrink-0 max-w-32 text-right">{a.impact}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tableau tâches */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 dark:border-slate-700">
          <h2 className="font-semibold text-slate-900 dark:text-slate-100">
            Tâches ({taches.length})
          </h2>
        </div>
        {taches.length === 0 ? (
          <div className="py-10 text-center">
            <Workflow className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm text-slate-500 dark:text-slate-400">Aucune tâche</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-100 dark:border-slate-700">
                  <th className="text-left text-xs font-semibold text-slate-500 dark:text-slate-400 px-4 py-2.5">Tâche</th>
                  <th className="text-left text-xs font-semibold text-slate-500 dark:text-slate-400 px-4 py-2.5 hidden sm:table-cell">Module</th>
                  <th className="text-left text-xs font-semibold text-slate-500 dark:text-slate-400 px-4 py-2.5">Priorité</th>
                  <th className="text-left text-xs font-semibold text-slate-500 dark:text-slate-400 px-4 py-2.5">Statut</th>
                  <th className="text-left text-xs font-semibold text-slate-500 dark:text-slate-400 px-4 py-2.5 hidden lg:table-cell">Échéance</th>
                  <th className="text-right text-xs font-semibold text-slate-500 dark:text-slate-400 px-4 py-2.5">Impact</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-700">
                {taches.slice(0, 20).map(t => (
                  <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                    <td className="px-4 py-2.5">
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate max-w-48">{t.titre}</p>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-slate-500 dark:text-slate-400 hidden sm:table-cell">
                      {t.module_origine || '—'}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`text-xs font-medium ${PRIORITE_COLORS[t.priorite_ia || t.priorite] || ''}`}>
                        {(t.priorite_ia || t.priorite).charAt(0).toUpperCase() + (t.priorite_ia || t.priorite).slice(1)}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <select
                        value={t.statut}
                        onChange={e => changerStatutTache(t.id, e.target.value)}
                        className={`text-xs px-2 py-0.5 rounded-full border-0 font-medium cursor-pointer ${STATUT_COLORS[t.statut] || ''}`}
                      >
                        {['a_faire', 'en_cours', 'bloquee', 'terminee', 'annulee'].map(s => (
                          <option key={s} value={s}>{s.replace('_', ' ')}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-2.5 text-xs hidden lg:table-cell">
                      {t.echeance ? (
                        <span className={new Date(t.echeance) < new Date() ? 'text-red-500 font-medium' : 'text-slate-500 dark:text-slate-400'}>
                          {new Date(t.echeance).toLocaleDateString('fr-FR')}
                        </span>
                      ) : <span className="text-slate-400">—</span>}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      {t.score_impact != null ? (
                        <span className={`text-xs font-bold ${
                          t.score_impact >= 70 ? 'text-red-600 dark:text-red-400' :
                          t.score_impact >= 40 ? 'text-amber-600 dark:text-amber-400' :
                          'text-slate-500 dark:text-slate-400'
                        }`}>{t.score_impact}</span>
                      ) : <span className="text-xs text-slate-400">—</span>}
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
