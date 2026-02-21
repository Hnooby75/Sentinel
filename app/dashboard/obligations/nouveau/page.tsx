// ============================================
// app/dashboard/obligations/nouveau/page.tsx
// Module 3 — Ajouter une obligation manuellement
// ============================================
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save } from 'lucide-react'

export default function NouvelleObligationPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)
  const [form, setForm] = useState({
    libelle_custom: '',
    statut: 'a_faire',
    echeance: '',
    notes: '',
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setErreur(null)
    try {
      const res = await fetch('/api/obligations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur création')
      router.push('/dashboard/obligations')
    } catch (e: any) {
      setErreur(e.message)
    } finally {
      setLoading(false)
    }
  }

  const inputClass = "w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
  const labelClass = "block text-sm font-medium text-slate-700 mb-1"

  return (
    <div className="max-w-xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/obligations" className="text-slate-400 hover:text-slate-600">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Nouvelle obligation</h1>
          <p className="text-slate-500 text-sm">Ajout manuel d'une obligation légale</p>
        </div>
      </div>

      {erreur && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">{erreur}</div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
        <div>
          <label className={labelClass}>Libellé de l'obligation *</label>
          <input className={inputClass} required
            value={form.libelle_custom}
            onChange={e => setForm(p => ({ ...p, libelle_custom: e.target.value }))}
            placeholder="Ex: Déclaration TVA mensuelle" />
        </div>
        <div>
          <label className={labelClass}>Statut</label>
          <select className={inputClass}
            value={form.statut}
            onChange={e => setForm(p => ({ ...p, statut: e.target.value }))}>
            <option value="a_faire">À faire</option>
            <option value="en_cours">En cours</option>
            <option value="valide">Validée</option>
            <option value="non_applicable">Non applicable</option>
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
            placeholder="Références, détails spécifiques..." />
        </div>
        <button
          type="submit"
          disabled={loading || !form.libelle_custom}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white px-4 py-3 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2"
        >
          <Save className="w-4 h-4" />
          {loading ? 'Enregistrement...' : 'Enregistrer'}
        </button>
      </form>
    </div>
  )
}
