'use client'

import { useState } from 'react'
import { Settings, History, AlertTriangle, SlidersHorizontal, Package } from 'lucide-react'
import { formatFCFA, formatDateTime } from '@/lib/utils'
import { StockAdjustmentDialog } from '@/components/modules/products/stock-adjustment-dialog'
import { StockHistoryDialog } from '@/components/modules/products/stock-history-dialog'
import { ThresholdDialog } from '@/components/modules/products/threshold-dialog'
import type { Product, Stock, ProductCategory } from '@/types'

interface ProductWithStock extends Product {
  product_categories?: ProductCategory
  stock?: Stock[]
}

interface StockTableProps {
  products: ProductWithStock[]
  entityId: string
  onRefresh: () => void
}

function getStatus(s?: Stock[]) {
  const st = s?.[0]
  if (!st) return 'unknown'
  if (st.quantity <= 0) return 'rupture'
  if (st.quantity <= st.min_threshold) return 'bas'
  return 'ok'
}

const statusCfg = {
  ok:      { label: 'OK',        cls: 'bg-forest-50 text-forest-700' },
  bas:     { label: 'Seuil bas', cls: 'bg-gold-50 text-gold-700' },
  rupture: { label: 'Rupture',   cls: 'bg-red-50 text-red-700' },
  unknown: { label: '—',         cls: 'bg-cream-200 text-bark-400' },
}

