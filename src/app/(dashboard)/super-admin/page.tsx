import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Building2, Users, Package, TrendingUp } from 'lucide-react'
import { formatFCFA } from '@/lib/utils'

export default async function SuperAdminDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const today = new Date().toISOString().split('T')[0]

  const [{ data: entities }, { count: userCount }, { data: invoices }, { data: products }] = await Promise.all([
    supabase.from('entities').select('id, name, theme_color'),
    supabase.from('users').select('id', { count: 'exact', head: true }),
    supabase.from('invoices').select('total_sell, entity_id').eq('date', today).eq('status', 'validated'),
    supabase.from('products').select('id', { count: 'exact', head: true }).eq('active', true),
  ])

  const totalToday = invoices?.reduce((s: number, i: any) => s + i.total_sell, 0) ?? 0

  const entityTotals = (entities ?? []).map((e: any) => ({
    ...e,
    total: invoices?.filter((i: any) => i.entity_id === e.id).reduce((s: number, i: any) => s + i.total_sell, 0) ?? 0,
  })) ?? []

  const stats = [
    { label: 'Entités actives', value: entities?.length.toString() ?? '0', icon: Building2, color: 'text-violet-600', bg: 'bg-violet-50' },
    { label: 'Utilisateurs', value: userCount?.toString() ?? '0', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Ventes du jour', value: formatFCFA(totalToday), icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Produits actifs', value: products?.length?.toString() ?? '0', icon: Package, color: 'text-gray-600', bg: 'bg-gray-100' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-xl font-bold text-gray-900">Vue globale</h1>
        <p className="mt-0.5 text-sm text-gray-500">Supervision de toutes les entités</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {stats.map((s: any) => {
          const Icon = s.icon
          return (
            <div key={s.label} className="rounded-sm border border-gray-200 bg-white p-4 shadow-sm">
              <div className={`mb-3 inline-flex h-8 w-8 items-center justify-center rounded-sm ${s.bg}`}>
                <Icon className={`h-4 w-4 ${s.color}`} />
              </div>
              <div className="text-lg font-bold text-gray-900">{s.value}</div>
              <div className="mt-0.5 text-xs text-gray-500">{s.label}</div>
            </div>
          )
        })}
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold text-gray-700">Ventes par entité — aujourd'hui</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {entityTotals.map((e: any) => (
            <div key={e.id} className="flex items-center justify-between rounded-sm border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="h-8 w-1 rounded-sm" style={{ backgroundColor: e.theme_color }} />
                <span className="text-sm font-medium text-gray-900">{e.name}</span>
              </div>
              <span className="text-sm font-bold text-gray-900">{formatFCFA(e.total)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
