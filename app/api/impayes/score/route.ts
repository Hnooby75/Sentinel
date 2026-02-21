// ============================================
// app/api/impayes/score/route.ts
// Module 2 — Recalcul score impayés
// ============================================
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@/lib/supabase/admin'
import { calculerScoreImpayes } from '@/lib/scoring/impayes'
import { calculerScoreGlobal, sauvegarderScoreGlobal } from '@/lib/scoring/global'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { data: utilisateur } = await createAdminClient()
    .from('utilisateurs').select('entreprise_id').eq('id', user.id).single()
  if (!utilisateur) return NextResponse.json({ error: 'Profil introuvable' }, { status: 404 })

  const result = await calculerScoreImpayes(utilisateur.entreprise_id)

  // Synchroniser scores globaux (non bloquant)
  calculerScoreGlobal(utilisateur.entreprise_id).then(async (globalResult) => {
    await sauvegarderScoreGlobal(utilisateur.entreprise_id, globalResult)
  }).catch(console.error)

  return NextResponse.json(result)
}
