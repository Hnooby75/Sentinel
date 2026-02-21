// ============================================
// app/dashboard/impayes/page.tsx
// Module 2 — Impayés : liste factures + KPIs
// ============================================
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getUtilisateur } from '@/lib/supabase/getUtilisateur'
import { Plus, AlertTriangle, CheckCircle, Clock, TrendingDown, Euro } from 'lucide-react'

const STATUT_COLORS: Record<string, string> = {
  brouillon: 'bg-slate-100 text-slate-600',
  envoyee: 'bg-blue-100 text-blue-700',
  partielle: 'bg-yellow-100 text-yellow-700',
  payee: 'bg-green-100 text-green-700',
  en_retard: 'bg-orange-100 text-orange-700',
  contentieux: 'bg-red-100 text-red-700',
}

const STATUT_LABELS: Record<string, string> = {
  brouillon: 'Brouillon',
  envoyee: 'Envoyée',
  partielle: 'Partielle',
  payee: 'Payée',
  en_retard: 'En retard',
  contentieux: 'Contentieux',
}

function formatEur(n: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)
}

export default async function ImpayesPage({
  searchParams
}: {
  searchParams: Promise<{ statut?: string; created?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const utilisateur = await getUtilisateur(user.id)
  if (!utilisateur) return null

  let query = supabase
    .from('factures')
    .select('id, numero, montant_ttc, statut, date_emission, date_echeance, client:clients(nom)')
    .eq('entreprise_id', utilisateur.entreprise_id)
    .order('date_echeance', { ascending: false })

  if (params.statut) query = query.eq('statut', params.statut)

  const { data: factures } = await query

  // KPIs
  const { data: toutes } = await supabase
    .from('factures')
    .select('montant_ttc, statut')
    .eq('entreprise_id', utilisateur.entreprise_id)

  const montantTotal = toutes?.reduce((acc, f) => acc + Number(f.montant_ttc), 0) ?? 0
  const montantRisque = toutes?.filter(f => ['en_retard', 'contentieux'].includes(f.statut))
    .reduce((acc, f) => acc + Number(f.montant_ttc), 0) ?? 0
  const nbEnRetard = toutes?.filter(f => f.statut === 'en_retard').length ?? 0
  const nbContentieux = toutes?.filter(f => f.statut === 'contentieux').length ?? 0

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Protection contre les impayés</h1>
          <p className="text-slate-500 text-sm mt-0.5">Suivi des factures et scoring de fiabilité clients</p>
        </div>
        <Link
          href="/dashboard/impayes/nouveau"
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nouvelle facture
        </Link>
      </div>

      {params.created && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3 text-sm">
          <CheckCircle className="w-4 h-4" />
          Facture créée avec succès.
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Euro className="w-4 h-4 text-slate-500" />
            <span className="text-xs text-slate-500 font-medium">Total facturé</span>
          </div>
          <div className="text-xl font-bold text-slate-900">{formatEur(montantTotal)}</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown className="w-4 h-4 text-orange-500" />
            <span className="text-xs text-slate-500 font-medium">Montant à risque</span>
          </div>
          <div className="text-xl font-bold text-orange-600">{formatEur(montantRisque)}</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-orange-500" />
            <span className="text-xs text-slate-500 font-medium">En retard</span>
          </div>
          <div className="text-xl font-bold text-orange-600">{nbEnRetard}</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            <span className="text-xs text-slate-500 font-medium">Contentieux</span>
          </div>
          <div className="text-xl font-bold text-red-600">{nbContentieux}</div>
        </div>
      </div>

      {/* Filtres */}
      <div className="flex items-center gap-2 flex-wrap">
        {[
          { label: 'Toutes', value: '' },
          { label: 'En retard', value: 'en_retard' },
          { label: 'Contentieux', value: 'contentieux' },
          { label: 'Envoyées', value: 'envoyee' },
          { label: 'Payées', value: 'payee' },
        ].map(f => (
          <Link
            key={f.value}
            href={f.value ? `/dashboard/impayes?statut=${f.value}` : '/dashboard/impayes'}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              params.statut === f.value || (!params.statut && !f.value)
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
            }`}
          >
            {f.label}
          </Link>
        ))}
      </div>

      {/* Table */}
      {factures && factures.length > 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3">Facture</th>
                <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3 hidden md:table-cell">Client</th>
                <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3">Montant TTC</th>
                <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3">Statut</th>
                <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3 hidden lg:table-cell">Échéance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {factures.map((f: any) => (
                <tr key={f.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3.5">
                    <Link href={`/dashboard/impayes/${f.id}`} className="block">
                      <p className="text-sm font-medium text-slate-900 hover:text-blue-600">{f.numero}</p>
                      <p className="text-xs text-slate-500">{new Date(f.date_emission).toLocaleDateString('fr-FR')}</p>
                    </Link>
                  </td>
                  <td className="px-4 py-3.5 hidden md:table-cell">
                    <span className="text-sm text-slate-700">{(f.client as any)?.nom}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="text-sm font-semibold text-slate-900">{formatEur(Number(f.montant_ttc))}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUT_COLORS[f.statut]}`}>
                      {STATUT_LABELS[f.statut]}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 hidden lg:table-cell">
                    <span className={`text-xs ${
                      f.statut === 'en_retard' || (f.date_echeance && new Date(f.date_echeance) < new Date())
                        ? 'text-orange-600 font-medium'
                        : 'text-slate-500'
                    }`}>
                      {new Date(f.date_echeance).toLocaleDateString('fr-FR')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 py-16 text-center">
          <AlertTriangle className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-700">
            {params.statut ? 'Aucune facture pour ce filtre' : 'Aucune facture enregistrée'}
          </h3>
          <p className="text-sm text-slate-500 mt-1 mb-5">
            {!params.statut && 'Commencez à suivre vos factures pour protéger votre trésorerie'}
          </p>
          {!params.statut && (
            <Link href="/dashboard/impayes/nouveau"
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors">
              <Plus className="w-4 h-4" />
              Créer ma première facture
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
