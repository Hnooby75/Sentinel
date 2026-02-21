// ============================================
// app/dashboard/obligations/page.tsx
// Module 3 — Obligations administratives
// ============================================
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getUtilisateur } from '@/lib/supabase/getUtilisateur'
import { ClipboardList, Plus, CheckCircle, AlertTriangle, Clock, XCircle, Zap } from 'lucide-react'

const STATUT_COLORS: Record<string, string> = {
  a_faire: 'bg-blue-100 text-blue-700',
  en_cours: 'bg-yellow-100 text-yellow-700',
  valide: 'bg-green-100 text-green-700',
  en_retard: 'bg-red-100 text-red-700',
  non_applicable: 'bg-slate-100 text-slate-500',
}

const STATUT_LABELS: Record<string, string> = {
  a_faire: 'À faire',
  en_cours: 'En cours',
  valide: 'Validée',
  en_retard: 'En retard',
  non_applicable: 'N/A',
}

const STATUT_ICONS: Record<string, any> = {
  a_faire: Clock,
  en_cours: Clock,
  valide: CheckCircle,
  en_retard: AlertTriangle,
  non_applicable: XCircle,
}

const CAT_COLORS: Record<string, string> = {
  fiscal: 'bg-purple-50 text-purple-700',
  social: 'bg-blue-50 text-blue-700',
  juridique: 'bg-slate-50 text-slate-700',
  rgpd: 'bg-indigo-50 text-indigo-700',
  sectoriel: 'bg-amber-50 text-amber-700',
  environnement: 'bg-green-50 text-green-700',
}

export default async function ObligationsPage({
  searchParams
}: {
  searchParams: Promise<{ statut?: string; generated?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const utilisateur = await getUtilisateur(user.id)
  if (!utilisateur) return null

  let query = supabase
    .from('obligations')
    .select('*, type_obligation:types_obligations(libelle, categorie, frequence, source_legale)')
    .eq('entreprise_id', utilisateur.entreprise_id)
    .order('echeance', { ascending: true, nullsFirst: false })

  if (params.statut) query = query.eq('statut', params.statut)

  const { data: obligations } = await query

  // Stats
  const { data: toutes } = await supabase
    .from('obligations')
    .select('statut')
    .eq('entreprise_id', utilisateur.entreprise_id)

  const stats = {
    total: toutes?.filter(o => o.statut !== 'non_applicable').length ?? 0,
    validees: toutes?.filter(o => o.statut === 'valide').length ?? 0,
    enRetard: toutes?.filter(o => o.statut === 'en_retard').length ?? 0,
    aFaire: toutes?.filter(o => o.statut === 'a_faire').length ?? 0,
  }

  const hasObligations = (toutes?.length ?? 0) > 0

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Obligations administratives</h1>
          <p className="text-slate-500 text-sm mt-0.5">Calendrier et suivi de vos échéances légales</p>
        </div>
        <div className="flex items-center gap-2">
          {!hasObligations && (
            <form action="/api/obligations/generer" method="POST">
              <button
                formAction="/api/obligations/generer"
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors"
              >
                <Zap className="w-4 h-4" />
                Générer automatiquement
              </button>
            </form>
          )}
          <Link
            href="/dashboard/obligations/nouveau"
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors"
          >
            <Plus className="w-4 h-4" />
            Ajouter
          </Link>
        </div>
      </div>

      {params.generated && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3 text-sm">
          <CheckCircle className="w-4 h-4" />
          Obligations générées automatiquement selon votre profil.
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
          <div className="text-2xl font-bold text-slate-900">{stats.total}</div>
          <div className="text-xs text-slate-500 mt-0.5">Total actives</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
          <div className="text-2xl font-bold text-green-600">{stats.validees}</div>
          <div className="text-xs text-slate-500 mt-0.5">Validées</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
          <div className="text-2xl font-bold text-orange-600">{stats.aFaire}</div>
          <div className="text-xs text-slate-500 mt-0.5">À faire</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
          <div className="text-2xl font-bold text-red-600">{stats.enRetard}</div>
          <div className="text-xs text-slate-500 mt-0.5">En retard</div>
        </div>
      </div>

      {/* Filtres */}
      <div className="flex items-center gap-2 flex-wrap">
        {[
          { label: 'Toutes', value: '' },
          { label: 'À faire', value: 'a_faire' },
          { label: 'En retard', value: 'en_retard' },
          { label: 'En cours', value: 'en_cours' },
          { label: 'Validées', value: 'valide' },
        ].map(f => (
          <Link
            key={f.value}
            href={f.value ? `/dashboard/obligations?statut=${f.value}` : '/dashboard/obligations'}
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

      {/* Liste */}
      {obligations && obligations.length > 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3">Obligation</th>
                <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3 hidden md:table-cell">Catégorie</th>
                <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3">Statut</th>
                <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3 hidden lg:table-cell">Échéance</th>
                <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3 hidden xl:table-cell">Source</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {obligations.map((o: any) => {
                const type = o.type_obligation
                const StatusIcon = STATUT_ICONS[o.statut] || Clock
                const isLate = o.echeance && new Date(o.echeance) < new Date() && !['valide', 'non_applicable'].includes(o.statut)
                return (
                  <tr key={o.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3.5">
                      <Link href={`/dashboard/obligations/${o.id}`} className="block">
                        <p className="text-sm font-medium text-slate-900 hover:text-blue-600">
                          {type?.libelle || o.libelle_custom}
                        </p>
                        <p className="text-xs text-slate-500 capitalize">{type?.frequence}</p>
                      </Link>
                    </td>
                    <td className="px-4 py-3.5 hidden md:table-cell">
                      {type?.categorie && (
                        <span className={`text-xs px-2 py-1 rounded-full font-medium capitalize ${CAT_COLORS[type.categorie] || 'bg-slate-50 text-slate-600'}`}>
                          {type.categorie}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <StatusIcon className={`w-3.5 h-3.5 ${isLate ? 'text-red-500' : ''}`} />
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${isLate ? 'bg-red-100 text-red-700' : STATUT_COLORS[o.statut]}`}>
                          {isLate ? 'En retard' : STATUT_LABELS[o.statut]}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 hidden lg:table-cell">
                      {o.echeance ? (
                        <span className={`text-xs font-medium ${isLate ? 'text-red-600' : 'text-slate-500'}`}>
                          {new Date(o.echeance).toLocaleDateString('fr-FR')}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 hidden xl:table-cell">
                      <span className="text-xs text-slate-400">{type?.source_legale || '—'}</span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 py-16 text-center">
          <ClipboardList className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-700">
            {params.statut ? 'Aucune obligation pour ce filtre' : 'Aucune obligation configurée'}
          </h3>
          <p className="text-sm text-slate-500 mt-1 mb-5">
            {!params.statut && 'Générez automatiquement vos obligations légales selon votre profil'}
          </p>
          {!params.statut && !hasObligations && (
            <GenerateButton />
          )}
        </div>
      )}
    </div>
  )
}

function GenerateButton() {
  return (
    <Link
      href="/api/obligations/generer"
      className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
    >
      <Zap className="w-4 h-4" />
      Générer mes obligations
    </Link>
  )
}
