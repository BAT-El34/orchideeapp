'use client'

import { useEffect, useState } from 'react'
import { X, TrendingUp, TrendingDown, RotateCcw } from 'lucide-react'
import { formatDateTime } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import type { StockMovement } from '@/types'

interface StockHistoryDialogProps {
  productId: string
  productName: string
  entityId: string
  onClose: () => void
}

const typeConfig = {
  IN: { label: 'Entrée', icon: TrendingUp, cls: 'text-green-600 bg-green-50' },
  OUT: { label: 'Sortie', icon: TrendingDown, cls: 'text-red-600 bg-red-50' },
  ADJUSTMENT: { label: 'Ajustement', icon: RotateCcw, cls: 'text-violet-600 bg-violet-50' },
}

export function StockHistoryDialog({ productId, productName, entityId, onClose }: StockHistoryDialogProps) {
  const [movements, setMovements] = useState<(StockMovement & { users?: { full_name: string } })[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from('stock_movements')
        .select('*, users(full_name)')
        .eq('product_id', productId)
        .eq('entity_id', entityId)
        .order('created_at', { ascending: false })
        .limit(50)
      setMovements((data as any) ?? [])
      setLoading(false)
    }
    load()
  }, [productId, entityId])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-2xl max-h-[80vh] flex flex-col rounded-sm border border-gray-200 bg-white shadow-md">
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4 flex-shrink-0">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Historique des mouvements</h2>
            <p className="text-xs text-gray-500 mt-0.5">{productName}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-200 border-t-violet-600" />
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-gray-50">
                <tr className="border-b border-gray-200">
                  {['Date', 'Type', 'Quantité', 'Référence', 'Utilisateur'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {movements.map((m) => {
                  const cfg = typeConfig[m.type]
                  const Icon = cfg.icon
                  return (
                    <tr key={m.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{formatDateTime(m.created_at)}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 rounded-sm px-2 py-0.5 text-xs font-medium ${cfg.cls}`}>
                          <Icon className="h-3 w-3" />
                          {cfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {m.type === 'IN' ? '+' : m.type === 'OUT' ? '-' : ''}{m.quantity}
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{m.reference ?? '—'}</td>
                      <td className="px-4 py-3 text-gray-600 text-xs">{m.users?.full_name ?? '—'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
          {!loading && movements.length === 0 && (
            <div className="py-12 text-center text-sm text-gray-400">Aucun mouvement enregistré</div>
          )}
        </div>
      </div>
    </div>
  )
}
