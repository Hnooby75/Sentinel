'use client'

import { useState } from 'react'
import { Check } from 'lucide-react'

const panels = {
  legal: {
    label: 'Légal & Fiscal',
    features: [
      'Obligations TVA, IS, liasse automatisées',
      'Calendrier fiscal avec alertes',
      'Optimisation charges et déductions',
      'Analyse et gestion des contrats',
      'Suivi des impayés et relances',
      'Score de santé financière',
      'Génération de rapports d\'audit',
      'Copilote juridique IA 24/7',
    ],
  },
  site: {
    label: 'Site Web',
    features: [
      'Site professionnel créé en 48h',
      'Design sur-mesure par nos équipes',
      'Hébergement France inclus (99,9%)',
      'Nom de domaine personnalisé',
      'CMS intégré au dashboard',
      'SEO technique optimisé',
      'Formulaire de contact / devis',
      'Mises à jour illimitées',
    ],
  },
  marketing: {
    label: 'Marketing',
    features: [
      'Manager marketing dédié (humain)',
      'Gestion 3 réseaux sociaux',
      'Création de contenus visuels',
      'Campagnes ADS Meta & Google',
      'Partenariats influenceurs locaux',
      'Rapport mensuel avec KPIs',
      'Stratégie éditoriale personnalisée',
      'Veille concurrentielle',
    ],
  },
}

export default function FeaturesSection() {
  const [active, setActive] = useState<keyof typeof panels>('legal')

  return (
    <section className="py-24 max-w-5xl mx-auto px-6">
      <div className="text-center mb-12">
        <h2 className="text-4xl font-black text-white mb-4">Une plateforme, tout compris</h2>
        <p className="text-slate-400">Chaque pilier est un produit complet, pas un module allégé.</p>
      </div>

      <div className="flex gap-2 justify-center mb-10">
        {(Object.entries(panels) as [keyof typeof panels, { label: string; features: string[] }][]).map(([id, p]) => (
          <button
            key={id}
            onClick={() => setActive(id)}
            className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
              active === id
                ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white'
                : 'text-slate-400 border border-white/10 hover:text-white hover:border-white/20'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-white/8 bg-white/3 p-8">
        <div className="grid sm:grid-cols-2 gap-3">
          {panels[active].features.map(f => (
            <div key={f} className="flex items-center gap-3 p-3 rounded-xl bg-white/3 border border-white/5">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center flex-shrink-0">
                <Check className="w-3.5 h-3.5 text-cyan-400" />
              </div>
              <span className="text-sm text-slate-300">{f}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
