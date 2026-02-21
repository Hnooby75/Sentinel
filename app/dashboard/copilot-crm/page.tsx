'use client'

// ============================================
// app/dashboard/copilot-crm/page.tsx
// CRM & Ventes IA — Pipeline & Leads
// ============================================
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Target, Plus, RefreshCw, Loader2,
  CheckCircle, XCircle, AlertTriangle, TrendingUp
} from 'lucide-react'

interface SalesPrediction {
  revenu_prevu_30j: number | null
  revenu_prevu_90j: number | null
  nb_deals_prevus: number | null
  taux_conversion_prevu: number | null
  deals_en_danger: Array<{ titre: string; montant: number; raison: string; score_risque: number }>
  recommandations: Array<{ priorite: string; action: string; impact_estime: string }>
  analyse_texte: string | null
  genere_a: string
}

interface Lead {
  id: string
  nom: string
  email: string | null
  entreprise_nom: string | null
  source: string
  statut: string
  score_ia: number | null
}

interface Opportunite {
  id: string
  titre: string
  montant_estime: number | null
  probabilite: number
  etape: string
  date_cloture_prevue: string | null
}

interface KPIs {
  [etape: string]: { nb: number; montant: number }
}

const ETAPES = ['prospection', 'qualification', 'proposition', 'negociation', 'gagne', 'perdu'] as const

const ETAPE_COLORS: Record<string, string> = {
  prospection:    'border-slate-300 dark:border-slate-600',
  qualification:  'border-blue-300 dark:border-blue-700',
  proposition:    'border-purple-300 dark:border-purple-700',
  negociation:    'border-amber-300 dark:border-amber-700',
  gagne:          'border-green-300 dark:border-green-700',
  perdu:          'border-red-300 dark:border-red-700',
}

const SOURCE_LABELS: Record<string, string> = {
  site: 'Site web', referral: 'Référral', cold: 'Cold outreach', event: 'Événement', autre: 'Autre',
}

function formatEur(n: number | null) {
  if (n == null) return '—'
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency', currency: 'EUR', maximumFractionDigits: 0,
  }).format(n)
}

