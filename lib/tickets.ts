// ============================================
// lib/tickets.ts
// Mapping sujets → catégories pour les tickets SAV
// ============================================

export interface SujetTicket {
  label: string
  categorie: string
}

export const SUJETS: SujetTicket[] = [
  { label: 'Problème de facturation',  categorie: 'Facturation'  },
  { label: 'Bug ou erreur technique',  categorie: 'Technique'    },
  { label: 'Mon site web',             categorie: 'Site Web'     },
  { label: 'Activation site web',      categorie: 'Site Web'     },
  { label: 'Marketing',                categorie: 'Marketing'    },
  { label: 'Abonnement / Upgrade',     categorie: 'Abonnement'   },
  { label: 'Onboarding / Formation',   categorie: 'Onboarding'   },
  { label: 'Autre',                    categorie: 'Divers'       },
]

export function getCategorieFromSujet(sujet: string): string {
  const found = SUJETS.find(s => s.label === sujet)
  return found ? found.categorie : 'Divers'
}

export const STATUT_COLORS: Record<string, string> = {
  ouvert:     'bg-blue-500/10 text-blue-400 border-blue-500/20',
  en_attente: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  résolu:     'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  clôturé:    'bg-slate-500/10 text-slate-400 border-slate-500/20',
}

export const STATUT_LABELS: Record<string, string> = {
  ouvert:     'Ouvert',
  en_attente: 'En attente',
  résolu:     'Résolu',
  clôturé:    'Clôturé',
}
