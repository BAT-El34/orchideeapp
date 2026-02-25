'use client'

import { useState, useMemo } from 'react'
import { Search, LayoutList, LayoutGrid, Package } from 'lucide-react'
import { formatFCFA, calcMarginPct } from '@/lib/utils'
import type { Product, ProductCategory, Stock } from '@/types'

interface ProductWithStock extends Product {
  product_categories?: ProductCategory
  stock?: Stock[]
}

interface ProductCatalogProps {
  products: ProductWithStock[]
  categories: ProductCategory[]
  entityId: string
}

function stockStatus(stock?: Stock[]) {
  if (!stock || stock.length === 0) return 'unknown'
  const s = stock[0]
  if (s.quantity <= 0) return 'rupture'
  if (s.quantity <= s.min_threshold) return 'bas'
  return 'ok'
}

const statusConfig = {
  ok: { label: 'En stock', cls: 'bg-green-50 text-green-700' },
  bas: { label: 'Seuil bas', cls: 'bg-amber-50 text-amber-700' },
  rupture: { label: 'Rupture', cls: 'bg-red-50 text-red-700' },
  unknown: { label: 'Non suivi', cls: 'bg-gray-100 text-gray-500' },
}

export function ProductCatalog({ products, categories, entityId }: ProductCatalogProps) {
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [view, setView] = useState<'list' | 'grid'>('list')

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchSearch =
        !search ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.product_categories?.name.toLowerCase().includes(search.toLowerCase())
      const matchCat = !categoryFilter || p.category_id === categoryFilter
      const status = stockStatus(p.stock)
      const matchStatus = !statusFilter || status === statusFilter
      return matchSearch && matchCat && matchStatus
    })
  }, [products, search, categoryFilter, statusFilter])

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un produit..."
            className="h-9 w-full rounded-sm border border-gray-200 bg-white pl-9 pr-3 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="h-9 rounded-sm border border-gray-200 bg-white px-3 text-sm text-gray-700 focus:border-violet-500 focus:outline-none"
        >
          <option value="">Toutes catégories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-9 rounded-sm border border-gray-200 bg-white px-3 text-sm text-gray-700 focus:border-violet-500 focus:outline-none"
        >
          <option value="">Tous les statuts</option>
          <option value="ok">En stock</option>
          <option value="bas">Seuil bas</option>
          <option value="rupture">Rupture</option>
        </select>
        <div className="flex rounded-sm border border-gray-200 overflow-hidden">
          <button
            onClick={() => setView('list')}
            className={`p-2 ${view === 'list' ? 'bg-violet-600 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
          >
            <LayoutList className="h-4 w-4" />
          </button>
          <button
            onClick={() => setView('grid')}
            className={`p-2 ${view === 'grid' ? 'bg-violet-600 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
        </div>
      </div>

      <p className="text-xs text-gray-500">{filtered.length} produit{filtered.length !== 1 ? 's' : ''}</p>

      {view === 'list' ? (
        <div className="rounded-sm border border-gray-200 bg-white shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                {['Produit', 'Catégorie', 'Unité', 'Prix achat', 'Prix vente', 'Marge', 'Stock', 'Statut'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((p) => {
                const status = stockStatus(p.stock)
                const cfg = statusConfig[status]
                const qty = p.stock?.[0]?.quantity ?? null
                return (
                  <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900">{p.name}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{p.product_categories?.name ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-500">{p.unit}</td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{formatFCFA(p.price_buy)}</td>
                    <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">{formatFCFA(p.price_sell)}</td>
                    <td className="px-4 py-3 text-green-700">{calcMarginPct(p.price_buy, p.price_sell)}</td>
                    <td className="px-4 py-3 text-gray-700">{qty !== null ? qty : '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-sm px-2 py-0.5 text-xs font-medium ${cfg.cls}`}>
                        {cfg.label}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <Package className="mb-2 h-6 w-6" />
              <p className="text-sm">Aucun produit</p>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
          {filtered.map((p) => {
            const status = stockStatus(p.stock)
            const cfg = statusConfig[status]
            const qty = p.stock?.[0]?.quantity ?? null
            return (
              <div key={p.id} className="rounded-sm border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-2">
                  <span className={`inline-flex rounded-sm px-1.5 py-0.5 text-xs font-medium ${cfg.cls}`}>
                    {cfg.label}
                  </span>
                  <span className="text-xs text-gray-400">{p.product_categories?.name}</span>
                </div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3 leading-tight">{p.name}</h3>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Vente</span>
                    <span className="font-semibold text-gray-900">{formatFCFA(p.price_sell)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Stock</span>
                    <span className="text-gray-700">{qty !== null ? `${qty} ${p.unit}` : '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Marge</span>
                    <span className="text-green-700">{calcMarginPct(p.price_buy, p.price_sell)}</span>
                  </div>
                </div>
              </div>
            )
          })}
          {filtered.length === 0 && (
            <div className="col-span-full flex flex-col items-center py-12 text-gray-400">
              <Package className="mb-2 h-6 w-6" />
              <p className="text-sm">Aucun produit</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
