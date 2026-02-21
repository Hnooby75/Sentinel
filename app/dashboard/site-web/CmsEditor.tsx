'use client'

// ============================================
// app/dashboard/site-web/CmsEditor.tsx
// Éditeur CMS vitrine — super_admin uniquement
// ============================================
import { useState } from 'react'
import { Save, Check, Loader2, ExternalLink, AlertCircle, RefreshCw } from 'lucide-react'

interface ContenuVitrine {
  titre?: string
  description?: string
  hero_ligne1?: string
  hero_ligne2?: string
  hero_sous_titre?: string
}

interface Props {
  initialContenu: ContenuVitrine
}

const DEFAULTS: ContenuVitrine = {
  hero_ligne1:     'Pilotez votre PME',
  hero_ligne2:     'depuis un seul endroit',
  hero_sous_titre: 'La plateforme tout-en-un qui combine SaaS de gestion IA, site web professionnel et marketing humain — pour les dirigeants qui veulent performer.',
}

export default function CmsEditor({ initialContenu }: Props) {
  const [contenu, setContenu] = useState<ContenuVitrine>({
    hero_ligne1:     initialContenu.hero_ligne1     || DEFAULTS.hero_ligne1,
    hero_ligne2:     initialContenu.hero_ligne2     || DEFAULTS.hero_ligne2,
    hero_sous_titre: initialContenu.hero_sous_titre || DEFAULTS.hero_sous_titre,
  })
  const [saving,  setSaving]  = useState(false)
  const [saved,   setSaved]   = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  async function handleSave() {
    setSaving(true); setError(null); setSaved(false)
    try {
      const res = await fetch('/api/admin/vitrine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contenu }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d.error || `Erreur ${res.status}`)
      }
      setSaved(true)
      setTimeout(() => setSaved(false), 4000)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  function handleReset(field: keyof ContenuVitrine) {
    setContenu(prev => ({ ...prev, [field]: DEFAULTS[field] }))
  }

  return (
    <div className="rounded-2xl border border-amber-500/20 bg-slate-900 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-amber-500/10 bg-amber-500/5 flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-white text-sm">Modifier le contenu de la vitrine</h2>
          <p className="text-xs text-slate-500 mt-0.5">Les modifications sont visibles sur <code className="text-amber-400">/vitrine/</code> immédiatement</p>
        </div>
        <a
          href="/vitrine/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 transition-colors"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          Voir la vitrine
        </a>
      </div>

      <div className="p-6 space-y-5">
        {error && (
          <div className="flex items-start gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 px-4 py-3 rounded-xl">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            {error}
          </div>
        )}

        {/* Titre H1 — Ligne 1 (gradient) */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs text-slate-400 font-medium">
              Titre principal — ligne 1 <span className="text-slate-600">(texte en gradient)</span>
            </label>
            <button
              onClick={() => handleReset('hero_ligne1')}
              className="flex items-center gap-1 text-[10px] text-slate-600 hover:text-slate-400 transition-colors"
            >
              <RefreshCw className="w-2.5 h-2.5" />
              Reset
            </button>
          </div>
          <input
            value={contenu.hero_ligne1}
            onChange={e => setContenu(prev => ({ ...prev, hero_ligne1: e.target.value }))}
            placeholder={DEFAULTS.hero_ligne1}
            className="w-full rounded-xl bg-slate-800 border border-slate-700 px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-500/50"
          />
        </div>

        {/* Titre H1 — Ligne 2 */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs text-slate-400 font-medium">
              Titre principal — ligne 2 <span className="text-slate-600">(texte blanc)</span>
            </label>
            <button
              onClick={() => handleReset('hero_ligne2')}
              className="flex items-center gap-1 text-[10px] text-slate-600 hover:text-slate-400 transition-colors"
            >
              <RefreshCw className="w-2.5 h-2.5" />
              Reset
            </button>
          </div>
          <input
            value={contenu.hero_ligne2}
            onChange={e => setContenu(prev => ({ ...prev, hero_ligne2: e.target.value }))}
            placeholder={DEFAULTS.hero_ligne2}
            className="w-full rounded-xl bg-slate-800 border border-slate-700 px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-500/50"
          />
        </div>

        {/* Sous-titre */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs text-slate-400 font-medium">Sous-titre (description courte)</label>
            <button
              onClick={() => handleReset('hero_sous_titre')}
              className="flex items-center gap-1 text-[10px] text-slate-600 hover:text-slate-400 transition-colors"
            >
              <RefreshCw className="w-2.5 h-2.5" />
              Reset
            </button>
          </div>
          <textarea
            value={contenu.hero_sous_titre}
            onChange={e => setContenu(prev => ({ ...prev, hero_sous_titre: e.target.value }))}
            placeholder={DEFAULTS.hero_sous_titre}
            rows={3}
            className="w-full rounded-xl bg-slate-800 border border-slate-700 px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-500/50 resize-none"
          />
        </div>

        {/* Aperçu */}
        <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
          <p className="text-[10px] text-slate-600 uppercase tracking-wide font-semibold mb-3">Aperçu</p>
          <p className="text-lg font-bold leading-tight">
            <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              {contenu.hero_ligne1 || DEFAULTS.hero_ligne1}
            </span>
            <br />
            <span className="text-white">{contenu.hero_ligne2 || DEFAULTS.hero_ligne2}</span>
          </p>
          <p className="text-slate-400 text-xs mt-2 leading-relaxed">
            {contenu.hero_sous_titre || DEFAULTS.hero_sous_titre}
          </p>
        </div>

        {/* Bouton sauvegarder */}
        <div className="flex items-center gap-3 pt-1">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-black font-semibold text-sm transition-all"
          >
            {saving
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : saved
              ? <Check className="w-4 h-4" />
              : <Save className="w-4 h-4" />
            }
            {saving ? 'Sauvegarde...' : saved ? 'Sauvegardé !' : 'Sauvegarder les modifications'}
          </button>
          {saved && (
            <p className="text-xs text-emerald-400">
              Rechargez <code>/vitrine/</code> pour voir les changements
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
