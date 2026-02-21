// ============================================
// app/dashboard/veille/page.tsx
// Feature 7 — Veille réglementaire
// ============================================
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getUtilisateur } from '@/lib/supabase/getUtilisateur'

import { Bell, AlertTriangle, Info, CheckCircle, Calendar, ExternalLink, Newspaper, Filter, BookOpen } from 'lucide-react'

async function getVeilleData(entrepriseId: string) {
  try {
    const supabase = await createClient()

    const [updatesResult, impactsResult] = await Promise.all([
      supabase
        .from('regulatory_updates')
        .select('*')
        .eq('actif', true)
        .order('date_publication', { ascending: false })
        .limit(30),
      supabase
        .from('regulatory_impacts')
        .select('update_id, impact_niveau, actions_requises, deadline, statut')
        .eq('entreprise_id', entrepriseId),
    ])

    const impactsMap = new Map(impactsResult.data?.map(i => [i.update_id, i]) || [])

    return (updatesResult.data || []).map(u => ({
      ...u,
      mon_impact: impactsMap.get(u.id) || null,
    }))
  } catch {
    return []
  }
}

const REGLEMENT_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  ai_act: { label: 'AI Act', color: 'text-blue-700 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-900/30' },
  rgpd: { label: 'RGPD', color: 'text-purple-700 dark:text-purple-400', bg: 'bg-purple-100 dark:bg-purple-900/30' },
  nis2: { label: 'NIS2', color: 'text-red-700 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-900/30' },
  dsa: { label: 'DSA', color: 'text-orange-700 dark:text-orange-400', bg: 'bg-orange-100 dark:bg-orange-900/30' },
  dma: { label: 'DMA', color: 'text-amber-700 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-900/30' },
}

const IMPACT_CONFIG = {
  critique: { color: 'text-red-700 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-900/30', icon: AlertTriangle },
  important: { color: 'text-orange-700 dark:text-orange-400', bg: 'bg-orange-100 dark:bg-orange-900/30', icon: AlertTriangle },
  modere: { color: 'text-yellow-700 dark:text-yellow-400', bg: 'bg-yellow-100 dark:bg-yellow-900/30', icon: Info },
  faible: { color: 'text-green-700 dark:text-green-400', bg: 'bg-green-100 dark:bg-green-900/30', icon: CheckCircle },
}

// Actualités démo si la table est vide
const DEMO_UPDATES = [
  {
    id: 'd1', titre: "AI Act : entrée en vigueur des obligations pour les systèmes à haut risque", reglement: 'ai_act', type: 'Réglementation',
    resume: "Depuis le 2 août 2026, les fournisseurs de systèmes IA à haut risque doivent être conformes aux exigences de l'AI Act. Les PME disposent d'une période de transition supplémentaire de 12 mois.",
    date_publication: '2026-02-15', actif: true, source_url: null,
    mon_impact: { impact_niveau: 'critique', actions_requises: ['Vérifier la classification de vos systèmes IA', 'Mettre à jour votre documentation technique'], deadline: '2026-04-01', statut: 'en_cours' },
  },
  {
    id: 'd2', titre: "RGPD : nouvelles lignes directrices sur l'IA générative", reglement: 'rgpd', type: 'Lignes directrices',
    resume: "Le EDPB publie des lignes directrices précisant comment les obligations RGPD s'appliquent aux modèles IA génératifs utilisés par les entreprises européennes.",
    date_publication: '2026-01-28', actif: true, source_url: null,
    mon_impact: { impact_niveau: 'important', actions_requises: ["Analyser vos traitements IA au regard des nouvelles lignes directrices", "Mettre à jour votre registre des traitements"], deadline: '2026-03-15', statut: 'a_traiter' },
  },
  {
    id: 'd3', titre: "NIS2 : rapport annuel de cybersécurité obligatoire", reglement: 'nis2', type: 'Obligation',
    resume: "Les entités essentielles et importantes doivent soumettre leur premier rapport annuel de cybersécurité avant le 31 mars 2026.",
    date_publication: '2026-01-10', actif: true, source_url: null,
    mon_impact: { impact_niveau: 'modere', actions_requises: ["Préparer le rapport de cybersécurité 2025"], deadline: '2026-03-31', statut: 'a_traiter' },
  },
  {
    id: 'd4', titre: "AI Act : publication des standards harmonisés CEN/CENELEC", reglement: 'ai_act', type: 'Standard',
    resume: "Le CEN/CENELEC publie les premiers standards techniques harmonisés pour la mise en conformité AI Act, couvrant la gestion des risques et la documentation.",
    date_publication: '2025-12-20', actif: true, source_url: null,
    mon_impact: null,
  },
  {
    id: 'd5', titre: "DSA : premières décisions de conformité de la Commission", reglement: 'dsa', type: 'Décision',
    resume: "La Commission européenne publie ses premières décisions d'exécution du DSA concernant les très grandes plateformes. Les PME restent exemptées des obligations les plus lourdes.",
    date_publication: '2025-12-05', actif: true, source_url: null,
    mon_impact: { impact_niveau: 'faible', actions_requises: ["Vérifier votre statut d'assujettissement au DSA"], deadline: null, statut: 'traite' },
  },
]

