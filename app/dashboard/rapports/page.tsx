// ============================================
// app/dashboard/rapports/page.tsx
// Rapports de conformité + générateur PDF amélioré
// ============================================
'use client'

import { useState, useEffect } from 'react'
import {
  FileOutput, Download, Clock, CheckCircle,
  AlertCircle, FileText, Shield, BarChart2, Eye, Loader2,
  Calendar
} from 'lucide-react'

interface Rapport {
  id: string
  titre: string
  type_rapport: string
  statut: string
  created_at: string
  score_snapshot: number | null
  fichier_url: string | null
  expire_at: string | null
  genere_par_utilisateur?: { prenom: string; nom: string } | null
}

type ReportType = 'conformite_ia' | 'sante_globale' | 'rapport_complet' | 'rapport_mensuel'

const REPORT_TYPES: Record<ReportType, { label: string; description: string; icon: any; color: string }> = {
  conformite_ia: {
    label: 'Conformité IA Act',
    description: 'Bilan de vos usages IA, niveaux de risque et conformité réglementaire',
    icon: Shield,
    color: 'blue',
  },
  sante_globale: {
    label: 'Santé globale',
    description: 'Synthèse de tous vos scores : conformité, finances, contrats, obligations',
    icon: BarChart2,
    color: 'green',
  },
  rapport_complet: {
    label: 'Rapport complet',
    description: 'Rapport exhaustif incluant toutes les données et recommandations prioritaires',
    icon: FileText,
    color: 'purple',
  },
  rapport_mensuel: {
    label: 'Rapport mensuel',
    description: 'Tous les sous-scores + top 5 recommandations du mois — idéal pour votre direction',
    icon: Calendar,
    color: 'amber',
  },
}

const TYPE_LABELS: Record<string, string> = {
  ai_act_simplifie: 'Rapport AI Act simplifié',
  registre_traitements: 'Registre des traitements',
  bilan_conformite: 'Bilan de conformité',
  export_audit: 'Export audit complet',
  conformite_ia: 'Conformité IA Act',
  sante_globale: 'Santé globale',
  rapport_complet: 'Rapport complet',
  rapport_mensuel: 'Rapport mensuel complet',
}

const STATUT_CONFIG: Record<string, { icon: any; color: string; label: string }> = {
  pret: { icon: CheckCircle, color: 'text-green-600 dark:text-green-400', label: 'Prêt' },
  en_generation: { icon: Clock, color: 'text-blue-600 dark:text-blue-400', label: 'En cours...' },
  erreur: { icon: AlertCircle, color: 'text-red-600 dark:text-red-400', label: 'Erreur' },
  expire: { icon: Clock, color: 'text-slate-400', label: 'Expiré' },
}

