'use client'

import { useEffect, useState } from 'react'
import { Wifi, WifiOff, RefreshCw } from 'lucide-react'
import { useAppStore, useSyncStore } from '@/stores/app-store'
import { createClient } from '@/lib/supabase/client'

const CACHE_REFRESH_INTERVAL_MS = 15 * 60 * 1000

export function OnlineStatus() {
  const isOnline = useAppStore((s) => s.isOnline)
  const setOnline = useAppStore((s) => s.setOnline)
  const { queue, isSyncing, setIsSyncing, markSynced, clearSynced } = useSyncStore()
  const pendingCount = queue.filter((q) => !q.synced).length

  useEffect(() => {
    setOnline(navigator.onLine)
    const handleOnline = () => setOnline(true)
    const handleOffline = () => setOnline(false)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [setOnline])

  useEffect(() => {
    if (!isOnline || pendingCount === 0 || isSyncing) return
    const sync = async () => {
      setIsSyncing(true)
      const supabase = createClient()
      const pending = queue.filter((q) => !q.synced)
      for (const item of pending) {
        try {
          if (item.operation === 'INSERT') await supabase.from(item.table_name as any).insert(item.payload)
          else if (item.operation === 'UPDATE') {
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
    }
    sync()
  }, [isOnline, pendingCount])

  if (isOnline && pendingCount === 0) return null

  return (
    <div className={`flex items-center gap-2 px-4 py-1.5 text-xs font-medium border-b ${
      !isOnline
        ? 'bg-red-50 border-red-200 text-red-700'
        : 'bg-amber-50 border-amber-200 text-amber-700'
    }`}>
      {isOnline
        ? <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
        : <WifiOff className="h-3.5 w-3.5" />
      }
      <span>
        {!isOnline
          ? `Hors ligne — ${pendingCount} opération${pendingCount > 1 ? 's' : ''} en attente`
          : isSyncing
            ? 'Synchronisation en cours...'
            : `${pendingCount} opération${pendingCount > 1 ? 's' : ''} en attente de synchronisation`
        }
      </span>
    </div>
  )
}
