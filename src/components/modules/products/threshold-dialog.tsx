'use client'

import { useState, useEffect } from 'react'
import { X, Settings, AlertTriangle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { ToastContainer } from '@/components/ui/toast-container'
import type { Product } from '@/types'

interface ThresholdDialogProps {
  product: Product
  entityId: string
  onClose: () => void
  onSuccess: () => void
}

interface ThresholdData {
  min_stock: number
  reorder_qty: number
  auto_order: boolean
  manual_validation_required: boolean
  active: boolean
}

export function ThresholdDialog({ product, entityId, onClose, onSuccess }: ThresholdDialogProps) {
  const [data, setData] = useState<ThresholdData>({
    min_stock: 0,
    reorder_qty: 0,
    auto_order: false,
    manual_validation_required: true,
    active: true,
  })
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const toast = useToast()

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data: existing } = await supabase
        .from('stock_thresholds')
        .select('*')
        .eq('product_id', product.id)
        .eq('entity_id', entityId)
        .single()
      if (existing) {
        setData({
          min_stock: existing.min_stock,
          reorder_qty: existing.reorder_qty,
          auto_order: existing.auto_order,
          manual_validation_required: existing.manual_validation_required,
          active: existing.active,
        })
      }
      setFetching(false)
    }
    load()
  }, [product.id, entityId])

  const handleSave = async () => {
    setLoading(true)
    const supabase = createClient()
    const payload = { ...data, product_id: product.id, entity_id: entityId }

    const { data: existing } = await supabase
      .from('stock_thresholds')
      .select('id')
      .eq('product_id', product.id)
      .eq('entity_id', entityId)
      .single()

    const { error } = existing
      ? await supabase.from('stock_thresholds').update(data).eq('id', existing.id)
      : await supabase.from('stock_thresholds').insert(payload)

    if (error) {
      toast.error('Erreur lors de la sauvegarde')
    } else {
      toast.success('Seuil configuré')
      onSuccess()
      onClose()
    }
    setLoading(false)
  }

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
        <div className="w-full max-w-md rounded-sm border border-gray-200 bg-white shadow-md">
          <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
            <div className="flex items-center gap-2">
              <Settings className="h-4 w-4 text-gray-500" />
              <div>
                <h2 className="text-sm font-semibold text-gray-900">Seuil d'alerte</h2>
                <p className="text-xs text-gray-500 mt-0.5">{product.name}</p>
              </div>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="h-5 w-5" />
            </button>
          </div>

          {fetching ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-200 border-t-violet-600" />
            </div>
          ) : (
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-700">
                    Stock minimum ({product.unit})
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.001"
                    value={data.min_stock}
                    onChange={(e) => setData((d) => ({ ...d, min_stock: parseFloat(e.target.value) || 0 }))}
                    className="h-9 w-full rounded-sm border border-gray-200 px-3 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-700">
                    Quantité à commander
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.001"
                    value={data.reorder_qty}
                    onChange={(e) => setData((d) => ({ ...d, reorder_qty: parseFloat(e.target.value) || 0 }))}
                    className="h-9 w-full rounded-sm border border-gray-200 px-3 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                  />
                </div>
              </div>

              <div className="space-y-3 rounded-sm border border-gray-200 p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-medium text-gray-700">Commande automatique</div>
                    <div className="text-xs text-gray-500 mt-0.5">Créer une commande quand le stock atteint le seuil</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setData((d) => ({ ...d, auto_order: !d.auto_order }))}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${data.auto_order ? 'bg-violet-600' : 'bg-gray-200'}`}
                  >
                    <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${data.auto_order ? 'translate-x-4' : 'translate-x-0.5'}`} />
                  </button>
                </div>

                {data.auto_order && (
                  <div className="flex items-center justify-between border-t border-gray-100 pt-3">
                    <div>
                      <div className="text-xs font-medium text-gray-700">Validation manuelle requise</div>
                      <div className="text-xs text-gray-500 mt-0.5">L'admin doit valider avant envoi</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setData((d) => ({ ...d, manual_validation_required: !d.manual_validation_required }))}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${data.manual_validation_required ? 'bg-violet-600' : 'bg-gray-200'}`}
                    >
                      <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${data.manual_validation_required ? 'translate-x-4' : 'translate-x-0.5'}`} />
                    </button>
                  </div>
                )}

                <div className="flex items-center justify-between border-t border-gray-100 pt-3">
                  <div>
                    <div className="text-xs font-medium text-gray-700">Seuil actif</div>
                    <div className="text-xs text-gray-500 mt-0.5">Activer la surveillance du stock</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setData((d) => ({ ...d, active: !d.active }))}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${data.active ? 'bg-violet-600' : 'bg-gray-200'}`}
                  >
                    <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${data.active ? 'translate-x-4' : 'translate-x-0.5'}`} />
                  </button>
                </div>
              </div>

              {data.auto_order && !data.manual_validation_required && (
                <div className="flex items-start gap-2 rounded-sm border border-amber-200 bg-amber-50 p-3 text-xs text-amber-700">
                  <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  Les commandes seront envoyées automatiquement sans validation. Assurez-vous que les quantités sont correctes.
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
                  onClick={handleSave}
                  disabled={loading}
                  className="flex-1 h-9 rounded-sm bg-violet-600 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-60 transition-colors"
                >
                  {loading ? 'Sauvegarde...' : 'Enregistrer'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      <ToastContainer />
    </>
  )
}
