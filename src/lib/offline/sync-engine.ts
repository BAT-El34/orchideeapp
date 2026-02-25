'use client'

import { createClient } from '@/lib/supabase/client'
import { db } from './dexie-schema'
import { useSyncStore, useAppStore } from '@/stores/app-store'

export async function syncToSupabase() {
  const { queue, markSynced, clearSynced, setIsSyncing } = useSyncStore.getState()
  const pending = queue.filter((q) => !q.synced)
  if (pending.length === 0) return

  setIsSyncing(true)
  const supabase = createClient()

  for (const item of pending) {
    try {
      if (item.operation === 'INSERT') {
        await supabase.from(item.table_name as any).insert(item.payload)
      } else if (item.operation === 'UPDATE') {
        const { id, ...rest } = item.payload as any
        await supabase.from(item.table_name as any).update(rest).eq('id', id)
      } else if (item.operation === 'DELETE') {
        await supabase.from(item.table_name as any).delete().eq('id', (item.payload as any).id)
      }
      markSynced(item.id)
    } catch (err) {
      console.error('Sync failed for item:', item.id, err)
    }
  }

  clearSynced()
  setIsSyncing(false)
  useAppStore.getState().setOfflineQueueCount(0)
}

export async function seedOfflineData(entityId: string) {
  const supabase = createClient()

  const [{ data: products }, { data: stock }, { data: sessions }] = await Promise.all([
    supabase.from('products').select('*, product_categories(*)').eq('active', true),
    supabase.from('stock').select('*').eq('entity_id', entityId),
    supabase.from('cash_sessions').select('*').eq('entity_id', entityId).eq('status', 'open').limit(1),
  ])

  await db.transaction('rw', [db.products, db.stock, db.cash_sessions], async () => {
    if (products) await db.products.bulkPut(products as any)
    if (stock) await db.stock.bulkPut(stock as any)
    if (sessions) await db.cash_sessions.bulkPut(sessions as any)
  })
}

export function setupConnectivityWatcher() {
  window.addEventListener('online', () => {
    useAppStore.getState().setOnline(true)
    syncToSupabase()
  })
  window.addEventListener('offline', () => {
    useAppStore.getState().setOnline(false)
  })
}
