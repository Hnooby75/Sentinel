// ============================================
// app/dashboard/formation/page.tsx
// Feature 5 — AI Literacy Hub gamifié
// ============================================
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getUtilisateur } from '@/lib/supabase/getUtilisateur'

import {
  BookOpen, Trophy, CheckCircle, Clock, Star,
  ChevronRight, GraduationCap, Target, Award,
  Lock, Play, BarChart2, Sparkles
} from 'lucide-react'

async function getFormationData(userId: string, entrepriseId: string) {
  try {
    const supabase = await createClient()

    const [modulesResult, progressResult, leaderboardResult, myRankResult] = await Promise.all([
      supabase
        .from('training_modules')
        .select('id, titre, description, categorie, niveau, duree_minutes, points, ordre')
        .eq('actif', true)
        .order('ordre', { ascending: true }),
      supabase
        .from('training_progress')
        .select('module_id, statut, score, completed_at')
        .eq('utilisateur_id', userId),
      supabase
        .from('training_leaderboard')
        .select('utilisateur_id, total_points, rang, modules_completes, utilisateur:utilisateurs(prenom, nom)')
        .eq('entreprise_id', entrepriseId)
        .order('total_points', { ascending: false })
        .limit(10),
      supabase
        .from('training_leaderboard')
        .select('total_points, rang, modules_completes')
        .eq('utilisateur_id', userId)
        .eq('entreprise_id', entrepriseId)
        .maybeSingle(),
    ])

    const progressMap = new Map(progressResult.data?.map(p => [p.module_id, p]) || [])
    const modules = (modulesResult.data || []).map(m => ({
      ...m,
      progress: progressMap.get(m.id) || null,
    }))

    const completed = modules.filter(m => m.progress?.statut === 'completed').length
    const total = modules.length

    return {
      modules,
      stats: {
        total,
        completed,
        in_progress: modules.filter(m => m.progress?.statut === 'in_progress').length,
        total_points: myRankResult.data?.total_points || 0,
        rang: myRankResult.data?.rang || null,
        modules_completes: myRankResult.data?.modules_completes || 0,
        completion_rate: total > 0 ? Math.round((completed / total) * 100) : 0,
      },
      leaderboard: leaderboardResult.data || [],
    }
  } catch {
    return {
      modules: [],
      stats: { total: 0, completed: 0, in_progress: 0, total_points: 0, rang: null, modules_completes: 0, completion_rate: 0 },
      leaderboard: [],
    }
  }
}

const NIVEAU_CONFIG = {
  debutant: { label: 'Débutant', color: 'text-green-700 dark:text-green-400', bg: 'bg-green-100 dark:bg-green-900/30' },
  intermediaire: { label: 'Intermédiaire', color: 'text-blue-700 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-900/30' },
  avance: { label: 'Avancé', color: 'text-purple-700 dark:text-purple-400', bg: 'bg-purple-100 dark:bg-purple-900/30' },
}

