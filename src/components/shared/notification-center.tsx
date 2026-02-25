'use client'

import { useState, useEffect, useRef } from 'react'
import { Bell, X, CheckCheck, ShoppingCart, AlertTriangle, CreditCard, FileCheck, Info } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { formatDateTime } from '@/lib/utils'
import type { Notification } from '@/types'

const TYPE_CFG = {
  ORDER: { icon: ShoppingCart, cls: 'text-violet-600 bg-violet-50' },
  ALERT: { icon: AlertTriangle, cls: 'text-amber-600 bg-amber-50' },
  CASH: { icon: CreditCard, cls: 'text-blue-600 bg-blue-50' },
  VALIDATION: { icon: FileCheck, cls: 'text-green-600 bg-green-50' },
  REPORT: { icon: Info, cls: 'text-gray-600 bg-gray-100' },
}

interface NotificationCenterProps {
  userId: string
  entityId: string | null
  role: string
}

export function NotificationCenter({ userId, entityId, role }: NotificationCenterProps) {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const ref = useRef<HTMLDivElement>(null)

  const unread = notifications.filter((n) => n.status === 'pending' || n.status === 'sent').length

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      let query = supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(30)

      if (role !== 'super_admin' && entityId) {
        query = query.or(`entity_id.eq.${entityId},to_user_id.eq.${userId}`)
      }

      const { data } = await query
      setNotifications(data ?? [])
    }
    load()

    const supabase = createClient()
    const sub = supabase
      .channel('notifications')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, (payload) => {
        setNotifications((prev) => [payload.new as Notification, ...prev])
      })
      .subscribe()

    return () => { supabase.removeChannel(sub) }
  }, [userId, entityId, role])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const markRead = async (id: string) => {
    const supabase = createClient()
    await supabase.from('notifications').update({ status: 'read' }).eq('id', id)
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, status: 'read' } : n))
  }

  const markAllRead = async () => {
    const supabase = createClient()
    const ids = notifications.filter((n) => n.status !== 'read').map((n) => n.id)
    if (ids.length === 0) return
    await supabase.from('notifications').update({ status: 'read' }).in('id', ids)
    setNotifications((prev) => prev.map((n) => ({ ...n, status: 'read' as const })))
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative flex h-8 w-8 items-center justify-center rounded-sm text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors"
      >
        <Bell className="h-4.5 w-4.5" />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 z-50 rounded-sm border border-gray-200 bg-white shadow-md">
          <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
            <span className="text-sm font-semibold text-gray-900">Notifications</span>
            <div className="flex items-center gap-2">
              {unread > 0 && (
                <button onClick={markAllRead} className="text-xs text-violet-600 hover:underline flex items-center gap-1">
                  <CheckCheck className="h-3 w-3" />
                  Tout marquer lu
                </button>
              )}
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto divide-y divide-gray-100">
            {notifications.length === 0 && (
              <div className="py-8 text-center text-sm text-gray-400">Aucune notification</div>
            )}
            {notifications.map((n) => {
              const cfg = TYPE_CFG[n.type] ?? TYPE_CFG.REPORT
              const Icon = cfg.icon
              const isUnread = n.status !== 'read'
              return (
                <div
                  key={n.id}
                  onClick={() => isUnread && markRead(n.id)}
                  className={`flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors ${isUnread ? 'bg-blue-50/40' : ''}`}
                >
                  <div className={`mt-0.5 flex-shrink-0 flex h-7 w-7 items-center justify-center rounded-sm ${cfg.cls}`}>
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs leading-snug ${isUnread ? 'font-medium text-gray-900' : 'text-gray-600'}`}>
                      {n.message}
                    </p>
                    <p className="mt-1 text-xs text-gray-400">{formatDateTime(n.created_at)}</p>
                  </div>
                  {isUnread && <div className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-blue-500" />}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
