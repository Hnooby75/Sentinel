// ============================================
// app/api/ai/analyse-operations/route.ts
// GET: dernier rapport opérations + synthèse
// POST: déclenche analyserOperations()
// ============================================
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@/lib/supabase/admin'
import { getUtilisateur } from '@/lib/supabase/getUtilisateur'
import { analyserOperations, genererSyntheseExecutive } from '@/lib/services/ai/operations'

const COOLDOWN_MS = 3_600_000 // 1h

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const utilisateur = await getUtilisateur(user.id)
  if (!utilisateur) return NextResponse.json({ error: 'Profil introuvable' }, { status: 404 })

  const db = createAdminClient()
  const eid = utilisateur.entreprise_id
  const url = new URL(request.url)
  const type = url.searchParams.get('type') as 'quotidien' | 'hebdomadaire' | 'mensuel' || 'quotidien'

  const { data: rapport } = await db
    .from('ai_strategy_reports')
    .select('*')
    .eq('entreprise_id', eid)
    .eq('type_rapport', type)
    .order('genere_a', { ascending: false })
    .limit(1)
    .maybeSingle()

  return NextResponse.json({ rapport })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const utilisateur = await getUtilisateur(user.id)
  if (!utilisateur) return NextResponse.json({ error: 'Profil introuvable' }, { status: 404 })

  const db = createAdminClient()
  const eid = utilisateur.entreprise_id

  let type: 'quotidien' | 'hebdomadaire' | 'mensuel' = 'quotidien'
  try {
    const body = await request.json()
    if (['quotidien', 'hebdomadaire', 'mensuel'].includes(body.type)) {
      type = body.type
    }
  } catch { /* pas de body = quotidien */ }

  // Rate limiting
  const { data: derniere } = await db
    .from('ai_strategy_reports')
    .select('genere_a')
    .eq('entreprise_id', eid)
    .eq('type_rapport', type)
    .order('genere_a', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (derniere) {
    const elapsed = Date.now() - new Date(derniere.genere_a).getTime()
    if (elapsed < COOLDOWN_MS) {
      const { data: cache } = await db
        .from('ai_strategy_reports')
        .select('*')
        .eq('entreprise_id', eid)
        .eq('type_rapport', type)
        .order('genere_a', { ascending: false })
        .limit(1)
        .maybeSingle()
      return NextResponse.json({ cached: true, data: cache })
    }
  }

  try {
    const result = type === 'quotidien'
      ? await analyserOperations(eid)
      : await genererSyntheseExecutive(eid, type)
    return NextResponse.json({ cached: false, data: result })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Erreur inconnue'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
