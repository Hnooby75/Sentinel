// ============================================
// app/dashboard/contrats/[id]/page.tsx
// Module 4 — Résultat d'analyse contractuelle
// ============================================
import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { getUtilisateur } from '@/lib/supabase/getUtilisateur'
import { ArrowLeft, AlertTriangle, CheckCircle, ShieldAlert, ShieldCheck, Info } from 'lucide-react'

const RISQUE_CONFIG: Record<string, { color: string; bg: string; icon: any; label: string }> = {
  faible: { color: 'text-green-700', bg: 'bg-green-50 border-green-200', icon: ShieldCheck, label: 'Risque faible' },
  modere: { color: 'text-yellow-700', bg: 'bg-yellow-50 border-yellow-200', icon: Info, label: 'Risque modéré' },
  eleve: { color: 'text-orange-700', bg: 'bg-orange-50 border-orange-200', icon: AlertTriangle, label: 'Risque élevé' },
  critique: { color: 'text-red-700', bg: 'bg-red-50 border-red-200', icon: ShieldAlert, label: 'Risque critique' },
}

const IMPACT_COLORS: Record<string, string> = {
  faible: 'bg-green-100 text-green-700',
  modere: 'bg-yellow-100 text-yellow-700',
  eleve: 'bg-orange-100 text-orange-700',
  critique: 'bg-red-100 text-red-700',
}

export default async function ContratDetailPage({
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

  const { data: contrat } = await supabase
    .from('documents_contrats')
    .select('*, analyses_contrats(*)')
    .eq('id', id)
    .eq('entreprise_id', utilisateur.entreprise_id)
    .single()

  if (!contrat) notFound()

  const analyse = (contrat.analyses_contrats as any[])?.[0]
  const risqueConfig = analyse ? RISQUE_CONFIG[analyse.niveau_risque] : null
  const RisqueIcon = risqueConfig?.icon || Info

  const pointsSensibles: any[] = analyse?.points_sensibles ?? []
  const recommandations: string[] = analyse?.recommandations ?? []

  // Score gauge
  const scoreRisque = analyse?.score_risque ?? 50
  const scoreColor = scoreRisque >= 75 ? '#22c55e' : scoreRisque >= 50 ? '#f59e0b' : scoreRisque >= 30 ? '#f97316' : '#ef4444'

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/contrats" className="text-slate-400 hover:text-slate-600">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-slate-900 line-clamp-1">{contrat.nom}</h1>
          <p className="text-slate-500 text-sm capitalize">{contrat.type_contrat} · {new Date(contrat.created_at).toLocaleDateString('fr-FR')}</p>
        </div>
      </div>

      {!analyse ? (
        <div className="bg-white rounded-xl border border-slate-200 py-12 text-center">
          <Info className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm text-slate-500">Analyse en attente...</p>
          <form action={`/api/contrats/${id}/analyse`} method="POST" className="mt-4">
            <button type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold">
              Lancer l'analyse
            </button>
          </form>
        </div>
      ) : (
        <>
          {/* Score + niveau */}
          <div className={`rounded-xl border p-5 ${risqueConfig?.bg}`}>
            <div className="flex items-center gap-4">
              <div className="relative w-20 h-20 flex-shrink-0">
                <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
                  <circle cx="40" cy="40" r="34" fill="none" stroke="#e2e8f0" strokeWidth="8" />
                  <circle
                    cx="40" cy="40" r="34" fill="none"
                    stroke={scoreColor} strokeWidth="8"
                    strokeDasharray={2 * Math.PI * 34}
                    strokeDashoffset={2 * Math.PI * 34 * (1 - scoreRisque / 100)}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-xl font-bold text-slate-900">{scoreRisque}</span>
                  <span className="text-xs text-slate-500">/100</span>
                </div>
              </div>
              <div className="flex-1">
                <div className={`flex items-center gap-2 font-semibold text-lg ${risqueConfig?.color}`}>
                  <RisqueIcon className="w-5 h-5" />
                  {risqueConfig?.label}
                </div>
                <p className="text-sm text-slate-700 mt-1 leading-relaxed">{analyse.resume}</p>
              </div>
            </div>
          </div>

          {/* Points sensibles */}
          {pointsSensibles.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h2 className="font-semibold text-slate-900 mb-3">
                {pointsSensibles.length} point{pointsSensibles.length > 1 ? 's' : ''} sensible{pointsSensibles.length > 1 ? 's' : ''} détecté{pointsSensibles.length > 1 ? 's' : ''}
              </h2>
              <div className="space-y-3">
                {pointsSensibles.map((p: any, i: number) => (
                  <div key={i} className="border border-slate-100 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-medium text-slate-900">{p.description}</p>
                          <span className={`text-xs px-1.5 py-0.5 rounded font-medium flex-shrink-0 ${IMPACT_COLORS[p.impact]}`}>
                            {p.impact}
                          </span>
                        </div>
                        {p.extrait && (
                          <blockquote className="text-xs text-slate-500 italic border-l-2 border-slate-200 pl-2 line-clamp-2">
                            {p.extrait}
                          </blockquote>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommandations */}
          {recommandations.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h2 className="font-semibold text-slate-900 mb-3">Recommandations</h2>
              <ul className="space-y-2">
                {recommandations.map((r: string, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Date analyse */}
          <p className="text-xs text-slate-400 text-center">
            Analysé le {new Date(analyse.analyse_a).toLocaleDateString('fr-FR', {
              day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
            })}
          </p>
        </>
      )}
    </div>
  )
}
