'use client'

import { useEffect, useRef } from 'react'
import { useAppStore } from '@/stores/app-store'
import { db } from '@/lib/offline/dexie-schema'
import { createClient } from '@/lib/supabase/client'

const REFRESH_INTERVAL = 15 * 60 * 1000

export function useCacheRefresh(entityId: string | null) {
  const isOnline = useAppStore((s) => s.isOnline)
  const lastRefresh = useRef<number>(0)

  useEffect(() => {
    if (!entityId || !isOnline) return

    const refresh = async () => {
      const now = Date.now()
      if (now - lastRefresh.current < REFRESH_INTERVAL) return
      lastRefresh.current = now

      const supabase = createClient()
      const [{ data: products }, { data: stock }] = await Promise.all([
        supabase.from('products').select('*, product_categories(*)').eq('active', true),
        supabase.from('stock').select('*').eq('entity_id', entityId),
      ])

      await db.transaction('rw', [db.products, db.stock], async () => {
        if (products?.length) await db.products.bulkPut(products as any)
        if (stock?.length) await db.stock.bulkPut(stock as any)
      })
    }

    refresh()
    const interval = setInterval(refresh, REFRESH_INTERVAL)
    return () => clearInterval(interval)
  }, [entityId, isOnline])
}
