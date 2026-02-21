'use client'

import { useState } from 'react'
import { Trash2, Loader2, Check } from 'lucide-react'

export default function CleanupButton() {
  const [loading, setLoading] = useState(false)
  const [result,  setResult]  = useState<{ deleted: number } | null>(null)

  async function handleCleanup() {
    if (!confirm('Supprimer toutes les entreprises sans utilisateurs (orphelines) ?')) return
    setLoading(true)
    try {
      const res = await fetch('/api/admin/cleanup', { method: 'POST' })
      const d = await res.json()
      setResult(d)
      // Recharger la page après 2s pour afficher les vrais chiffres
      setTimeout(() => window.location.reload(), 2000)
    } catch {
      alert('Erreur lors du nettoyage')
    } finally {
      setLoading(false)
    }
  }

  if (result) return (
    <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">
      <Check className="w-4 h-4" />
      {result.deleted} entreprises orphelines supprimées — rechargement...
    </div>
  )

  return (
    <button
      onClick={handleCleanup}
      disabled={loading}
      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-sm transition-all disabled:opacity-60"
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
      {loading ? 'Nettoyage...' : 'Nettoyer les comptes orphelins'}
    </button>
  )
}
