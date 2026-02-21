// ============================================
// app/dashboard/rapports/generer/page.tsx
// Hub de génération de rapports
// ============================================
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getUtilisateur } from '@/lib/supabase/getUtilisateur'
import {
  Package, FileText, Shield, ArrowRight,
  Sparkles, ClipboardList, FileOutput
} from 'lucide-react'

const REPORT_TYPES = [
  {
    id: 'audit',
    titre: 'Package d\'audit complet',
    description: 'Compilez toutes vos données de conformité en un seul rapport : journaux IA, score, obligations, contrats, fournisseurs. Idéal pour un audit réglementaire.',
    icon: Package,
    href: '/dashboard/rapports/audit',
    color: 'bg-blue-50 border-blue-200',
    iconColor: 'text-blue-600',
    badge: 'Recommandé',
    badgeColor: 'bg-blue-100 text-blue-700',
  },
  {
    id: 'fria',
    titre: 'Analyse d\'impact droits fondamentaux (FRIA)',
    description: 'Générez automatiquement une FRIA pour un système IA — requis par l\'Art. 27 AI Act pour les déployeurs de systèmes à haut risque.',
    icon: Shield,
    href: '/dashboard/journaux',
    color: 'bg-red-50 border-red-200',
    iconColor: 'text-red-600',
    badge: 'IA-assisté',
    badgeColor: 'bg-purple-100 text-purple-700',
    note: 'Sélectionnez un système IA depuis vos journaux',
  },
  {
    id: 'technical_doc',
    titre: 'Documentation technique',
    description: 'Fiche technique complète selon l\'Art. 11 + Annexe IV AI Act. Générée automatiquement via Claude à partir de vos données de déclaration.',
    icon: FileText,
    href: '/dashboard/journaux',
    color: 'bg-orange-50 border-orange-200',
    iconColor: 'text-orange-600',
    badge: 'IA-assisté',
    badgeColor: 'bg-purple-100 text-purple-700',
    note: 'Sélectionnez un système IA depuis vos journaux',
  },
  {
    id: 'obligations',
    titre: 'Rapport des obligations légales',
    description: 'Vue d\'ensemble de toutes vos obligations administratives, leur statut et les preuves archivées. Parfait pour un contrôle URSSAF ou fiscal.',
    icon: ClipboardList,
    href: '/dashboard/obligations',
    color: 'bg-green-50 border-green-200',
    iconColor: 'text-green-600',
    note: 'Généré depuis vos obligations',
  },
  {
    id: 'conformite',
    titre: 'Bilan de conformité AI Act',
    description: 'Synthèse executive : score, niveau, recommandations prioritaires et historique. Format prêt pour votre direction ou vos investisseurs.',
    icon: FileOutput,
    href: '/dashboard/score',
    color: 'bg-slate-50 border-slate-200',
    iconColor: 'text-slate-600',
    note: 'Généré depuis votre score de conformité',
  },
]

export default async function GenererRapportPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const utilisateur = await getUtilisateur(user.id)
  if (!utilisateur) redirect('/login')

  const isAllowed = ['admin', 'manager'].includes(utilisateur.role)
  if (!isAllowed) redirect('/dashboard/rapports')

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-blue-500" />
          Générer un rapport
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Choisissez le type de document à produire pour votre audit réglementaire
        </p>
      </div>

      <div className="space-y-3">
        {REPORT_TYPES.map(report => (
          <Link
            key={report.id}
            href={report.href}
            className={`block bg-white border-2 ${report.color} rounded-xl p-5 hover:shadow-md transition-all group`}
          >
            <div className="flex items-start gap-4">
              <div className={`p-3 rounded-xl ${report.color} flex-shrink-0`}>
                <report.icon className={`w-6 h-6 ${report.iconColor}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h3 className="font-semibold text-slate-900">{report.titre}</h3>
                  {report.badge && (
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${report.badgeColor}`}>
                      {report.badge}
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-600">{report.description}</p>
                {report.note && (
                  <p className="text-xs text-slate-400 mt-1.5 italic">{report.note}</p>
                )}
              </div>
              <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-slate-600 transition-colors flex-shrink-0 mt-1" />
            </div>
          </Link>
        ))}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
        <strong>Conseil :</strong> Commencez par le <strong>Package d'audit complet</strong> — il agrège automatiquement
        toutes vos données en un seul document téléchargeable, parfait pour un contrôle rapide.
      </div>
    </div>
  )
}
