// ============================================
// app/admin/clients/[id]/apercu/page.tsx
// Super admin — aperçu complet du dashboard d'un client
// ============================================
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@/lib/supabase/admin'
import { getUtilisateur } from '@/lib/supabase/getUtilisateur'
import Link from 'next/link'
import {
  ArrowLeft, Users, FileText, BarChart2, AlertCircle,
  ClipboardList, TrendingUp, Shield, CheckCircle, Clock,
  Building2, CreditCard,
} from 'lucide-react'

const PLAN_LABELS: Record<string, string> = {
  trial: 'Essai gratuit', starter: 'Starter', pro: 'Pro', enterprise: 'Enterprise',
}

export default async function ApercuClientPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const currentUser = await getUtilisateur(user.id)
  if (currentUser?.role !== 'super_admin') redirect('/dashboard')

  const { id } = await params
  const db = createAdminClient()

  // Récupération parallèle de toutes les données du client
  const [
    entrepriseRes,
    membresRes,
    journauxRes,
    scoreConformiteRes,
    scoreGlobalRes,
    obligationsRes,
    facturesRes,
  ] = await Promise.all([
    db.from('entreprises')
      .select('id, nom, plan, plan_actif, trial_expires_at, secteur, taille, created_at')
      .eq('id', id)
      .single(),

    db.from('utilisateurs')
      .select('id, prenom, nom, email, role, actif')
      .eq('entreprise_id', id)
      .order('created_at', { ascending: true }),

    db.from('journaux_usage_ia')
      .select('id, titre, niveau_risque, statut, created_at')
      .eq('entreprise_id', id)
      .neq('statut', 'archive')
      .order('created_at', { ascending: false })
      .limit(5),

    db.from('scores_conformite')
      .select('score_global, niveau_conformite, calcule_a')
      .eq('entreprise_id', id)
      .order('calcule_a', { ascending: false })
      .limit(1)
      .maybeSingle(),

    db.from('scores_globaux')
      .select('score_global, niveau, calcule_a')
      .eq('entreprise_id', id)
      .order('calcule_a', { ascending: false })
      .limit(1)
      .maybeSingle(),

    db.from('obligations')
      .select('statut')
      .eq('entreprise_id', id),

    db.from('factures')
      .select('montant_ttc, statut')
      .eq('entreprise_id', id)
      .in('statut', ['en_retard', 'contentieux']),
  ])

  const entreprise = entrepriseRes.data
  if (!entreprise) redirect('/admin/clients')

  const membres = membresRes.data || []
  const journaux = journauxRes.data || []
  const scoreConformite = scoreConformiteRes.data
  const scoreGlobal = scoreGlobalRes.data
  const obligations = obligationsRes.data || []
  const facturesEnRetard = facturesRes.data || []

  const obligationsEnRetard = obligations.filter(o => o.statut === 'en_retard').length
  const obligationsAFaire = obligations.filter(o => o.statut === 'a_faire').length
  const montantImpaye = facturesEnRetard.reduce((s, f) => s + (Number(f.montant_ttc) || 0), 0)

  const trialExpired = entreprise.trial_expires_at && new Date(entreprise.trial_expires_at) < new Date()
  const trialDaysLeft = entreprise.trial_expires_at
    ? Math.max(0, Math.ceil((new Date(entreprise.trial_expires_at).getTime() - Date.now()) / 86400000))
    : null

  const niveauColor: Record<string, string> = {
    critique: 'text-red-400', insuffisant: 'text-orange-400',
    partiel: 'text-yellow-400', bon: 'text-blue-400', excellent: 'text-emerald-400',
  }

  const risqueColors: Record<string, string> = {
    inacceptable: 'bg-red-500/10 text-red-400 border-red-500/20',
    eleve: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    limite: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    minimal: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    non_classe: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/admin/clients/${id}`} className="text-slate-500 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white">{entreprise.nom}</h1>
            <span className={`text-xs px-2.5 py-1 rounded-full border ${
              entreprise.plan_actif
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : 'bg-red-500/10 text-red-400 border-red-500/20'
            }`}>
              {entreprise.plan_actif ? 'Actif' : 'Suspendu'}
            </span>
            <span className="text-xs px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
              {PLAN_LABELS[entreprise.plan] || entreprise.plan}
            </span>
          </div>
          <p className="text-slate-400 text-sm mt-0.5">
            Aperçu du dashboard — vue super admin
            {entreprise.secteur && ` · ${entreprise.secteur}`}
            {entreprise.taille && ` · ${entreprise.taille} salariés`}
          </p>
        </div>
        <Link
          href={`/admin/clients/${id}`}
          className="text-xs text-slate-400 hover:text-white transition-colors border border-slate-700 px-3 py-1.5 rounded-lg"
        >
          Retour fiche client
        </Link>
      </div>

      {/* Banner trial */}
      {entreprise.plan === 'trial' && (
        <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm ${
          trialExpired
            ? 'bg-red-500/10 border-red-500/20 text-red-400'
            : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
        }`}>
          <Clock className="w-4 h-4 flex-shrink-0" />
          {trialExpired
            ? `Essai expiré le ${new Date(entreprise.trial_expires_at!).toLocaleDateString('fr-FR')}`
            : `Essai actif — ${trialDaysLeft} jour${(trialDaysLeft || 0) > 1 ? 's' : ''} restant${(trialDaysLeft || 0) > 1 ? 's' : ''}`
          }
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <div className="flex items-center gap-2 mb-3">
            <BarChart2 className="w-4 h-4 text-blue-400" />
            <p className="text-xs text-slate-400">Score conformité</p>
          </div>
          <p className="text-3xl font-black text-white">{scoreConformite?.score_global ?? '—'}</p>
          <p className={`text-xs mt-1 font-medium capitalize ${niveauColor[scoreConformite?.niveau_conformite || 'critique']}`}>
            {scoreConformite?.niveau_conformite || 'Non calculé'}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <div className="flex items-center gap-2 mb-3">
            <Shield className="w-4 h-4 text-purple-400" />
            <p className="text-xs text-slate-400">Score global</p>
          </div>
          <p className="text-3xl font-black text-white">{scoreGlobal?.score_global ?? '—'}</p>
          <p className={`text-xs mt-1 font-medium capitalize ${niveauColor[scoreGlobal?.niveau || 'critique']}`}>
            {scoreGlobal?.niveau || 'Non calculé'}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <div className="flex items-center gap-2 mb-3">
            <FileText className="w-4 h-4 text-cyan-400" />
            <p className="text-xs text-slate-400">Journaux IA</p>
          </div>
          <p className="text-3xl font-black text-white">{journaux.length}</p>
          <p className="text-xs mt-1 text-slate-500">actifs (hors archive)</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <div className="flex items-center gap-2 mb-3">
            <Users className="w-4 h-4 text-emerald-400" />
            <p className="text-xs text-slate-400">Membres</p>
          </div>
          <p className="text-3xl font-black text-white">{membres.length}</p>
          <p className="text-xs mt-1 text-slate-500">
            {membres.filter(m => m.actif).length} actif{membres.filter(m => m.actif).length > 1 ? 's' : ''}
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        {/* Obligations */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="font-semibold text-white flex items-center gap-2 mb-4">
            <ClipboardList className="w-4 h-4 text-orange-400" />
            Obligations légales
          </h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">Total obligations</span>
              <span className="text-white font-medium">{obligations.length}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">En retard</span>
              <span className={obligationsEnRetard > 0 ? 'text-red-400 font-medium' : 'text-emerald-400'}>
                {obligationsEnRetard}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">À faire</span>
              <span className={obligationsAFaire > 0 ? 'text-amber-400 font-medium' : 'text-emerald-400'}>
                {obligationsAFaire}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">Validées</span>
              <span className="text-emerald-400">
                {obligations.filter(o => o.statut === 'valide').length}
              </span>
            </div>
          </div>
        </div>

        {/* Impayés */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="font-semibold text-white flex items-center gap-2 mb-4">
            <AlertCircle className="w-4 h-4 text-red-400" />
            Impayés & trésorerie
          </h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">Factures en retard</span>
              <span className={facturesEnRetard.length > 0 ? 'text-red-400 font-medium' : 'text-emerald-400'}>
                {facturesEnRetard.length}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">Montant impayé total</span>
              <span className={montantImpaye > 0 ? 'text-red-400 font-bold' : 'text-emerald-400'}>
                {montantImpaye > 0 ? `${montantImpaye.toLocaleString('fr-FR')} €` : '0 €'}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">En contentieux</span>
              <span className="text-orange-400">
                {facturesEnRetard.filter(f => f.statut === 'contentieux').length}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Journaux récents */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center gap-2">
          <FileText className="w-4 h-4 text-cyan-400" />
          <h2 className="font-semibold text-white">Derniers journaux IA</h2>
        </div>
        {journaux.length === 0 ? (
          <p className="text-center py-8 text-sm text-slate-500">Aucun journal déclaré</p>
        ) : (
          <div className="divide-y divide-slate-800">
            {journaux.map(j => (
              <div key={j.id} className="flex items-center gap-4 px-6 py-3 hover:bg-slate-800/50">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">{j.titre}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {new Date(j.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full border flex-shrink-0 ${risqueColors[j.niveau_risque] || risqueColors.non_classe}`}>
                  {j.niveau_risque?.replace('_', ' ') || 'non classé'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Membres */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center gap-2">
          <Users className="w-4 h-4 text-purple-400" />
          <h2 className="font-semibold text-white">Équipe ({membres.length})</h2>
        </div>
        {membres.length === 0 ? (
          <p className="text-center py-8 text-sm text-slate-500">Aucun membre</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-xs text-slate-500">
                <th className="text-left px-6 py-3">Nom</th>
                <th className="text-left px-6 py-3">Email</th>
                <th className="text-left px-6 py-3">Rôle</th>
                <th className="text-left px-6 py-3">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {membres.map(m => (
                <tr key={m.id} className="hover:bg-slate-800/50">
                  <td className="px-6 py-3 font-medium text-white">{m.prenom} {m.nom}</td>
                  <td className="px-6 py-3 text-slate-400">{m.email}</td>
                  <td className="px-6 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${
                      m.role === 'admin'
                        ? 'text-amber-400 border-amber-500/20 bg-amber-500/10'
                        : 'text-slate-400 border-slate-700 bg-slate-800'
                    }`}>{m.role}</span>
                  </td>
                  <td className="px-6 py-3">
                    <span className={`text-xs flex items-center gap-1 ${m.actif ? 'text-emerald-400' : 'text-slate-500'}`}>
                      {m.actif ? <><CheckCircle className="w-3 h-3" /> Actif</> : '○ Inactif'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Footer info */}
      <div className="flex items-center gap-3 text-xs text-slate-500 px-1">
        <Building2 className="w-3.5 h-3.5" />
        <span>Client depuis le {new Date(entreprise.created_at).toLocaleDateString('fr-FR')}</span>
        <span>·</span>
        <CreditCard className="w-3.5 h-3.5" />
        <span>{PLAN_LABELS[entreprise.plan] || entreprise.plan} — {entreprise.plan_actif ? 'Accès actif' : 'Accès suspendu'}</span>
      </div>
    </div>
  )
}
