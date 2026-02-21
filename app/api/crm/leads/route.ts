// ============================================
// app/api/crm/leads/route.ts
// GET: liste leads (ORDER BY score_ia DESC)
// POST: créer lead + scorer async
// ============================================
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@/lib/supabase/admin'
import { getUtilisateur } from '@/lib/supabase/getUtilisateur'
import { scorerLead } from '@/lib/services/ai/crm'
import { z } from 'zod'

const CreateLeadSchema = z.object({
  nom: z.string().min(1).max(200),
  email: z.string().email().optional().nullable(),
  telephone: z.string().max(30).optional().nullable(),
  entreprise_nom: z.string().max(200).optional().nullable(),
  source: z.enum(['site', 'referral', 'cold', 'event', 'autre']).default('autre'),
  statut: z.enum(['nouveau', 'contacte', 'qualifie', 'disqualifie']).default('nouveau'),
  notes: z.string().max(2000).optional().nullable(),
  assigne_a: z.string().uuid().optional().nullable(),
})

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const utilisateur = await getUtilisateur(user.id)
  if (!utilisateur) return NextResponse.json({ error: 'Profil introuvable' }, { status: 404 })

  const db = createAdminClient()
  const eid = utilisateur.entreprise_id
  const url = new URL(request.url)
  const statut = url.searchParams.get('statut')

  let query = db
    .from('leads')
    .select('*')
    .eq('entreprise_id', eid)
    .order('score_ia', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })

  if (statut) query = query.eq('statut', statut)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ leads: data || [] })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const utilisateur = await getUtilisateur(user.id)
  if (!utilisateur) return NextResponse.json({ error: 'Profil introuvable' }, { status: 404 })

  const body = await request.json()
  const validation = CreateLeadSchema.safeParse(body)
  if (!validation.success) {
    return NextResponse.json({ error: 'Données invalides', details: validation.error.issues }, { status: 400 })
  }

  const db = createAdminClient()
  const eid = utilisateur.entreprise_id

  const { data: lead, error } = await db
    .from('leads')
    .insert({ ...validation.data, entreprise_id: eid })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Scorer en async (fire-and-forget)
  scorerLead(
    {
      id: lead.id,
      nom: lead.nom,
      email: lead.email,
      telephone: lead.telephone,
      entreprise_nom: lead.entreprise_nom,
      source: lead.source,
      notes: lead.notes,
    },
    eid
  ).catch(err => console.error('Erreur scoring lead:', err))

  return NextResponse.json({ lead }, { status: 201 })
}
