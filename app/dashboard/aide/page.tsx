// ============================================
// app/dashboard/aide/page.tsx
// Centre d'aide — FAQ avec searchbar et accordion
// ============================================
'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import {
  Search, ChevronDown, ChevronUp, HelpCircle,
  Shield, BarChart2, CreditCard, Megaphone, Users, MessageSquare
} from 'lucide-react'

interface FAQ {
  question: string
  answer: string
}

interface Categorie {
  id: string
  label: string
  icon: React.ElementType
  color: string
  faqs: FAQ[]
}

const CATEGORIES: Categorie[] = [
  {
    id: 'conformite',
    label: 'Conformité IA Act',
    icon: Shield,
    color: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20',
    faqs: [
      {
        question: "Qu'est-ce que l'AI Act et pourquoi dois-je m'y conformer ?",
        answer: "L'AI Act (Règlement européen sur l'intelligence artificielle) est la première législation mondiale sur l'IA, entrée en application en 2024. Elle oblige toutes les entreprises utilisant ou développant des systèmes IA en Europe à documenter leurs usages, évaluer les risques, et mettre en place une gouvernance appropriée. Les sanctions pour non-conformité peuvent atteindre 30 millions d'euros ou 6% du chiffre d'affaires mondial.",
      },
      {
        question: "Comment Sentinel m'aide-t-il à me conformer à l'AI Act ?",
        answer: "Sentinel centralise tous vos usages IA dans un registre structuré, calcule automatiquement votre score de conformité selon les critères de l'AI Act, génère des recommandations prioritaires et produit des rapports prêts pour les audits. Vous avez une vue claire de votre exposition réglementaire en temps réel.",
      },
      {
        question: "Comment déclarer un usage IA dans Sentinel ?",
        answer: "Rendez-vous dans Journaux IA > Déclarer un usage. Renseignez le nom de l'outil, sa catégorie, la fréquence d'utilisation, si des données personnelles sont traitées et si des décisions automatisées sont prises. Sentinel classe automatiquement le niveau de risque selon l'AI Act (inacceptable, élevé, limité, faible).",
      },
      {
        question: "Quels sont les niveaux de risque définis par l'AI Act ?",
        answer: "L'AI Act définit 4 niveaux : (1) Inacceptable — systèmes interdits (manipulation subliminale, notation sociale) ; (2) Élevé — obligations strictes (IA médicale, recrutement, crédit) ; (3) Limité — obligations de transparence (chatbots, deepfakes) ; (4) Faible/Minimal — obligations légères ou inexistantes (filtres anti-spam, jeux vidéo).",
      },
    ],
  },
  {
    id: 'score',
    label: 'Score & Rapports',
    icon: BarChart2,
    color: 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20',
    faqs: [
      {
        question: "Comment est calculé mon score de conformité ?",
        answer: "Votre score (0-100) est calculé selon 4 axes pondérés : Documentation (30%) — qualité et complétude des fiches d'usage IA ; Classification des risques (30%) — pertinence des niveaux de risque assignés ; Mesures de mitigation (25%) — actions mises en place pour réduire les risques ; Gouvernance (15%) — processus de supervision et de contrôle. Cliquez sur 'Recalculer' pour mettre à jour votre score après chaque action.",
      },
      {
        question: "Que signifie le score global de santé de l'entreprise ?",
        answer: "Le score global (visible sur le tableau de bord) agrège 5 dimensions : conformité IA, gestion des impayés, respect des obligations réglementaires, santé financière et sécurité contractuelle. Un score > 70 est considéré bon. Il est calculé séparément du score de conformité AI Act pur.",
      },
      {
        question: "Comment générer un rapport PDF pour un audit ?",
        answer: "Dans la section Rapports, sélectionnez le type de rapport souhaité (Conformité IA Act, Santé globale, Rapport complet ou Rapport mensuel) puis cliquez sur 'Télécharger'. Le PDF est généré avec une page de garde officielle, vos scores, les barres de progression visuelles et les recommandations prioritaires.",
      },
      {
        question: "À quelle fréquence dois-je recalculer mon score ?",
        answer: "Nous recommandons de recalculer votre score après chaque déclaration d'usage IA, chaque mise à jour d'une obligation ou d'un contrat, et au minimum une fois par mois. Le rapport mensuel automatique capture votre état à un instant T pour un suivi dans le temps.",
      },
    ],
  },
  {
    id: 'facturation',
    label: 'Facturation & Abonnement',
    icon: CreditCard,
    color: 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20',
    faqs: [
      {
        question: "Quels sont les plans disponibles et leurs prix ?",
        answer: "Sentinel propose 3 plans payants : Starter (79€/mois) — conformité IA Act, journaux, score, rapports ; Pro (149€/mois) — tout Starter + marketing, copilote IA, modules business avancés ; Enterprise (499€/mois) — tout Pro + support prioritaire, SSO, SLA garanti. Un essai gratuit de 14 jours est disponible sans carte bancaire.",
      },
      {
        question: "Comment modifier ou annuler mon abonnement ?",
        answer: "Rendez-vous dans Paramètres > Abonnement. Vous pouvez modifier votre plan (upgrade/downgrade), mettre à jour vos informations de paiement ou résilier votre abonnement. La résiliation prend effet à la fin de la période de facturation en cours. Vos données sont conservées 30 jours après résiliation.",
      },
      {
        question: "Mes données sont-elles supprimées si je résilie ?",
        answer: "Non, pas immédiatement. En cas de résiliation, vos données sont conservées pendant 30 jours, période pendant laquelle vous pouvez exporter vos rapports et journaux. Après 30 jours, les données sont définitivement supprimées conformément au RGPD. Contactez le support pour un export complet de vos données.",
      },
      {
        question: "Le paiement est-il sécurisé ?",
        answer: "Oui. Les paiements sont gérés par Stripe, leader mondial de la sécurité des paiements en ligne (certifié PCI-DSS niveau 1). Sentinel ne stocke aucun numéro de carte bancaire. Stripe gère le chiffrement et la conformité des transactions.",
      },
    ],
  },
  {
    id: 'marketing',
    label: 'Marketing',
    icon: Megaphone,
    color: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20',
    faqs: [
      {
        question: "Qu'est-ce que le module Marketing de Sentinel ?",
        answer: "Le module Marketing (disponible en plans Pro et Enterprise) vous connecte à un agent marketing Sentinel dédié. L'agent prend en charge vos campagnes digitales (réseaux sociaux, SEA, email, SEO), organise des rendez-vous réguliers et vous fournit des KPIs mensuels. C'est votre équipe marketing externalisée, gérée depuis Sentinel.",
      },
      {
        question: "Comment contacter mon agent marketing assigné ?",
        answer: "Dans la section Marketing, utilisez la messagerie intégrée pour envoyer des messages à votre agent. Vous pouvez également planifier des rendez-vous visio directement depuis l'agenda du module. Votre agent répond sous 24h ouvrées.",
      },
      {
        question: "Comment suivre les performances de mes campagnes ?",
        answer: "L'onglet KPIs de la section Marketing affiche vos indicateurs mensuels : portée, engagement, nouveaux abonnés, leads générés, conversions et chiffre d'affaires généré. Votre agent met à jour ces données chaque mois lors du point de suivi.",
      },
      {
        question: "Puis-je changer d'agent marketing ?",
        answer: "Oui. Contactez le support via la section SAV et demandez un changement d'agent. Un délai de transition de 7 jours est prévu pour assurer la continuité de vos campagnes. Toutes vos données et l'historique des campagnes restent accessibles.",
      },
    ],
  },
  {
    id: 'equipe',
    label: 'Équipe & Accès',
    icon: Users,
    color: 'text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-700',
    faqs: [
      {
        question: "Comment inviter des membres dans mon équipe ?",
        answer: "Dans Équipe > Inviter un membre, renseignez l'adresse email de votre collaborateur et sélectionnez son rôle (Admin ou Membre). Un email d'invitation est envoyé automatiquement. Votre collaborateur doit cliquer sur le lien dans l'email pour créer son compte et rejoindre votre organisation.",
      },
      {
        question: "Quelle est la différence entre Admin et Membre ?",
        answer: "Un Admin peut gérer tous les modules, inviter des membres, modifier les paramètres de l'entreprise et accéder aux données sensibles (contrats, finances). Un Membre peut consulter et saisir des données dans les modules Journaux, Obligations, Score et Copilote, mais n'a pas accès aux paramètres, à la facturation ni à la gestion d'équipe.",
      },
      {
        question: "Puis-je limiter l'accès de certains membres à certains modules ?",
        answer: "Actuellement, Sentinel propose 2 niveaux d'accès (Admin et Membre). Des permissions granulaires par module sont en cours de développement et seront disponibles sur le plan Enterprise. Contactez le support si vous avez des besoins spécifiques d'isolation des accès.",
      },
      {
        question: "Comment réinitialiser le mot de passe d'un membre ?",
        answer: "Chaque utilisateur peut réinitialiser son mot de passe depuis la page de connexion (/login) en cliquant sur 'Mot de passe oublié'. En tant qu'Admin, vous ne pouvez pas réinitialiser les mots de passe des autres membres pour des raisons de sécurité (RGPD). En cas de blocage, contactez le support.",
      },
    ],
  },
]

