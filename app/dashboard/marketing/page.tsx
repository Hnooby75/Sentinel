// ============================================
// app/dashboard/marketing/page.tsx
// Module Marketing — server component
// Lit le vrai plan Supabase (plus de localStorage)
// ============================================
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@/lib/supabase/admin'
import { getUtilisateur } from '@/lib/supabase/getUtilisateur'
import {
  Megaphone, Users, Clock, Target, BarChart,
  TrendingUp, ArrowUpRight, Calendar, MessageSquare, CheckCircle
} from 'lucide-react'

const MARKETING_PLANS = ['pro', 'enterprise']

const statutCampagneColors: Record<string, string> = {
  setup: 'bg-amber-500/20 text-amber-400',
  actif: 'bg-emerald-500/20 text-emerald-400',
  pause: 'bg-slate-500/20 text-slate-400',
  termine: 'bg-red-500/20 text-red-400',
}

export default async function MarketingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const utilisateur = await getUtilisateur(user.id)
  if (!utilisateur) redirect('/login')

  const plan: string = utilisateur.entreprise?.plan ?? 'trial'
  const hasPlan = MARKETING_PLANS.includes(plan)

  // Plan inactif → upsell
  if (!hasPlan) {
    return (
      <div className="max-w-2xl mx-auto py-12">
        <div className="rounded-2xl border border-purple-500/20 bg-gradient-to-b from-purple-500/10 to-pink-500/5 p-10 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center mx-auto mb-6">
            <Megaphone className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold mb-3">Marketing Humain</h1>
          <p className="text-slate-400 mb-8 leading-relaxed">
            Un manager marketing dédié pour votre PME. Réseaux sociaux, ADS, influenceurs.
            Des vrais experts, des résultats mesurables. Disponible dès le pack{' '}
            <strong className="text-white">Pro</strong>.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8 text-left">
            {[
              { title: 'Manager dédié', desc: 'Un humain, pas un bot' },
              { title: '4h/mois min.', desc: 'Création & gestion incluses' },
              { title: 'Rapport mensuel', desc: 'KPIs clairs chaque mois' },
            ].map(f => (
              <div key={f.title} className="rounded-xl bg-white/5 border border-white/[0.08] p-4">
                <p className="text-sm font-semibold text-white mb-1">{f.title}</p>
                <p className="text-xs text-slate-400">{f.desc}</p>
              </div>
            ))}
          </div>
          <Link
            href="/dashboard/parametres/abonnement"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-purple-500 to-pink-600 hover:opacity-90 transition-all"
          >
            Passer au pack Pro
            <ArrowUpRight className="w-4 h-4" />
          </Link>
          <p className="text-xs text-slate-500 mt-3">À partir de 149€/mois · Résiliation libre</p>
        </div>
      </div>
    )
  }

  // Plan OK → charger la mission depuis Supabase
  const db = createAdminClient()
  const eid = utilisateur.entreprise_id
  const now = new Date()
  const moisDebut = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`

  const [missionRes, campagnesRes, kpisRes, rdvRes, messagesRes] = await Promise.all([
    db
      .from('marketing_missions')
      .select(`
        id, heures_allouees_par_mois, statut, notes,
        agent:agents_sentinel(id, prenom, nom, email, photo_url, role, specialites, bio)
      `)
      .eq('entreprise_id', eid)
      .single(),
    db
      .from('campagnes_marketing')
      .select('id, nom, type, statut, plateforme')
      .eq('entreprise_id', eid)
      .order('created_at', { ascending: false })
      .limit(5),
    db
      .from('kpis_marketing')
      .select('portee, engagement, nouveaux_abonnes, leads, conversions, ca_genere')
      .eq('entreprise_id', eid)
      .gte('mois', moisDebut)
      .order('mois', { ascending: false })
      .limit(1),
    db
      .from('rendez_vous_marketing')
      .select('id, titre, date_rdv, duree_minutes, statut, lien_visio')
      .eq('entreprise_id', eid)
      .gte('date_rdv', now.toISOString())
      .in('statut', ['planifie', 'confirme'])
      .order('date_rdv', { ascending: true })
      .limit(1),
    db
      .from('messages_marketing')
      .select('id, content, is_from_agent, created_at')
      .eq('entreprise_id', eid)
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  const mission = missionRes.data
  const campagnes = campagnesRes.data || []
  const kpis = kpisRes.data?.[0] ?? null
  const prochainRdv = rdvRes.data?.[0] ?? null
  const derniersMsgs = (messagesRes.data || []).reverse()

  // Pas de mission configurée
  if (!mission) {
    return (
      <div className="max-w-2xl mx-auto py-12">
        <div className="rounded-2xl border border-slate-700 bg-slate-800/30 p-10 text-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500/30 to-pink-500/20 flex items-center justify-center mx-auto mb-5 border border-purple-500/20">
            <Megaphone className="w-7 h-7 text-purple-400" />
          </div>
          <h1 className="text-xl font-bold mb-2 text-white">Marketing en cours de configuration</h1>
          <p className="text-slate-400 text-sm leading-relaxed">
            Votre accompagnement marketing est activé. Notre équipe vous assigne un manager dédié dans les 48h.
            En attendant, vous pouvez nous écrire via le support.
          </p>
          <Link
            href="/dashboard/sav"
            className="inline-flex items-center gap-2 mt-6 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium transition-colors"
          >
            <MessageSquare className="w-4 h-4" />
            Contacter le support
          </Link>
        </div>
      </div>
    )
  }

  // Heures utilisées ce mois
  const { data: heuresData } = await db
    .from('heures_marketing')
    .select('heures_utilisees')
    .eq('mission_id', mission.id)
    .gte('mois', moisDebut)
    .order('mois', { ascending: false })
    .limit(1)
  const heuresUtilisees = heuresData?.[0]?.heures_utilisees ?? 0
  const heuresAllouees = mission.heures_allouees_par_mois ?? 4
  const pctHeures = heuresAllouees > 0 ? Math.min((heuresUtilisees / heuresAllouees) * 100, 100) : 0

  const agent = Array.isArray(mission.agent)
    ? (mission.agent[0] ?? null)
    : (mission.agent as { id: string; prenom: string; nom: string; email: string; photo_url: string | null; role: string; specialites: string[]; bio: string | null } | null)

  const agentInitials = agent ? `${agent.prenom[0]}${agent.nom[0]}`.toUpperCase() : 'M'

  const roleLabel: Record<string, string> = {
    agent_junior: 'Agent junior',
    agent_senior: 'Agent senior',
    manager: 'Manager marketing',
    directeur: 'Directeur marketing',
  }

  const statutMissionColor =
    mission.statut === 'active' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' :
    mission.statut === 'pause' ? 'text-amber-400 bg-amber-500/10 border-amber-500/20' :
    'text-slate-400 bg-slate-500/10 border-slate-500/20'

  return (
    <div className="max-w-4xl mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Marketing {agent ? `— ${agent.prenom} ${agent.nom}` : ''}
          </h1>
          <p className="text-slate-400 text-sm mt-1">Votre accompagnement marketing dédié</p>
        </div>
        <span className={`text-xs px-3 py-1 rounded-full border capitalize font-medium ${statutMissionColor}`}>
          {mission.statut}
        </span>
      </div>

      {/* Row 1 : Agent */}
      {agent && (
        <div className="rounded-2xl border border-slate-700/50 bg-slate-800/30 p-6">
          <h2 className="font-semibold mb-4 flex items-center gap-2 text-sm text-slate-400 uppercase tracking-wider">
            <Users className="w-4 h-4" />
            Votre manager dédié
          </h2>
          <div className="flex items-start gap-4">
            {agent.photo_url ? (
              <img
                src={agent.photo_url}
                alt={`${agent.prenom} ${agent.nom}`}
                className="w-14 h-14 rounded-full object-cover flex-shrink-0"
              />
            ) : (
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                {agentInitials}
              </div>
            )}
            <div className="flex-1">
              <p className="font-semibold text-white text-lg">{agent.prenom} {agent.nom}</p>
              <p className="text-sm text-slate-400">{roleLabel[agent.role] ?? agent.role}</p>
              {agent.bio && <p className="text-sm text-slate-400 mt-1">{agent.bio}</p>}
              {agent.specialites && agent.specialites.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {agent.specialites.map((s: string) => (
                    <span key={s} className="text-xs px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-400 border border-purple-500/20">
                      {s}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div className="flex flex-col gap-2 flex-shrink-0">
              <Link
                href="/dashboard/sav"
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium transition-colors"
              >
                <MessageSquare className="w-4 h-4" />
                Message
              </Link>
              {prochainRdv && (
                <Link
                  href="/dashboard/sav"
                  className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-700 hover:border-slate-600 text-slate-300 text-sm font-medium transition-colors"
                >
                  <Calendar className="w-4 h-4" />
                  RDV
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Row 2 : Heures + Campagnes */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Heures ce mois */}
        <div className="rounded-2xl border border-slate-700/50 bg-slate-800/30 p-6">
          <h2 className="font-semibold mb-4 flex items-center gap-2 text-sm text-slate-400 uppercase tracking-wider">
            <Clock className="w-4 h-4" />
            Heures ce mois
          </h2>
          <div className="flex items-end gap-2 mb-3">
            <span className="text-4xl font-black text-white">{heuresUtilisees.toFixed(1)}</span>
            <span className="text-slate-400 text-sm pb-1">/ {heuresAllouees}h allouées</span>
          </div>
          {/* Arc SVG */}
          <div className="relative w-full flex justify-center mb-3">
            <svg width="120" height="60" viewBox="0 0 120 60">
              <path
                d="M 10 55 A 50 50 0 0 1 110 55"
                fill="none"
                stroke="#334155"
                strokeWidth="8"
                strokeLinecap="round"
              />
              <path
                d="M 10 55 A 50 50 0 0 1 110 55"
                fill="none"
                stroke="url(#grad)"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${(pctHeures / 100) * 157} 157`}
              />
              <defs>
                <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#a855f7" />
                  <stop offset="100%" stopColor="#ec4899" />
                </linearGradient>
              </defs>
            </svg>
            <span className="absolute bottom-1 text-lg font-bold text-white">
              {Math.round(pctHeures)}%
            </span>
          </div>
          <p className="text-xs text-slate-500 text-center">
            {Math.max(0, heuresAllouees - heuresUtilisees).toFixed(1)}h restantes ce mois
          </p>
        </div>

        {/* Campagnes */}
        <div className="rounded-2xl border border-slate-700/50 bg-slate-800/30 p-6">
          <h2 className="font-semibold mb-4 flex items-center gap-2 text-sm text-slate-400 uppercase tracking-wider">
            <Target className="w-4 h-4" />
            Campagnes en cours
          </h2>
          {campagnes.length === 0 ? (
            <p className="text-slate-500 text-sm">Aucune campagne pour le moment.</p>
          ) : (
            <div className="space-y-2.5">
              {campagnes.map(c => (
                <div key={c.id} className="flex items-center justify-between text-sm">
                  <div className="flex-1 min-w-0 mr-2">
                    <p className="text-slate-300 truncate">{c.nom}</p>
                    {c.plateforme && <p className="text-xs text-slate-500 truncate">{c.plateforme}</p>}
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${statutCampagneColors[c.statut] ?? 'bg-slate-500/20 text-slate-400'}`}>
                    {c.statut}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Row 3 : KPIs */}
      <div className="rounded-2xl border border-slate-700/50 bg-slate-800/30 p-6">
        <h2 className="font-semibold mb-6 flex items-center gap-2 text-sm text-slate-400 uppercase tracking-wider">
          <BarChart className="w-4 h-4" />
          KPIs du mois
        </h2>
        {kpis ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { label: 'Portée totale', value: kpis.portee.toLocaleString('fr-FR'), icon: TrendingUp },
              { label: 'Engagement', value: `${kpis.engagement.toFixed(1)}%`, icon: Target },
              { label: 'Nouveaux abonnés', value: `+${kpis.nouveaux_abonnes}`, icon: Users },
              { label: 'Leads', value: String(kpis.leads), icon: BarChart },
            ].map(kpi => (
              <div key={kpi.label} className="text-center">
                <kpi.icon className="w-5 h-5 text-purple-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-white">{kpi.value}</p>
                <p className="text-xs text-slate-400 mt-1">{kpi.label}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-slate-500 text-sm text-center py-4">
            Aucun KPI saisi pour ce mois. Votre manager les mettra à jour prochainement.
          </p>
        )}
      </div>

      {/* Row 4 : Prochain RDV */}
      {prochainRdv && (
        <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-5">
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-blue-400 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-medium text-white">{prochainRdv.titre}</p>
              <p className="text-sm text-slate-400 mt-0.5">
                {new Date(prochainRdv.date_rdv).toLocaleString('fr-FR', {
                  weekday: 'long', day: '2-digit', month: 'long',
                  hour: '2-digit', minute: '2-digit'
                })} · {prochainRdv.duree_minutes} min
              </p>
            </div>
            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400">
              {prochainRdv.statut}
            </span>
            {prochainRdv.lien_visio && (
              <a
                href={prochainRdv.lien_visio}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium transition-colors"
              >
                Rejoindre
                <ArrowUpRight className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>
      )}

      {/* Row 5 : Derniers messages */}
      <div className="rounded-2xl border border-slate-700/50 bg-slate-800/30 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold flex items-center gap-2 text-sm text-slate-400 uppercase tracking-wider">
            <MessageSquare className="w-4 h-4" />
            Derniers messages
          </h2>
          <Link
            href="/dashboard/sav"
            className="text-xs text-purple-400 hover:underline"
          >
            Voir le chat complet →
          </Link>
        </div>
        {derniersMsgs.length === 0 ? (
          <p className="text-slate-500 text-sm">
            Aucun échange pour le moment.{' '}
            <Link href="/dashboard/sav" className="text-purple-400 hover:underline">
              Envoyer un message →
            </Link>
          </p>
        ) : (
          <div className="space-y-3">
            {derniersMsgs.map(msg => (
              <div key={msg.id} className={`flex gap-3 text-sm ${msg.is_from_agent ? '' : 'flex-row-reverse'}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                  msg.is_from_agent ? 'bg-purple-600' : 'bg-blue-600'
                }`}>
                  {msg.is_from_agent ? agentInitials : (utilisateur.prenom?.[0] ?? 'V')}
                </div>
                <div className={`rounded-xl px-3 py-2 max-w-[80%] ${
                  msg.is_from_agent ? 'bg-slate-800 text-slate-200' : 'bg-blue-600/30 text-slate-200'
                }`}>
                  <p className="text-xs leading-relaxed line-clamp-2">{msg.content}</p>
                  <p className="text-[10px] text-slate-500 mt-1">
                    {new Date(msg.created_at).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="mt-4 pt-4 border-t border-slate-700/50">
          <Link
            href="/dashboard/sav"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-purple-500/30 text-purple-400 hover:bg-purple-500/10 text-sm font-medium transition-colors w-full justify-center"
          >
            <MessageSquare className="w-4 h-4" />
            Ouvrir le chat avec {agent?.prenom ?? 'votre manager'}
          </Link>
        </div>
      </div>
    </div>
  )
}
