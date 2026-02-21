// ============================================
// app/dashboard/impayes/nouveau/page.tsx
// Module 2 — Création client + facture
// ============================================
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, Save, User, FileText, CheckCircle } from 'lucide-react'

type Etape = 1 | 2

export default function NouvelleFacturePage() {
  const router = useRouter()
  const [etape, setEtape] = useState<Etape>(1)
  const [loading, setLoading] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)
  const [clientId, setClientId] = useState<string | null>(null)
  const [clientCreated, setClientCreated] = useState(false)

  const [client, setClient] = useState({
    nom: '', email: '', telephone: '', siret: '', secteur: '', pays: 'FR', notes: '',
  })
  const [facture, setFacture] = useState({
    numero: `FAC-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`,
    montant_ht: '', montant_ttc: '', devise: 'EUR',
    statut: 'envoyee',
    date_emission: new Date().toISOString().split('T')[0],
    date_echeance: '', notes: '',
    client_id_existant: '',
  })

  async function creerClient() {
    setLoading(true)
    setErreur(null)
    try {
      const res = await fetch('/api/impayes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'client', client }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur création client')
      setClientId(data.id)
      setClientCreated(true)
      setEtape(2)
    } catch (e: any) {
      setErreur(e.message)
    } finally {
      setLoading(false)
    }
  }

  async function creerFacture() {
    setLoading(true)
    setErreur(null)
    try {
      const cid = clientId || facture.client_id_existant
      if (!cid) throw new Error('Client requis')

      const res = await fetch('/api/impayes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: cid,
          numero: facture.numero,
          montant_ht: parseFloat(facture.montant_ht),
          montant_ttc: parseFloat(facture.montant_ttc),
          devise: facture.devise,
          statut: facture.statut,
          date_emission: facture.date_emission,
          date_echeance: facture.date_echeance,
          notes: facture.notes,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur création facture')
      router.push('/dashboard/impayes?created=1')
    } catch (e: any) {
      setErreur(e.message)
    } finally {
      setLoading(false)
    }
  }

  const inputClass = "w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
  const labelClass = "block text-sm font-medium text-slate-700 mb-1"

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/impayes" className="text-slate-400 hover:text-slate-600">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Nouvelle facture</h1>
          <p className="text-slate-500 text-sm">Étape {etape}/2</p>
        </div>
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-2">
        {[
          { n: 1, label: 'Client', icon: User },
          { n: 2, label: 'Facture', icon: FileText },
        ].map(({ n, label, icon: Icon }) => (
          <div key={n} className="flex items-center gap-2">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium ${
              etape === n ? 'bg-blue-600 text-white' :
              etape > n ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-400'
            }`}>
              <Icon className="w-3.5 h-3.5" />
              {label}
            </div>
            {n < 2 && <ArrowRight className="w-4 h-4 text-slate-300" />}
          </div>
        ))}
      </div>

      {erreur && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
          {erreur}
        </div>
      )}

      {etape === 1 && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
          <h2 className="text-base font-semibold text-slate-900">Informations client</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className={labelClass}>Nom / Raison sociale *</label>
              <input className={inputClass} value={client.nom}
                onChange={e => setClient(p => ({ ...p, nom: e.target.value }))}
                placeholder="Acme Corporation" />
            </div>
            <div>
              <label className={labelClass}>Email</label>
              <input className={inputClass} type="email" value={client.email}
                onChange={e => setClient(p => ({ ...p, email: e.target.value }))}
                placeholder="contact@acme.fr" />
            </div>
            <div>
              <label className={labelClass}>Téléphone</label>
              <input className={inputClass} value={client.telephone}
                onChange={e => setClient(p => ({ ...p, telephone: e.target.value }))}
                placeholder="+33 1 00 00 00 00" />
            </div>
            <div>
              <label className={labelClass}>SIRET</label>
              <input className={inputClass} value={client.siret}
                onChange={e => setClient(p => ({ ...p, siret: e.target.value }))}
                placeholder="12345678900001" maxLength={14} />
            </div>
            <div>
              <label className={labelClass}>Secteur</label>
              <input className={inputClass} value={client.secteur}
                onChange={e => setClient(p => ({ ...p, secteur: e.target.value }))}
                placeholder="Tech, Commerce..." />
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass}>Notes</label>
              <textarea className={inputClass} rows={2} value={client.notes}
                onChange={e => setClient(p => ({ ...p, notes: e.target.value }))}
                placeholder="Informations complémentaires..." />
            </div>
          </div>

          <button
            onClick={creerClient}
            disabled={loading || !client.nom}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white px-4 py-3 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2"
          >
            {loading ? 'Création...' : 'Créer le client et continuer'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {etape === 2 && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
          {clientCreated && (
            <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 rounded-lg px-3 py-2 text-sm">
              <CheckCircle className="w-4 h-4" />
              Client créé avec succès.
            </div>
          )}
          <h2 className="text-base font-semibold text-slate-900">Détails de la facture</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Numéro de facture *</label>
              <input className={inputClass} value={facture.numero}
                onChange={e => setFacture(p => ({ ...p, numero: e.target.value }))} />
            </div>
            <div>
              <label className={labelClass}>Statut</label>
              <select className={inputClass} value={facture.statut}
                onChange={e => setFacture(p => ({ ...p, statut: e.target.value }))}>
                <option value="brouillon">Brouillon</option>
                <option value="envoyee">Envoyée</option>
                <option value="en_retard">En retard</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Montant HT (€) *</label>
              <input className={inputClass} type="number" step="0.01" min="0"
                value={facture.montant_ht}
                onChange={e => {
                  const ht = parseFloat(e.target.value) || 0
                  setFacture(p => ({ ...p, montant_ht: e.target.value, montant_ttc: String((ht * 1.2).toFixed(2)) }))
                }}
                placeholder="1000.00" />
            </div>
            <div>
              <label className={labelClass}>Montant TTC (€) *</label>
              <input className={inputClass} type="number" step="0.01" min="0"
                value={facture.montant_ttc}
                onChange={e => setFacture(p => ({ ...p, montant_ttc: e.target.value }))}
                placeholder="1200.00" />
            </div>
            <div>
              <label className={labelClass}>Date d'émission *</label>
              <input className={inputClass} type="date" value={facture.date_emission}
                onChange={e => setFacture(p => ({ ...p, date_emission: e.target.value }))} />
            </div>
            <div>
              <label className={labelClass}>Date d'échéance *</label>
              <input className={inputClass} type="date" value={facture.date_echeance}
                onChange={e => setFacture(p => ({ ...p, date_echeance: e.target.value }))} />
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass}>Notes</label>
              <textarea className={inputClass} rows={2} value={facture.notes}
                onChange={e => setFacture(p => ({ ...p, notes: e.target.value }))}
                placeholder="Référence commande, conditions..." />
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={() => setEtape(1)}
              className="px-4 py-2.5 border border-slate-200 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-50 flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" /> Retour
            </button>
            <button
              onClick={creerFacture}
              disabled={loading || !facture.montant_ttc || !facture.date_echeance}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              {loading ? 'Enregistrement...' : 'Enregistrer la facture'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