export default function CopilotCRMPage() {
  const router = useRouter()
  const [prediction, setPrediction] = useState<SalesPrediction | null>(null)
  const [leads, setLeads] = useState<Lead[]>([])
  const [opportunites, setOpportunites] = useState<Opportunite[]>([])
  const [kpis, setKpis] = useState<KPIs>({})
  const [pipelineTotal, setPipelineTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [analysing, setAnalysing] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [showLeadForm, setShowLeadForm] = useState(false)
  const [showDealForm, setShowDealForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [leadForm, setLeadForm] = useState({ nom: '', email: '', telephone: '', entreprise_nom: '', source: 'site', notes: '' })
  const [dealForm, setDealForm] = useState({ titre: '', montant_estime: '', probabilite: '50', etape: 'prospection', date_cloture_prevue: '' })

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [crmRes, leadsRes, oppsRes] = await Promise.all([
        fetch('/api/ai/analyse-crm'),
        fetch('/api/crm/leads'),
        fetch('/api/crm/opportunites'),
      ])
      const crm = await crmRes.json()
      const leadsData = await leadsRes.json()
      const oppsData = await oppsRes.json()
      setPrediction(crm.prediction)
      setLeads(leadsData.leads || [])
      setOpportunites(oppsData.opportunites || [])
      setKpis(oppsData.kpis || {})
      setPipelineTotal(oppsData.pipeline_total || 0)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  async function lancerAnalyse() {
    setAnalysing(true)
    setMessage(null)
    try {
      const res = await fetch('/api/ai/analyse-crm', { method: 'POST' })
      const json = await res.json()
      if (json.error) setMessage({ type: 'error', text: json.error })
      else {
        setMessage({ type: 'success', text: json.cached ? 'Cache < 1h' : 'Analyse CRM terminée !' })
        await fetchData()
        router.refresh()
      }
    } catch { setMessage({ type: 'error', text: 'Erreur analyse' }) }
    finally { setAnalysing(false) }
  }

  async function creerLead(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch('/api/crm/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...leadForm, email: leadForm.email || null, telephone: leadForm.telephone || null, entreprise_nom: leadForm.entreprise_nom || null, notes: leadForm.notes || null }),
      })
      const json = await res.json()
      if (json.error) setMessage({ type: 'error', text: json.error })
      else {
        setMessage({ type: 'success', text: 'Lead créé + scoring IA en cours !' })
        setShowLeadForm(false)
        setLeadForm({ nom: '', email: '', telephone: '', entreprise_nom: '', source: 'site', notes: '' })
        await fetchData()
      }
    } finally { setSaving(false) }
  }

  async function creerDeal(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch('/api/crm/opportunites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titre: dealForm.titre,
          montant_estime: dealForm.montant_estime ? Number(dealForm.montant_estime) : null,
          probabilite: Number(dealForm.probabilite),
          etape: dealForm.etape,
          date_cloture_prevue: dealForm.date_cloture_prevue || null,
        }),
      })
      const json = await res.json()
      if (json.error) setMessage({ type: 'error', text: json.error })
      else {
        setMessage({ type: 'success', text: 'Opportunité créée !' })
        setShowDealForm(false)
        setDealForm({ titre: '', montant_estime: '', probabilite: '50', etape: 'prospection', date_cloture_prevue: '' })
        await fetchData()
      }
    } finally { setSaving(false) }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 text-blue-500 animate-spin" /></div>
  }

  const leadsChauds = leads.filter(l => (l.score_ia ?? 0) >= 70).slice(0, 5)

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">CRM & Ventes IA</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">Pipeline, leads et prévisions commerciales</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowLeadForm(!showLeadForm)}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors">
            <Plus className="w-4 h-4" /> Lead
          </button>
          <button onClick={() => setShowDealForm(!showDealForm)}
            className="flex items-center gap-1.5 bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors">
            <Plus className="w-4 h-4" /> Deal
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

      {/* Formulaire Lead */}
      {showLeadForm && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
          <h2 className="font-semibold text-slate-900 dark:text-slate-100 mb-4">Nouveau lead</h2>
          <form onSubmit={creerLead} className="grid grid-cols-2 gap-3">
            {[
              { key: 'nom', label: 'Nom complet', required: true },
              { key: 'email', label: 'Email' },
              { key: 'telephone', label: 'Téléphone' },
              { key: 'entreprise_nom', label: 'Entreprise' },
            ].map(f => (
              <div key={f.key}>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">{f.label}{f.required && <span className="text-red-500 ml-0.5">*</span>}</label>
                <input type="text" required={f.required} value={leadForm[f.key as keyof typeof leadForm]}
                  onChange={e => setLeadForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                  className="w-full px-3 py-1.5 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            ))}
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Source</label>
              <select value={leadForm.source} onChange={e => setLeadForm(prev => ({ ...prev, source: e.target.value }))}
                className="w-full px-3 py-1.5 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100">
                {Object.entries(SOURCE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div className="col-span-2 flex gap-2 justify-end">
              <button type="button" onClick={() => setShowLeadForm(false)} className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">Annuler</button>
              <button type="submit" disabled={saving} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium">
                {saving && <Loader2 className="w-3 h-3 animate-spin" />} Créer
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Formulaire Deal */}
      {showDealForm && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
          <h2 className="font-semibold text-slate-900 dark:text-slate-100 mb-4">Nouvelle opportunité</h2>
          <form onSubmit={creerDeal} className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Titre<span className="text-red-500 ml-0.5">*</span></label>
              <input type="text" required value={dealForm.titre} onChange={e => setDealForm(prev => ({ ...prev, titre: e.target.value }))}
                className="w-full px-3 py-1.5 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Montant estimé (€)</label>
              <input type="number" value={dealForm.montant_estime} onChange={e => setDealForm(prev => ({ ...prev, montant_estime: e.target.value }))}
                className="w-full px-3 py-1.5 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Probabilité (%)</label>
              <input type="number" min="0" max="100" value={dealForm.probabilite} onChange={e => setDealForm(prev => ({ ...prev, probabilite: e.target.value }))}
                className="w-full px-3 py-1.5 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Étape</label>
              <select value={dealForm.etape} onChange={e => setDealForm(prev => ({ ...prev, etape: e.target.value }))}
                className="w-full px-3 py-1.5 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100">
                {ETAPES.map(et => <option key={et} value={et}>{et.charAt(0).toUpperCase() + et.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Clôture prévue</label>
              <input type="date" value={dealForm.date_cloture_prevue} onChange={e => setDealForm(prev => ({ ...prev, date_cloture_prevue: e.target.value }))}
                className="w-full px-3 py-1.5 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="col-span-2 flex gap-2 justify-end">
              <button type="button" onClick={() => setShowDealForm(false)} className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">Annuler</button>
              <button type="submit" disabled={saving} className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium">
                {saving && <Loader2 className="w-3 h-3 animate-spin" />} Créer
              </button>
            </div>
          </form>
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-2">Pipeline total</p>
          <p className="text-xl font-bold text-slate-900 dark:text-slate-100">{formatEur(pipelineTotal)}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-2">Deals actifs</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            {opportunites.filter(o => o.etape !== 'gagne' && o.etape !== 'perdu').length}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-2">Revenu prévu 30j</p>
          <p className="text-xl font-bold text-slate-900 dark:text-slate-100">{formatEur(prediction?.revenu_prevu_30j ?? null)}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-2">Taux conversion prévu</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            {prediction?.taux_conversion_prevu != null ? `${prediction.taux_conversion_prevu}%` : '—'}
          </p>
        </div>
      </div>

      {/* Pipeline Kanban */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
        <h2 className="font-semibold text-slate-900 dark:text-slate-100 mb-4 text-sm">Pipeline Kanban</h2>
        <div className="overflow-x-auto">
          <div className="flex gap-3 min-w-max">
            {ETAPES.map(etape => {
              const etapeOps = opportunites.filter(o => o.etape === etape)
              const etapeKpi = kpis[etape] || { nb: 0, montant: 0 }
              return (
                <div key={etape} className={`w-52 flex-shrink-0 rounded-lg border-t-4 bg-slate-50 dark:bg-slate-700/50 ${ETAPE_COLORS[etape]} border border-slate-200 dark:border-slate-700`}>
                  <div className="p-3 border-b border-slate-200 dark:border-slate-600">
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase">{etape}</p>
                    <div className="flex items-center justify-between mt-0.5">
                      <span className="text-xs text-slate-500">{etapeKpi.nb} deal(s)</span>
                      <span className="text-xs font-medium text-slate-600 dark:text-slate-400">{formatEur(etapeKpi.montant)}</span>
                    </div>
                  </div>
                  <div className="p-2 space-y-2 min-h-20">
                    {etapeOps.slice(0, 5).map(o => (
                      <div key={o.id} className="bg-white dark:bg-slate-800 rounded-lg p-2 border border-slate-200 dark:border-slate-600 shadow-sm">
                        <p className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate">{o.titre}</p>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-xs text-slate-500">{formatEur(o.montant_estime)}</span>
                          <span className="text-xs text-slate-400">{o.probabilite}%</span>
                        </div>
                      </div>
                    ))}
                    {etapeOps.length === 0 && (
                      <p className="text-xs text-slate-400 dark:text-slate-500 text-center py-3">Vide</p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Leads chauds */}
      {leadsChauds.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-emerald-500" />
            <h2 className="font-semibold text-slate-900 dark:text-slate-100 text-sm">Leads chauds (score ≥ 70)</h2>
          </div>
          <div className="space-y-2">
            {leadsChauds.map(l => (
              <div key={l.id} className="flex items-center justify-between p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{l.nom}</p>
                  {l.entreprise_nom && <p className="text-xs text-slate-500">{l.entreprise_nom}</p>}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-500">{SOURCE_LABELS[l.source] || l.source}</span>
                  {l.score_ia != null && (
                    <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/40 px-2 py-0.5 rounded-full">
                      {l.score_ia}/100
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Deals en danger */}
      {prediction?.deals_en_danger && prediction.deals_en_danger.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <h2 className="font-semibold text-slate-900 dark:text-slate-100 text-sm">
              Deals en danger ({prediction.deals_en_danger.length})
            </h2>
          </div>
          <div className="space-y-2">
            {prediction.deals_en_danger.map((d, i) => (
              <div key={i} className="flex items-start gap-3 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-amber-800 dark:text-amber-300">{d.titre}</p>
                    <span className="text-sm font-bold text-amber-700 dark:text-amber-400">{formatEur(d.montant)}</span>
                  </div>
                  <p className="text-xs text-amber-600 dark:text-amber-500 mt-0.5">{d.raison}</p>
                </div>
                <span className="text-xs font-bold text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30 px-2 py-0.5 rounded-full flex-shrink-0">
                  Risque {d.score_risque}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
