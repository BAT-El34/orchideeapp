import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { TrendingUp, Package, FileText, ShoppingCart, ArrowUpRight } from 'lucide-react'
import { formatFCFA, formatDate } from '@/lib/utils'
import Link from 'next/link'
import { MobileDashboard } from '@/components/modules/dashboard/mobile-dashboard'

export default async function ManagerDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('users').select('entity_id, full_name').eq('id', user.id).single()
  if (!profile?.entity_id) redirect('/login')

  const today = new Date().toISOString().split('T')[0]
  const [invoicesRes, stockRes, ordersRes] = await Promise.all([
    supabase.from('invoices').select('total_sell, status').eq('entity_id', profile.entity_id).eq('date', today),
    supabase.from('stock').select('quantity, min_threshold, products(name)').eq('entity_id', profile.entity_id),
    supabase.from('orders').select('id', { count: 'exact' }).eq('entity_id', profile.entity_id).eq('status', 'pending_validation'),
  ])

  const invoices = invoicesRes.data ?? []
  const stock = stockRes.data ?? []
  const ordersCount = ordersRes.count ?? 0

  const totalSales = invoices.filter((i: any) => i.status === 'validated').reduce((s: number, i: any) => s + i.total_sell, 0)
  const lowStock = stock.filter((s: any) => s.quantity <= s.min_threshold)

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir'

  const mobileStats = {
    totalSalesToday: totalSales,
    invoiceCount: invoices.length,
    lowStockCount: lowStock.length,
    pendingOrders: ordersCount,
    pendingNotifications: 0,
    sessionOpen: false,
  }

  const cards = [
    { label: 'Ventes du jour',      value: formatFCFA(totalSales), icon: TrendingUp,   gradient: 'from-forest-700 to-forest-500', href: '/manager/factures' },
    { label: 'Factures',            value: invoices.length.toString(), icon: FileText,  gradient: 'from-gold-600 to-gold-400',     href: '/manager/factures' },
    { label: lowStock.length > 0 ? 'Alertes stock' : 'Stock OK',
                                    value: lowStock.length > 0 ? lowStock.length.toString() : '✓',
                                                                   icon: Package,       gradient: lowStock.length > 0 ? 'from-red-600 to-red-400' : 'from-sage-600 to-sage-400', href: '/manager/stock' },
    { label: 'Commandes',           value: ordersCount.toString(), icon: ShoppingCart,  gradient: 'from-indigo-600 to-indigo-400', href: '/manager/commandes' },
  ]

  return (
    <>
      {/* Mobile */}
      <div className="lg:hidden">
        <MobileDashboard stats={mobileStats} userName={profile.full_name ?? 'Manager'} basePath="/manager" />
      </div>

      {/* Desktop */}
      <div className="hidden lg:block space-y-6">
        <div className="rounded-xl bg-gradient-to-br from-forest-800 via-forest-700 to-forest-600 p-6 text-white">
          <p className="text-sm text-forest-300">{formatDate(new Date().toISOString())}</p>
          <h1 className="font-heading text-3xl font-bold mt-1">{greeting}, {profile.full_name?.split(' ')[0]} 👋</h1>
        </div>

        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          {cards.map((card) => {
            const Icon = card.icon
            return (
              <Link key={card.label} href={card.href}
                className={`relative overflow-hidden rounded-xl bg-gradient-to-br ${card.gradient} p-5 shadow-botanical-md hover:scale-105 active:scale-95 transition-transform`}>
                <Icon className="absolute -right-2 -bottom-2 h-16 w-16 opacity-10" />
                <Icon className="h-5 w-5 text-white/80 mb-3" />
                <div className="text-2xl font-bold text-white">{card.value}</div>
                <div className="mt-1 text-xs text-white/75 font-medium">{card.label}</div>
              </Link>
            )
          })}
        </div>

        {lowStock.length > 0 && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4">
            <h2 className="mb-3 text-sm font-semibold text-red-800">⚠ Produits en rupture ou sous seuil</h2>
            <div className="space-y-1">
              {lowStock.slice(0, 8).map((s: any, i: number) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="text-red-700">{s.products?.name}</span>
                  <span className="font-medium text-red-800">{s.quantity} / {s.min_threshold} min</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  )
}
