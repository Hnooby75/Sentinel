// ============================================
// app/api/crm/opportunites/route.ts
// GET: pipeline + KPIs groupés par étape
// POST: créer opportunité
// ============================================
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@/lib/supabase/admin'
import { getUtilisateur } from '@/lib/supabase/getUtilisateur'
import { z } from 'zod'

const CreateOpportuniteSchema = z.object({
  titre: z.string().min(1).max(300),
  montant_estime: z.number().positive().optional().nullable(),
  probabilite: z.number().min(0).max(100).default(50),
  etape: z.enum(['prospection', 'qualification', 'proposition', 'negociation', 'gagne', 'perdu']).default('prospection'),
  date_cloture_prevue: z.string().optional().nullable(),
  lead_id: z.string().uuid().optional().nullable(),
  client_id: z.string().uuid().optional().nullable(),
  assigne_a: z.string().uuid().optional().nullable(),
})

const ETAPES_ORDER = ['prospection', 'qualification', 'proposition', 'negociation', 'gagne', 'perdu'] as const

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const utilisateur = await getUtilisateur(user.id)
  if (!utilisateur) return NextResponse.json({ error: 'Profil introuvable' }, { status: 404 })

  const db = createAdminClient()
  const eid = utilisateur.entreprise_id

  const { data, error } = await db
    .from('opportunites')
    .select('*')
    .eq('entreprise_id', eid)
    .order('updated_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const opportunites = data || []

  // KPIs par étape
  const kpis = ETAPES_ORDER.reduce((acc, etape) => {
    const items = opportunites.filter(o => o.etape === etape)
    acc[etape] = {
      nb: items.length,
      montant: items.reduce((s, o) => s + (Number(o.montant_estime) || 0), 0),
    }
    return acc
  }, {} as Record<string, { nb: number; montant: number }>)

  const pipeline_total = opportunites
    .filter(o => o.etape !== 'gagne' && o.etape !== 'perdu')
    .reduce((s, o) => s + (Number(o.montant_estime) || 0), 0)

  return NextResponse.json({
    opportunites,
    kpis,
    pipeline_total,
  })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const utilisateur = await getUtilisateur(user.id)
  if (!utilisateur) return NextResponse.json({ error: 'Profil introuvable' }, { status: 404 })

  const body = await request.json()
  const validation = CreateOpportuniteSchema.safeParse(body)
  if (!validation.success) {
    return NextResponse.json({ error: 'Données invalides', details: validation.error.issues }, { status: 400 })
  }

  const db = createAdminClient()
  const { data, error } = await db
    .from('opportunites')
    .insert({ ...validation.data, entreprise_id: utilisateur.entreprise_id })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ opportunite: data }, { status: 201 })
}
