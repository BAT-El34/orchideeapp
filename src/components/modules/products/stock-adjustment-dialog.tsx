'use client'

import { useState } from 'react'
import { X, AlertTriangle } from 'lucide-react'
import { formatFCFA } from '@/lib/utils'
import type { Product, Stock } from '@/types'

interface StockAdjustmentDialogProps {
  product: Product & { stock?: Stock[] }
  entityId: string
  onClose: () => void
  onSuccess: () => void
}

export function StockAdjustmentDialog({ product, entityId, onClose, onSuccess }: StockAdjustmentDialogProps) {
  const [type, setType] = useState<'IN' | 'OUT' | 'ADJUSTMENT'>('ADJUSTMENT')
  const [quantity, setQuantity] = useState('')
  const [reference, setReference] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const currentStock = product.stock?.find((s) => s.entity_id === entityId)?.quantity ?? 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const qty = parseFloat(quantity)
    if (!qty || qty <= 0) { setError('Quantité invalide'); return }

    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/stock/adjust', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id: product.id, entity_id: entityId, type, quantity: qty, reference }),
      })
      if (!res.ok) throw new Error('Erreur serveur')
      onSuccess()
      onClose()
    } catch {
      setError('Échec de l\'ajustement. Vérifiez votre connexion.')
    } finally {
      setLoading(false)
    }
  }

  const preview = () => {
    const qty = parseFloat(quantity) || 0
    if (type === 'ADJUSTMENT') return qty
    if (type === 'IN') return currentStock + qty
    return Math.max(0, currentStock - qty)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-sm border border-gray-200 bg-white shadow-md">
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Ajustement de stock</h2>
            <p className="text-xs text-gray-500 mt-0.5">{product.name}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="flex items-center justify-between rounded-sm bg-gray-50 p-3 text-sm">
            <span className="text-gray-600">Stock actuel</span>
            <span className="font-semibold text-gray-900">{currentStock} {product.unit}</span>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-700">Type d'opération</label>
            <div className="flex gap-2">
              {([['IN', 'Entrée'], ['OUT', 'Sortie'], ['ADJUSTMENT', 'Ajustement']] as const).map(([val, lbl]) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setType(val)}
                  className={`flex-1 py-2 text-xs font-medium rounded-sm border transition-colors ${
                    type === val
                      ? val === 'IN' ? 'bg-green-600 border-green-600 text-white'
                        : val === 'OUT' ? 'bg-red-600 border-red-600 text-white'
                        : 'bg-violet-600 border-violet-600 text-white'
                      : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {lbl}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-700">
              {type === 'ADJUSTMENT' ? 'Nouveau stock' : 'Quantité'}
            </label>
            <input
              type="number"
              min="0"
              step="0.001"
              required
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="h-9 w-full rounded-sm border border-gray-200 px-3 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-700">Référence / motif</label>
            <input
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="Ex: BL-2024-001, Inventaire mensuel..."
              className="h-9 w-full rounded-sm border border-gray-200 px-3 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
            />
          </div>

          {quantity && (
            <div className="rounded-sm bg-blue-50 border border-blue-200 p-3 text-sm">
              <span className="text-blue-700">Stock après opération : </span>
              <span className="font-semibold text-blue-900">{preview()} {product.unit}</span>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 rounded-sm border border-red-200 bg-red-50 p-3 text-xs text-red-700">
              <AlertTriangle className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-9 rounded-sm border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 h-9 rounded-sm bg-violet-600 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-60 transition-colors"
            >
              {loading ? 'En cours...' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
