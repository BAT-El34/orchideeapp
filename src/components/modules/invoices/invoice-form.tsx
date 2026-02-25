'use client'

import { useState, useMemo, useCallback, useRef } from 'react'
import { Search, Plus, Minus, Trash2, CheckCircle, FileText, ChevronRight, ArrowLeft } from 'lucide-react'
import { formatFCFA } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import { useOfflineSync } from '@/hooks/use-offline-sync'
import { ToastContainer } from '@/components/ui/toast-container'
import type { Product } from '@/types'

interface CartLine {
  product: Product
  quantity: number
}

interface InvoiceFormProps {
  products: Product[]
  entityId: string
  userId: string
  role: string
}

export function InvoiceForm({ products, entityId, userId, role }: InvoiceFormProps) {
  const [step, setStep] = useState<1 | 2>(1)
  const [search, setSearch] = useState('')
  const [cart, setCart] = useState<CartLine[]>([])
  const [amountReceived, setAmountReceived] = useState('')
  const [loading, setLoading] = useState(false)
  const [savedDraft, setSavedDraft] = useState<string | null>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const toast = useToast()
  const { isOnline, addToQueue } = useOfflineSync()

  const canEditPrice = ['admin', 'super_admin', 'manager'].includes(role)

  const filtered = useMemo(() => {
    if (!search.trim()) return []
    const q = search.toLowerCase()
    return products.filter((p) => p.active && p.name.toLowerCase().includes(q)).slice(0, 8)
  }, [search, products])

  const addProduct = useCallback((product: Product) => {
    setCart((prev) => {
      const existing = prev.find((l) => l.product.id === product.id)
      if (existing) return prev.map((l) => l.product.id === product.id ? { ...l, quantity: l.quantity + 1 } : l)
      return [...prev, { product, quantity: 1 }]
    })
    setSearch('')
    searchRef.current?.focus()
  }, [])

  const updateQty = useCallback((productId: string, qty: number) => {
    if (qty <= 0) {
      setCart((prev) => prev.filter((l) => l.product.id !== productId))
    } else {
      setCart((prev) => prev.map((l) => l.product.id === productId ? { ...l, quantity: qty } : l))
    }
  }, [])

  const totals = useMemo(() => {
    const totalBuy = cart.reduce((s, l) => s + l.product.price_buy * l.quantity, 0)
    const totalSell = cart.reduce((s, l) => s + l.product.price_sell * l.quantity, 0)
    const margin = totalSell - totalBuy
    const marginPct = totalBuy > 0 ? ((margin / totalBuy) * 100).toFixed(1) : '0'
    return { totalBuy, totalSell, margin, marginPct }
  }, [cart])

  const change = amountReceived ? parseFloat(amountReceived) - totals.totalSell : null

  const buildInvoicePayload = (status: 'draft' | 'validated') => ({
    entity_id: entityId,
    user_id: userId,
    date: new Date().toISOString().split('T')[0],
    total_buy: totals.totalBuy,
    total_sell: totals.totalSell,
    margin: totals.margin,
    status,
    lines: cart.map((l) => ({
      product_id: l.product.id,
      product_name_snapshot: l.product.name,
      quantity: l.quantity,
      price_buy: l.product.price_buy,
      price_sell: l.product.price_sell,
      total_buy: l.product.price_buy * l.quantity,
      total_sell: l.product.price_sell * l.quantity,
    })),
  })

  const handleSave = async (status: 'draft' | 'validated') => {
    if (cart.length === 0) { toast.error('Ajoutez au moins un produit'); return }
    setLoading(true)
    const payload = buildInvoicePayload(status)

    if (!isOnline) {
      addToQueue({ table_name: 'invoices', operation: 'INSERT', payload })
      toast.warning(`Facture enregistrée localement (hors ligne)`)
      setLoading(false)
      if (status === 'validated') { setCart([]); setStep(1) }
      return
    }

    try {
      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      if (status === 'draft') {
        setSavedDraft(data.id)
        toast.success('Brouillon enregistré')
      } else {
        toast.success('Facture validée avec succès')
        setCart([])
        setStep(1)
        setSavedDraft(null)
      }
    } catch {
      toast.error('Erreur lors de l\'enregistrement')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="flex items-center gap-3">
          {step === 2 && (
            <button onClick={() => setStep(1)} className="p-1 text-gray-500 hover:text-gray-900">
              <ArrowLeft className="h-5 w-5" />
            </button>
          )}
          <div>
            <h1 className="font-heading text-xl font-bold text-gray-900">Nouvelle facture</h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Étape {step} / 2 — {step === 1 ? 'Sélection des produits' : 'Récapitulatif & validation'}
            </p>
          </div>
        </div>

        {step === 1 && (
          <>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                ref={searchRef}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher un produit à ajouter..."
                autoFocus
                className="h-11 w-full rounded-sm border border-gray-200 bg-white pl-9 pr-3 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
              />
              {filtered.length > 0 && (
                <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-sm shadow-md overflow-hidden">
                  {filtered.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => addProduct(p)}
                      className="flex items-center justify-between w-full px-4 py-2.5 text-sm hover:bg-violet-50 transition-colors text-left"
                    >
                      <span className="font-medium text-gray-900">{p.name}</span>
                      <span className="text-violet-600 font-semibold ml-4 whitespace-nowrap">{formatFCFA(p.price_sell)}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {cart.length > 0 && (
              <>
                <div className="rounded-sm border border-gray-200 bg-white shadow-sm overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 bg-gray-50">
                        {['Désignation', 'QTE', 'PA unit.', 'Total achat', 'PV unit.', 'Total vente', ''].map((h) => (
                          <th key={h} className="px-3 py-2.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide whitespace-nowrap">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {cart.map((line) => (
                        <tr key={line.product.id}>
                          <td className="px-3 py-2.5 font-medium text-gray-900 max-w-32 truncate">{line.product.name}</td>
                          <td className="px-3 py-2.5">
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => updateQty(line.product.id, line.quantity - 1)}
                                className="h-6 w-6 flex items-center justify-center rounded-sm border border-gray-200 text-gray-500 hover:bg-gray-50"
                              >
                                <Minus className="h-3 w-3" />
                              </button>
                              <input
                                type="number"
                                min="1"
                                value={line.quantity}
                                onChange={(e) => updateQty(line.product.id, parseFloat(e.target.value) || 0)}
                                className="h-6 w-12 rounded-sm border border-gray-200 text-center text-xs focus:border-violet-500 focus:outline-none"
                              />
                              <button
                                onClick={() => updateQty(line.product.id, line.quantity + 1)}
                                className="h-6 w-6 flex items-center justify-center rounded-sm border border-gray-200 text-gray-500 hover:bg-gray-50"
                              >
                                <Plus className="h-3 w-3" />
                              </button>
                            </div>
                          </td>
                          <td className="px-3 py-2.5 text-xs text-gray-500 whitespace-nowrap">{formatFCFA(line.product.price_buy)}</td>
                          <td className="px-3 py-2.5 text-xs text-gray-700 whitespace-nowrap">{formatFCFA(line.product.price_buy * line.quantity)}</td>
                          <td className="px-3 py-2.5 text-xs font-medium text-gray-900 whitespace-nowrap">{formatFCFA(line.product.price_sell)}</td>
                          <td className="px-3 py-2.5 text-xs font-semibold text-violet-700 whitespace-nowrap">{formatFCFA(line.product.price_sell * line.quantity)}</td>
                          <td className="px-3 py-2.5">
                            <button onClick={() => updateQty(line.product.id, 0)} className="text-gray-300 hover:text-red-500 transition-colors">
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex items-center justify-between rounded-sm border border-gray-200 bg-gray-50 px-4 py-3">
                  <span className="text-sm text-gray-600">{cart.length} article{cart.length > 1 ? 's' : ''}</span>
                  <div className="text-right">
                    <div className="text-xs text-gray-500">Total vente</div>
                    <div className="text-lg font-bold text-gray-900">{formatFCFA(totals.totalSell)}</div>
                  </div>
                </div>

                <button
                  onClick={() => setStep(2)}
                  className="flex w-full items-center justify-center gap-2 h-11 rounded-sm bg-violet-600 text-sm font-medium text-white hover:bg-violet-700 transition-colors"
                >
                  Récapitulatif et validation
                  <ChevronRight className="h-4 w-4" />
                </button>
              </>
            )}
          </>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="rounded-sm border border-gray-200 bg-white shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    {['Produit', 'QTE', 'Prix vente', 'Total'].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {cart.map((line) => (
                    <tr key={line.product.id}>
                      <td className="px-4 py-2.5 font-medium text-gray-900">{line.product.name}</td>
                      <td className="px-4 py-2.5 text-gray-600">{line.quantity}</td>
                      <td className="px-4 py-2.5 text-gray-700">{formatFCFA(line.product.price_sell)}</td>
                      <td className="px-4 py-2.5 font-semibold text-gray-900">{formatFCFA(line.product.price_sell * line.quantity)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="rounded-sm border border-gray-200 bg-white p-4 space-y-2.5 shadow-sm">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total achats</span>
                <span className="text-gray-700">{formatFCFA(totals.totalBuy)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total ventes</span>
                <span className="font-semibold text-gray-900">{formatFCFA(totals.totalSell)}</span>
              </div>
              <div className="flex justify-between text-sm border-t border-gray-100 pt-2">
                <span className="text-gray-600">Marge</span>
                <span className="font-semibold text-green-700">{formatFCFA(totals.margin)} ({totals.marginPct}%)</span>
              </div>
            </div>

            <div className="rounded-sm border border-gray-200 bg-white p-4 shadow-sm">
              <label className="mb-2 block text-xs font-medium text-gray-700">Montant reçu (FCFA)</label>
              <input
                type="number"
                min="0"
                value={amountReceived}
                onChange={(e) => setAmountReceived(e.target.value)}
                className="h-11 w-full rounded-sm border border-gray-200 px-3 text-lg font-semibold focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
              />
              {change !== null && (
                <div className={`mt-3 rounded-sm p-3 text-center ${change >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                  <div className="text-xs text-gray-500 mb-1">{change >= 0 ? 'Rendu monnaie' : 'Montant insuffisant'}</div>
                  <div className={`text-2xl font-bold ${change >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                    {change >= 0 ? '+' : ''}{formatFCFA(Math.abs(change))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => handleSave('draft')}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 h-10 rounded-sm border border-gray-200 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-60 transition-colors"
              >
                <FileText className="h-4 w-4" />
                Brouillon
              </button>
              <button
                onClick={() => handleSave('validated')}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 h-10 rounded-sm bg-violet-600 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-60 transition-colors"
              >
                <CheckCircle className="h-4 w-4" />
                {loading ? 'En cours...' : 'Valider'}
              </button>
            </div>
          </div>
        )}
      </div>
      <ToastContainer />
    </>
  )
}
