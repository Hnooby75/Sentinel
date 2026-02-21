// ============================================
// app/dashboard/contrats/nouveau/page.tsx
// Module 4 — Dépôt et analyse d'un contrat
// ============================================
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Search, AlertCircle } from 'lucide-react'

const TYPE_OPTIONS = [
  { value: 'prestataire', label: 'Contrat prestataire' },
  { value: 'client', label: 'Contrat client' },
  { value: 'partenariat', label: 'Partenariat' },
  { value: 'emploi', label: 'Contrat de travail' },
  { value: 'bail', label: 'Bail commercial / professionnel' },
  { value: 'cgu', label: 'CGU / CGV' },
  { value: 'autre', label: 'Autre' },
]

export default function NouveauContratPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)
  const [form, setForm] = useState({
    nom: '',
    type_contrat: 'prestataire',
    contenu_texte: '',
  })

  const longueurTexte = form.contenu_texte.trim().length
  const estimationOK = longueurTexte >= 100

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!estimationOK) {
      setErreur('Veuillez coller au minimum 100 caractères du contrat.')
      return
    }
    setLoading(true)
    setErreur(null)
    try {
      const res = await fetch('/api/contrats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur analyse')
      router.push(`/dashboard/contrats/${data.document.id}`)
    } catch (e: any) {
      setErreur(e.message)
    } finally {
      setLoading(false)
    }
  }

  const inputClass = "w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
  const labelClass = "block text-sm font-medium text-slate-700 mb-1"

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/contrats" className="text-slate-400 hover:text-slate-600">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Analyser un contrat</h1>
          <p className="text-slate-500 text-sm">Copiez-collez le texte du contrat — analyse en quelques secondes</p>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 flex items-start gap-3">
        <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
        <div className="text-sm text-blue-800">
          <p className="font-medium">Analyse par règles (sans IA externe)</p>
          <p className="text-xs text-blue-600 mt-0.5">
            Votre contrat est analysé localement — aucune donnée n'est envoyée à un service tiers.
            L'analyse détecte les clauses contractuelles à risque par pattern matching.
          </p>
        </div>
      </div>

      {erreur && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">{erreur}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className={labelClass}>Nom du contrat *</label>
              <input className={inputClass} required
                value={form.nom}
                onChange={e => setForm(p => ({ ...p, nom: e.target.value }))}
                placeholder="Ex: Contrat de prestation InfoSoft SA — 2024" />
            </div>
            <div>
              <label className={labelClass}>Type de contrat</label>
              <select className={inputClass}
                value={form.type_contrat}
                onChange={e => setForm(p => ({ ...p, type_contrat: e.target.value }))}>
                {TYPE_OPTIONS.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className={labelClass.replace(' mb-1', '')}>Texte du contrat *</label>
              <span className={`text-xs ${longueurTexte < 100 ? 'text-slate-400' : 'text-green-600 font-medium'}`}>
                {longueurTexte} caractères
              </span>
            </div>
            <textarea
              className={`${inputClass} font-mono text-xs`}
              rows={16}
              value={form.contenu_texte}
              onChange={e => setForm(p => ({ ...p, contenu_texte: e.target.value }))}
              placeholder="Collez ici le texte de votre contrat...

Astuce : Copiez tout le contrat (Ctrl+A puis Ctrl+C) depuis votre éditeur de texte ou PDF."
            />
            {!estimationOK && longueurTexte > 0 && (
              <p className="text-xs text-amber-600 mt-1">
                Minimum 100 caractères requis ({100 - longueurTexte} restants)
              </p>
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || !form.nom || !estimationOK}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white px-4 py-3 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2"
        >
          <Search className="w-4 h-4" />
          {loading ? 'Analyse en cours...' : 'Lancer l\'analyse'}
        </button>
      </form>
    </div>
  )
}
