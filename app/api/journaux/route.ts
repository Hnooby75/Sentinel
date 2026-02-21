// ============================================
// app/api/journaux/route.ts
// CRUD journaux d'usage IA
// ============================================
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@/lib/supabase/admin'
import { calculerScore } from '@/lib/scoring/engine'
import { calculerScoreGlobal, sauvegarderScoreGlobal } from '@/lib/scoring/global'
import { z } from 'zod'

const JournalSchema = z.object({
  titre: z.string().min(5, 'Titre trop court').max(200),
  description: z.string().min(20, 'Description trop courte'),
  outil_ia: z.string().min(1),
  outil_ia_custom: z.string().optional(),
  categorie_usage: z.enum([
    'generation_contenu', 'analyse_donnees', 'decision_automatisee',
    'interaction_client', 'recrutement', 'surveillance', 'autre'
  ]),
  frequence_usage: z.enum(['unique', 'quotidien', 'hebdomadaire', 'mensuel', 'continu']).optional(),
  nb_utilisateurs_concernes: z.number().int().positive().optional(),
  date_premier_usage: z.string().optional(),
  traite_donnees_perso: z.boolean(),
  types_donnees_perso: z.array(z.string()).optional(),
  base_legale_rgpd: z.enum([
    'consentement', 'execution_contrat', 'obligation_legale',
    'interet_vital', 'mission_interet_public', 'interet_legitime'
  ]).optional(),
  decision_automatisee: z.boolean().default(false),
  impact_personnes: z.boolean().default(false),
  prompt_exemple: z.string().max(2000).optional(),
})

// GET — lister les journaux de l'entreprise
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const niveau_risque = searchParams.get('niveau_risque')
  const statut = searchParams.get('statut') || 'actif'
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
  const limit = Math.min(50, parseInt(searchParams.get('limit') || '20'))
  const offset = (page - 1) * limit

  let query = supabase
    .from('journaux_usage_ia')
    .select('*, declarant:utilisateurs(prenom, nom)', { count: 'exact' })
    .neq('statut', 'archive')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (niveau_risque) query = query.eq('niveau_risque', niveau_risque)
  if (statut && statut !== 'tous') query = query.eq('statut', statut)

  const { data, count, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({
    data,
    pagination: { page, limit, total: count, pages: Math.ceil((count || 0) / limit) }
  })
}

// POST — créer un journal
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { data: utilisateur } = await createAdminClient()
    .from('utilisateurs')
    .select('entreprise_id, role')
    .eq('id', user.id)
    .single()

  if (!utilisateur) return NextResponse.json({ error: 'Profil introuvable' }, { status: 404 })

  const body = await request.json()
  const validation = JournalSchema.safeParse(body)

  if (!validation.success) {
    return NextResponse.json(
      { error: 'Données invalides', details: validation.error.flatten() },
      { status: 400 }
    )
  }

  const data = validation.data

  // Estimer le niveau de risque automatiquement
  const niveau_risque = estimerNiveauRisque(data)

  const { data: journal, error } = await supabase
    .from('journaux_usage_ia')
    .insert({
      entreprise_id: utilisateur.entreprise_id,
      declarant_id: user.id,
      ...data,
      niveau_risque,
      statut: 'actif',
    })
    .select()
    .single()

  if (error) {
    console.error('Erreur création journal:', error)
    return NextResponse.json({ error: 'Erreur création' }, { status: 500 })
  }

  // Log audit (admin client pour bypass RLS)
  const adminClient = createAdminClient()
  await adminClient.from('audit_logs').insert({
    entreprise_id: utilisateur.entreprise_id,
    utilisateur_id: user.id,
    action: 'journal.create',
    ressource_type: 'journal_usage_ia',
    ressource_id: journal.id,
    apres: journal,
    succes: true,
  })

  // Recalculer scores en arrière-plan (non bloquant)
  const eid = utilisateur.entreprise_id
  Promise.all([
    calculerScore(eid).then(async (scoreResult) => {
      await adminClient.from('scores_conformite').insert({
        entreprise_id: eid,
        ...scoreResult,
      })
    }),
    calculerScoreGlobal(eid).then(async (globalResult) => {
      await sauvegarderScoreGlobal(eid, globalResult)
    }),
  ]).catch(console.error)

  return NextResponse.json(journal, { status: 201 })
}

// Estimation automatique du niveau de risque selon AI Act
function estimerNiveauRisque(data: z.infer<typeof JournalSchema>): string {
  const { categorie_usage, decision_automatisee, impact_personnes, traite_donnees_perso } = data

  // Risque élevé (Annexe III AI Act)
  if (categorie_usage === 'recrutement') return 'eleve'
  if (categorie_usage === 'surveillance') return 'eleve'
  if (categorie_usage === 'decision_automatisee' && impact_personnes) return 'eleve'

  // Risque limité (Art. 50 - obligation de transparence)
  if (categorie_usage === 'interaction_client') return 'limite'

  // Risque faible
  if (['generation_contenu', 'analyse_donnees'].includes(categorie_usage)) {
    if (!traite_donnees_perso && !decision_automatisee) return 'faible'
    return 'limite'
  }

  return 'non_classe'
}
