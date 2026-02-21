// ============================================
// app/dashboard/obligations/[id]/page.tsx
// Module 3 — Détail et mise à jour d'une obligation
// ============================================
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save, CheckCircle } from 'lucide-react'

const STATUT_OPTIONS = [
  { value: 'a_faire', label: 'À faire' },
  { value: 'en_cours', label: 'En cours' },
  { value: 'valide', label: 'Validée' },
  { value: 'en_retard', label: 'En retard' },
  { value: 'non_applicable', label: 'Non applicable' },
]

export default function ObligationDetailPage({
  params
}: {
  params: { id: string }
}) {
  const router = useRouter()
  const [obligation, setObligation] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)
  const [form, setForm] = useState({ statut: '', echeance: '', notes: '' })

  useEffect(() => {
    fetch(`/api/obligations/${params.id}`)
      .then(r => r.json())
      .then(data => {
        setObligation(data)
        setForm({
          statut: data.statut || 'a_faire',
          echeance: data.echeance || '',
          notes: data.notes || '',
        })
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [params.id])

  async function handleSave() {
    setSaving(true)
    setErreur(null)
    setSaved(false)
    try {
      const res = await fetch(`/api/obligations/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur mise à jour')
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (e: any) {
      setErreur(e.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="text-center py-20 text-slate-400">Chargement...</div>
  if (!obligation) return <div className="text-center py-20 text-slate-400">Obligation introuvable</div>

  const inputClass = "w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
  const labelClass = "block text-sm font-medium text-slate-700 mb-1"

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/obligations" className="text-slate-400 hover:text-slate-600">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            {obligation.type_obligation?.libelle || obligation.libelle_custom}
          </h1>
          {obligation.type_obligation?.categorie && (
            <p className="text-sm text-slate-500 capitalize">{obligation.type_obligation.categorie}</p>
          )}
        </div>
      </div>

      {obligation.type_obligation?.source_legale && (
        <div className="bg-slate-50 rounded-lg px-4 py-3">
          <p className="text-xs text-slate-500">Référence légale</p>
          <p className="text-sm font-medium text-slate-700">{obligation.type_obligation.source_legale}</p>
        </div>
      )}

      {erreur && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">{erreur}</div>
      )}
      {saved && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 rounded-lg px-4 py-3 text-sm">
          <CheckCircle className="w-4 h-4" /> Obligation mise à jour.
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
        <h2 className="font-semibold text-slate-900">Mise à jour</h2>
        <div>
          <label className={labelClass}>Statut</label>
          <select className={inputClass}
            value={form.statut}
            onChange={e => setForm(p => ({ ...p, statut: e.target.value }))}>
            {STATUT_OPTIONS.map(s => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>Date d'échéance</label>
          <input className={inputClass} type="date"
            value={form.echeance}
            onChange={e => setForm(p => ({ ...p, echeance: e.target.value }))} />
        </div>
        <div>
          <label className={labelClass}>Notes</label>
          <textarea className={inputClass} rows={3}
            value={form.notes}
            onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
            placeholder="Commentaires, pièces jointes..." />
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 text-white px-4 py-3 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Enregistrement...' : 'Mettre à jour'}
        </button>
      </div>
    </div>
  )
}
