// ============================================
// app/dashboard/rapports/audit/page.tsx
// Feature 10 — Package d'audit one-click
// ============================================
'use client'

import { useState } from 'react'
import { Download, Package, CheckCircle, AlertTriangle, FileText, Loader2, Printer } from 'lucide-react'

interface AuditData {
  genere_a: string
  genere_par: string
  entreprise: { nom: string; secteur: string; taille: string; plan: string }
  score_conformite: { score: number; niveau: string; recommandations: Record<string, unknown>[] } | null
  systemes_ia: Record<string, unknown>[]
  nb_systemes: number
  nb_haut_risque: number
  obligations: Record<string, unknown>[]
  nb_obligations_retard: number
  contrats: Record<string, unknown>[]
  fournisseurs: Record<string, unknown>[]
  rapports_generes: Record<string, unknown>[]
  resume_conformite: { score: number; niveau: string; recommandations_cles: Record<string, unknown>[] }
}

const NIVEAU_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  excellent: { label: 'Excellent', color: 'text-emerald-700', bg: 'bg-emerald-100' },
  bon: { label: 'Bon', color: 'text-green-700', bg: 'bg-green-100' },
  partiel: { label: 'Partiel', color: 'text-yellow-700', bg: 'bg-yellow-100' },
  insuffisant: { label: 'Insuffisant', color: 'text-orange-700', bg: 'bg-orange-100' },
  critique: { label: 'Critique', color: 'text-red-700', bg: 'bg-red-100' },
}

export default function AuditPackagePage() {
  const [loading, setLoading] = useState(false)
  const [auditData, setAuditData] = useState<AuditData | null>(null)
  const [error, setError] = useState('')

  async function generateAudit() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/reports/audit-package')
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Erreur génération')
      }
      const data = await res.json()
      setAuditData(data)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setLoading(false)
    }
  }

  function handlePrint() {
    window.print()
  }

  const niveauCfg = auditData?.resume_conformite?.niveau
    ? NIVEAU_LABELS[auditData.resume_conformite.niveau]
    : null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Package className="w-6 h-6 text-blue-500" />
            Package d'audit complet
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Compilez l'ensemble de vos données de conformité en un seul rapport
          </p>
        </div>
        <div className="flex gap-2">
          {auditData && (
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 border border-slate-200 text-slate-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
            >
              <Printer className="w-4 h-4" />
              Imprimer / PDF
            </button>
          )}
          <button
            onClick={generateAudit}
            disabled={loading}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            {loading ? 'Génération…' : auditData ? 'Régénérer' : 'Générer le package'}
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {!auditData && !loading && (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center space-y-4">
          <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto">
            <Package className="w-8 h-8 text-blue-500" />
          </div>
          <div>
            <h2 className="font-semibold text-slate-800">Prêt à compiler votre audit</h2>
            <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
              En un clic, nous agrégeons vos journaux IA, score de conformité, obligations,
              analyses contractuelles et évaluations fournisseurs.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3 max-w-lg mx-auto text-left">
            {[
              { icon: CheckCircle, text: 'Systèmes IA déclarés', color: 'text-blue-600' },
              { icon: CheckCircle, text: 'Score de conformité', color: 'text-blue-600' },
              { icon: CheckCircle, text: 'Obligations légales', color: 'text-blue-600' },
              { icon: CheckCircle, text: 'Risques contractuels', color: 'text-blue-600' },
              { icon: CheckCircle, text: 'Évaluations fournisseurs', color: 'text-blue-600' },
              { icon: CheckCircle, text: 'Recommandations clés', color: 'text-blue-600' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-slate-600">
                <item.icon className={`w-4 h-4 ${item.color}`} />
                {item.text}
              </div>
            ))}
          </div>
          <button
            onClick={generateAudit}
            className="bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Générer maintenant
          </button>
        </div>
      )}

      {auditData && (
        <div className="space-y-4 print:space-y-6" id="audit-report">
          {/* En-tête du rapport */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">{auditData.entreprise?.nom}</h2>
                <p className="text-sm text-slate-500 mt-0.5">
                  Rapport de conformité AI Act — Généré le {new Date(auditData.genere_a).toLocaleDateString('fr-FR')}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">Par : {auditData.genere_par}</p>
              </div>
              {niveauCfg && (
                <div className={`text-center px-4 py-2 rounded-xl ${niveauCfg.bg}`}>
                  <p className={`text-3xl font-bold ${niveauCfg.color}`}>{auditData.resume_conformite.score}</p>
                  <p className={`text-xs font-semibold ${niveauCfg.color}`}>{niveauCfg.label}</p>
                </div>
              )}
            </div>
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: 'Systèmes IA', value: auditData.nb_systemes, icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50' },
              { label: 'Haut risque', value: auditData.nb_haut_risque, icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50' },
              { label: 'Obligations en retard', value: auditData.nb_obligations_retard, icon: AlertTriangle, color: 'text-orange-600', bg: 'bg-orange-50' },
              { label: 'Contrats analysés', value: auditData.contrats.length, icon: FileText, color: 'text-purple-600', bg: 'bg-purple-50' },
            ].map(stat => (
              <div key={stat.label} className="bg-white rounded-xl border border-slate-200 p-4">
                <div className={`w-9 h-9 ${stat.bg} rounded-lg flex items-center justify-center mb-2`}>
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                <p className="text-xs text-slate-500">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Systèmes IA */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-500" />
              Systèmes IA déclarés ({auditData.systemes_ia.length})
            </h3>
            {auditData.systemes_ia.length === 0 ? (
              <p className="text-sm text-slate-400">Aucun système IA déclaré</p>
            ) : (
              <div className="space-y-2">
                {auditData.systemes_ia.map((s: Record<string, unknown>, i: number) => (
                  <div key={i} className="flex items-center gap-3 text-sm border-b border-slate-100 last:border-0 pb-2 last:pb-0">
                    <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${
                      s.niveau_risque === 'eleve' ? 'bg-red-100 text-red-700' :
                      s.niveau_risque === 'limite' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {s.niveau_risque as string}
                    </span>
                    <span className="font-medium text-slate-800">{s.titre as string}</span>
                    <span className="text-slate-400 text-xs">{s.outil_ia as string}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recommandations */}
          {auditData.resume_conformite.recommandations_cles.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
                Actions prioritaires
              </h3>
              <ul className="space-y-2">
                {auditData.resume_conformite.recommandations_cles.map((reco: Record<string, unknown>, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                    <span className={`text-xs px-1.5 py-0.5 rounded flex-shrink-0 mt-0.5 ${
                      (reco.priorite as string) === 'critique' ? 'bg-red-100 text-red-700' :
                      (reco.priorite as string) === 'haute' ? 'bg-orange-100 text-orange-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {reco.priorite as string}
                    </span>
                    {(reco.titre || reco.message) as string}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
