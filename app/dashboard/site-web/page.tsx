// ============================================
// app/dashboard/site-web/page.tsx
// Mon Site Web — 4 cas selon le profil du compte
// ============================================
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@/lib/supabase/admin'
import { getUtilisateur } from '@/lib/supabase/getUtilisateur'
import {
  Globe, ExternalLink, CheckCircle, Clock, Wrench, XCircle,
  Layout, Search, Zap, ArrowRight, MessageSquare, Ticket, ShieldCheck,
} from 'lucide-react'
import CmsEditor from './CmsEditor'

// ─── Types ────────────────────────────────────────────────
interface SiteClient {
  url: string | null
  statut: string | null
  contenu: Record<string, unknown>
  updated_at: string | null
}

interface EntrepriseData {
  nom: string
  plan: string
  site_web_actif: boolean
}

// ─── Helpers ──────────────────────────────────────────────
const STATUT_CONFIG: Record<string, { label: string; color: string; icon: typeof CheckCircle }> = {
  en_ligne:      { label: 'En ligne',      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', icon: CheckCircle  },
  en_creation:   { label: 'En création',   color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',       icon: Clock        },
  en_maintenance:{ label: 'En maintenance',color: 'text-blue-400 bg-blue-500/10 border-blue-500/20',          icon: Wrench       },
  inactif:       { label: 'Inactif',       color: 'text-slate-400 bg-slate-500/10 border-slate-500/20',       icon: XCircle      },
}

function StatutBadge({ statut }: { statut: string | null }) {
  const cfg = STATUT_CONFIG[statut ?? ''] ?? STATUT_CONFIG.inactif
  const Icon = cfg.icon
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full border ${cfg.color}`}>
      <Icon className="w-3.5 h-3.5" />
      {cfg.label}
    </span>
  )
}

// ─── Page principale ──────────────────────────────────────
export default async function SiteWebPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const utilisateur = await getUtilisateur(user.id)
  if (!utilisateur) redirect('/login')

  const db = createAdminClient()

  // Récupérer entreprise + site en parallèle
  const [{ data: entreprise }, { data: siteData }] = await Promise.all([
    db.from('entreprises')
      .select('*')   // select('*') évite une erreur si site_web_actif n'existe pas encore
      .eq('id', utilisateur.entreprise_id)
      .single(),
    db.from('sites_clients')
      .select('url, statut, contenu, updated_at')
      .eq('entreprise_id', utilisateur.entreprise_id)
      .maybeSingle(),
  ])

  const e = entreprise as EntrepriseData | null
  const s = siteData as SiteClient | null

  const isSuperAdmin  = utilisateur.role === 'super_admin'
  const siteWebActif  = e?.site_web_actif ?? false
  const siteConfigue  = s?.statut === 'en_ligne' && s?.url

  // ── CAS 1 : super_admin → sa propre vitrine + CMS ──────
  if (isSuperAdmin) {
    return <PageSuperAdmin site={s} entreprise={e} />
  }

  // ── CAS 2 : site_web_actif = false → upsell ────────────
  // (plan gratuit / pack site web non acheté)
  if (!siteWebActif) {
    return <PageUpsell />
  }

  // ── CAS 3 : pack acheté mais site pas encore configuré ─
  if (!siteConfigue) {
    return <PageEnCreation site={s} />
  }

  // ── CAS 4 : site payé + configuré en ligne ───────────────
  return <PageSiteClient site={s} entreprise={e} />
}

// ─────────────────────────────────────────────────────────
// CAS 1 — Super admin : affiche son propre site (Sentinel)
// ─────────────────────────────────────────────────────────
function PageSuperAdmin({ site, entreprise }: { site: SiteClient | null; entreprise: EntrepriseData | null }) {
  const siteUrl    = site?.url ?? '/vitrine/'
  const lastUpdate = site?.updated_at
    ? new Date(site.updated_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
    : null
  const contenu = (site?.contenu ?? {}) as Record<string, string>

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/30 flex items-center justify-center">
          <Globe className="w-5 h-5 text-cyan-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">Mon Site Web</h1>
          <p className="text-slate-500 text-sm">{entreprise?.nom ?? 'Sentinel'}</p>
        </div>
        <div className="ml-auto">
          <StatutBadge statut={site?.statut ?? 'en_ligne'} />
        </div>
      </div>

      {/* Badge super admin */}
      <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-sm text-amber-400">
        <ShieldCheck className="w-4 h-4 flex-shrink-0" />
        <span>Compte super admin — vous gérez votre propre vitrine Sentinel</span>
      </div>

      {/* Carte site */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden">
        <div className="bg-slate-800/60 px-5 py-4 border-b border-slate-800 flex items-center gap-3">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/70" />
            <div className="w-3 h-3 rounded-full bg-amber-500/70" />
            <div className="w-3 h-3 rounded-full bg-emerald-500/70" />
          </div>
          <span className="text-xs text-slate-500 font-mono bg-slate-900 px-3 py-1 rounded-md">
            {siteUrl}
          </span>
        </div>

        <div className="p-6 space-y-5">
          <div>
            <p className="text-xs text-slate-500 mb-2 uppercase tracking-wide font-semibold">URL de votre vitrine</p>
            <div className="flex items-center gap-3">
              <code className="flex-1 text-sm text-cyan-400 bg-slate-800 px-4 py-2.5 rounded-xl truncate">
                {siteUrl}
              </code>
              <a
                href={siteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 text-sm font-semibold transition-colors flex-shrink-0"
              >
                <ExternalLink className="w-4 h-4" />
                Voir ma vitrine
              </a>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
              <p className="text-xs text-slate-500 mb-1">Statut</p>
              <StatutBadge statut={site?.statut ?? 'en_ligne'} />
            </div>
            <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
              <p className="text-xs text-slate-500 mb-1">Dernière mise à jour</p>
              <p className="text-sm font-medium text-white">{lastUpdate ?? '—'}</p>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800">
            <p className="text-xs text-slate-500 mb-3">Gestion avancée</p>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/admin/clients"
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-amber-400 text-xs font-medium transition-colors"
              >
                Configurer les sites clients
              </Link>
              <a
                href="/vitrine/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-medium transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Prévisualiser en plein écran
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* CMS — éditeur de contenu vitrine */}
      <CmsEditor initialContenu={contenu} />
    </div>
  )
}

// ─────────────────────────────────────────────────────────
// CAS 2 — Upsell : le client n'a pas acheté le service
// ─────────────────────────────────────────────────────────
function PageUpsell() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center py-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/30 mb-5">
          <Globe className="w-8 h-8 text-cyan-400" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Mon Site Web</h1>
        <p className="text-slate-400">
          Un site professionnel géré par notre équipe, inclus dans votre abonnement.
        </p>
      </div>

      {/* Features */}
      <div className="rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-cyan-500/5 to-blue-600/5 p-7">
        <h2 className="font-semibold text-white mb-5">Ce qui est inclus</h2>
        <div className="space-y-4">
          {[
            { icon: Layout, color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',    title: 'Design professionnel', desc: 'Site aux couleurs de votre marque. Responsive et moderne. Livré en 10 jours.' },
            { icon: Search, color: 'text-blue-400 bg-blue-500/10 border-blue-500/20',    title: 'SEO inclus',           desc: 'Optimisation Google dès le départ. Hébergement France, SSL, 99.9% uptime.' },
            { icon: Zap,    color: 'text-violet-400 bg-violet-500/10 border-violet-500/20', title: 'CMS simple',        desc: 'Modifiez vos textes et images en 2 clics depuis votre dashboard, sans coder.' },
          ].map(({ icon: Icon, color, title, desc }) => (
            <div key={title} className="flex items-start gap-4">
              <div className={`w-10 h-10 rounded-xl border flex items-center justify-center flex-shrink-0 ${color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <p className="font-semibold text-white text-sm">{title}</p>
                <p className="text-slate-400 text-sm mt-0.5">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tarifs rapides */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <p className="text-xs text-slate-500 mb-1">Site Essentiel</p>
          <p className="text-2xl font-bold text-white">149€<span className="text-sm font-normal text-slate-400">/mois</span></p>
          <p className="text-xs text-slate-500 mt-2">5 pages · SEO de base · CMS</p>
        </div>
        <div className="rounded-xl border border-cyan-500/30 bg-gradient-to-br from-cyan-500/5 to-blue-500/5 p-5">
          <div className="flex items-center gap-2 mb-1">
            <p className="text-xs text-slate-500">Site Pro</p>
            <span className="text-[10px] font-bold bg-cyan-500 text-black px-1.5 py-0.5 rounded">RECOMMANDÉ</span>
          </div>
          <p className="text-2xl font-bold text-white">249€<span className="text-sm font-normal text-slate-400">/mois</span></p>
          <p className="text-xs text-slate-500 mt-2">15+ pages · SEO avancé · Analytics</p>
        </div>
      </div>

      {/* CTA */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 text-center">
        <p className="text-white font-semibold mb-1">Intéressé par ce service ?</p>
        <p className="text-slate-400 text-sm mb-5">
          Contactez notre équipe via un ticket SAV. Nous vous répondons sous 48h avec une proposition personnalisée.
        </p>
        <Link
          href="/dashboard/sav/tickets?sujet=Activation+site+web"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:opacity-90 text-white font-semibold transition-opacity"
        >
          <Ticket className="w-4 h-4" />
          Demander ce service
        </Link>
        <p className="text-slate-600 text-xs mt-4 flex items-center justify-center gap-1.5">
          <MessageSquare className="w-3.5 h-3.5" />
          Ou écrivez-nous via le chat SAV
        </p>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────
// CAS 3 — Site payé mais pas encore créé / en création
// ─────────────────────────────────────────────────────────
function PageEnCreation({ site }: { site: SiteClient | null }) {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
          <Clock className="w-5 h-5 text-amber-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">Mon Site Web</h1>
          <p className="text-slate-500 text-sm">Service activé</p>
        </div>
        <div className="ml-auto">
          <StatutBadge statut={site?.statut ?? 'en_creation'} />
        </div>
      </div>

      {/* Status card */}
      <div className="rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-orange-500/5 p-8 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-500/20 border border-amber-500/30 mb-5">
          <Wrench className="w-8 h-8 text-amber-400" />
        </div>
        <h2 className="text-xl font-bold text-white mb-3">Votre site est en cours de création</h2>
        <p className="text-slate-400 leading-relaxed max-w-md mx-auto">
          Notre équipe prépare votre site web. Vous serez notifié par email dès qu&apos;il sera en ligne.
          En moyenne, la livraison prend <strong className="text-white">7 à 10 jours</strong> après validation de vos informations.
        </p>
      </div>

      {/* Étapes */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
        <h3 className="font-semibold text-white mb-4">Prochaines étapes</h3>
        <div className="space-y-3">
          {[
            { done: true,  label: 'Service site web activé' },
            { done: false, label: 'Transmission de vos informations (logo, couleurs, textes)' },
            { done: false, label: 'Design et intégration par notre équipe' },
            { done: false, label: 'Validation et mise en ligne' },
          ].map((step, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                step.done
                  ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-400'
                  : 'bg-slate-800 border border-slate-700 text-slate-600'
              }`}>
                {step.done ? '✓' : i + 1}
              </div>
              <span className={`text-sm ${step.done ? 'text-slate-400 line-through' : 'text-slate-300'}`}>
                {step.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* SAV ticket */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 text-center">
        <p className="text-white font-semibold mb-1">Une question sur votre site ?</p>
        <p className="text-slate-400 text-sm mb-5">
          Créez un ticket SAV pour transmettre vos informations (logo, couleurs, textes) ou suivre l&apos;avancement de votre site.
        </p>
        <Link
          href="/dashboard/sav/tickets?sujet=Mon+site+web"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-semibold transition-colors"
        >
          <Ticket className="w-4 h-4" />
          Créer un ticket de suivi
        </Link>
        <p className="text-slate-600 text-xs mt-4 flex items-center justify-center gap-1.5">
          <MessageSquare className="w-3.5 h-3.5" />
          Ou contactez-nous via le chat SAV
        </p>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────
// CAS 4 — Site configuré et en ligne : dashboard client
// ─────────────────────────────────────────────────────────
function PageSiteClient({ site, entreprise }: { site: SiteClient | null; entreprise: EntrepriseData | null }) {
  const siteUrl    = site?.url ?? '#'
  const lastUpdate = site?.updated_at
    ? new Date(site.updated_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
    : null

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/30 flex items-center justify-center">
          <Globe className="w-5 h-5 text-cyan-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">Mon Site Web</h1>
          <p className="text-slate-500 text-sm">{entreprise?.nom ?? ''}</p>
        </div>
        <div className="ml-auto">
          <StatutBadge statut={site?.statut ?? 'en_ligne'} />
        </div>
      </div>

      {/* Carte site */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden">
        {/* Browser mockup header */}
        <div className="bg-slate-800/60 px-5 py-4 border-b border-slate-800 flex items-center gap-3">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/70" />
            <div className="w-3 h-3 rounded-full bg-amber-500/70" />
            <div className="w-3 h-3 rounded-full bg-emerald-500/70" />
          </div>
          <span className="text-xs text-slate-500 font-mono bg-slate-900 px-3 py-1 rounded-md truncate">
            {siteUrl}
          </span>
        </div>

        <div className="p-6 space-y-5">
          {/* URL + action */}
          <div>
            <p className="text-xs text-slate-500 mb-2 uppercase tracking-wide font-semibold">URL de votre site</p>
            <div className="flex items-center gap-3">
              <code className="flex-1 text-sm text-cyan-400 bg-slate-800 px-4 py-2.5 rounded-xl truncate">
                {siteUrl}
              </code>
              <a
                href={siteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 text-sm font-semibold transition-colors flex-shrink-0"
              >
                <ExternalLink className="w-4 h-4" />
                Voir mon site
              </a>
            </div>
          </div>

          {/* Infos */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
              <p className="text-xs text-slate-500 mb-1">Statut</p>
              <StatutBadge statut={site?.statut ?? 'en_ligne'} />
            </div>
            <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
              <p className="text-xs text-slate-500 mb-1">Dernière mise à jour</p>
              <p className="text-sm font-medium text-white">{lastUpdate ?? '—'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Demande modification */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
        <h3 className="font-semibold text-white mb-1">Demander une modification</h3>
        <p className="text-slate-400 text-sm mb-4">
          Besoin de mettre à jour vos textes, photos ou informations ? Créez un ticket et notre équipe s&apos;en occupe sous 48h.
        </p>
        <Link
          href="/dashboard/sav/tickets?sujet=Mon+site+web"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors"
        >
          <ArrowRight className="w-4 h-4" />
          Demander une modification
        </Link>
      </div>
    </div>
  )
}
