// ============================================
// app/dashboard/cms — Gestion du site vitrine
// Éditeur multi-onglets : Général, Services, Témoignages, Contact
// ============================================
'use client'

import { useState, useEffect } from 'react'
import {
  Globe, Save, Eye, Loader2, Plus, Trash2,
  Type, ImageIcon, Phone, Star, Package,
  CheckCircle, AlertCircle, ExternalLink, Copy, Check
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Hero {
  titre: string
  sous_titre: string
  cta_label: string
  cta_href: string
  image_url: string
}

interface APropos {
  titre: string
  texte: string
  image_url: string
}

interface Service {
  id: string
  titre: string
  description: string
  icon: string
  prix: string
}

interface Temoignage {
  id: string
  nom: string
  poste: string
  texte: string
  note: number
}

interface Contact {
  email: string
  telephone: string
  adresse: string
}

interface Config {
  nom_site: string
  slug: string
  couleur: string
  publie: boolean
}

interface SiteContenu {
  hero: Hero
  a_propos: APropos
  services: Service[]
  temoignages: Temoignage[]
  contact: Contact
  config: Config
}

// ─── Valeurs par défaut ────────────────────────────────────────────────────────

const DEFAULT_CONTENU: SiteContenu = {
  hero: {
    titre: 'Bienvenue sur notre site',
    sous_titre: 'Votre partenaire de confiance pour vos projets digitaux',
    cta_label: 'Nous contacter',
    cta_href: '#contact',
    image_url: '',
  },
  a_propos: {
    titre: 'Qui sommes-nous ?',
    texte: 'Nous sommes une équipe passionnée qui accompagne les entreprises dans leur transformation digitale.',
    image_url: '',
  },
  services: [
    { id: '1', titre: 'Création de site web', description: 'Sites vitrines et e-commerce sur mesure', icon: '🌐', prix: 'À partir de 800€' },
    { id: '2', titre: 'Référencement SEO', description: 'Optimisez votre visibilité sur Google', icon: '📈', prix: 'À partir de 200€/mois' },
    { id: '3', titre: 'Maintenance', description: 'Gardez votre site à jour et sécurisé', icon: '🔧', prix: 'À partir de 90€/mois' },
  ],
  temoignages: [
    { id: '1', nom: 'Marie Dupont', poste: 'Directrice, Agence ABC', texte: 'Excellent travail, très professionnel et réactif. Je recommande vivement !', note: 5 },
    { id: '2', nom: 'Jean Martin', poste: 'Gérant, Commerce XYZ', texte: 'Notre site a été livré dans les délais et dépasse nos attentes.', note: 5 },
  ],
  contact: {
    email: 'contact@monentreprise.fr',
    telephone: '01 23 45 67 89',
    adresse: 'Paris, France',
  },
  config: {
    nom_site: 'Mon Site',
    slug: '',
    couleur: '#3B82F6',
    publie: false,
  },
}

// ─── Composant champ texte ─────────────────────────────────────────────────────

function Field({ label, value, onChange, multiline = false, placeholder = '' }: {
  label: string
  value: string
  onChange: (v: string) => void
  multiline?: boolean
  placeholder?: string
}) {
  const cls = 'w-full text-sm border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-blue-400 dark:focus:border-blue-500 transition-colors'
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">{label}</label>
      {multiline
        ? <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={3} className={`${cls} resize-y`} />
        : <input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className={cls} />
      }
    </div>
  )
}

// ─── Page principale ───────────────────────────────────────────────────────────