export default async function VeillePage({
  searchParams,
}: {
  searchParams: Promise<{ reglement?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const utilisateur = await getUtilisateur(user.id)
  if (!utilisateur) redirect('/login')

  const dbUpdates = await getVeilleData(utilisateur.entreprise_id)
  const isDemo = dbUpdates.length === 0
  const allUpdates = isDemo ? DEMO_UPDATES : dbUpdates

  // Filtre par réglementation
  const activeFilter = params.reglement || ''
  const updates = activeFilter
    ? allUpdates.filter((u: any) => u.reglement === activeFilter)
    : allUpdates

  const critiques = allUpdates.filter((u: any) => u.mon_impact?.impact_niveau === 'critique').length
  const importants = allUpdates.filter((u: any) => u.mon_impact?.impact_niveau === 'important').length

  // Compte par reglement pour les filtres
  const countByReglement = ['ai_act', 'rgpd', 'nis2', 'dsa', 'dma'].reduce((acc, r) => ({
    ...acc,
    [r]: allUpdates.filter((u: any) => u.reglement === r).length,
  }), {} as Record<string, number>)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Newspaper className="w-6 h-6 text-blue-500" />
            Veille réglementaire
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Suivez l'évolution de l'AI Act, RGPD et NIS2 — mis à jour en continu
          </p>
        </div>
        {(critiques > 0 || importants > 0) && (
          <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-4 py-2">
            <Bell className="w-4 h-4 text-red-600 dark:text-red-400" />
            <span className="text-sm font-medium text-red-700 dark:text-red-300">
              {critiques + importants} mise{critiques + importants > 1 ? 's' : ''} à jour à traiter
            </span>
          </div>
        )}
      </div>

      {/* Bandeau démo */}
      {isDemo && (
        <div className="flex items-start gap-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl px-5 py-4">
          <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-blue-800 dark:text-blue-200">Actualités réglementaires — données démo</p>
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">
              Ces actualités sont des exemples représentatifs. Les vraies données sont synchronisées automatiquement.
            </p>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Mises à jour', value: allUpdates.length, icon: Newspaper, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20' },
          { label: 'Critiques', value: critiques, icon: AlertTriangle, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/20' },
          { label: 'Importantes', value: importants, icon: AlertTriangle, color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-900/20' },
          { label: 'Traitées', value: allUpdates.filter((u: any) => u.mon_impact?.statut === 'traite').length, icon: CheckCircle, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
        ].map(stat => (
          <div key={stat.label} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
            <div className={`w-9 h-9 ${stat.bg} rounded-lg flex items-center justify-center mb-3`}>
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{stat.value}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Filtres par réglementation */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="w-4 h-4 text-slate-400 flex-shrink-0" />
        <Link
          href="/dashboard/veille"
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            !activeFilter
              ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900'
              : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
          }`}
        >
          Tous ({allUpdates.length})
        </Link>
        {Object.entries(REGLEMENT_CONFIG).map(([key, cfg]) => {
          const count = countByReglement[key] || 0
          if (count === 0) return null
          return (
            <Link
              key={key}
              href={`/dashboard/veille?reglement=${key}`}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeFilter === key
                  ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900'
                  : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
            >
              {cfg.label} ({count})
            </Link>
          )
        })}
      </div>

      {/* Mises à jour */}
      {updates.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-12 text-center">
          <Newspaper className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 dark:text-slate-400 font-medium">Aucune mise à jour pour ce filtre</p>
        </div>
      ) : (
        <div className="space-y-3">
          {updates.map((update: any) => {
            const reglCfg = REGLEMENT_CONFIG[update.reglement] || { label: update.reglement, color: 'text-slate-700 dark:text-slate-300', bg: 'bg-slate-100 dark:bg-slate-700' }
            const impactCfg = update.mon_impact ? IMPACT_CONFIG[update.mon_impact.impact_niveau as keyof typeof IMPACT_CONFIG] : null
            const ImpactIcon = impactCfg?.icon || Info

            return (
              <div
                key={update.id}
                className={`bg-white dark:bg-slate-800 rounded-xl border p-5 hover:shadow-sm transition-shadow ${
                  impactCfg?.color.includes('red') ? 'border-red-200 dark:border-red-800' :
                  impactCfg?.color.includes('orange') ? 'border-orange-200 dark:border-orange-800' :
                  'border-slate-200 dark:border-slate-700'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    {/* Badges */}
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${reglCfg.bg} ${reglCfg.color}`}>
                        {reglCfg.label}
                      </span>
                      {update.type && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400">
                          {update.type}
                        </span>
                      )}
                      {impactCfg && (
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1 ${impactCfg.bg} ${impactCfg.color}`}>
                          <ImpactIcon className="w-3 h-3" />
                          Impact {update.mon_impact?.impact_niveau}
                        </span>
                      )}
                      <span className="text-xs text-slate-400 dark:text-slate-500 ml-auto flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {update.date_publication ? new Date(update.date_publication).toLocaleDateString('fr-FR') : '—'}
                      </span>
                    </div>

                    {/* Titre */}
                    <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-sm">{update.titre}</h3>

                    {/* Résumé */}
                    {update.resume && (
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed">{update.resume}</p>
                    )}

                    {/* Actions requises */}
                    {update.mon_impact?.actions_requises?.length > 0 && (
                      <div className="mt-3 space-y-1.5">
                        <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Actions requises</p>
                        {update.mon_impact.actions_requises.slice(0, 3).map((action: string, i: number) => (
                          <p key={i} className="text-xs text-orange-700 dark:text-orange-400 flex items-start gap-1.5 bg-orange-50 dark:bg-orange-900/20 rounded-lg px-3 py-1.5">
                            <AlertTriangle className="w-3 h-3 flex-shrink-0 mt-0.5" />
                            {action}
                          </p>
                        ))}
                      </div>
                    )}

                    {/* Deadline */}
                    {update.mon_impact?.deadline && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-red-400" />
                        Deadline : <span className="font-medium text-red-600 dark:text-red-400">
                          {new Date(update.mon_impact.deadline).toLocaleDateString('fr-FR')}
                        </span>
                      </p>
                    )}
                  </div>

                  {update.source_url && (
                    <a
                      href={update.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex-shrink-0 mt-1"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
