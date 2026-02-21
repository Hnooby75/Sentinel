// ============================================
// app/dashboard/contrats/page.tsx
// Module 4 — Liste des contrats analysés
// ============================================
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getUtilisateur } from '@/lib/supabase/getUtilisateur'
import { FileSignature, Plus, AlertTriangle, CheckCircle, Shield } from 'lucide-react'

const RISQUE_COLORS: Record<string, string> = {
  faible: 'bg-green-100 text-green-700',
  modere: 'bg-yellow-100 text-yellow-700',
  eleve: 'bg-orange-100 text-orange-700',
  critique: 'bg-red-100 text-red-700',
}

const RISQUE_LABELS: Record<string, string> = {
  faible: 'Faible', modere: 'Modéré', eleve: 'Élevé', critique: 'Critique',
}

const TYPE_LABELS: Record<string, string> = {
  prestataire: 'Prestataire', client: 'Client', partenariat: 'Partenariat',
  emploi: 'Emploi', bail: 'Bail', cgu: 'CGU', autre: 'Autre',
}

export default async function ContratsPage({
  searchParams
}: {
  searchParams: Promise<{ created?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const utilisateur = await getUtilisateur(user.id)
  if (!utilisateur) return null

  const { data: contrats } = await supabase
    .from('documents_contrats')
    .select('*, analyses_contrats(score_risque, niveau_risque, analyse_a)')
    .eq('entreprise_id', utilisateur.entreprise_id)
    .order('created_at', { ascending: false })

  const stats = {
    total: contrats?.length ?? 0,
    analyses: contrats?.filter(c => (c.analyses_contrats as any[])?.length > 0).length ?? 0,
    critiques: contrats?.filter(c =>
      (c.analyses_contrats as any[])?.[0]?.niveau_risque === 'critique'
    ).length ?? 0,
  }

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Analyse contractuelle</h1>
          <p className="text-slate-500 text-sm mt-0.5">Vos contrats analysés en quelques secondes</p>
        </div>
        <Link
          href="/dashboard/contrats/nouveau"
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors"
        >
          <Plus className="w-4 h-4" />
          Analyser un contrat
        </Link>
      </div>

      {params.created && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3 text-sm">
          <CheckCircle className="w-4 h-4" />
          Contrat analysé avec succès.
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
          <div className="text-2xl font-bold text-slate-900">{stats.total}</div>
          <div className="text-xs text-slate-500 mt-0.5">Contrats déposés</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">{stats.analyses}</div>
          <div className="text-xs text-slate-500 mt-0.5">Analysés</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
          <div className="text-2xl font-bold text-red-600">{stats.critiques}</div>
          <div className="text-xs text-slate-500 mt-0.5">À risque critique</div>
        </div>
      </div>

      {/* Liste */}
      {contrats && contrats.length > 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3">Contrat</th>
                <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3 hidden md:table-cell">Type</th>
                <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3">Risque</th>
                <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3 hidden lg:table-cell">Score</th>
                <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3 hidden xl:table-cell">Analysé le</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {contrats.map((c: any) => {
                const analyse = (c.analyses_contrats as any[])?.[0]
                return (
                  <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3.5">
                      <Link href={`/dashboard/contrats/${c.id}`} className="block">
                        <p className="text-sm font-medium text-slate-900 hover:text-blue-600 line-clamp-1">{c.nom}</p>
                        <p className="text-xs text-slate-400">{new Date(c.created_at).toLocaleDateString('fr-FR')}</p>
                      </Link>
                    </td>
                    <td className="px-4 py-3.5 hidden md:table-cell">
                      <span className="text-xs text-slate-600">{TYPE_LABELS[c.type_contrat] || c.type_contrat}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      {analyse ? (
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${RISQUE_COLORS[analyse.niveau_risque]}`}>
                          {RISQUE_LABELS[analyse.niveau_risque]}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">En attente</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 hidden lg:table-cell">
                      {analyse ? (
                        <div className="flex items-center gap-1.5">
                          <div className="w-16 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                analyse.score_risque >= 75 ? 'bg-green-500' :
                                analyse.score_risque >= 50 ? 'bg-yellow-500' :
                                analyse.score_risque >= 30 ? 'bg-orange-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${analyse.score_risque}%` }}
                            />
                          </div>
                          <span className="text-xs text-slate-600">{analyse.score_risque}/100</span>
                        </div>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3.5 hidden xl:table-cell">
                      <span className="text-xs text-slate-400">
                        {analyse ? new Date(analyse.analyse_a).toLocaleDateString('fr-FR') : '—'}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 py-16 text-center">
          <FileSignature className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-700">Aucun contrat analysé</h3>
          <p className="text-sm text-slate-500 mt-1 mb-5">
            Copiez-collez le texte de votre contrat pour une analyse en 30 secondes
          </p>
          <Link href="/dashboard/contrats/nouveau"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors">
            <Plus className="w-4 h-4" />
            Analyser mon premier contrat
          </Link>
        </div>
      )}
    </div>
  )
}