export default function RapportsPage() {
  const [rapports, setRapports] = useState<Rapport[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedType, setSelectedType] = useState<ReportType | null>(null)
  const [generating, setGenerating] = useState(false)
  const [generatingMensuel, setGeneratingMensuel] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)

  useEffect(() => {
    loadRapports()
  }, [])

  async function loadRapports() {
    try {
      const r = await fetch('/api/rapports')
      if (r.ok) {
        const data = await r.json()
        setRapports(data.data || [])
      }
    } catch { /* ignore */ } finally {
      setLoading(false)
    }
  }

  async function generatePDF(type: ReportType) {
    if (type === 'rapport_mensuel') {
      await generateMensuel()
      return
    }

    setGenerating(true)
    setPreview(null)

    try {
      const [scoreRes, journauxRes, scoreGlobalRes] = await Promise.all([
        fetch('/api/score').then(r => r.ok ? r.json() : null).catch(() => null),
        fetch('/api/journaux').then(r => r.ok ? r.json() : null).catch(() => null),
        fetch('/api/score-global').then(r => r.ok ? r.json() : null).catch(() => null),
      ])

      const config = REPORT_TYPES[type]
      const now = new Date()
      const dateStr = now.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })

      const previewHtml = buildPreviewHtml(type, config.label, dateStr, scoreRes, journauxRes)
      setPreview(previewHtml)

      const { jsPDF } = await import('jspdf')
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

      const pageW = doc.internal.pageSize.getWidth()
      const pageH = doc.internal.pageSize.getHeight()
      const margin = 20

      // ── PAGE DE GARDE ──────────────────────────────────────────────
      // Fond header
      doc.setFillColor(37, 99, 235) // blue-600
      doc.rect(0, 0, pageW, 50, 'F')

      // Logo SENTINEL
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(28)
      doc.setFont('helvetica', 'bold')
      doc.text('SENTINEL', margin, 22)

      // Sous-titre logo
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      doc.text('Conformité IA & Gouvernance d\'entreprise', margin, 32)

      // Date en haut à droite
      doc.setFontSize(9)
      doc.text(`Généré le ${dateStr}`, pageW - margin, 32, { align: 'right' })

      // Bande décorative
      doc.setFillColor(59, 130, 246) // blue-500
      doc.rect(0, 50, pageW, 4, 'F')

      // Titre du rapport
      let y = 75
      doc.setTextColor(15, 23, 42) // slate-900
      doc.setFontSize(20)
      doc.setFont('helvetica', 'bold')
      doc.text(config.label, margin, y)
      y += 8

      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(100, 116, 139) // slate-500
      doc.text(config.description, margin, y, { maxWidth: pageW - margin * 2 })
      y += 14

      // Séparateur
      doc.setDrawColor(226, 232, 240) // slate-200
      doc.setLineWidth(0.5)
      doc.line(margin, y, pageW - margin, y)
      y += 10

      // Score global
      const score = scoreRes?.score_global ?? scoreRes?.data?.score_global ?? 0
      const scoreNum = typeof score === 'number' ? score : parseInt(score) || 0
      const scoreColor = scoreNum >= 70 ? [34, 197, 94] : scoreNum >= 50 ? [245, 158, 11] : [239, 68, 68]

      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(15, 23, 42)
      doc.text('Score de conformité global', margin, y)
      y += 8

      // Barre de progression pour le score
      const barW = pageW - margin * 2
      const barH = 8
      // Fond gris
      doc.setFillColor(226, 232, 240)
      doc.roundedRect(margin, y, barW, barH, 2, 2, 'F')
      // Barre colorée
      const filledW = Math.round((scoreNum / 100) * barW)
      if (filledW > 0) {
        doc.setFillColor(scoreColor[0], scoreColor[1], scoreColor[2])
        doc.roundedRect(margin, y, filledW, barH, 2, 2, 'F')
      }
      // Label score
      doc.setFontSize(11)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(scoreColor[0], scoreColor[1], scoreColor[2])
      doc.text(`${scoreNum}/100`, margin + barW + 4, y + 6)
      y += 16

      if (type === 'conformite_ia' || type === 'rapport_complet') {
        const journaux = journauxRes?.data || journauxRes || []
        const total = Array.isArray(journaux) ? journaux.length : 0

        doc.setFontSize(12)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(15, 23, 42)
        doc.text('Usages IA déclarés', margin, y)
        y += 7

        doc.setFontSize(10)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(100, 116, 139)
        doc.text(`Nombre total d'usages : ${total}`, margin, y)
        y += 5

        if (Array.isArray(journaux) && journaux.length > 0) {
          const risques = ['inacceptable', 'eleve', 'limite', 'faible']
          risques.forEach(r => {
            const count = journaux.filter((j: any) => j.niveau_risque === r).length
            if (count > 0) {
              doc.text(`• Niveau ${r} : ${count}`, margin + 4, y)
              y += 5
            }
          })
        }
      }

      if (type === 'sante_globale' || type === 'rapport_complet') {
        y += 4
        doc.setFontSize(12)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(15, 23, 42)
        doc.text('Scores par module', margin, y)
        y += 8

        const sg = scoreGlobalRes?.data || scoreGlobalRes
        const modules = [
          { label: 'Conformité IA', key: 'score_conformite_ia' },
          { label: 'Impayés', key: 'score_impayes' },
          { label: 'Obligations', key: 'score_obligations' },
          { label: 'Financier', key: 'score_financier' },
          { label: 'Contrats', key: 'score_contractuel' },
        ]
        modules.forEach(m => {
          const val = sg?.[m.key] ?? 50
          const mColor = val >= 70 ? [34, 197, 94] : val >= 50 ? [245, 158, 11] : [239, 68, 68]
          doc.setFontSize(9)
          doc.setFont('helvetica', 'normal')
          doc.setTextColor(71, 85, 105)
          doc.text(m.label, margin, y)
          // Mini barre
          const mBarW = 80
          doc.setFillColor(226, 232, 240)
          doc.roundedRect(margin + 40, y - 4, mBarW, 5, 1, 1, 'F')
          const mFilled = Math.round((val / 100) * mBarW)
          if (mFilled > 0) {
            doc.setFillColor(mColor[0], mColor[1], mColor[2])
            doc.roundedRect(margin + 40, y - 4, mFilled, 5, 1, 1, 'F')
          }
          doc.setTextColor(mColor[0], mColor[1], mColor[2])
          doc.setFont('helvetica', 'bold')
          doc.text(`${val}`, margin + 40 + mBarW + 4, y)
          y += 7
        })
      }

      // Séparateur
      y += 4
      doc.setDrawColor(226, 232, 240)
      doc.line(margin, y, pageW - margin, y)
      y += 8

      // Note légale
      doc.setFontSize(8)
      doc.setTextColor(148, 163, 184)
      doc.setFont('helvetica', 'italic')
      doc.text(
        'Ce rapport a été généré automatiquement par Sentinel. Il constitue un document de conformité interne.',
        margin, y, { maxWidth: pageW - margin * 2 }
      )

      // Pagination
      doc.setFontSize(8)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(148, 163, 184)
      doc.text('Page 1/1', pageW / 2, pageH - 10, { align: 'center' })

      const filename = `sentinel-${type}-${now.toISOString().split('T')[0]}.pdf`
      doc.save(filename)

    } catch (err) {
      console.error('PDF generation error:', err)
      alert('Erreur lors de la génération du PDF. Réessayez.')
    } finally {
      setGenerating(false)
    }
  }

  async function generateMensuel() {
    setGeneratingMensuel(true)
    try {
      const res = await fetch('/api/rapports/mensuel', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      alert('Rapport mensuel généré avec succès !')
      await loadRapports()
    } catch (err: any) {
      alert(`Erreur : ${err.message}`)
    } finally {
      setGeneratingMensuel(false)
    }
  }

  function buildPreviewHtml(type: ReportType, label: string, dateStr: string, scoreRes: any, journauxRes: any): string {
    const score = scoreRes?.score_global ?? scoreRes?.data?.score_global ?? '—'
    const journaux = journauxRes?.data || journauxRes || []
    const total = Array.isArray(journaux) ? journaux.length : 0

    return `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
        <div style="background: #2563eb; color: white; padding: 16px 24px; border-radius: 8px 8px 0 0;">
          <strong style="font-size: 20px;">SENTINEL</strong>
          <div style="font-size: 12px; opacity: 0.8; margin-top: 4px;">${label}</div>
        </div>
        <div style="border: 1px solid #e2e8f0; border-top: none; padding: 24px; border-radius: 0 0 8px 8px;">
          <p style="color: #64748b; font-size: 12px; margin-bottom: 16px;">Généré le ${dateStr}</p>
          <h2 style="color: #0f172a; margin-bottom: 8px;">Score de conformité : <strong>${score}/100</strong></h2>
          ${type !== 'sante_globale' ? `<p style="color: #64748b;">Usages IA déclarés : <strong>${total}</strong></p>` : ''}
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 16px 0;" />
          <p style="color: #94a3b8; font-size: 11px; font-style: italic;">
            Ce rapport a été généré automatiquement par Sentinel.
          </p>
        </div>
      </div>
    `
  }

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Rapports de conformité</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">Documents prêts pour vos audits réglementaires</p>
        </div>
      </div>

      {/* Info box */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl px-5 py-4">
        <p className="text-sm text-blue-800 dark:text-blue-200">
          <strong>À quoi servent ces rapports ?</strong> En cas de contrôle réglementaire (CNIL, AI Act),
          ces documents prouvent que votre entreprise a documenté et maîtrisé ses usages IA.
        </p>
      </div>

      {/* Générateur PDF */}
      <div>
        <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3">Générer un rapport PDF</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {(Object.entries(REPORT_TYPES) as [ReportType, typeof REPORT_TYPES[ReportType]][]).map(([key, cfg]) => {
            const Icon = cfg.icon
            const colorCls: Record<string, string> = {
              blue: 'border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/20',
              green: 'border-green-200 dark:border-green-800 hover:bg-green-50 dark:hover:bg-green-900/20',
              purple: 'border-purple-200 dark:border-purple-800 hover:bg-purple-50 dark:hover:bg-purple-900/20',
              amber: 'border-amber-200 dark:border-amber-800 hover:bg-amber-50 dark:hover:bg-amber-900/20',
            }
            const iconColorCls: Record<string, string> = {
              blue: 'text-blue-500',
              green: 'text-green-500',
              purple: 'text-purple-500',
              amber: 'text-amber-500',
            }
            return (
              <div
                key={key}
                onClick={() => setSelectedType(key)}
                className={`bg-white dark:bg-slate-800 rounded-xl border-2 p-5 cursor-pointer transition-colors ${colorCls[cfg.color]} ${
                  selectedType === key ? 'ring-2 ring-blue-500' : 'border-slate-200 dark:border-slate-700'
                }`}
              >
                <Icon className={`w-6 h-6 mb-3 ${iconColorCls[cfg.color]}`} />
                <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-sm">{cfg.label}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">{cfg.description}</p>
              </div>
            )
          })}
        </div>

        {selectedType && (
          <div className="mt-4 flex gap-3 items-center">
            <button
              onClick={() => generatePDF(selectedType)}
              disabled={generating || generatingMensuel}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors"
            >
              {(generating || generatingMensuel) ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              {(generating || generatingMensuel) ? 'Génération…' : `Télécharger — ${REPORT_TYPES[selectedType].label}`}
            </button>
            {!generating && !generatingMensuel && (
              <button
                onClick={() => setSelectedType(null)}
                className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              >
                Annuler
              </button>
            )}
          </div>
        )}
      </div>

      {/* Preview */}
      {preview && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2 px-5 py-3 border-b border-slate-100 dark:border-slate-700">
            <Eye className="w-4 h-4 text-slate-500" />
            <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">Aperçu du rapport</span>
            <span className="text-xs text-slate-500 dark:text-slate-400 ml-1">(version simplifiée)</span>
          </div>
          <div
            className="p-4 overflow-x-auto"
            dangerouslySetInnerHTML={{ __html: preview }}
          />
        </div>
      )}

      {/* Liste rapports DB */}
      {loading ? (
        <div className="flex items-center justify-center h-20">
          <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
        </div>
      ) : rapports.length > 0 ? (
        <div>
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3">Rapports sauvegardés</h2>
          <div className="space-y-3">
            {rapports.map((rapport) => {
              const statutConfig = STATUT_CONFIG[rapport.statut] || STATUT_CONFIG.pret
              const Icon = statutConfig.icon
              const isExpired = rapport.expire_at && new Date(rapport.expire_at) < new Date()

              return (
                <div
                  key={rapport.id}
                  className={`bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 px-5 py-4 flex items-center gap-4 ${isExpired ? 'opacity-60' : ''}`}
                >
                  <div className="bg-slate-100 dark:bg-slate-700 p-2.5 rounded-lg flex-shrink-0">
                    <FileOutput className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{rapport.titre}</p>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {TYPE_LABELS[rapport.type_rapport] || rapport.type_rapport}
                      </span>
                      <span className="text-slate-300 dark:text-slate-600">·</span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {new Date(rapport.created_at).toLocaleDateString('fr-FR', {
                          day: 'numeric', month: 'long', year: 'numeric'
                        })}
                      </span>
                      {rapport.score_snapshot !== null && (
                        <>
                          <span className="text-slate-300 dark:text-slate-600">·</span>
                          <span className="text-xs text-slate-500 dark:text-slate-400">Score : {rapport.score_snapshot}/100</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className={`flex items-center gap-1.5 ${statutConfig.color}`}>
                      <Icon className="w-4 h-4" />
                      <span className="text-xs font-medium">{statutConfig.label}</span>
                    </div>
                    {rapport.statut === 'pret' && rapport.fichier_url && !isExpired && (
                      <a
                        href={rapport.fichier_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 bg-slate-900 dark:bg-slate-700 hover:bg-slate-700 dark:hover:bg-slate-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Télécharger
                      </a>
                    )}
                    {isExpired && (
                      <span className="text-xs text-slate-400 italic">Lien expiré</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ) : !preview && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 py-12 text-center">
          <FileOutput className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-700 dark:text-slate-300">Aucun rapport généré</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Sélectionnez un type de rapport ci-dessus pour commencer
          </p>
        </div>
      )}
    </div>
  )
}
