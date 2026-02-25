'use client'

import { useState, useMemo } from 'react'
import { Search, Plus, Trash2, X } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { ToastContainer } from '@/components/ui/toast-container'
import type { Product } from '@/types'

interface NewOrderFormProps {
  products: Product[]
  entityId: string
  userId: string
  onSuccess: () => void
  onClose: () => void
}

interface OrderLine { product: Product; qty: number }

function addBusinessDays(days: number): string {
  const d = new Date()
  let added = 0
  while (added < days) {
    d.setDate(d.getDate() + 1)
    if (d.getDay() !== 0 && d.getDay() !== 6) added++
  }
  return d.toISOString().split('T')[0]
}

export function NewOrderForm({ products, entityId, userId, onSuccess, onClose }: NewOrderFormProps) {
  const [search, setSearch] = useState('')
  const [lines, setLines] = useState<OrderLine[]>([])
  const [deliveryDate, setDeliveryDate] = useState(addBusinessDays(2))
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)
  const toast = useToast()

  const minDate = addBusinessDays(2)

  const filtered = useMemo(() => {
    if (!search.trim()) return []
    return products.filter((p) => p.active && p.name.toLowerCase().includes(search.toLowerCase())).slice(0, 8)
  }, [search, products])

  const addLine = (p: Product) => {
    setLines((prev) => {
      const ex = prev.find((l) => l.product.id === p.id)
      if (ex) return prev.map((l) => l.product.id === p.id ? { ...l, qty: l.qty + 1 } : l)
      return [...prev, { product: p, qty: 1 }]
    })
    setSearch('')
  }

  const submit = async () => {
    if (lines.length === 0) { toast.error('Ajoutez au moins un produit'); return }
    if (deliveryDate < minDate) { toast.error(`Date minimum : ${minDate}`); return }
    setLoading(true)
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        entity_id: entityId,
        user_id: userId,
        type: 'MANUAL',
        status: 'pending_validation',
        delivery_date_requested: deliveryDate,
        comment,
        lines: lines.map((l) => ({
          product_id: l.product.id,
          product_name_snapshot: l.product.name,
          quantity_ordered: l.qty,
          quantity_delivered: 0,
        })),
      }),
    })
    if (res.ok) {
      toast.success('Commande créée')
      onSuccess()
      onClose()
    } else {
      toast.error('Erreur création commande')
    }
    setLoading(false)
  }

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
        <div className="w-full max-w-lg max-h-[90vh] flex flex-col rounded-sm border border-gray-200 bg-white shadow-md">
          <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4 flex-shrink-0">
            <h2 className="text-sm font-semibold text-gray-900">Nouvelle commande</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
          </div>

          <div className="overflow-y-auto flex-1 p-5 space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-700">Date de livraison souhaitée</label>
              <input type="date" min={minDate} value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)}
                className="h-9 w-full rounded-sm border border-gray-200 px-3 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500" />
            </div>

            <div className="relative">
              <label className="mb-1.5 block text-xs font-medium text-gray-700">Ajouter des produits</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input value={search} onChange={(e) => setSearch(e.target.value)}
                  placeholder="Rechercher..."
                  className="h-9 w-full rounded-sm border border-gray-200 bg-white pl-9 pr-3 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500" />
              </div>
              {filtered.length > 0 && (
                <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-sm shadow-md">
                  {filtered.map((p) => (
                    <button key={p.id} onClick={() => addLine(p)}
                      className="flex w-full items-center justify-between px-4 py-2 text-sm hover:bg-violet-50">
                      <span className="text-gray-900">{p.name}</span>
                      <Plus className="h-4 w-4 text-violet-600" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {lines.length > 0 && (
              <div className="rounded-sm border border-gray-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50">
                      {['Produit', 'Quantité', ''].map((h) => (
                        <th key={h} className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {lines.map((l) => (
                      <tr key={l.product.id}>
                        <td className="px-3 py-2 text-gray-900">{l.product.name}</td>
                        <td className="px-3 py-2">
                          <input type="number" min="1" value={l.qty}
                            onChange={(e) => setLines((prev) => prev.map((x) => x.product.id === l.product.id ? { ...x, qty: parseInt(e.target.value) || 1 } : x))}
                            className="h-7 w-20 rounded-sm border border-gray-200 px-2 text-sm focus:border-violet-500 focus:outline-none" />
                        </td>
                        <td className="px-3 py-2">
                          <button onClick={() => setLines((p) => p.filter((x) => x.product.id !== l.product.id))}
                            className="text-gray-300 hover:text-red-500">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-700">Commentaire (optionnel)</label>
              <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={2}
                className="w-full rounded-sm border border-gray-200 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none resize-none" />
            </div>
          </div>

          <div className="flex gap-2 border-t border-gray-200 p-4 flex-shrink-0">
            <button onClick={onClose} className="flex-1 h-9 rounded-sm border border-gray-200 text-sm text-gray-600 hover:bg-gray-50">Annuler</button>
            <button onClick={submit} disabled={loading}
              className="flex-1 h-9 rounded-sm bg-violet-600 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-60 transition-colors">
              {loading ? 'Création...' : 'Créer la commande'}
            </button>
          </div>
        </div>
      </div>
      <ToastContainer />
    </>
  )
}