const CATEGORIE_CONFIG: Record<string, { label: string; color: string }> = {
  fondamentaux: { label: 'Fondamentaux', color: 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300' },
  obligations: { label: 'Obligations', color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' },
  pratique: { label: 'Pratique', color: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' },
  juridique: { label: 'Juridique', color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400' },
  technique: { label: 'Technique', color: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400' },
  gouvernance: { label: 'Gouvernance', color: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400' },
}

// Modules démo affichés si la table est vide
const DEMO_MODULES = [
  { id: 'demo-1', titre: "Introduction à l'AI Act européen", description: "Comprendre les grands principes, le calendrier d'application et les obligations selon le niveau de risque.", categorie: 'fondamentaux', niveau: 'debutant', duree_minutes: 20, points: 50, ordre: 1 },
  { id: 'demo-2', titre: "Classifier vos systèmes IA", description: "Apprenez à évaluer le niveau de risque de chaque système IA selon la taxonomie de l'AI Act.", categorie: 'pratique', niveau: 'intermediaire', duree_minutes: 35, points: 100, ordre: 2 },
  { id: 'demo-3', titre: "Obligations de documentation", description: "Registre des systèmes, fiches techniques, évaluations de conformité : ce que la loi exige.", categorie: 'obligations', niveau: 'intermediaire', duree_minutes: 25, points: 75, ordre: 3 },
  { id: 'demo-4', titre: "RGPD × AI Act : synergies", description: "Comment vos obligations RGPD existantes s'articulent avec les nouvelles exigences de l'AI Act.", categorie: 'juridique', niveau: 'avance', duree_minutes: 45, points: 150, ordre: 4 },
  { id: 'demo-5', titre: "Gouvernance interne de l'IA", description: "Mettre en place un comité IA, des politiques d'usage et des procédures de surveillance continue.", categorie: 'gouvernance', niveau: 'avance', duree_minutes: 40, points: 125, ordre: 5 },
  { id: 'demo-6', titre: "Audit et contrôle : se préparer", description: "Simulez un audit réglementaire et identifiez les documents à préparer en priorité.", categorie: 'pratique', niveau: 'avance', duree_minutes: 50, points: 175, ordre: 6 },
]

export default async function FormationPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const utilisateur = await getUtilisateur(user.id)
  if (!utilisateur) redirect('/login')

  const { modules: dbModules, stats, leaderboard } = await getFormationData(user.id, utilisateur.entreprise_id)

  // Si la table est vide, on affiche les modules démo
  const isDemo = dbModules.length === 0
  const modules = isDemo
    ? DEMO_MODULES.map(m => ({ ...m, progress: null }))
    : dbModules

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-blue-500" />
            AI Literacy Hub
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Formez votre équipe à l'AI Act — certifications, quiz, classements
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.total_points} pts</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {stats.rang ? `Rang #${stats.rang}` : 'Pas encore classé'}
          </p>
        </div>
      </div>

      {/* Bandeau démo */}
      {isDemo && (
        <div className="flex items-start gap-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl px-5 py-4">
          <Sparkles className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">Modules en cours de chargement</p>
            <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">
              Aperçu des 6 modules disponibles. Lancez le seed démo pour activer le contenu complet.
            </p>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Modules complétés', value: isDemo ? `0/${modules.length}` : `${stats.completed}/${stats.total}`, icon: CheckCircle, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
          { label: 'En cours', value: stats.in_progress, icon: Clock, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20' },
          { label: 'Points gagnés', value: stats.total_points, icon: Star, color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-50 dark:bg-yellow-900/20' },
          { label: 'Progression', value: `${stats.completion_rate}%`, icon: Target, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-900/20' },
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

      {/* Barre de progression globale */}
      {!isDemo && stats.total > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 px-5 py-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Progression globale</span>
            <span className="text-sm font-bold text-slate-900 dark:text-slate-100">{stats.completion_rate}%</span>
          </div>
          <div className="h-3 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full transition-all duration-700"
              style={{ width: `${stats.completion_rate}%` }}
            />
          </div>
          <div className="flex justify-between mt-1.5">
            <span className="text-xs text-slate-400 dark:text-slate-500">{stats.completed} module{stats.completed > 1 ? 's' : ''} terminé{stats.completed > 1 ? 's' : ''}</span>
            <span className="text-xs text-slate-400 dark:text-slate-500">{stats.total - stats.completed} restant{stats.total - stats.completed > 1 ? 's' : ''}</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Modules list */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-slate-800 dark:text-slate-100">Parcours de formation</h2>
            <div className="flex items-center gap-1.5">
              <BarChart2 className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-xs text-slate-500 dark:text-slate-400">{modules.length} modules</span>
            </div>
          </div>

          {modules.map((module, index) => {
            const niveauCfg = NIVEAU_CONFIG[module.niveau as keyof typeof NIVEAU_CONFIG]
            const categorieCfg = CATEGORIE_CONFIG[module.categorie] || { label: module.categorie, color: 'bg-slate-100 text-slate-700' }
            const isCompleted = module.progress?.statut === 'completed'
            const isInProgress = module.progress?.statut === 'in_progress'
            const isLocked = isDemo && index > 1

            const cardContent = (
              <div className="flex items-start gap-4">
                {/* Icône statut */}
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  isCompleted ? 'bg-emerald-100 dark:bg-emerald-900/30' :
                  isInProgress ? 'bg-blue-100 dark:bg-blue-900/30' :
                  isLocked ? 'bg-slate-100 dark:bg-slate-700' :
                  'bg-slate-100 dark:bg-slate-700'
                }`}>
                  {isCompleted ? (
                    <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  ) : isInProgress ? (
                    <Play className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  ) : isLocked ? (
                    <Lock className="w-5 h-5 text-slate-400 dark:text-slate-500" />
                  ) : (
                    <BookOpen className="w-5 h-5 text-slate-400 dark:text-slate-500" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${categorieCfg.color}`}>
                      {categorieCfg.label}
                    </span>
                    {niveauCfg && (
                      <span className={`text-xs px-2 py-0.5 rounded-full ${niveauCfg.bg} ${niveauCfg.color}`}>
                        {niveauCfg.label}
                      </span>
                    )}
                    <span className="text-xs text-slate-400 dark:text-slate-500 ml-auto flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {module.duree_minutes} min
                      <span className="mx-1">·</span>
                      <Star className="w-3 h-3 text-yellow-400" /> {module.points} pts
                    </span>
                  </div>
                  <h3 className={`font-medium text-sm ${isLocked ? 'text-slate-400 dark:text-slate-500' : 'text-slate-900 dark:text-slate-100'}`}>
                    {module.titre}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">{module.description}</p>
                  {isCompleted && module.progress?.score != null && (
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-1 flex items-center gap-1">
                      <Trophy className="w-3 h-3" /> Score : {module.progress.score}/100
                    </p>
                  )}
                </div>
                <ChevronRight className={`w-4 h-4 flex-shrink-0 mt-1 ${isLocked ? 'text-slate-200 dark:text-slate-600' : 'text-slate-300 dark:text-slate-600'}`} />
              </div>
            )

            if (isLocked) {
              return (
                <div key={module.id} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 opacity-60 cursor-not-allowed">
                  {cardContent}
                </div>
              )
            }

            return (
              <Link
                key={module.id}
                href={isDemo ? '#' : `/dashboard/formation/${module.id}`}
                className="block bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-sm transition-all"
              >
                {cardContent}
              </Link>
            )
          })}
        </div>

        {/* Sidebar : Leaderboard + Badges */}
        <div className="space-y-4">
          {/* Leaderboard */}
          <div>
            <h2 className="font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-3">
              <Trophy className="w-4 h-4 text-yellow-500" />
              Classement équipe
            </h2>
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
              {leaderboard.length === 0 ? (
                <div className="p-6 text-center">
                  <Award className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm text-slate-400 dark:text-slate-500">Complétez des modules pour apparaître ici</p>
                </div>
              ) : (
                leaderboard.map((entry: Record<string, unknown>, i) => {
                  const u = entry.utilisateur as { prenom: string; nom: string } | null
                  const isMe = entry.utilisateur_id === user.id
                  return (
                    <div
                      key={entry.utilisateur_id as string}
                      className={`flex items-center gap-3 px-4 py-3 border-b border-slate-100 dark:border-slate-700 last:border-0 ${
                        isMe ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                      }`}
                    >
                      <span className="text-sm font-bold w-7 text-center flex-shrink-0">
                        {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium truncate ${isMe ? 'text-blue-700 dark:text-blue-400' : 'text-slate-700 dark:text-slate-300'}`}>
                          {u?.prenom} {u?.nom} {isMe && '(vous)'}
                        </p>
                        <p className="text-xs text-slate-400 dark:text-slate-500">{entry.modules_completes as number} modules</p>
                      </div>
                      <span className="text-sm font-bold text-slate-700 dark:text-slate-300 flex-shrink-0">{entry.total_points as number} pts</span>
                    </div>
                  )
                })
              )}
            </div>
          </div>

          {/* Conseils */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-100 dark:border-blue-800 rounded-xl p-4">
            <h3 className="font-semibold text-blue-800 dark:text-blue-200 text-sm mb-2 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" />
              Pourquoi se former ?
            </h3>
            <ul className="space-y-1.5">
              {[
                "Réduire votre score de risque IA Act",
                "Préparer vos équipes aux audits",
                "Éviter les amendes (jusqu'à 35M€)",
                "Valoriser votre conformité clients",
              ].map((tip, i) => (
                <li key={i} className="text-xs text-blue-700 dark:text-blue-300 flex items-start gap-1.5">
                  <CheckCircle className="w-3 h-3 flex-shrink-0 mt-0.5 text-blue-500" />
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
