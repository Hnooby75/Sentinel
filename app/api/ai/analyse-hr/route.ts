// ============================================
// app/api/ai/analyse-hr/route.ts
// GET: dernier rapport RH
// POST: déclenche analyserRH()
// ============================================
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@/lib/supabase/admin'
import { getUtilisateur } from '@/lib/supabase/getUtilisateur'
import { analyserRH } from '@/lib/services/ai/rh'

const COOLDOWN_MS = 3_600_000 // 1h

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const utilisateur = await getUtilisateur(user.id)
  if (!utilisateur) return NextResponse.json({ error: 'Profil introuvable' }, { status: 404 })

  const db = createAdminClient()
  const eid = utilisateur.entreprise_id

  const [rapportRes, alertesRes] = await Promise.all([
    db
      .from('ai_hr_reports')
      .select('*')
      .eq('entreprise_id', eid)
      .order('genere_a', { ascending: false })
      .limit(1)
      .maybeSingle(),
    db
      .from('ai_alerts')
      .select('*')
      .eq('entreprise_id', eid)
      .eq('module', 'rh')
      .eq('resolu', false)
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  return NextResponse.json({
    rapport: rapportRes.data,
    alertes: alertesRes.data || [],
  })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const utilisateur = await getUtilisateur(user.id)
  if (!utilisateur) return NextResponse.json({ error: 'Profil introuvable' }, { status: 404 })

  const db = createAdminClient()
  const eid = utilisateur.entreprise_id

  // Rate limiting
  const { data: derniere } = await db
    .from('ai_hr_reports')
    .select('genere_a')
    .eq('entreprise_id', eid)
    .order('genere_a', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (derniere) {
    const elapsed = Date.now() - new Date(derniere.genere_a).getTime()
    if (elapsed < COOLDOWN_MS) {
      const { data: cache } = await db
        .from('ai_hr_reports')
        .select('*')
        .eq('entreprise_id', eid)
        .order('genere_a', { ascending: false })
        .limit(1)
        .maybeSingle()
      return NextResponse.json({ cached: true, data: cache })
    }
  }

  try {
    const result = await analyserRH(eid)
    return NextResponse.json({ cached: false, data: result })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Erreur inconnue'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
