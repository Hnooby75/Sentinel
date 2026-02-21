// ============================================
// app/api/impayes/route.ts
// Module 2 — Impayés : CRUD factures + clients
// ============================================
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@/lib/supabase/admin'
import { calculerScoreGlobal, sauvegarderScoreGlobal } from '@/lib/scoring/global'
import { z } from 'zod'

const ClientSchema = z.object({
  nom: z.string().min(1, 'Nom requis').max(200),
  email: z.string().email().optional().or(z.literal('')),
  telephone: z.string().optional(),
  siret: z.string().optional(),
  secteur: z.string().optional(),
  pays: z.string().default('FR'),
  notes: z.string().optional(),
})

const FactureSchema = z.object({
  client_id: z.string().uuid(),
  numero: z.string().min(1),
  montant_ht: z.number().positive(),
  montant_ttc: z.number().positive(),
  devise: z.string().default('EUR'),
  statut: z.enum(['brouillon', 'envoyee', 'partielle', 'payee', 'en_retard', 'contentieux']).default('envoyee'),
  date_emission: z.string(),
  date_echeance: z.string(),
  date_paiement: z.string().optional(),
  notes: z.string().optional(),
})

// GET — liste des factures avec KPIs
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  // FIX: utiliser admin client pour bypasser RLS sur utilisateurs (évite récursion infinie)
  const admin = createAdminClient()
  const { data: utilisateur } = await admin
    .from('utilisateurs').select('entreprise_id').eq('id', user.id).single()
  if (!utilisateur) return NextResponse.json({ error: 'Profil introuvable' }, { status: 404 })

  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type') || 'factures'

  if (type === 'clients') {
    const { data, error } = await supabase
      .from('clients')
      .select('*, scores_fiabilite_client(score, montant_impaye, calcule_a)')
      .eq('entreprise_id', utilisateur.entreprise_id)
      .eq('actif', true)
      .order('nom')
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data })
  }

  // Liste factures avec client
  const statut = searchParams.get('statut')
  let query = supabase
    .from('factures')
    .select('*, client:clients(id, nom, email), paiements(*)')
    .eq('entreprise_id', utilisateur.entreprise_id)
    .order('date_echeance', { ascending: false })

  if (statut) query = query.eq('statut', statut)

  const { data: factures, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // KPIs
  const total = factures?.reduce((acc, f) => acc + Number(f.montant_ttc), 0) ?? 0
  const aRisque = factures
    ?.filter(f => ['en_retard', 'contentieux'].includes(f.statut))
    .reduce((acc, f) => acc + Number(f.montant_ttc), 0) ?? 0

  return NextResponse.json({
    data: factures,
    kpi: {
      montant_total: total,
      montant_a_risque: aRisque,
      nb_en_retard: factures?.filter(f => f.statut === 'en_retard').length ?? 0,
      nb_contentieux: factures?.filter(f => f.statut === 'contentieux').length ?? 0,
    },
  })
}

// POST — créer client + facture
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const admin = createAdminClient()
  const { data: utilisateur } = await admin
    .from('utilisateurs').select('entreprise_id, role').eq('id', user.id).single()
  if (!utilisateur) return NextResponse.json({ error: 'Profil introuvable' }, { status: 404 })

  const body = await request.json()

  // Création client si fourni
  if (body.type === 'client') {
    const validation = ClientSchema.safeParse(body.client)
    if (!validation.success) {
      return NextResponse.json({ error: 'Données invalides', details: validation.error.flatten() }, { status: 400 })
    }
    const { data: client, error } = await supabase
      .from('clients')
      .insert({ ...validation.data, entreprise_id: utilisateur.entreprise_id })
      .select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    await admin.from('audit_logs').insert({
      entreprise_id: utilisateur.entreprise_id,
      utilisateur_id: user.id,
      action: 'client.create',
      ressource_type: 'client',
      ressource_id: client.id,
      apres: client,
      succes: true,
    })
    return NextResponse.json(client, { status: 201 })
  }

  // Création facture
  const validation = FactureSchema.safeParse(body)
  if (!validation.success) {
    return NextResponse.json({ error: 'Données invalides', details: validation.error.flatten() }, { status: 400 })
  }

  const { data: facture, error } = await supabase
    .from('factures')
    .insert({ ...validation.data, entreprise_id: utilisateur.entreprise_id })
    .select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await admin.from('audit_logs').insert({
    entreprise_id: utilisateur.entreprise_id,
    utilisateur_id: user.id,
    action: 'facture.create',
    ressource_type: 'facture',
    ressource_id: facture.id,
    apres: facture,
    succes: true,
  })

  // Recalculer scores globaux (non bloquant)
  calculerScoreGlobal(utilisateur.entreprise_id).then(async (result) => {
    await sauvegarderScoreGlobal(utilisateur.entreprise_id, result)
  }).catch(console.error)

  return NextResponse.json(facture, { status: 201 })
}
