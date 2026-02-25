import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { formatDateTime } from '@/lib/utils'
import { Bell, ShoppingCart, AlertTriangle, CreditCard, FileCheck, Info } from 'lucide-react'

const TYPE_CFG = {
  ORDER: { label: 'Commande', icon: ShoppingCart, cls: 'text-violet-600 bg-violet-50' },
  ALERT: { label: 'Alerte', icon: AlertTriangle, cls: 'text-amber-600 bg-amber-50' },
  CASH: { label: 'Caisse', icon: CreditCard, cls: 'text-blue-600 bg-blue-50' },
  VALIDATION: { label: 'Validation', icon: FileCheck, cls: 'text-green-600 bg-green-50' },
  REPORT: { label: 'Rapport', icon: Info, cls: 'text-gray-600 bg-gray-100' },
}

const STATUS_CFG = {
  pending: { label: 'En attente', cls: 'bg-amber-50 text-amber-700' },
  sent: { label: 'Envoyée', cls: 'bg-blue-50 text-blue-700' },
  read: { label: 'Lue', cls: 'bg-gray-100 text-gray-500' },
  validated: { label: 'Validée', cls: 'bg-green-50 text-green-700' },
}

export default async function NotificationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('users').select('entity_id, role').eq('id', user.id).single()

  let query = supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(100)

  if (profile?.role !== 'super_admin' && profile?.entity_id) {
    query = query.or(`entity_id.eq.${profile.entity_id},to_user_id.eq.${user.id}`)
  }

  const { data: notifications } = await query

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-heading text-xl font-bold text-gray-900">Notifications</h1>
        <p className="mt-0.5 text-sm text-gray-500">{notifications?.length ?? 0} notification{(notifications?.length ?? 0) !== 1 ? 's' : ''}</p>
      </div>

      <div className="rounded-sm border border-gray-200 bg-white shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              {['Type', 'Message', 'Canal', 'Statut', 'Date'].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {notifications?.map((n: any) => {
              const tcfg = TYPE_CFG[n.type as keyof typeof TYPE_CFG] ?? TYPE_CFG.REPORT
              const scfg = STATUS_CFG[n.status as keyof typeof STATUS_CFG] ?? STATUS_CFG.pending
              const Icon = tcfg.icon
              return (
                <tr key={n.id} className={`hover:bg-gray-50 transition-colors ${n.status === 'pending' ? 'bg-blue-50/30' : ''}`}>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1.5 rounded-sm px-2 py-0.5 text-xs font-medium ${tcfg.cls}`}>
                      <Icon className="h-3 w-3" />
                      {tcfg.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-700 max-w-xs truncate">{n.message}</td>
                  <td className="px-4 py-3 text-xs text-gray-500 uppercase">{n.channel}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-sm px-2 py-0.5 text-xs font-medium ${scfg.cls}`}>{scfg.label}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{formatDateTime(n.created_at)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {(!notifications || notifications.length === 0) && (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <Bell className="mb-2 h-6 w-6" />
            <p className="text-sm">Aucune notification</p>
          </div>
        )}
      </div>
    </div>
  )
}
