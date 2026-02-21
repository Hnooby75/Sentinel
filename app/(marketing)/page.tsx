import Link from 'next/link'
import { Shield, Scale, Globe, Megaphone, Check, Zap, Lock, RefreshCw, Headphones, ChevronRight } from 'lucide-react'
import FeaturesSection from '@/components/marketing/FeaturesSection'

// Packs par défaut si la table n'est pas encore créée
const DEFAULT_PACKS = [
  {
    name: 'Solo',
    price: 49,
    desc: 'Gestion légale & fiscale complète',
    features: ['Obligations légales automatisées', 'Optimisation fiscale IA', 'Gestion des contrats', 'Suivi des impayés', 'Copilote juridique', 'Support email'],
    popular: false,
  },
  {
    name: 'Présence',
    price: 149,
    desc: 'Solo + Site web professionnel',
    features: ['Tout Solo', 'Site web pro créé en 48h', 'Hébergement France inclus', 'CMS depuis le dashboard', 'Support prioritaire'],
    popular: false,
  },
  {
    name: 'Croissance',
    price: 349,
    desc: 'Présence + 4h marketing/mois',
    features: ['Tout Présence', '4h marketing/mois', 'Réseaux sociaux gérés', 'Rapport mensuel KPIs', 'Manager marketing dédié'],
    popular: true,
  },
  {
    name: 'Accélération',
    price: 699,
    desc: 'Tout inclus + 12h marketing + ADS',
    features: ['Tout Croissance', '12h marketing/mois', 'ADS Meta & Google gérés', 'Budget ADS optimisé', 'Suivi hebdomadaire'],
    popular: false,
  },
]

type Pack = typeof DEFAULT_PACKS[number]

async function getPacks(): Promise<Pack[]> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const res = await fetch(`${baseUrl}/api/site-settings?cle=packs`, {
      next: { revalidate: 30 },
    })
    if (!res.ok) return DEFAULT_PACKS
    const { valeur } = await res.json()
    return Array.isArray(valeur) && valeur.length > 0 ? valeur : DEFAULT_PACKS
  } catch {
    return DEFAULT_PACKS
  }
}

// ─── Hero ────────────────────────────────────────────────────────────────────
function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl" />
        <svg className="absolute inset-0 w-full h-full opacity-[0.03]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {['Zéro pénalité fiscale', 'Données France 🇫🇷', 'Sans engagement'].map(badge => (
            <span key={badge} className="text-xs px-3 py-1 rounded-full border border-cyan-500/30 text-cyan-400 bg-cyan-500/5">
              {badge}
            </span>
          ))}
        </div>

        <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-6 leading-none">
          <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-500 bg-clip-text text-transparent animate-gradient-x">
            Votre PME,
          </span>
          <br />
          <span className="text-white">pilotée sereinement</span>
        </h1>

        <p className="text-xl md:text-2xl text-slate-400 mb-4 max-w-2xl mx-auto">
          Obligations légales · Optimisation fiscale · Site web · Marketing
        </p>
        <p className="text-base text-slate-500 mb-10 max-w-xl mx-auto">
          De la déclaration TVA à l&apos;optimisation de votre IS, en passant par vos contrats
          et votre présence en ligne — tout centralisé, automatisé et simplifié.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/register"
            className="px-8 py-4 rounded-xl font-semibold text-white bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600 hover:opacity-90 transition-all animate-glow-pulse text-base"
          >
            Essai gratuit 30 jours
          </Link>
          <Link
            href="/#pricing"
            className="px-8 py-4 rounded-xl font-semibold text-slate-300 border border-white/10 hover:border-white/20 hover:text-white transition-all text-base"
          >
            Voir les packs →
          </Link>
        </div>

        {/* Dashboard mockup */}
        <div className="mt-16 animate-float-slow">
          <div className="relative mx-auto max-w-3xl">
            <div className="rounded-2xl border border-white/10 bg-white/3 backdrop-blur-xl overflow-hidden shadow-2xl shadow-cyan-500/10">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5 bg-white/2">
                <div className="w-3 h-3 rounded-full bg-red-500/60" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                <div className="w-3 h-3 rounded-full bg-green-500/60" />
                <span className="ml-4 text-xs text-slate-500">app.sentinel.fr/dashboard</span>
              </div>
              <div className="p-6 grid grid-cols-3 gap-4">
                {[
                  { label: 'Économies fiscales', value: '4 200€', color: 'text-emerald-400' },
                  { label: 'Obligations à jour', value: '12/12', color: 'text-cyan-400' },
                  { label: 'Santé financière', value: '87/100', color: 'text-purple-400' },
                ].map(stat => (
                  <div key={stat.label} className="rounded-xl bg-white/3 border border-white/5 p-4">
                    <p className="text-xs text-slate-500 mb-1">{stat.label}</p>
                    <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
                  </div>
                ))}
                <div className="col-span-3 rounded-xl bg-white/3 border border-white/5 p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs text-slate-400">Copilote juridique — TVA T1 2026 : 3 déductions identifiées…</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── Stats bar ───────────────────────────────────────────────────────────────
