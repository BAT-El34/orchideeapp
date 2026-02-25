import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { formatFCFA, formatDate } from '@/lib/utils'
import { TrendingUp, Package, FileText } from 'lucide-react'

export default async function ReadonlyDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('users').select('entity_id, full_name').eq('id', user.id).single()
  if (!profile?.entity_id) redirect('/login')

  const today = new Date().toISOString().split('T')[0]
  const [{ data: invoices }, { data: stock }] = await Promise.all([
    supabase.from('invoices').select('total_sell, status').eq('entity_id', profile.entity_id).eq('date', today),
    supabase.from('stock').select('quantity, min_threshold').eq('entity_id', profile.entity_id),
  ])

  const totalSales = invoices?.filter((i: any) => i.status === 'validated').reduce((s: number, i: any) => s + i.total_sell, 0) ?? 0
  const lowStock = stock?.filter((s: any) => s.quantity <= s.min_threshold).length ?? 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-xl font-bold text-gray-900">Vue lecture seule</h1>
        <p className="mt-0.5 text-sm text-gray-500">{formatDate(new Date().toISOString())} — {profile.full_name}</p>
      </div>
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Ventes du jour', value: formatFCFA(totalSales), icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Factures', value: (invoices?.length ?? 0).toString(), icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Alertes stock', value: lowStock.toString(), icon: Package, color: lowStock > 0 ? 'text-red-600' : 'text-gray-600', bg: lowStock > 0 ? 'bg-red-50' : 'bg-gray-100' },
        ].map((s: any) => {
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
    </div>
  )
}
