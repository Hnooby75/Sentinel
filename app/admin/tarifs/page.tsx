// ============================================
// app/admin/tarifs/page.tsx
// Éditeur de tarifs — services et packs
// ============================================
'use client'

import { useState, useEffect, useCallback } from 'react'
import { Tag, Save, RotateCcw, Check, AlertCircle, Package, Wrench } from 'lucide-react'
import { DEFAULT_SERVICES, DEFAULT_PACKS, type ServiceTarif, type PackTarif } from '@/lib/tarifs'

type Tab = 'services' | 'packs'

export default function AdminTarifsPage() {
  const [tab, setTab] = useState<Tab>('services')
  const [services, setServices] = useState<ServiceTarif[]>([])
  const [packs, setPacks] = useState<PackTarif[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)

  const showToast = (type: 'success' | 'error', msg: string) => {
    setToast({ type, msg })
    setTimeout(() => setToast(null), 3500)
  }

  const load = useCallback(async () => {
    setLoading(true)
    const [resS, resP] = await Promise.all([
      fetch('/api/v1/services'),
      fetch('/api/v1/packs'),
    ])
    const dataS = await resS.json()
    const dataP = await resP.json()
    setServices(dataS.services ?? DEFAULT_SERVICES)
    setPacks(dataP.packs ?? DEFAULT_PACKS)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function saveServices() {
    setSaving(true)
    const res = await fetch('/api/admin/tarifs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cle: 'tarifs_services', valeur: services }),
    })
    setSaving(false)
    if (res.ok) showToast('success', 'Services mis à jour ✓')
    else showToast('error', 'Erreur lors de la sauvegarde')
  }

  async function savePacks() {
    setSaving(true)
    const res = await fetch('/api/admin/tarifs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cle: 'tarifs_packs', valeur: packs }),
    })
    setSaving(false)
    if (res.ok) showToast('success', 'Packs mis à jour ✓')
    else showToast('error', 'Erreur lors de la sauvegarde')
  }

  function updateService(idx: number, field: keyof ServiceTarif, value: unknown) {
    setServices(prev => prev.map((s, i) => i === idx ? { ...s, [field]: value } : s))
  }

  function updatePack(idx: number, field: keyof PackTarif, value: unknown) {
    setPacks(prev => prev.map((p, i) => i === idx ? { ...p, [field]: value } : p))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
            <Tag className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Gestion des tarifs</h1>
            <p className="text-xs text-slate-500">Modifiez les prix affichés sur le site</p>
          </div>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-2 text-xs text-slate-400 hover:text-white border border-white/10 hover:border-white/20 px-3 py-2 rounded-lg transition-all"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Recharger
        </button>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium ${
          toast.type === 'success'
            ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
            : 'bg-red-500/10 border border-red-500/30 text-red-400'
        }`}>
          {toast.type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-slate-900 rounded-xl w-fit">
        {([
          { id: 'services', label: 'Services individuels', icon: Wrench },
          { id: 'packs',    label: 'Packs complets',       icon: Package },
        ] as { id: Tab; label: string; icon: React.ElementType }[]).map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === t.id
                ? 'bg-amber-500/20 text-amber-400'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </div>

      {/* Services tab */}
      {tab === 'services' && (
        <div className="space-y-4">
          {services.map((s, idx) => (
            <div key={s.id} className="rounded-2xl border border-white/8 bg-slate-900 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 font-bold">
                    {s.id}
                  </span>
                  <h3 className="font-bold text-white">{s.nom}</h3>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs text-slate-500 font-medium mb-1.5 block">Nom affiché</label>
                  <input
                    value={s.nom}
                    onChange={e => updateService(idx, 'nom', e.target.value)}
                    className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500/50"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-500 font-medium mb-1.5 block">Prix mensuel (€)</label>
                  <input
                    type="number"
                    value={s.prix_mensuel}
                    onChange={e => updateService(idx, 'prix_mensuel', Number(e.target.value))}
                    className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500/50"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-500 font-medium mb-1.5 block">Prix création (€, 0 = non)</label>
                  <input
                    type="number"
                    value={s.prix_creation ?? 0}
                    onChange={e => updateService(idx, 'prix_creation', Number(e.target.value) || null)}
                    className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500/50"
                  />
                </div>
                {s.essai_jours !== undefined && (
                  <div>
                    <label className="text-xs text-slate-500 font-medium mb-1.5 block">Essai gratuit (jours)</label>
                    <input
                      type="number"
                      value={s.essai_jours}
                      onChange={e => updateService(idx, 'essai_jours', Number(e.target.value))}
                      className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500/50"
                    />
                  </div>
                )}
                {s.heures !== undefined && (
                  <div>
                    <label className="text-xs text-slate-500 font-medium mb-1.5 block">Heures/mois incluses</label>
                    <input
                      type="number"
                      value={s.heures}
                      onChange={e => updateService(idx, 'heures', Number(e.target.value))}
                      className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500/50"
                    />
                  </div>
                )}
                <div>
                  <label className="text-xs text-slate-500 font-medium mb-1.5 block">Badge</label>
                  <input
                    value={s.badge}
                    onChange={e => updateService(idx, 'badge', e.target.value)}
                    className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500/50"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-500 font-medium mb-1.5 block">Description courte</label>
                <input
                  value={s.description}
                  onChange={e => updateService(idx, 'description', e.target.value)}
                  className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500/50"
                />
              </div>

              <div>
                <label className="text-xs text-slate-500 font-medium mb-1.5 block">
                  Features (une par ligne)
                </label>
                <textarea
                  value={s.features.join('\n')}
                  onChange={e => updateService(idx, 'features', e.target.value.split('\n').filter(Boolean))}
                  rows={Math.max(3, s.features.length)}
                  className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500/50 resize-none"
                />
              </div>
            </div>
          ))}

          <div className="flex justify-end">
            <button
              onClick={saveServices}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-black font-bold text-sm hover:opacity-90 disabled:opacity-50 transition-all"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Sauvegarde…' : 'Sauvegarder les services'}
            </button>
          </div>
        </div>
      )}

      {/* Packs tab */}
      {tab === 'packs' && (
        <div className="space-y-4">
          {packs.map((p, idx) => (
            <div key={p.id} className="rounded-2xl border border-white/8 bg-slate-900 p-6 space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 font-bold">
                  {p.id}
                </span>
                <h3 className="font-bold text-white">{p.nom}</h3>
                {p.popular && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 font-bold">
                    ⭐ Populaire
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="text-xs text-slate-500 font-medium mb-1.5 block">Nom affiché</label>
                  <input
                    value={p.nom}
                    onChange={e => updatePack(idx, 'nom', e.target.value)}
                    className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500/50"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-500 font-medium mb-1.5 block">Prix mensuel (€)</label>
                  <input
                    type="number"
                    value={p.prix_mensuel}
                    onChange={e => updatePack(idx, 'prix_mensuel', Number(e.target.value))}
                    className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500/50"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-500 font-medium mb-1.5 block">Prix création (€, 0 = non)</label>
                  <input
                    type="number"
                    value={p.prix_creation ?? 0}
                    onChange={e => updatePack(idx, 'prix_creation', Number(e.target.value) || null)}
                    className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500/50"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-500 font-medium mb-1.5 block">Économie/mois (€)</label>
                  <input
                    type="number"
                    value={p.economie_mensuelle}
                    onChange={e => updatePack(idx, 'economie_mensuelle', Number(e.target.value))}
                    className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-500 font-medium mb-1.5 block">Description</label>
                  <input
                    value={p.description}
                    onChange={e => updatePack(idx, 'description', e.target.value)}
                    className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500/50"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-500 font-medium mb-1.5 block">Label CTA</label>
                  <input
                    value={p.cta_label}
                    onChange={e => updatePack(idx, 'cta_label', e.target.value)}
                    className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500/50"
                  />
                </div>
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={p.popular}
                    onChange={e => updatePack(idx, 'popular', e.target.checked)}
                    className="w-4 h-4 rounded accent-amber-500"
                  />
                  <span className="text-sm text-slate-300">Afficher comme &quot;le plus populaire&quot;</span>
                </label>
              </div>

              <div>
                <label className="text-xs text-slate-500 font-medium mb-1.5 block">
                  Features (une par ligne)
                </label>
                <textarea
                  value={p.features.join('\n')}
                  onChange={e => updatePack(idx, 'features', e.target.value.split('\n').filter(Boolean))}
                  rows={Math.max(3, p.features.length)}
                  className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500/50 resize-none"
                />
              </div>
            </div>
          ))}

          <div className="flex justify-end">
            <button
              onClick={savePacks}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-black font-bold text-sm hover:opacity-90 disabled:opacity-50 transition-all"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Sauvegarde…' : 'Sauvegarder les packs'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
