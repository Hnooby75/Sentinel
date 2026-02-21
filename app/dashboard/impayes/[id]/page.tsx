// ============================================
// app/dashboard/impayes/[id]/page.tsx
// Module 2 — Détail facture + relances
// ============================================
import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { getUtilisateur } from '@/lib/supabase/getUtilisateur'
import { ArrowLeft, Euro, Calendar, User, MessageSquare } from 'lucide-react'

const STATUT_COLORS: Record<string, string> = {
  brouillon: 'bg-slate-100 text-slate-600',
  envoyee: 'bg-blue-100 text-blue-700',
  partielle: 'bg-yellow-100 text-yellow-700',
  payee: 'bg-green-100 text-green-700',
  en_retard: 'bg-orange-100 text-orange-700',
  contentieux: 'bg-red-100 text-red-700',
}

const STATUT_LABELS: Record<string, string> = {
  brouillon: 'Brouillon', envoyee: 'Envoyée', partielle: 'Partielle',
  payee: 'Payée', en_retard: 'En retard', contentieux: 'Contentieux',
}

function formatEur(n: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n)
}

export default async function FactureDetailPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const utilisateur = await getUtilisateur(user.id)
  if (!utilisateur) return null

  const { data: facture } = await supabase
    .from('factures')
    .select('*, client:clients(id, nom, email, telephone), paiements(*), relances(*)')
    .eq('id', id)
    .eq('entreprise_id', utilisateur.entreprise_id)
    .single()

  if (!facture) notFound()

  const montantPaye = (facture.paiements as any[])?.reduce((acc: number, p: any) => acc + Number(p.montant), 0) ?? 0
  const montantRestant = Number(facture.montant_ttc) - montantPaye

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/impayes" className="text-slate-400 hover:text-slate-600">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Facture {facture.numero}</h1>
          <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUT_COLORS[facture.statut]}`}>
            {STATUT_LABELS[facture.statut]}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Montants */}
        <div className="md:col-span-2 bg-white rounded-xl border border-slate-200 p-5 space-y-4">
          <h2 className="font-semibold text-slate-900">Détails financiers</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-slate-500">Montant HT</p>
              <p className="text-lg font-semibold text-slate-900">{formatEur(Number(facture.montant_ht))}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Montant TTC</p>
              <p className="text-lg font-bold text-slate-900">{formatEur(Number(facture.montant_ttc))}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Montant payé</p>
              <p className="text-lg font-semibold text-green-600">{formatEur(montantPaye)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Restant dû</p>
              <p className={`text-lg font-bold ${montantRestant > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                {formatEur(montantRestant)}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-400" />
              <div>
                <p className="text-xs text-slate-500">Émission</p>
                <p className="text-sm font-medium text-slate-800">
                  {new Date(facture.date_emission).toLocaleDateString('fr-FR')}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-400" />
              <div>
                <p className="text-xs text-slate-500">Échéance</p>
                <p className={`text-sm font-medium ${
                  new Date(facture.date_echeance) < new Date() && facture.statut !== 'payee'
                    ? 'text-orange-600' : 'text-slate-800'
                }`}>
                  {new Date(facture.date_echeance).toLocaleDateString('fr-FR')}
                </p>
              </div>
            </div>
          </div>

          {facture.notes && (
            <div className="bg-slate-50 rounded-lg px-3 py-2">
              <p className="text-xs text-slate-500 mb-1">Notes</p>
              <p className="text-sm text-slate-700">{facture.notes}</p>
            </div>
          )}
        </div>

        {/* Client */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="font-semibold text-slate-900 mb-3">Client</h2>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
              <User className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p className="font-medium text-slate-900">{(facture.client as any)?.nom}</p>
              {(facture.client as any)?.email && (
                <p className="text-xs text-slate-500 mt-0.5">{(facture.client as any).email}</p>
              )}
              {(facture.client as any)?.telephone && (
                <p className="text-xs text-slate-500">{(facture.client as any).telephone}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Paiements */}
      {(facture.paiements as any[])?.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="font-semibold text-slate-900 mb-3">Paiements reçus</h2>
          <div className="space-y-2">
            {(facture.paiements as any[]).map((p: any) => (
              <div key={p.id} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                <div>
                  <span className="text-sm font-medium text-green-600">{formatEur(Number(p.montant))}</span>
                  {p.reference && <span className="text-xs text-slate-400 ml-2">Réf: {p.reference}</span>}
                </div>
                <span className="text-xs text-slate-500">{new Date(p.date_paiement).toLocaleDateString('fr-FR')}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Relances */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-slate-900">Relances</h2>
          <span className="text-xs text-slate-400">{(facture.relances as any[])?.length ?? 0} relance(s)</span>
        </div>
        {(facture.relances as any[])?.length > 0 ? (
          <div className="space-y-2">
            {(facture.relances as any[]).map((r: any) => (
              <div key={r.id} className="flex items-center gap-3 py-2 border-b border-slate-50 last:border-0">
                <MessageSquare className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-900 capitalize">{r.type.replace(/_/g, ' ')}</p>
                  {r.notes && <p className="text-xs text-slate-500">{r.notes}</p>}
                </div>
                <span className="text-xs text-slate-400">
                  {new Date(r.date_envoi).toLocaleDateString('fr-FR')}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-400">Aucune relance envoyée</p>
        )}
      </div>
    </div>
  )
}
