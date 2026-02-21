// ============================================
// app/dashboard/financier/saisie/page.tsx
// Module 5 — Saisie mensuelle des données financières
// ============================================
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save, TrendingUp } from 'lucide-react'

function premierJourMois(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`
}

export default function SaisieMensuelPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)

  const now = new Date()
  const [form, setForm] = useState({
    mois: premierJourMois(now),
    ca_mensuel: '',
    charges_fixes: '',
    charges_variables: '',
    tresorerie: '',
    notes: '',
  })

  const ca = parseFloat(form.ca_mensuel) || 0
  const cf = parseFloat(form.charges_fixes) || 0
  const cv = parseFloat(form.charges_variables) || 0
  const marge = ca - cf - cv
  const tauxCharges = ca > 0 ? Math.round(((cf + cv) / ca) * 100) : 0

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setErreur(null)
    try {
      const res = await fetch('/api/financier', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mois: form.mois,
          ca_mensuel: parseFloat(form.ca_mensuel) || 0,
          charges_fixes: parseFloat(form.charges_fixes) || 0,
          charges_variables: parseFloat(form.charges_variables) || 0,
          tresorerie: parseFloat(form.tresorerie) || 0,
          notes: form.notes,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur enregistrement')

      // Recalcul des indicateurs en arrière-plan
      fetch('/api/financier/indicateurs', { method: 'POST' }).catch(() => {})

      router.push('/dashboard/financier')
    } catch (e: any) {
      setErreur(e.message)
    } finally {
      setLoading(false)
    }
  }

  const inputClass = "w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
  const labelClass = "block text-sm font-medium text-slate-700 mb-1"

  // Mois disponibles (12 derniers mois)
  const moisOptions = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    return {
      value: premierJourMois(d),
      label: d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }),
    }
  })

  return (
    <div className="max-w-xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/financier" className="text-slate-400 hover:text-slate-600">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Saisie mensuelle</h1>
          <p className="text-slate-500 text-sm">Données financières du mois</p>
        </div>
      </div>

      {erreur && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">{erreur}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
          <div>
            <label className={labelClass}>Mois concerné</label>
            <select className={inputClass} value={form.mois}
              onChange={e => setForm(p => ({ ...p, mois: e.target.value }))}>
              {moisOptions.map(m => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelClass}>Chiffre d'affaires mensuel (€) *</label>
            <input className={inputClass} type="number" step="0.01" min="0" required
              value={form.ca_mensuel}
              onChange={e => setForm(p => ({ ...p, ca_mensuel: e.target.value }))}
              placeholder="50000" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Charges fixes (€)</label>
              <input className={inputClass} type="number" step="0.01" min="0"
                value={form.charges_fixes}
                onChange={e => setForm(p => ({ ...p, charges_fixes: e.target.value }))}
                placeholder="Loyer, salaires..." />
            </div>
            <div>
              <label className={labelClass}>Charges variables (€)</label>
              <input className={inputClass} type="number" step="0.01" min="0"
                value={form.charges_variables}
                onChange={e => setForm(p => ({ ...p, charges_variables: e.target.value }))}
                placeholder="Fournisseurs..." />
            </div>
          </div>

          <div>
            <label className={labelClass}>Trésorerie disponible (€) *</label>
            <input className={inputClass} type="number" step="0.01" required
              value={form.tresorerie}
              onChange={e => setForm(p => ({ ...p, tresorerie: e.target.value }))}
              placeholder="Solde bancaire total" />
          </div>

          <div>
            <label className={labelClass}>Notes</label>
            <textarea className={inputClass} rows={2}
              value={form.notes}
              onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
              placeholder="Événements particuliers ce mois..." />
          </div>
        </div>

        {/* Aperçu temps réel */}
        {(ca > 0 || cf > 0 || cv > 0) && (
          <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
              <TrendingUp className="w-4 h-4 text-blue-500" />
              Aperçu
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Marge brute</span>
                <span className={`font-semibold ${marge >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {marge.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Taux de charges</span>
                <span className={`font-semibold ${tauxCharges < 65 ? 'text-green-600' : tauxCharges < 80 ? 'text-yellow-600' : 'text-red-600'}`}>
                  {tauxCharges}%
                </span>
              </div>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !form.ca_mensuel || !form.tresorerie}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white px-4 py-3 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2"
        >
          <Save className="w-4 h-4" />
          {loading ? 'Enregistrement...' : 'Enregistrer'}
        </button>
      </form>
    </div>
  )
}
