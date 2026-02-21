import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getUtilisateur } from '@/lib/supabase/getUtilisateur'
import { Plus, Filter, FileText, AlertTriangle, CheckCircle, Clock, Sparkles } from 'lucide-react'

const RISQUE_COLORS: Record<string, string> = {
  inacceptable: 'bg-red-100 text-red-700 border-red-200',
  eleve: 'bg-orange-100 text-orange-700 border-orange-200',
  limite: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  faible: 'bg-green-100 text-green-700 border-green-200',
  non_classe: 'bg-slate-100 text-slate-600 border-slate-200',
}

const RISQUE_LABELS: Record<string, string> = {
  inacceptable: 'Inacceptable', eleve: 'Élevé',
  limite: 'Limité', faible: 'Faible', non_classe: 'Non classé',
}

const OUTIL_ICONS: Record<string, string> = {
  'ChatGPT': '🤖', 'Claude': '🧠', 'Gemini': '✨',
  'Copilot': '💼', 'Mistral': '🌀', 'Custom': '⚙️', 'Autre': '📦'
}

export default async function JournauxPage({
  searchParams
}: {
  searchParams: Promise<{ niveau_risque?: string; statut?: string; created?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const utilisateur = await getUtilisateur(user.id)
  if (!utilisateur) return null

  // Construire la requête avec filtres
  let query = supabase
    .from('journaux_usage_ia')
    .select(`
      id, titre, outil_ia, categorie_usage, niveau_risque,
      statut, traite_donnees_perso, decision_automatisee,
      date_premier_usage, created_at,
      declarant:utilisateurs(prenom, nom)
    `)
    .eq('entreprise_id', utilisateur.entreprise_id)
    .order('created_at', { ascending: false })

  if (params.niveau_risque) {
    query = query.eq('niveau_risque', params.niveau_risque)
  }
  if (params.statut) {
    query = query.eq('statut', params.statut)
  }

  const { data: journaux } = await query

  // Stats pour les filtres rapides
  const { data: allJournaux } = await supabase
    .from('journaux_usage_ia')
    .select('niveau_risque, statut')
    .eq('entreprise_id', utilisateur.entreprise_id)

  const stats = {
    total: allJournaux?.length ?? 0,
    nonClasses: allJournaux?.filter(j => j.niveau_risque === 'non_classe').length ?? 0,
    risqueEleve: allJournaux?.filter(j => j.niveau_risque === 'eleve' || j.niveau_risque === 'inacceptable').length ?? 0,
    aRevoir: allJournaux?.filter(j => j.statut === 'a_revoir').length ?? 0,
  }

  const FILTRE_ACTIF = params.niveau_risque || params.statut

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Journaux d'usage IA</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {stats.total} usage{stats.total > 1 ? 's' : ''} déclaré{stats.total > 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/journaux/smart"
            className="flex items-center gap-2 border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors"
          >
            <Sparkles className="w-4 h-4" />
            Classifier avec l'IA
          </Link>
          <Link
            href="/dashboard/journaux/nouveau"
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nouveau journal
          </Link>
        </div>
      </div>

      {/* Toast succès création */}
      {params.created && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3 text-sm">
          <CheckCircle className="w-4 h-4" />
          Usage IA enregistré avec succès. Le score de conformité a été recalculé.
        </div>
      )}

      {/* Filtres rapides */}
      <div className="flex items-center gap-2 flex-wrap">
        <Link
          href="/dashboard/journaux"
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
            !FILTRE_ACTIF ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
          }`}
        >
          Tous ({stats.total})
        </Link>
        <Link
          href="/dashboard/journaux?niveau_risque=non_classe"
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
            params.niveau_risque === 'non_classe' ? 'bg-slate-700 text-white border-slate-700' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
          }`}
        >
          <Clock className="w-3 h-3" />
          Non classés ({stats.nonClasses})
        </Link>
        <Link
          href="/dashboard/journaux?niveau_risque=eleve"
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
            params.niveau_risque === 'eleve' ? 'bg-orange-600 text-white border-orange-600' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
          }`}
        >
          <AlertTriangle className="w-3 h-3" />
          Risque élevé ({stats.risqueEleve})
        </Link>
        <Link
          href="/dashboard/journaux?statut=a_revoir"
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
            params.statut === 'a_revoir' ? 'bg-amber-600 text-white border-amber-600' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
          }`}
        >
          À revoir ({stats.aRevoir})
        </Link>
      </div>

      {/* Table */}
      {journaux && journaux.length > 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3">Usage IA</th>
                <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3 hidden md:table-cell">Outil</th>
                <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3 hidden lg:table-cell">Déclarant</th>
                <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3">Risque</th>
                <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3 hidden sm:table-cell">Données perso</th>
                <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3 hidden xl:table-cell">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {journaux.map((journal: any) => (
                <tr key={journal.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3.5">
                    <Link href={`/dashboard/journaux/${journal.id}`} className="block">
                      <p className="text-sm font-medium text-slate-900 hover:text-blue-600 transition-colors line-clamp-1">
                        {journal.titre}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {journal.categorie_usage?.replace(/_/g, ' ')}
                      </p>
                    </Link>
                  </td>
                  <td className="px-4 py-3.5 hidden md:table-cell">
                    <span className="text-sm text-slate-700">
                      {OUTIL_ICONS[journal.outil_ia] || '🤖'} {journal.outil_ia}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 hidden lg:table-cell">
                    <span className="text-sm text-slate-600">
                      {(journal.declarant as any)?.prenom} {(journal.declarant as any)?.nom}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={`text-xs px-2 py-1 rounded-full border font-medium ${RISQUE_COLORS[journal.niveau_risque]}`}>
                      {RISQUE_LABELS[journal.niveau_risque]}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 hidden sm:table-cell">
                    <span className={`text-xs font-medium ${journal.traite_donnees_perso ? 'text-orange-600' : 'text-slate-400'}`}>
                      {journal.traite_donnees_perso ? '⚠ Oui' : 'Non'}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 hidden xl:table-cell">
                    <span className="text-xs text-slate-500">
                      {new Date(journal.created_at).toLocaleDateString('fr-FR')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 py-16 text-center">
          <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-700">
            {FILTRE_ACTIF ? 'Aucun journal pour ce filtre' : 'Aucun usage IA déclaré'}
          </h3>
          <p className="text-sm text-slate-500 mt-1 mb-5">
            {FILTRE_ACTIF
              ? 'Essayez un autre filtre'
              : 'Commencez à documenter vos usages IA pour être conforme à l\'AI Act'
            }
          </p>
          {!FILTRE_ACTIF && (
            <Link href="/dashboard/journaux/nouveau"
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors">
              <Plus className="w-4 h-4" />
              Déclarer mon premier usage IA
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
