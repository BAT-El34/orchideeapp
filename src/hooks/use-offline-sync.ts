'use client'

import { useEffect, useCallback } from 'react'
import { useAppStore, useSyncStore } from '@/stores/app-store'
import { createClient } from '@/lib/supabase/client'

export function useOfflineSync() {
  const isOnline = useAppStore((s) => s.isOnline)
  const setOnline = useAppStore((s) => s.setOnline)
  const setOfflineQueueCount = useAppStore((s) => s.setOfflineQueueCount)
  const { queue, addToQueue, markSynced, clearSynced, setIsSyncing } = useSyncStore()

  const pendingCount = queue.filter((q) => !q.synced).length

  const sync = useCallback(async () => {
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
      } catch {}
    }
    clearSynced()
    setIsSyncing(false)
    setOfflineQueueCount(0)
  }, [queue, markSynced, clearSynced, setIsSyncing, setOfflineQueueCount])

  useEffect(() => {
    const onOnline = () => { setOnline(true); sync() }
    const onOffline = () => setOnline(false)
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    setOnline(navigator.onLine)
    return () => { window.removeEventListener('online', onOnline); window.removeEventListener('offline', onOffline) }
  }, [setOnline, sync])

  useEffect(() => { setOfflineQueueCount(pendingCount) }, [pendingCount, setOfflineQueueCount])

  return { isOnline, pendingCount, addToQueue, sync }
}
