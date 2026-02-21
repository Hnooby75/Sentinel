// ============================================
// app/api/marketing/kpis/route.ts
// GET: KPIs du mois courant
// ============================================
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@/lib/supabase/admin'
import { getUtilisateur } from '@/lib/supabase/getUtilisateur'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const utilisateur = await getUtilisateur(user.id)
  if (!utilisateur) return NextResponse.json({ error: 'Profil introuvable' }, { status: 404 })

  const db = createAdminClient()
  const now = new Date()
  const moisDebut = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`

  const { data: kpis } = await db
    .from('kpis_marketing')
    .select('*')
    .eq('entreprise_id', utilisateur.entreprise_id)
    .gte('mois', moisDebut)
    .order('mois', { ascending: false })
    .limit(1)

  return NextResponse.json({ kpis: kpis?.[0] ?? null })
}
