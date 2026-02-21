// ============================================
// lib/tarifs.ts — Données tarifaires par défaut
// Utilisées si la table site_settings est vide
// ============================================

export interface ServiceTarif {
  id: string
  nom: string
  sous_domaine: string
  description: string
  badge: string
  couleur: string      // "cyan" | "blue" | "purple"
  prix_mensuel: number
  prix_creation: number | null
  heures?: number
  essai_jours?: number
  popular?: boolean
  features: string[]
}

export interface PackTarif {
  id: string
  nom: string
  description: string
  prix_mensuel: number
  prix_creation: number | null
  popular: boolean
  economie_mensuelle: number
  badge?: string
  services_inclus: string[]
  features: string[]
  cta_label: string
  cta_href: string
}

export const DEFAULT_SERVICES: ServiceTarif[] = [
  {
    id: 'saas',
    nom: 'SaaS Panel',
    sous_domaine: 'app',
    description: 'Gestion légale, fiscale et administrative de votre PME — automatisée par IA',
    badge: 'Panel de gestion PME',
    couleur: 'cyan',
    prix_mensuel: 49,
    prix_creation: null,
    essai_jours: 30,
    features: [
      'Obligations légales automatisées (TVA, IS, liasse)',
      'Optimisation fiscale par IA — économisez en moyenne 4 200€/an',
      'Gestion des contrats et analyse IA',
      'Suivi des impayés et relances automatiques',
      'Score de conformité en temps réel',
      'Copilote juridique IA 24/7',
      'Rapports et audit en 1 clic',
      'Veille réglementaire personnalisée',
      'Support email inclus',
    ],
  },
  {
    id: 'web',
    nom: 'Site Web Géré',
    sous_domaine: 'web',
    description: 'Votre site professionnel créé en 48h, hébergé en France, gérable depuis votre dashboard',
    badge: 'Création + Gestion',
    couleur: 'blue',
    prix_mensuel: 49,
    prix_creation: 499,
    features: [
      'Site professionnel créé en 48h',
      'Design sur-mesure, mobile-first',
      'Hébergement France inclus (OVH, 99.9% uptime)',
      'CMS intégré — modifiez votre contenu depuis le dashboard',
      'SSL automatique et sécurité incluse',
      'SEO technique optimisé dès le lancement',
      'Mises à jour illimitées sous 48h',
      'Analytics de base inclus',
    ],
  },
  {
    id: 'marketing-starter',
    nom: 'Marketing Starter',
    sous_domaine: 'marketing',
    description: '4h/mois de marketing géré par un expert humain dédié à votre PME',
    badge: '4h / mois',
    couleur: 'purple',
    prix_mensuel: 249,
    prix_creation: null,
    heures: 4,
    features: [
      'Manager marketing dédié (humain, pas un bot)',
      '2 publications/semaine sur vos réseaux sociaux',
      'Stratégie éditoriale mensuelle',
      'Rapport de performance mensuel',
      'Réponse à vos messages sous 48h',
    ],
  },
  {
    id: 'marketing-pro',
    nom: 'Marketing Pro',
    sous_domaine: 'marketing',
    description: '8h/mois + campagnes ADS Meta/Google gérées de A à Z',
    badge: '8h / mois',
    couleur: 'purple',
    prix_mensuel: 449,
    prix_creation: null,
    heures: 8,
    popular: true,
    features: [
      'Tout Marketing Starter',
      '4 publications/semaine sur vos réseaux',
      'Campagne ADS Meta ou Google (budget non inclus)',
      'Optimisation continue des publicités',
      'Rapport bi-mensuel + suivi en direct',
    ],
  },
  {
    id: 'marketing-expert',
    nom: 'Marketing Expert',
    sous_domaine: 'marketing',
    description: '15h/mois, ADS multi-canaux, influenceurs et stratégie complète',
    badge: '15h / mois',
    couleur: 'purple',
    prix_mensuel: 799,
    prix_creation: null,
    heures: 15,
    features: [
      'Tout Marketing Pro',
      'ADS Meta + Google simultanément',
      'Identification et activation influenceurs',
      'Stratégie éditoriale 3 mois glissants',
      'Suivi hebdomadaire avec votre manager',
    ],
  },
]

export const DEFAULT_PACKS: PackTarif[] = [
  {
    id: 'presence',
    nom: 'Pack Présence',
    description: 'Votre PME en ligne, gérée sereinement',
    prix_mensuel: 89,
    prix_creation: 499,
    popular: false,
    economie_mensuelle: 9,
    services_inclus: ['SaaS Panel', 'Site Web Géré'],
    features: [
      'SaaS Panel complet (gestion légale & fiscale)',
      'Site web professionnel créé en 48h',
      'Hébergement France inclus',
      'CMS dans votre dashboard',
      'Support email prioritaire',
    ],
    cta_label: 'Commencer avec Présence',
    cta_href: '/register',
  },
  {
    id: 'croissance',
    nom: 'Pack Croissance',
    description: 'Gestion + visibilité + nouveaux clients',
    badge: '⭐ Le plus populaire',
    prix_mensuel: 299,
    prix_creation: 499,
    popular: true,
    economie_mensuelle: 48,
    services_inclus: ['SaaS Panel', 'Site Web Géré', 'Marketing Starter'],
    features: [
      'Tout Pack Présence',
      'Marketing Starter (4h/mois dédié)',
      'Manager marketing humain dédié',
      'Réseaux sociaux gérés (2 posts/semaine)',
      'Rapport KPIs mensuel complet',
    ],
    cta_label: 'Choisir Croissance',
    cta_href: '/register',
  },
  {
    id: 'acceleration',
    nom: "Pack Accélération",
    description: 'Croissance maximale avec ADS gérés',
    prix_mensuel: 599,
    prix_creation: 499,
    popular: false,
    economie_mensuelle: 148,
    services_inclus: ['SaaS Panel', 'Site Web Géré', 'Marketing Pro'],
    features: [
      'Tout Pack Croissance',
      'Marketing Pro (8h/mois)',
      'ADS Meta + Google gérés de A à Z',
      'Optimisation continue des campagnes',
      'Suivi hebdomadaire avec votre manager',
    ],
    cta_label: "Accélérer maintenant",
    cta_href: '/register',
  },
  {
    id: 'entreprise',
    nom: 'Pack Entreprise',
    description: 'Pour les PME qui veulent dominer leur marché',
    prix_mensuel: 999,
    prix_creation: null,
    popular: false,
    economie_mensuelle: 348,
    services_inclus: ['SaaS Panel', 'Site Web Géré', 'Marketing Expert'],
    features: [
      'Tout Pack Accélération',
      'Marketing Expert (15h/mois)',
      'ADS multi-canaux + influenceurs',
      'Account manager senior dédié',
      'Support prioritaire 7j/7',
      'Personnalisation avancée du site',
    ],
    cta_label: 'Nous contacter',
    cta_href: '/register',
  },
]