export default function CMSPage() {
  const [tab, setTab] = useState<'general' | 'services' | 'temoignages' | 'contact'>('general')
  const [contenu, setContenu] = useState<SiteContenu>(DEFAULT_CONTENU)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [erreur, setErreur] = useState('')
  const [copiedUrl, setCopiedUrl] = useState(false)
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)

  useEffect(() => {
    fetch('/api/site-client').then(r => r.ok ? r.json() : null).then(data => {
      if (data?.role === 'super_admin') setIsSuperAdmin(true)
      if (data?.site?.contenu && Object.keys(data.site.contenu).length > 0) {
        // Merge avec valeurs par défaut pour les champs manquants
        setContenu({
          ...DEFAULT_CONTENU,
          ...data.site.contenu,
          hero: { ...DEFAULT_CONTENU.hero, ...data.site.contenu.hero },
          a_propos: { ...DEFAULT_CONTENU.a_propos, ...data.site.contenu.a_propos },
          contact: { ...DEFAULT_CONTENU.contact, ...data.site.contenu.contact },
          config: { ...DEFAULT_CONTENU.config, ...data.site.contenu.config },
          services: data.site.contenu.services || DEFAULT_CONTENU.services,
          temoignages: data.site.contenu.temoignages || DEFAULT_CONTENU.temoignages,
        })
      }
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  async function handleSave() {
    setSaving(true)
    setSaved(false)
    setErreur('')
    try {
      const res = await fetch('/api/site-client', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contenu,
          url: contenu.config.slug ? `/site/${contenu.config.slug}` : null,
          statut: contenu.config.publie ? 'en_ligne' : 'en_creation',
        }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (e: any) {
      setErreur(e.message || 'Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  function update<K extends keyof SiteContenu>(section: K, val: Partial<SiteContenu[K]>) {
    setContenu(prev => ({
      ...prev,
      [section]: typeof prev[section] === 'object' && !Array.isArray(prev[section])
        ? { ...(prev[section] as object), ...val }
        : val,
    }))
  }

  // Services
  function addService() {
    const id = Date.now().toString()
    setContenu(prev => ({
      ...prev,
      services: [...prev.services, { id, titre: 'Nouveau service', description: '', icon: '⭐', prix: '' }],
    }))
  }
  function updateService(id: string, field: keyof Service, val: string) {
    setContenu(prev => ({
      ...prev,
      services: prev.services.map(s => s.id === id ? { ...s, [field]: val } : s),
    }))
  }
  function deleteService(id: string) {
    setContenu(prev => ({ ...prev, services: prev.services.filter(s => s.id !== id) }))
  }

  // Témoignages
  function addTemoignage() {
    const id = Date.now().toString()
    setContenu(prev => ({
      ...prev,
      temoignages: [...prev.temoignages, { id, nom: 'Prénom Nom', poste: 'Poste, Entreprise', texte: 'Excellent travail !', note: 5 }],
    }))
  }
  function updateTemoignage(id: string, field: keyof Temoignage, val: string | number) {
    setContenu(prev => ({
      ...prev,
      temoignages: prev.temoignages.map(t => t.id === id ? { ...t, [field]: val } : t),
    }))
  }
  function deleteTemoignage(id: string) {
    setContenu(prev => ({ ...prev, temoignages: prev.temoignages.filter(t => t.id !== id) }))
  }

  const siteUrl = contenu.config.slug ? `/site/${contenu.config.slug}` : null
  const fullUrl = typeof window !== 'undefined' && siteUrl ? `${window.location.origin}${siteUrl}` : siteUrl

  async function copyUrl() {
    if (!fullUrl) return
    try {
      await navigator.clipboard.writeText(fullUrl)
      setCopiedUrl(true)
      setTimeout(() => setCopiedUrl(false), 2000)
    } catch { /* ignore */ }
  }

  const TABS = [
    { id: 'general', label: 'Général', icon: Type },
    { id: 'services', label: 'Services', icon: Package },
    { id: 'temoignages', label: 'Témoignages', icon: Star },
    { id: 'contact', label: 'Contact', icon: Phone },
  ] as const

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-5 page-enter">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Globe className="w-6 h-6 text-blue-500" />
            Mon Site Web
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
            {isSuperAdmin
              ? 'Éditez votre site vitrine HTML — cliquez sur "Voir ma vitrine" pour prévisualiser'
              : 'Éditez le contenu de votre site vitrine, publié à l\'URL de votre choix'}
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {/* Bouton vitrine pour le super_admin (test du système) */}
          {isSuperAdmin && (
            <a
              href="/vitrine/index.html"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-cyan-50 dark:bg-cyan-900/20 border border-cyan-200 dark:border-cyan-700 text-cyan-700 dark:text-cyan-400 rounded-lg px-3 py-2 text-xs font-semibold hover:bg-cyan-100 dark:hover:bg-cyan-900/30 transition-colors"
            >
              <Globe className="w-3.5 h-3.5" />
              Voir ma vitrine
              <ExternalLink className="w-3 h-3 opacity-60" />
            </a>
          )}
          {siteUrl && !isSuperAdmin && (
            <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2">
              <Globe className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-xs text-slate-600 dark:text-slate-400 font-mono">{siteUrl}</span>
              <button onClick={copyUrl} className="text-slate-400 hover:text-blue-500 transition-colors">
                {copiedUrl ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
              <a href={siteUrl} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-blue-500 transition-colors">
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            {saving ? 'Sauvegarde…' : saved ? 'Sauvegardé !' : 'Sauvegarder'}
          </button>
        </div>
      </div>

      {erreur && (
        <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700 dark:text-red-300">{erreur}</p>
        </div>
      )}

      {/* Config rapide */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-xl p-5 text-white space-y-4">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Configuration du site</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Field
            label="Nom du site"
            value={contenu.config.nom_site}
            onChange={v => update('config', { nom_site: v })}
            placeholder="Mon Entreprise"
          />
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
              URL du site
            </label>
            <div className="flex items-center gap-0">
              <span className="text-xs text-slate-500 bg-slate-700 border border-r-0 border-slate-600 rounded-l-lg px-3 py-2 whitespace-nowrap">/site/</span>
              <input
                type="text"
                value={contenu.config.slug}
                onChange={e => update('config', { slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/--+/g, '-') })}
                placeholder="mon-entreprise"
                className="flex-1 text-sm border border-slate-600 rounded-r-lg px-3 py-2 bg-slate-900 text-white placeholder-slate-500 focus:outline-none focus:border-blue-400 transition-colors"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Couleur principale</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={contenu.config.couleur}
                onChange={e => update('config', { couleur: e.target.value })}
                className="w-10 h-10 rounded-lg border-0 cursor-pointer bg-transparent"
              />
              <span className="text-sm font-mono text-slate-300">{contenu.config.couleur}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 pt-1">
          <label className="flex items-center gap-2 cursor-pointer">
            <div
              onClick={() => update('config', { publie: !contenu.config.publie })}
              className={`w-10 h-6 rounded-full transition-colors relative cursor-pointer ${contenu.config.publie ? 'bg-green-500' : 'bg-slate-600'}`}
            >
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${contenu.config.publie ? 'translate-x-5' : 'translate-x-1'}`} />
            </div>
            <span className={`text-sm font-semibold ${contenu.config.publie ? 'text-green-400' : 'text-slate-400'}`}>
              {contenu.config.publie ? '🟢 Site publié' : '⚪ Brouillon (non visible)'}
            </span>
          </label>
          {siteUrl && contenu.config.publie && (
            <a href={siteUrl} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 border border-blue-800 px-3 py-1.5 rounded-lg transition-colors">
              <Eye className="w-3.5 h-3.5" />
              Voir le site en direct
            </a>
          )}
        </div>
      </div>

      {/* Onglets */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="flex border-b border-slate-100 dark:border-slate-700 overflow-x-auto">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium whitespace-nowrap transition-colors border-b-2 ${
                tab === t.id
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50'
              }`}
            >
              <t.icon className="w-4 h-4" />
              {t.label}
            </button>
          ))}
        </div>

        <div className="p-6 space-y-5">
          {/* ── Onglet Général ── */}
          {tab === 'general' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 mb-4">
                  <Type className="w-4 h-4 text-blue-500" />
                  Section Hero (en-tête principale)
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Titre principal" value={contenu.hero.titre} onChange={v => update('hero', { titre: v })} placeholder="Votre titre accrocheur" />
                  <Field label="Sous-titre" value={contenu.hero.sous_titre} onChange={v => update('hero', { sous_titre: v })} placeholder="Description courte de votre activité" />
                  <Field label="Texte du bouton CTA" value={contenu.hero.cta_label} onChange={v => update('hero', { cta_label: v })} placeholder="Nous contacter" />
                  <Field label="Lien du bouton CTA" value={contenu.hero.cta_href} onChange={v => update('hero', { cta_href: v })} placeholder="#contact ou https://..." />
                  <div className="sm:col-span-2">
                    <Field label="URL image hero (optionnelle)" value={contenu.hero.image_url} onChange={v => update('hero', { image_url: v })} placeholder="https://images.unsplash.com/..." />
                    {contenu.hero.image_url && (
                      <img src={contenu.hero.image_url} alt="Hero preview" className="mt-2 w-full h-32 object-cover rounded-lg border border-slate-200 dark:border-slate-600" onError={e => (e.currentTarget.style.display = 'none')} />
                    )}
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-100 dark:border-slate-700 pt-5">
                <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 mb-4">
                  <ImageIcon className="w-4 h-4 text-purple-500" />
                  Section À propos
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Titre" value={contenu.a_propos.titre} onChange={v => update('a_propos', { titre: v })} placeholder="Qui sommes-nous ?" />
                  <Field label="URL image (optionnelle)" value={contenu.a_propos.image_url} onChange={v => update('a_propos', { image_url: v })} placeholder="https://..." />
                  <div className="sm:col-span-2">
                    <Field label="Texte de présentation" value={contenu.a_propos.texte} onChange={v => update('a_propos', { texte: v })} multiline placeholder="Décrivez votre entreprise..." />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Onglet Services ── */}
          {tab === 'services' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {contenu.services.length} service{contenu.services.length !== 1 ? 's' : ''} configuré{contenu.services.length !== 1 ? 's' : ''}
                </p>
                <button
                  onClick={addService}
                  className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Ajouter un service
                </button>
              </div>

              {contenu.services.map((service, idx) => (
                <div key={service.id} className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4 border border-slate-200 dark:border-slate-600 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Service {idx + 1}</span>
                    <button onClick={() => deleteService(service.id)} className="text-slate-300 hover:text-red-400 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Field label="Titre" value={service.titre} onChange={v => updateService(service.id, 'titre', v)} placeholder="Nom du service" />
                    <Field label="Icône (emoji)" value={service.icon} onChange={v => updateService(service.id, 'icon', v)} placeholder="🌐" />
                    <Field label="Prix / tarif" value={service.prix} onChange={v => updateService(service.id, 'prix', v)} placeholder="À partir de 800€" />
                    <div className="sm:col-span-2 sm:col-start-1 col-span-1">
                      <Field label="Description" value={service.description} onChange={v => updateService(service.id, 'description', v)} placeholder="Description courte du service" multiline />
                    </div>
                  </div>
                </div>
              ))}

              {contenu.services.length === 0 && (
                <div className="text-center py-10 text-slate-400 dark:text-slate-500">
                  <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Aucun service — cliquez sur "Ajouter un service"</p>
                </div>
              )}
            </div>
          )}

          {/* ── Onglet Témoignages ── */}
          {tab === 'temoignages' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {contenu.temoignages.length} témoignage{contenu.temoignages.length !== 1 ? 's' : ''}
                </p>
                <button
                  onClick={addTemoignage}
                  className="flex items-center gap-2 bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Ajouter un témoignage
                </button>
              </div>

              {contenu.temoignages.map((t, idx) => (
                <div key={t.id} className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4 border border-slate-200 dark:border-slate-600 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Témoignage {idx + 1}</span>
                    <button onClick={() => deleteTemoignage(t.id)} className="text-slate-300 hover:text-red-400 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Field label="Nom" value={t.nom} onChange={v => updateTemoignage(t.id, 'nom', v)} placeholder="Prénom Nom" />
                    <Field label="Poste / Entreprise" value={t.poste} onChange={v => updateTemoignage(t.id, 'poste', v)} placeholder="CEO, Entreprise XYZ" />
                    <div className="sm:col-span-2">
                      <Field label="Témoignage" value={t.texte} onChange={v => updateTemoignage(t.id, 'texte', v)} multiline placeholder="Ce que dit votre client..." />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Note (1-5 ⭐)</label>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map(n => (
                          <button
                            key={n}
                            onClick={() => updateTemoignage(t.id, 'note', n)}
                            className={`text-lg transition-transform hover:scale-110 ${n <= t.note ? 'text-amber-400' : 'text-slate-300 dark:text-slate-600'}`}
                          >
                            ★
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {contenu.temoignages.length === 0 && (
                <div className="text-center py-10 text-slate-400 dark:text-slate-500">
                  <Star className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Aucun témoignage — cliquez sur "Ajouter un témoignage"</p>
                </div>
              )}
            </div>
          )}

          {/* ── Onglet Contact ── */}
          {tab === 'contact' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Email de contact" value={contenu.contact.email} onChange={v => update('contact', { email: v })} placeholder="contact@monentreprise.fr" />
                <Field label="Téléphone" value={contenu.contact.telephone} onChange={v => update('contact', { telephone: v })} placeholder="01 23 45 67 89" />
                <div className="sm:col-span-2">
                  <Field label="Adresse" value={contenu.contact.adresse} onChange={v => update('contact', { adresse: v })} placeholder="Paris, France" />
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>Formulaire de contact :</strong> un formulaire email est automatiquement ajouté à votre site.
                  Les messages seront envoyés à l'adresse email configurée ci-dessus.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bouton sauvegarder bas de page */}
      <div className="flex items-center justify-between bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 px-5 py-4">
        <div className="text-sm text-slate-500 dark:text-slate-400">
          {isSuperAdmin
            ? <span>Vitrine accessible à <span className="font-mono text-cyan-600 dark:text-cyan-400">/vitrine/index.html</span></span>
            : siteUrl
              ? <span>Site accessible à <span className="font-mono text-blue-600 dark:text-blue-400">{siteUrl}</span></span>
              : <span>Définissez un slug dans Configuration pour obtenir votre URL</span>
          }
        </div>
        <div className="flex gap-3">
          {isSuperAdmin ? (
            <a href="/vitrine/index.html" target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 border border-cyan-300 dark:border-cyan-700 text-cyan-700 dark:text-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-900/20 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
              <Eye className="w-4 h-4" />
              Voir la vitrine
            </a>
          ) : siteUrl && (
            <a href={siteUrl} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
              <Eye className="w-4 h-4" />
              Prévisualiser
            </a>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-5 py-2 rounded-lg text-sm font-semibold transition-colors"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Sauvegarde…' : 'Sauvegarder les modifications'}
          </button>
        </div>
      </div>
    </div>
  )
}
