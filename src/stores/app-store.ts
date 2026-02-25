import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User, Entity, UserRole, SyncQueueItem } from '@/types'

interface AppState {
  user: User | null
  entity: Entity | null
  isOnline: boolean
  offlineQueueCount: number
  setUser: (user: User | null) => void
  setEntity: (entity: Entity | null) => void
  setOnline: (online: boolean) => void
  setOfflineQueueCount: (count: number) => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      user: null,
      entity: null,
      isOnline: true,
      offlineQueueCount: 0,
      setUser: (user) => set({ user }),
      setEntity: (entity) => set({ entity }),
      setOnline: (isOnline) => set({ isOnline }),
      setOfflineQueueCount: (offlineQueueCount) => set({ offlineQueueCount }),
    }),
    {
      name: 'orchidee-app-store',
      partialize: (state) => ({ user: state.user, entity: state.entity }),
    }
  )
)

interface SyncState {
  queue: SyncQueueItem[]
  isSyncing: boolean
  addToQueue: (item: Omit<SyncQueueItem, 'id' | 'created_at' | 'synced'>) => void
  markSynced: (id: string) => void
  clearSynced: () => void
  setIsSyncing: (v: boolean) => void
}

export const useSyncStore = create<SyncState>()(
  persist(
    (set) => ({
      queue: [],
      isSyncing: false,
      addToQueue: (item) =>
        set((state) => ({
          queue: [
            ...state.queue,
            {
              ...item,
              id: crypto.randomUUID(),
              synced: false,
              created_at: new Date().toISOString(),
            },
          ],
        })),
      markSynced: (id) =>
        set((state) => ({
          queue: state.queue.map((q) => (q.id === id ? { ...q, synced: true } : q)),
        })),
      clearSynced: () =>
        set((state) => ({
          queue: state.queue.filter((q) => !q.synced),
        })),
      setIsSyncing: (isSyncing) => set({ isSyncing }),
    }),
    { name: 'orchidee-sync-queue' }
  )
)
