'use client'

import { useState } from 'react'
import { ShoppingCart, ChevronRight } from 'lucide-react'
import { formatFCFA, formatDate } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import { ToastContainer } from '@/components/ui/toast-container'
import type { Order, UserRole } from '@/types'

const STATUS_CFG = {
  pending_validation: { label: 'En attente', cls: 'bg-amber-50 text-amber-700' },
  sent: { label: 'Envoyée', cls: 'bg-blue-50 text-blue-700' },
  in_preparation: { label: 'En préparation', cls: 'bg-violet-50 text-violet-700' },
  shipped: { label: 'Expédiée', cls: 'bg-indigo-50 text-indigo-700' },
  delivered: { label: 'Livrée', cls: 'bg-green-50 text-green-700' },
  cancelled: { label: 'Annulée', cls: 'bg-red-50 text-red-700' },
}

const NEXT_STATUS: Record<string, string> = {
  pending_validation: 'sent',
  sent: 'in_preparation',
  in_preparation: 'shipped',
  shipped: 'delivered',
}

const NEXT_LABELS: Record<string, string> = {
  pending_validation: 'Valider',
  sent: 'En préparation',
  in_preparation: 'Expédier',
  shipped: 'Livré',
}

interface OrdersTableProps {
  orders: (Order & { order_lines: any[]; users?: any })[]
  role: UserRole
}

export function OrdersTable({ orders: initial, role }: OrdersTableProps) {
  const [orders, setOrders] = useState(initial)
  const [filter, setFilter] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const toast = useToast()

  const canAdvance = ['admin', 'super_admin', 'manager'].includes(role)

  const filtered = orders.filter((o) => !filter || o.status === filter)

  const advance = async (orderId: string, currentStatus: string) => {
    const next = NEXT_STATUS[currentStatus]
    if (!next) return
    const res = await fetch(`/api/orders/${orderId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: next }),
    })
    if (res.ok) {
      setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, status: next as any } : o))
      toast.success('Statut mis à jour')
    } else {
      toast.error('Erreur mise à jour')
    }
  }

  const cancel = async (orderId: string) => {
    const res = await fetch(`/api/orders/${orderId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'cancelled' }),
    })
    if (res.ok) {
      setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, status: 'cancelled' } : o))
      toast.success('Commande annulée')
    }
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {(['', 'pending_validation', 'sent', 'in_preparation', 'shipped', 'delivered', 'cancelled'] as const).map((s) => {
            const cfg = s ? STATUS_CFG[s] : null
            return (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`rounded-sm px-3 py-1.5 text-xs font-medium border transition-colors ${filter === s ? 'bg-violet-600 border-violet-600 text-white' : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'}`}
              >
                {s ? cfg?.label : 'Toutes'}
              </button>
            )
          })}
        </div>

        <div className="rounded-sm border border-gray-200 bg-white shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                {['N°', 'Type', 'Statut', 'Date livraison', 'Lignes', 'Créée par', 'Actions'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((o) => {
                const cfg = STATUS_CFG[o.status]
                const isExpanded = expandedId === o.id
                return (
                  <>
                    <tr key={o.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-gray-500">{o.id.slice(0, 8)}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-sm px-1.5 py-0.5 text-xs font-medium ${o.type === 'AUTO' ? 'bg-purple-50 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>
                          {o.type === 'AUTO' ? 'Auto' : 'Manuel'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-sm px-2 py-0.5 text-xs font-medium ${cfg.cls}`}>{cfg.label}</span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{o.delivery_date_requested ? formatDate(o.delivery_date_requested) : '—'}</td>
                      <td className="px-4 py-3 text-gray-600">{o.order_lines?.length ?? 0} produit(s)</td>
                      <td className="px-4 py-3 text-xs text-gray-500">{o.users?.full_name ?? '—'}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => setExpandedId(isExpanded ? null : o.id)}
                            className="flex items-center gap-1 rounded-sm border border-gray-200 px-2 py-1 text-xs text-gray-600 hover:bg-gray-50">
                            <ChevronRight className={`h-3.5 w-3.5 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                            Détails
                          </button>
                          {canAdvance && NEXT_STATUS[o.status] && (
                            <button onClick={() => advance(o.id, o.status)}
                              className="rounded-sm border border-violet-200 bg-violet-50 px-2 py-1 text-xs text-violet-700 hover:bg-violet-100">
                              {NEXT_LABELS[o.status]}
                            </button>
                          )}
                          {canAdvance && o.status !== 'cancelled' && o.status !== 'delivered' && (
                            <button onClick={() => cancel(o.id)}
                              className="rounded-sm border border-red-200 bg-red-50 px-2 py-1 text-xs text-red-700 hover:bg-red-100">
                              Annuler
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr key={`${o.id}-expand`} className="bg-gray-50">
                        <td colSpan={7} className="px-6 py-3">
                          <div className="text-xs">
                            {o.comment && <p className="text-gray-600 mb-2 italic">"{o.comment}"</p>}
                            <table className="w-full max-w-lg">
                              <thead>
                                <tr className="text-gray-500">
                                  <th className="text-left pr-8 pb-1 font-medium">Produit</th>
                                  <th className="text-right pr-8 pb-1 font-medium">Commandé</th>
                                  <th className="text-right pb-1 font-medium">Livré</th>
                                </tr>
                              </thead>
                              <tbody>
                                {o.order_lines?.map((l: any) => (
                                  <tr key={l.id} className="text-gray-700">
                                    <td className="pr-8 py-0.5">{l.product_name_snapshot}</td>
                                    <td className="pr-8 py-0.5 text-right">{l.quantity_ordered}</td>
                                    <td className="py-0.5 text-right">{l.quantity_delivered}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                )
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <ShoppingCart className="mb-2 h-6 w-6" />
              <p className="text-sm">Aucune commande</p>
            </div>
          )}
        </div>
      </div>
      <ToastContainer />
    </>
  )
}
