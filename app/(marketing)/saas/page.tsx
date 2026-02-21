import Link from 'next/link'
import { Check, Scale, Calculator, FileSignature, AlertCircle, ClipboardList, TrendingUp, FileOutput, Zap } from 'lucide-react'
import type { Metadata } from 'next'
import { createClient as createAdminClient } from '@/lib/supabase/admin'
import { DEFAULT_SERVICES } from '@/lib/tarifs'

async function getSaasPrice() {
  try {
    const db = createAdminClient()
    const { data } = await db.from('site_settings').select('valeur').eq('cle', 'tarifs_services').single()
    if (data?.valeur && Array.isArray(data.valeur)) {
      const saas = data.valeur.find((s: { id: string }) => s.id === 'saas')
      if (saas) return saas
    }
  } catch { /* ignore */ }
  return DEFAULT_SERVICES.find(s => s.id === 'saas')!
}

export const metadata: Metadata = {
  title: 'Gestion Légale & Fiscale — Sentinel',
  description: 'Gérez vos obligations TVA/IS, optimisez votre fiscalité et pilotez vos contrats et impayés avec Sentinel. La plateforme tout-en-un pour PME.',
}

const features = [
  {
    icon: Calculator,
    title: 'Optimisation fiscale IA',
    desc: 'Claude AI analyse votre situation et identifie les déductions manquées, dispositifs applicables (CIR, JEI...) et économies IS réalisables.',
  },
  {
    icon: ClipboardList,
    title: 'Obligations légales automatisées',
    desc: 'Calendrier fiscal intégré : TVA, IS, liasse fiscale, déclarations sociales. Alertes avant chaque échéance, jamais de pénalité.',
  },
  {
    icon: FileSignature,
    title: 'Gestion des contrats',
    desc: 'Analysez vos contrats par IA, détectez les clauses à risque, suivez les échéances et gardez un registre centralisé.',
  },
  {
    icon: AlertCircle,
    title: 'Suivi des impayés',
    desc: 'Suivez vos factures en retard, automatisez les relances et scorez le risque de chaque client débiteur.',
  },
  {
    icon: TrendingUp,
    title: 'Santé financière',
    desc: 'Tableau de bord financier avec runway, ratio charges/CA, tendance, et alertes si vous approchez du rouge.',
  },
  {
    icon: FileOutput,
    title: 'Rapports et audit',
    desc: 'Générez vos rapports d\'activité, bilans de conformité et documents d\'audit en un clic. PDF prêt à partager.',
  },
]

