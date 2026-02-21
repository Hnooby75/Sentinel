// ============================================
// lib/ai/types.ts
// Types TypeScript pour les features IA
// ============================================

export interface ClassificationResult {
  risk_level: 'unacceptable' | 'high' | 'limited' | 'minimal'
  operator_status: 'provider' | 'deployer' | 'distributor' | 'importer'
  confidence: number
  rationale: string
  ai_act_articles: string[]
  required_documentation: string[]
  action_plan: ActionItem[]
  suggested_category: string
  suggested_mitigation: string[]
  transparency_required: boolean
  human_oversight_required: boolean
}

export interface ActionItem {
  priority: 'critical' | 'high' | 'medium' | 'low'
  action: string
  deadline: string
  effort: 'low' | 'medium' | 'high'
}

export interface CopilotMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  citations?: string[]
  created_at: string
}

export interface OnboardingResult {
  systemes_detectes: Array<{
    titre: string
    outil_ia: string
    categorie_usage: string
    niveau_risque: string
    priorite: string
  }>
  score_estime: number
  niveau_estime: string
  actions_prioritaires: string[]
  message_accueil: string
}

export interface SupplierScanResult {
  risk_score: number
  ai_usage_detected: Array<{
    description: string
    risk_level: string
    source: string
  }>
  policy_analysis: {
    has_ai_policy: boolean
    gdpr_compliant_claims: boolean
    transparency_level: string
    certifications: string[]
  }
  findings: string[]
  recommendations: string[]
  summary: string
}

export const RISK_LEVEL_CONFIG = {
  unacceptable: {
    label: 'Inacceptable',
    color: 'text-red-700',
    bg: 'bg-red-100',
    border: 'border-red-300',
    description: 'Interdit par l\'AI Act (Art. 5)',
  },
  high: {
    label: 'Élevé',
    color: 'text-orange-700',
    bg: 'bg-orange-100',
    border: 'border-orange-300',
    description: 'Obligations strictes requises (Annexe III)',
  },
  limited: {
    label: 'Limité',
    color: 'text-yellow-700',
    bg: 'bg-yellow-100',
    border: 'border-yellow-300',
    description: 'Transparence obligatoire (Art. 50)',
  },
  minimal: {
    label: 'Minimal',
    color: 'text-green-700',
    bg: 'bg-green-100',
    border: 'border-green-300',
    description: 'Peu de restrictions',
  },
} as const

export const OPERATOR_STATUS_CONFIG = {
  provider: { label: 'Fournisseur', description: 'Développe et met le système IA sur le marché' },
  deployer: { label: 'Déployeur', description: 'Utilise un système IA tiers (cas PME le plus fréquent)' },
  distributor: { label: 'Distributeur', description: 'Rend le système IA disponible sans modification' },
  importer: { label: 'Importateur', description: 'Importe un système IA d\'un pays non-UE' },
} as const
