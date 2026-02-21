import Link from 'next/link'
import { Users, TrendingUp, Target, BarChart, MessageSquare, Check, Star } from 'lucide-react'
import type { Metadata } from 'next'
import { createClient as createAdminClient } from '@/lib/supabase/admin'
import { DEFAULT_SERVICES, type ServiceTarif } from '@/lib/tarifs'

async function getMarketingPrices(): Promise<ServiceTarif[]> {
  try {
    const db = createAdminClient()
    const { data } = await db.from('site_settings').select('valeur').eq('cle', 'tarifs_services').single()
    if (data?.valeur && Array.isArray(data.valeur)) {
      const marketing = data.valeur.filter((s: ServiceTarif) => s.id.startsWith('marketing-'))
      if (marketing.length > 0) return marketing
    }
  } catch { /* ignore */ }
  return DEFAULT_SERVICES.filter(s => s.id.startsWith('marketing-'))
}

export const metadata: Metadata = {
  title: 'Marketing Humain — Sentinel',
  description: 'Un manager marketing dédié pour votre PME. Réseaux sociaux, ADS Meta/Google, influenceurs, contenu. Des résultats mesurables, pas des bots.',
}

const services = [
  {
    icon: Users,
    title: 'Manager dédié',
    desc: 'Une vraie personne, pas un bot. Votre manager connaît votre secteur et s\'implique dans votre croissance.',
  },
  {
    icon: MessageSquare,
    title: 'Gestion réseaux sociaux',
    desc: 'Instagram, LinkedIn, Facebook, TikTok. Contenus créés, planifiés et publiés par nos experts.',
  },
  {
    icon: Target,
    title: 'Campagnes ADS',
    desc: 'Meta Ads et Google Ads gérés de A à Z. Ciblage précis, optimisation continue, budget maîtrisé.',
  },
  {
    icon: TrendingUp,
    title: 'Partenariats influenceurs',
    desc: 'Identification et activation d\'influenceurs locaux pertinents pour votre secteur.',
  },
  {
    icon: BarChart,
    title: 'Reporting mensuel',
    desc: 'Rapport complet chaque mois : portée, engagement, leads générés, ROI publicitaire.',
  },
  {
    icon: Check,
    title: 'Stratégie éditoriale',
    desc: 'Ligne éditoriale cohérente avec votre marque. Calendrier de contenu à 3 mois glissants.',
  },
]

const results = [
  { value: '+340%', label: 'Portée organique moyenne après 3 mois' },
  { value: '2,8€', label: 'Coût par lead moyen sur nos campagnes ADS' },
  { value: '12x', label: 'ROI moyen sur les campagnes influenceurs' },
  { value: '48h', label: 'Délai de réponse à vos demandes' },
]

const MARKETING_COLORS: Record<string, { border: string; btn: string }> = {
  'marketing-starter': { border: 'border-purple-500/30', btn: 'from-purple-500 to-purple-600' },
  'marketing-pro':     { border: 'border-pink-500/50',   btn: 'from-purple-500 via-pink-500 to-rose-500' },
  'marketing-expert':  { border: 'border-rose-500/30',   btn: 'from-pink-500 to-rose-600' },
}

