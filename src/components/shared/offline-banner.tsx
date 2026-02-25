'use client'

import { useEffect } from 'react'
import { WifiOff, RefreshCw } from 'lucide-react'
import { useAppStore, useSyncStore } from '@/stores/app-store'
import { setupConnectivityWatcher, syncToSupabase } from '@/lib/offline/sync-engine'

export function OfflineBanner() {
  const isOnline = useAppStore((s) => s.isOnline)
  const offlineQueueCount = useAppStore((s) => s.offlineQueueCount)
  const isSyncing = useSyncStore((s) => s.isSyncing)
  const queue = useSyncStore((s) => s.queue)
  const pendingCount = queue.filter((q) => !q.synced).length

  useEffect(() => {
    setupConnectivityWatcher()
  }, [])

  if (isOnline && pendingCount === 0) return null

  return (
    <div className={`flex items-center gap-3 px-4 py-2 text-sm font-medium ${
      isOnline ? 'bg-amber-50 text-amber-800 border-b border-amber-200' : 'bg-red-50 text-red-800 border-b border-red-200'
    }`}>
      {isOnline ? (
        <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
      ) : (
        <WifiOff className="h-4 w-4" />
      )}
      {isOnline
        ? isSyncing
          ? `Synchronisation en cours...`
          : `${pendingCount} opération${pendingCount > 1 ? 's' : ''} en attente de synchronisation`
        : `Hors ligne — ${pendingCount} opération${pendingCount > 1 ? 's' : ''} en attente`}
      {isOnline && !isSyncing && pendingCount > 0 && (
        <button
          onClick={syncToSupabase}
          className="ml-auto underline text-xs hover:no-underline"
        >
          Synchroniser maintenant
        </button>
      )}
    </div>
  )
}