export function StockTable({ products, entityId, onRefresh }: StockTableProps) {
  const [adjustProduct, setAdjustProduct] = useState<ProductWithStock | null>(null)
  const [historyProduct, setHistoryProduct] = useState<ProductWithStock | null>(null)
  const [thresholdProduct, setThresholdProduct] = useState<ProductWithStock | null>(null)
  const [search, setSearch] = useState('')

  const alertCount = products.filter((p) => ['rupture','bas'].includes(getStatus(p.stock))).length
  const filtered = products.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()))

  return (
    <>
      {alertCount > 0 && (
        <div className="flex items-center gap-2 rounded-sm border border-gold-200 bg-gold-50 px-4 py-3 text-sm text-gold-800 mb-4">
          <AlertTriangle className="h-4 w-4 shrink-0 text-gold-600" />
          <span><strong>{alertCount} produit{alertCount > 1 ? 's' : ''}</strong> en alerte de stock (rupture ou seuil bas)</span>
        </div>
      )}

      <div className="mb-3">
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher un produit..."
          className="h-9 w-full max-w-xs rounded-sm border border-cream-400 px-3 text-sm focus:border-forest-500 focus:outline-none" />
      </div>

      {/* Desktop table */}
      <div className="hidden md:block rounded-sm border border-cream-400 bg-white shadow-botanical overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-cream-300 bg-forest-50">
              {['Produit','Catégorie','Unité','Achat','Vente','Qté','Seuil min','Statut','Modifié','Actions'].map((h) => (
                <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-forest-600 uppercase tracking-wide whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-cream-200">
            {filtered.map((p, i) => {
              const st = p.stock?.[0]
              const status = getStatus(p.stock)
              const cfg = statusCfg[status]
              return (
                <tr key={p.id} className={`hover:bg-cream-50 transition-colors ${i % 2 === 0 ? 'bg-white' : 'bg-cream-50/30'}`}>
                  <td className="px-4 py-2.5 font-medium text-forest-900">{p.name}</td>
                  <td className="px-4 py-2.5 text-xs text-bark-500">{p.product_categories?.name ?? '—'}</td>
                  <td className="px-4 py-2.5 text-xs text-bark-500">{p.unit}</td>
                  <td className="px-4 py-2.5 text-xs whitespace-nowrap">{formatFCFA(p.price_buy)}</td>
                  <td className="px-4 py-2.5 text-xs font-semibold whitespace-nowrap">{formatFCFA(p.price_sell)}</td>
                  <td className={`px-4 py-2.5 text-sm font-bold ${status === 'rupture' ? 'text-red-600' : status === 'bas' ? 'text-gold-600' : 'text-forest-700'}`}>
                    {st?.quantity ?? 0}
                  </td>
                  <td className="px-4 py-2.5 text-xs text-bark-400">{st?.min_threshold ?? '—'}</td>
                  <td className="px-4 py-2.5">
                    <span className={`inline-flex rounded-sm px-1.5 py-0.5 text-xs font-medium ${cfg.cls}`}>{cfg.label}</span>
                  </td>
                  <td className="px-4 py-2.5 text-xs text-bark-400 whitespace-nowrap">
                    {st?.updated_at ? formatDateTime(st.updated_at) : '—'}
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-1">
                      <button onClick={() => setAdjustProduct(p)} title="Ajuster le stock"
                        className="rounded-sm border border-cream-400 p-1.5 text-bark-500 hover:bg-cream-100 hover:text-forest-700 transition-colors">
                        <Settings className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => setHistoryProduct(p)} title="Historique"
                        className="rounded-sm border border-cream-400 p-1.5 text-bark-500 hover:bg-cream-100 hover:text-forest-700 transition-colors">
                        <History className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => setThresholdProduct(p)} title="Seuil d'alerte"
                        className="rounded-sm border border-cream-400 p-1.5 text-bark-500 hover:bg-cream-100 hover:text-forest-700 transition-colors">
                        <SlidersHorizontal className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={10} className="px-4 py-10 text-center text-sm text-bark-400">Aucun produit trouvé</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {filtered.map((p) => {
          const st = p.stock?.[0]
          const status = getStatus(p.stock)
          const cfg = statusCfg[status]
          return (
            <div key={p.id} className="rounded-sm border border-cream-400 bg-white p-4 shadow-botanical">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-medium text-forest-900">{p.name}</p>
                  <p className="text-xs text-bark-400">{p.product_categories?.name ?? '—'} · {p.unit}</p>
                </div>
                <span className={`inline-flex rounded-sm px-1.5 py-0.5 text-xs font-medium ${cfg.cls}`}>{cfg.label}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 mb-3 text-center">
                <div className="rounded-sm bg-cream-100 px-2 py-1.5">
                  <p className="text-xs text-bark-500 mb-0.5">Achat</p>
                  <p className="text-xs font-semibold text-forest-800">{formatFCFA(p.price_buy)}</p>
                </div>
                <div className="rounded-sm bg-cream-100 px-2 py-1.5">
                  <p className="text-xs text-bark-500 mb-0.5">Vente</p>
                  <p className="text-xs font-semibold text-forest-800">{formatFCFA(p.price_sell)}</p>
                </div>
                <div className={`rounded-sm px-2 py-1.5 ${status === 'rupture' ? 'bg-red-50' : status === 'bas' ? 'bg-gold-50' : 'bg-forest-50'}`}>
                  <p className="text-xs text-bark-500 mb-0.5">Stock</p>
                  <p className={`text-sm font-bold ${status === 'rupture' ? 'text-red-600' : status === 'bas' ? 'text-gold-600' : 'text-forest-700'}`}>{st?.quantity ?? 0}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setAdjustProduct(p)} className="flex-1 flex items-center justify-center gap-1 rounded-sm border border-cream-400 py-1.5 text-xs text-bark-600 hover:bg-cream-100">
                  <Settings className="h-3 w-3" /> Ajuster
                </button>
                <button onClick={() => setHistoryProduct(p)} className="flex-1 flex items-center justify-center gap-1 rounded-sm border border-cream-400 py-1.5 text-xs text-bark-600 hover:bg-cream-100">
                  <History className="h-3 w-3" /> Historique
                </button>
                <button onClick={() => setThresholdProduct(p)} className="flex-1 flex items-center justify-center gap-1 rounded-sm border border-cream-400 py-1.5 text-xs text-bark-600 hover:bg-cream-100">
                  <SlidersHorizontal className="h-3 w-3" /> Seuil
                </button>
              </div>
            </div>
          )
        })}
        {filtered.length === 0 && (
          <div className="flex flex-col items-center py-12 text-bark-400">
            <Package className="h-8 w-8 mb-2 opacity-40" />
            <p className="text-sm">Aucun produit</p>
          </div>
        )}
      </div>

      {adjustProduct && <StockAdjustmentDialog product={adjustProduct} entityId={entityId} onClose={() => setAdjustProduct(null)} onDone={() => { setAdjustProduct(null); onRefresh() }} />}
      {historyProduct && <StockHistoryDialog product={historyProduct} entityId={entityId} onClose={() => setHistoryProduct(null)} />}
      {thresholdProduct && <ThresholdDialog product={thresholdProduct} entityId={entityId} onClose={() => setThresholdProduct(null)} onDone={() => { setThresholdProduct(null); onRefresh() }} />}
    </>
  )
}
