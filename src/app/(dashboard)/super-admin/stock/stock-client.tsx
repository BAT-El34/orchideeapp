'use client'

import { useState } from 'react'
import { TrendingUp } from 'lucide-react'
import { StockTable } from '@/components/modules/products/stock-table'
import { ToastContainer } from '@/components/ui/toast-container'

interface StockPageClientProps {
  products: any[]
  entityId: string
}

export function StockPageClient({ products: initial, entityId }: StockPageClientProps) {
  const [products, setProducts] = useState(initial)

  const refresh = async () => {
    const res = await fetch(`/api/stock?entity_id=${entityId}`)
    if (res.ok) {
      const data = await res.json()
      setProducts(data)
    }
  }

  return (
    <>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-heading text-xl font-bold text-gray-900">Gestion des stocks</h1>
            <p className="mt-0.5 text-sm text-gray-500">{products.length} produits suivis</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <TrendingUp className="h-4 w-4" />
            Mis à jour en temps réel
          </div>
        </div>
        <StockTable products={products} entityId={entityId} onRefresh={refresh} />
      </div>
      <ToastContainer />
    </>
  )
}
