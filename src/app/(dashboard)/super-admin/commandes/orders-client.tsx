'use client'

import { useState } from 'react'
import { Plus, ShoppingCart } from 'lucide-react'
import { OrdersTable } from '@/components/modules/orders/orders-table'
import { NewOrderForm } from '@/components/modules/orders/new-order-form'
import type { UserRole } from '@/types'

interface OrdersPageClientProps {
  orders: any[]
  products: any[]
  entityId: string
  userId: string
  role: UserRole
}

export function OrdersPageClient({ orders: initial, products, entityId, userId, role }: OrdersPageClientProps) {
  const [orders, setOrders] = useState(initial)
  const [showNew, setShowNew] = useState(false)

  const refresh = async () => {
    const res = await fetch(`/api/orders?entity_id=${entityId}`)
    if (res.ok) setOrders(await res.json())
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-xl font-bold text-gray-900">Commandes</h1>
          <p className="mt-0.5 text-sm text-gray-500">{orders.length} commande{orders.length !== 1 ? 's' : ''}</p>
        </div>
        {['admin', 'super_admin', 'manager', 'vendeur'].includes(role) && (
          <button
            onClick={() => setShowNew(true)}
            className="flex items-center gap-2 rounded-sm bg-violet-600 px-3 py-2 text-sm font-medium text-white hover:bg-violet-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Nouvelle commande
          </button>
        )}
      </div>
      <OrdersTable orders={orders} role={role} />
      {showNew && (
        <NewOrderForm
          products={products}
          entityId={entityId}
          userId={userId}
          onSuccess={refresh}
          onClose={() => setShowNew(false)}
        />
      )}
    </div>
  )
}
