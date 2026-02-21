// ============================================
// app/api/contrats/[id]/analyse/route.ts
// Module 4 — Re-déclencher l'analyse d'un contrat
// ============================================
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@/lib/supabase/admin'
import { analyserContrat } from '@/lib/contrats/analyseur'
import { calculerScoreGlobal, sauvegarderScoreGlobal } from '@/lib/scoring/global'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { data: utilisateur } = await createAdminClient()
    .from('utilisateurs').select('entreprise_id').eq('id', user.id).single()
  if (!utilisateur) return NextResponse.json({ error: 'Profil introuvable' }, { status: 404 })

  const { data: document } = await supabase
    .from('documents_contrats')
    .select('contenu_texte, entreprise_id')
    .eq('id', id)
    .single()

  if (!document) return NextResponse.json({ error: 'Contrat introuvable' }, { status: 404 })
  if (!document.contenu_texte) {
    return NextResponse.json({ error: 'Aucun texte à analyser' }, { status: 400 })
  }

  const analyse = analyserContrat(document.contenu_texte)

  const admin = createAdminClient()

  // Supprimer l'ancienne analyse et en créer une nouvelle
  await admin.from('analyses_contrats').delete().eq('document_id', id)
  const { data: nouvelleAnalyse, error } = await admin
    .from('analyses_contrats')
    .insert({
      document_id: id,
      entreprise_id: utilisateur.entreprise_id,
      score_risque: analyse.score_risque,
      niveau_risque: analyse.niveau_risque,
      resume: analyse.resume,
      points_sensibles: analyse.points_sensibles,
      recommandations: analyse.recommandations,
    })
    .select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await admin.from('documents_contrats').update({ statut: 'analyse' }).eq('id', id)

  // Recalculer scores globaux (non bloquant)
  calculerScoreGlobal(utilisateur.entreprise_id).then(async (result) => {
    await sauvegarderScoreGlobal(utilisateur.entreprise_id, result)
  }).catch(console.error)

  return NextResponse.json(nouvelleAnalyse)
}