function Stats() {
  return (
    <section className="border-y border-white/5 bg-white/2">
      <div className="max-w-5xl mx-auto px-6 py-8 grid grid-cols-2 md:grid-cols-4 gap-6">
        {[
          { value: '4 200€', label: 'économisés en moyenne/an' },
          { value: '8h', label: 'gagnées par semaine' },
          { value: '500+', label: 'PME accompagnées' },
          { value: '30j', label: 'remboursé si insatisfait' },
        ].map(s => (
          <div key={s.label} className="text-center">
            <p className="text-2xl font-black text-white">{s.value}</p>
            <p className="text-xs text-slate-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

// ─── 3 Piliers ───────────────────────────────────────────────────────────────
function Pillars() {
  const pillars = [
    {
      icon: Scale,
      color: 'from-cyan-500 to-blue-600',
      title: 'Légal & Fiscal',
      desc: 'TVA, IS, obligations, contrats, impayés — votre gestion juridique et fiscale automatisée. Plus d\'amendes, plus de retards.',
      features: ['Calendrier fiscal automatique', 'Optimisation IS et charges', 'Gestion des contrats et impayés'],
    },
    {
      icon: Globe,
      color: 'from-blue-500 to-purple-600',
      title: 'Site Web Géré',
      desc: 'On crée votre site professionnel et vous le gérez depuis votre dashboard Sentinel.',
      features: ['Création en 48h', 'Hébergement France inclus', 'CMS intégré au dashboard'],
    },
    {
      icon: Megaphone,
      color: 'from-purple-500 to-pink-600',
      title: 'Marketing Humain',
      desc: 'Un manager dédié, pas un bot. Influenceurs, ADS, réseaux sociaux — des résultats mesurables.',
      features: ['Manager dédié (humain)', 'Gestion ADS Meta/Google', 'Rapport mensuel chiffré'],
    },
  ]

  return (
    <section className="py-24 max-w-6xl mx-auto px-6">
      <div className="text-center mb-16">
        <h2 className="text-4xl font-black text-white mb-4">Tout ce dont votre PME a besoin</h2>
        <p className="text-slate-400 max-w-xl mx-auto">Trois piliers, un seul abonnement. Arrêtez de jongler entre 10 outils.</p>
      </div>
      <div className="grid md:grid-cols-3 gap-6">
        {pillars.map(p => (
          <div
            key={p.title}
            className="rounded-2xl border border-white/8 bg-white/3 backdrop-blur-xl p-8 hover:border-white/15 transition-all duration-300 group"
          >
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${p.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
              <p.icon className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">{p.title}</h3>
            <p className="text-slate-400 text-sm mb-6 leading-relaxed">{p.desc}</p>
            <ul className="space-y-2">
              {p.features.map(f => (
                <li key={f} className="flex items-center gap-2 text-sm text-slate-300">
                  <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  )
}

// ─── Pricing (dynamique) ──────────────────────────────────────────────────────
function Pricing({ packs }: { packs: Pack[] }) {
  return (
    <section id="pricing" className="py-24 max-w-6xl mx-auto px-6">
      <div className="text-center mb-16">
        <h2 className="text-4xl font-black text-white mb-4">Des packs clairs, sans surprise</h2>
        <p className="text-slate-400">Sans engagement · Résiliation libre · Remboursé si insatisfait sous 30j</p>
      </div>
      <div className="grid md:grid-cols-4 gap-4">
        {packs.map((p) => (
          <div
            key={p.name}
            className={`relative rounded-2xl p-6 flex flex-col transition-all duration-300 hover:scale-[1.02] ${
              p.popular
                ? 'border-2 border-cyan-500/60 bg-gradient-to-b from-cyan-500/10 to-blue-500/5 animate-glow-pulse'
                : 'border border-white/8 bg-white/3 hover:border-white/15'
            }`}
          >
            {p.popular && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-bold px-3 py-1 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 text-white whitespace-nowrap">
                Le plus populaire
              </span>
            )}
            <div className="mb-6">
              <h3 className="text-lg font-bold text-white mb-1">{p.name}</h3>
              <p className="text-xs text-slate-500 mb-4">{p.desc}</p>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black text-white">{p.price}€</span>
                <span className="text-slate-500 text-sm">/mois</span>
              </div>
            </div>
            <ul className="space-y-2 flex-1 mb-6">
              {p.features.map((f: string) => (
                <li key={f} className="flex items-start gap-2 text-xs text-slate-300">
                  <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  {f}
                </li>
              ))}
            </ul>
            <Link
              href="/register"
              className={`block text-center py-2.5 rounded-xl text-sm font-semibold transition-all ${
                p.popular
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:opacity-90'
                  : 'border border-white/15 text-slate-300 hover:bg-white/5 hover:text-white'
              }`}
            >
              Choisir ce pack
            </Link>
          </div>
        ))}
      </div>
    </section>
  )
}

// ─── Garanties ───────────────────────────────────────────────────────────────
function Guarantees() {
  return (
    <section className="py-20 border-y border-white/5 bg-white/2">
      <div className="max-w-5xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
          {[
            { icon: Lock, label: 'Données hébergées en France', desc: 'Serveurs OVH certifiés HDS' },
            { icon: Shield, label: 'Experts certifiés', desc: 'Fiscaliste, juriste, comptable' },
            { icon: RefreshCw, label: '30j remboursé', desc: 'Satisfait ou remboursé sans question' },
            { icon: ChevronRight, label: 'Résiliation libre', desc: 'Aucun engagement minimum' },
            { icon: Headphones, label: 'Support humain', desc: 'Une vraie personne répond' },
          ].map(i => (
            <div key={i.label} className="text-center">
              <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/8 flex items-center justify-center mx-auto mb-3">
                <i.icon className="w-5 h-5 text-cyan-400" />
              </div>
              <p className="text-xs font-semibold text-white mb-1">{i.label}</p>
              <p className="text-xs text-slate-500">{i.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── CTA Final ───────────────────────────────────────────────────────────────
function FinalCTA() {
  return (
    <section className="py-24">
      <div className="max-w-3xl mx-auto px-6 text-center">
        <div className="rounded-3xl border border-cyan-500/20 bg-gradient-to-b from-cyan-500/10 to-purple-500/5 p-12">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center mx-auto mb-6">
            <Zap className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-4xl font-black text-white mb-4">Prêt à simplifier votre PME ?</h2>
          <p className="text-slate-400 mb-8 text-lg">
            Rejoignez 500+ dirigeants qui gèrent leur entreprise sereinement avec Sentinel.
          </p>
          <Link
            href="/register"
            className="inline-block px-10 py-4 rounded-xl font-semibold text-white bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600 hover:opacity-90 transition-all text-lg animate-glow-pulse"
          >
            Démarrer gratuitement
          </Link>
          <p className="text-xs text-slate-600 mt-4">Sans carte bancaire · Annulation libre · Support inclus</p>
        </div>
      </div>
    </section>
  )
}

// ─── Page (Server Component) ──────────────────────────────────────────────────
export default async function LandingPage() {
  const packs = await getPacks()

  return (
    <>
      <Hero />
      <Stats />
      <Pillars />
      <Pricing packs={packs} />
      <Guarantees />
      <FeaturesSection />
      <FinalCTA />
    </>
  )
}