export default async function SaasPage() {
  const saas = await getSaasPrice()
  return (
    <div className="pt-24">
      {/* Hero */}
      <section className="max-w-5xl mx-auto px-6 py-20 text-center">
        <span className="text-xs px-3 py-1 rounded-full border border-cyan-500/30 text-cyan-400 bg-cyan-500/5 mb-6 inline-block">
          Gestion Légale & Fiscale
        </span>
        <h1 className="text-5xl md:text-6xl font-black text-white mb-6">
          Gérez votre PME{' '}
          <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
            sans stress juridique
          </span>
        </h1>
        <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-4">
          Obligations fiscales, optimisation IS, contrats, impayés — Sentinel automatise
          tout ce qui est administrativement pénible et coûteux si mal géré.
        </p>
        <p className="text-base text-slate-500 max-w-xl mx-auto mb-10">
          En moyenne, nos clients économisent <strong className="text-white">4 200€/an</strong> en optimisation fiscale
          et évitent <strong className="text-white">toute pénalité</strong> grâce aux alertes d&apos;échéances.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/register"
            className="px-8 py-4 rounded-xl font-semibold text-white bg-gradient-to-r from-cyan-500 to-blue-500 hover:opacity-90 transition-all"
          >
            Démarrer gratuitement
          </Link>
          <Link
            href="/#pricing"
            className="px-8 py-4 rounded-xl font-semibold text-slate-300 border border-white/10 hover:border-white/20 hover:text-white transition-all"
          >
            Voir les tarifs
          </Link>
        </div>
      </section>

      {/* Features grid */}
      <section className="max-w-6xl mx-auto px-6 pb-24">
        <div className="grid md:grid-cols-3 gap-6">
          {features.map(f => (
            <div key={f.title} className="rounded-2xl border border-white/8 bg-white/3 p-6 hover:border-white/15 transition-all">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center mb-4">
                <f.icon className="w-5 h-5 text-cyan-400" />
              </div>
              <h3 className="font-bold text-white mb-2">{f.title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="border-y border-white/5 bg-white/2 py-20">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold mb-8">Tarif SaaS Panel</p>
          <div className="rounded-2xl border border-cyan-500/30 bg-gradient-to-b from-cyan-500/10 to-blue-500/5 p-10 max-w-sm mx-auto">
            <div className="flex items-baseline justify-center gap-1 mb-3">
              <span className="text-6xl font-black text-white">{saas.prix_mensuel}€</span>
              <span className="text-slate-400 text-lg">/mois</span>
            </div>
            <p className="text-emerald-400 text-sm font-semibold mb-6">
              ✓ Essai gratuit {saas.essai_jours ?? 30} jours · Sans carte bancaire
            </p>
            <ul className="space-y-2 text-left mb-8">
              {saas.features.map((f: string) => (
                <li key={f} className="flex items-start gap-2 text-sm text-slate-300">
                  <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  {f}
                </li>
              ))}
            </ul>
            <Link
              href="/register"
              className="block w-full py-3.5 rounded-xl font-bold text-white bg-gradient-to-r from-cyan-500 to-blue-500 hover:opacity-90 transition-all text-center"
            >
              Démarrer gratuitement
            </Link>
            <p className="text-xs text-slate-600 mt-3">Résiliation libre à tout moment</p>
          </div>
          <p className="text-sm text-slate-500 mt-8">
            Disponible aussi dans les{' '}
            <Link href="/packs" className="text-cyan-400 hover:text-cyan-300 underline underline-offset-2">
              packs complets
            </Link>{' '}
            dès 89€/mois (site web inclus)
          </p>
        </div>
      </section>

      {/* Ce que Sentinel remplace */}
      <section className="border-y border-white/5 bg-white/2 py-20">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-3xl font-black text-white text-center mb-4">
            Ce que Sentinel remplace
          </h2>
          <p className="text-slate-400 text-center mb-12">Un seul abonnement au lieu de 6 outils séparés</p>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { old: 'Comptable pour les obligations courantes', saving: 'Économisez 200-400€/mois' },
              { old: 'Logiciel de facturation séparé', saving: 'Déjà inclus' },
              { old: 'Outil de gestion des contrats', saving: 'Déjà inclus' },
              { old: 'Consultant fiscal ponctuel', saving: 'Disponible 24/7 par IA' },
              { old: 'Veille réglementaire manuelle', saving: 'Automatique et personnalisée' },
              { old: 'Rapports d\'audit sur devis', saving: 'Génération en 1 clic' },
            ].map(item => (
              <div key={item.old} className="flex items-start gap-3 p-4 rounded-xl bg-white/3 border border-white/5">
                <Scale className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-slate-300">{item.old}</p>
                  <p className="text-xs text-emerald-400 mt-1">→ {item.saving}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-3xl mx-auto px-6 py-24 text-center">
        <div className="rounded-3xl border border-cyan-500/20 bg-gradient-to-b from-cyan-500/10 to-blue-500/5 p-12">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center mx-auto mb-5">
            <Zap className="w-7 h-7 text-white" />
          </div>
          <h2 className="text-3xl font-black text-white mb-3">Dès {saas.prix_mensuel}€/mois, tout est inclus</h2>
          <p className="text-slate-400 mb-7">Essai gratuit {saas.essai_jours ?? 30} jours. Aucune carte bancaire requise.</p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link
              href="/register"
              className="px-8 py-4 rounded-xl font-semibold text-white bg-gradient-to-r from-cyan-500 to-blue-500 hover:opacity-90 transition-all"
            >
              Essai gratuit {saas.essai_jours ?? 30} jours
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
