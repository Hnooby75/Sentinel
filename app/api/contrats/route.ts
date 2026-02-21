// ============================================
// app/api/contrats/route.ts
// Module 4 — Contrats : liste + upload
// ============================================
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@/lib/supabase/admin'
import { analyserContrat } from '@/lib/contrats/analyseur'
import { calculerScoreGlobal, sauvegarderScoreGlobal } from '@/lib/scoring/global'
import { z } from 'zod'

const ContratSchema = z.object({
  nom: z.string().min(1, 'Nom requis').max(200),
  type_contrat: z.enum(['prestataire', 'client', 'partenariat', 'emploi', 'bail', 'cgu', 'autre']),
  contenu_texte: z.string().min(10, 'Texte du contrat requis'),
  fichier_url: z.string().optional(),
  taille_fichier: z.number().int().optional(),
})

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { data: utilisateur } = await createAdminClient()
    .from('utilisateurs').select('entreprise_id').eq('id', user.id).single()
  if (!utilisateur) return NextResponse.json({ error: 'Profil introuvable' }, { status: 404 })

  const { data: contrats, error } = await supabase
    .from('documents_contrats')
    .select('*, analyses_contrats(score_risque, niveau_risque, analyse_a)')
    .eq('entreprise_id', utilisateur.entreprise_id)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ data: contrats })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { data: utilisateur } = await createAdminClient()
    .from('utilisateurs').select('entreprise_id').eq('id', user.id).single()
  if (!utilisateur) return NextResponse.json({ error: 'Profil introuvable' }, { status: 404 })

  const body = await request.json()
  const validation = ContratSchema.safeParse(body)
  if (!validation.success) {
    return NextResponse.json({ error: 'Données invalides', details: validation.error.flatten() }, { status: 400 })
  }

  // Créer le document
  const { data: document, error } = await supabase
    .from('documents_contrats')
    .insert({
      ...validation.data,
      entreprise_id: utilisateur.entreprise_id,
      uploaded_by: user.id,
      statut: 'en_analyse',
    })
    .select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Analyser immédiatement
  const analyse = analyserContrat(validation.data.contenu_texte)

  const admin = createAdminClient()
  await admin.from('analyses_contrats').insert({
    document_id: document.id,
    entreprise_id: utilisateur.entreprise_id,
    score_risque: analyse.score_risque,
    niveau_risque: analyse.niveau_risque,
    resume: analyse.resume,
    points_sensibles: analyse.points_sensibles,
    recommandations: analyse.recommandations,
  })

  // Marquer comme analysé
  await admin.from('documents_contrats')
    .update({ statut: 'analyse' })
    .eq('id', document.id)

  await admin.from('audit_logs').insert({
    entreprise_id: utilisateur.entreprise_id,
    utilisateur_id: user.id,
    action: 'contrat.create_analyse',
    ressource_type: 'document_contrat',
    ressource_id: document.id,
    apres: { score_risque: analyse.score_risque, niveau_risque: analyse.niveau_risque },
    succes: true,
  })

  // Recalculer scores globaux (non bloquant)
  calculerScoreGlobal(utilisateur.entreprise_id).then(async (result) => {
    await sauvegarderScoreGlobal(utilisateur.entreprise_id, result)
  }).catch(console.error)

  return NextResponse.json({ document, analyse }, { status: 201 })
}