function AccordionItem({ faq, isOpen, onToggle }: {
  faq: FAQ
  isOpen: boolean
  onToggle: () => void
}) {
  return (
    <div className="border-b border-slate-100 dark:border-slate-700 last:border-0">
      <button
        onClick={onToggle}
        className="w-full flex items-start justify-between gap-4 px-5 py-4 text-left hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
      >
        <span className="text-sm font-medium text-slate-900 dark:text-slate-100 leading-snug">{faq.question}</span>
        {isOpen
          ? <ChevronUp className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
          : <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
        }
      </button>
      {isOpen && (
        <div className="px-5 pb-4">
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{faq.answer}</p>
        </div>
      )}
    </div>
  )
}

export default function AidePage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({})

  function toggleItem(catId: string, idx: number) {
    const key = `${catId}-${idx}`
    setOpenItems(prev => ({ ...prev, [key]: !prev[key] }))
  }

  // Filtrage temps réel
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return CATEGORIES
    const q = searchQuery.toLowerCase()
    return CATEGORIES
      .map(cat => ({
        ...cat,
        faqs: cat.faqs.filter(
          faq =>
            faq.question.toLowerCase().includes(q) ||
            faq.answer.toLowerCase().includes(q)
        ),
      }))
      .filter(cat => cat.faqs.length > 0 || cat.label.toLowerCase().includes(q))
  }, [searchQuery])

  const totalResults = filteredCategories.reduce((acc, c) => acc + c.faqs.length, 0)

  return (
    <div className="max-w-3xl mx-auto space-y-6 page-enter">
      {/* Header */}
      <div className="animate-fade-in">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <HelpCircle className="w-6 h-6 text-blue-500" />
          Centre d'aide
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
          Trouvez rapidement les réponses à vos questions
        </p>
      </div>

      {/* Searchbar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Rechercher une question, un sujet…"
          className="w-full pl-11 pr-4 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-blue-400 dark:focus:border-blue-500 text-sm transition-colors"
        />
        {searchQuery && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-400">
            {totalResults} résultat{totalResults !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* Catégories */}
      {filteredCategories.length === 0 ? (
        <div className="text-center py-12">
          <HelpCircle className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 dark:text-slate-400 font-medium">Aucun résultat pour "{searchQuery}"</p>
          <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
            Essayez d'autres mots-clés ou{' '}
            <Link href="/dashboard/sav" className="text-blue-600 dark:text-blue-400 hover:underline">contactez le support</Link>
          </p>
        </div>
      ) : (
        filteredCategories.map((cat) => (
          cat.faqs.length === 0 ? null : (
            <div key={cat.id} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-slide-up">
              {/* Cat header */}
              <div className={`px-5 py-3 border-b border-slate-100 dark:border-slate-700 flex items-center gap-3`}>
                <div className={`p-1.5 rounded-lg ${cat.color.split(' ').slice(2).join(' ')}`}>
                  <cat.icon className={`w-4 h-4 ${cat.color.split(' ').slice(0, 2).join(' ')}`} />
                </div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">{cat.label}</h2>
                <span className="text-xs text-slate-400 dark:text-slate-500 ml-auto">
                  {cat.faqs.length} question{cat.faqs.length > 1 ? 's' : ''}
                </span>
              </div>

              {/* FAQs */}
              <div>
                {cat.faqs.map((faq, idx) => (
                  <AccordionItem
                    key={idx}
                    faq={faq}
                    isOpen={!!openItems[`${cat.id}-${idx}`]}
                    onToggle={() => toggleItem(cat.id, idx)}
                  />
                ))}
              </div>
            </div>
          )
        ))
      )}

      {/* Bouton support */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6 text-center">
        <MessageSquare className="w-8 h-8 text-blue-500 mx-auto mb-3" />
        <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-1">Vous ne trouvez pas votre réponse ?</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
          Notre équipe vous répond sous 24h ouvrées.
        </p>
        <Link
          href="/dashboard/sav"
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-colors"
        >
          <MessageSquare className="w-4 h-4" />
          Contacter le support
        </Link>
      </div>
    </div>
  )
}