export default async function ServicesMarketingPage() {
  const marketingPlans = await getMarketingPrices()
  return (
    <div className="pt-24">
      {/* Hero */}
      <section className="max-w-5xl mx-auto px-6 py-20 text-center">
        <span className="text-xs px-3 py-1 rounded-full border border-purple-500/30 text-purple-400 bg-purple-500/5 mb-6 inline-block">
          Marketing Humain
        </span>
        <h1 className="text-5xl md:text-6xl font-black text-white mb-6">
          Un manager dédié,{' '}
          <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            pas un bot
          </span>
        </h1>
        <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-10">
          Notre équipe marketing gère votre visibilité digitale. Réseaux sociaux, ADS, influenceurs —
          des vrais experts qui connaissent votre secteur.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/register"
            className="px-8 py-4 rounded-xl font-semibold text-white bg-gradient-to-r from-purple-500 to-pink-600 hover:opacity-90 transition-all"
          >
            Découvrir le pack Croissance
          </Link>
          <Link
            href="/#pricing"
            className="px-8 py-4 rounded-xl font-semibold text-slate-300 border border-white/10 hover:border-white/20 hover:text-white transition-all"
          >
            Voir les tarifs
          </Link>
        </div>
      </section>

      {/* Résultats */}
      <section className="border-y border-white/5 bg-white/2 py-16">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {results.map(r => (
              <div key={r.label} className="text-center">
                <p className="text-3xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
                  {r.value}
                </p>
                <p className="text-xs text-slate-400">{r.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="max-w-6xl mx-auto px-6 py-24">
        <h2 className="text-3xl font-black text-white text-center mb-12">Ce qu&apos;on fait pour vous</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {services.map(s => (
            <div key={s.title} className="rounded-2xl border border-white/8 bg-white/3 p-6 hover:border-white/15 transition-all">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center mb-4">
                <s.icon className="w-5 h-5 text-purple-400" />
              </div>
              <h3 className="font-bold text-white mb-2">{s.title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Process */}
      <section className="border-y border-white/5 bg-white/2 py-20">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-3xl font-black text-white text-center mb-12">Comment ça marche</h2>
          <div className="space-y-6">
            {[
              { step: '1', title: 'Kick-off stratégique', desc: 'Appel de 45 minutes avec votre manager pour comprendre vos objectifs, votre cible et vos valeurs.' },
              { step: '2', title: 'Stratégie sur-mesure', desc: 'Votre manager élabore un plan marketing adapté à votre secteur et votre budget.' },
              { step: '3', title: 'Exécution et optimisation', desc: 'On crée, publie, analyse et optimise chaque mois. Vous recevez un rapport détaillé.' },
            ].map(item => (
              <div key={item.step} className="flex gap-6 p-6 rounded-2xl border border-white/8 bg-white/3">
                <div className="text-3xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent w-8 flex-shrink-0">
                  {item.step}
                </div>
                <div>
                  <h3 className="font-bold text-white mb-2">{item.title}</h3>
                  <p className="text-sm text-slate-400">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="border-y border-white/5 bg-white/2 py-20">
        <div className="max-w-5xl mx-auto px-6">
          <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold mb-2 text-center">Tarifs Marketing</p>
          <h2 className="text-3xl font-black text-white text-center mb-3">Choisissez votre niveau</h2>
          <p className="text-slate-400 text-center mb-12 text-sm">
            Disponibles seuls ou inclus dans un{' '}
            <Link href="/packs" className="text-purple-400 hover:text-purple-300 underline underline-offset-2">
              pack complet
            </Link>
          </p>
          <div className="grid md:grid-cols-3 gap-5">
            {marketingPlans.map(plan => {
              const c = MARKETING_COLORS[plan.id] || MARKETING_COLORS['marketing-starter']
              return (
                <div
                  key={plan.id}
                  className={`rounded-2xl border ${c.border} bg-gradient-to-b from-purple-500/8 to-transparent p-6 flex flex-col ${
                    plan.popular ? 'ring-1 ring-pink-500/40' : ''
                  }`}
                >
                  {plan.popular && (
                    <div className="flex items-center gap-1.5 text-pink-400 text-xs font-bold mb-3">
                      <Star className="w-3.5 h-3.5 fill-pink-400" />
                      Le plus populaire
                    </div>
                  )}
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 font-bold mb-3 inline-block w-fit">
                    {plan.badge}
                  </span>
                  <h3 className="text-lg font-black text-white mb-1">{plan.nom}</h3>
                  <p className="text-xs text-slate-500 mb-4 leading-relaxed">{plan.description}</p>
                  <div className="flex items-baseline gap-1 mb-5">
                    <span className="text-4xl font-black text-white">{plan.prix_mensuel}€</span>
                    <span className="text-slate-400 text-sm">/mois</span>
                  </div>
                  <ul className="space-y-2 flex-1 mb-6">
                    {plan.features.map(f => (
                      <li key={f} className="flex items-start gap-2 text-xs text-slate-300">
                        <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/register"
                    className={`block text-center py-3 rounded-xl text-sm font-bold text-white bg-gradient-to-r ${c.btn} hover:opacity-90 transition-all`}
                  >
                    Choisir {plan.nom}
                  </Link>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-3xl mx-auto px-6 py-24 text-center">
        <div className="rounded-3xl border border-purple-500/20 bg-gradient-to-b from-purple-500/10 to-pink-500/5 p-12">
          <h2 className="text-3xl font-black text-white mb-4">Prêt à booster votre visibilité ?</h2>
          <p className="text-slate-400 mb-8">
            Disponible dès le pack Croissance à <strong className="text-white">299€/mois</strong>. Manager dédié inclus.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link
              href="/register"
              className="px-8 py-4 rounded-xl font-semibold text-white bg-gradient-to-r from-purple-500 to-pink-600 hover:opacity-90 transition-all"
            >
              Commencer maintenant
            </Link>
            <Link
              href="/packs"
              className="px-8 py-4 rounded-xl font-semibold text-slate-300 border border-white/10 hover:border-white/25 hover:text-white transition-all"
            >
              Voir les packs complets
            </Link>
          </div>
          <p className="text-xs text-slate-600 mt-4">Sans engagement · Annulation libre</p>
        </div>
      </section>
    </div>
  )
}
