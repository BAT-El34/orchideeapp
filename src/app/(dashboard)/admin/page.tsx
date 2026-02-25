import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { TrendingUp, FileText, Package, Bell, CreditCard, ShoppingCart } from 'lucide-react'
import { formatFCFA, formatDate } from '@/lib/utils'
import Link from 'next/link'
import { MobileDashboard } from '@/components/modules/dashboard/mobile-dashboard'

async function getDashboardStats(entityId: string) {
  const supabase = await createClient()
  const today = new Date().toISOString().split('T')[0]
  const [invoices, stock, orders, notifications, cashSession] = await Promise.all([
    supabase.from('invoices').select('total_sell, status').eq('entity_id', entityId).eq('date', today),
    supabase.from('stock').select('quantity, min_threshold').eq('entity_id', entityId),
    supabase.from('orders').select('id', { count: 'exact' }).eq('entity_id', entityId).eq('status', 'pending_validation'),
    supabase.from('notifications').select('id', { count: 'exact' }).eq('entity_id', entityId).eq('status', 'pending'),
    supabase.from('cash_sessions').select('id').eq('entity_id', entityId).eq('status', 'open').limit(1),
  ])
  const validated = invoices.data?.filter((i: any) => i.status === 'validated') ?? []
  return {
    totalSalesToday: validated.reduce((s: number, i: any) => s + i.total_sell, 0),
    invoiceCount: invoices.data?.length ?? 0,
    lowStockCount: stock.data?.filter((s: any) => s.quantity <= s.min_threshold).length ?? 0,
    pendingOrders: orders?.count ?? 0,
    pendingNotifications: notifications?.count ?? 0,
    sessionOpen: (cashSession.data?.length ?? 0) > 0,
  }
}

export default async function AdminDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('users').select('entity_id, full_name').eq('id', user.id).single()
  if (!profile?.entity_id) redirect('/login')

  const stats = await getDashboardStats(profile.entity_id)
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir'

  const cards = [
    { label: 'Ventes du jour',    value: formatFCFA(stats.totalSalesToday), icon: TrendingUp, gradient: 'from-forest-700 to-forest-500', href: '/admin/factures' },
    { label: 'Factures',          value: stats.invoiceCount.toString(),      icon: FileText,   gradient: 'from-gold-600 to-gold-400',     href: '/admin/factures' },
    { label: stats.lowStockCount > 0 ? 'Alertes stock' : 'Stock OK',
                                  value: stats.lowStockCount > 0 ? stats.lowStockCount.toString() : '✓',
                                                                             icon: Package,    gradient: stats.lowStockCount > 0 ? 'from-red-600 to-red-400' : 'from-sage-600 to-sage-400', href: '/admin/stock' },
    { label: 'Commandes',         value: stats.pendingOrders.toString(),     icon: ShoppingCart,gradient:'from-indigo-600 to-indigo-400', href: '/admin/commandes' },
    { label: 'Notifications',     value: stats.pendingNotifications.toString(), icon: Bell,   gradient: 'from-orange-500 to-orange-400',  href: '/admin/notifications' },
    { label: stats.sessionOpen ? 'Caisse active' : 'Caisse fermée',
                                  value: stats.sessionOpen ? 'Active' : 'Fermée',
                                                                             icon: CreditCard, gradient: stats.sessionOpen ? 'from-emerald-600 to-emerald-400' : 'from-gray-500 to-gray-400', href: '/admin/factures' },
  ]

  return (
    <>
      {/* Mobile — tuiles inspirées smart home */}
      <div className="lg:hidden">
        <MobileDashboard stats={stats} userName={profile.full_name ?? 'Utilisateur'} basePath="/admin" />
      </div>

      {/* Desktop — grille classique améliorée */}
      <div className="hidden lg:block space-y-6">
        <div className="rounded-xl bg-gradient-to-br from-forest-800 via-forest-700 to-forest-600 p-6 text-white shadow-botanical-md">
          <p className="text-sm text-forest-300 font-medium">{formatDate(new Date().toISOString())}</p>
          <h1 className="font-heading text-3xl font-bold mt-1">{greeting}, {profile.full_name?.split(' ')[0]} 👋</h1>
          <p className="text-forest-300 text-sm mt-0.5">Tableau de bord administrateur</p>
        </div>

        <div className="grid grid-cols-3 xl:grid-cols-6 gap-4">
          {cards.map((card) => {
            const Icon = card.icon
            return (
              <Link key={card.label} href={card.href}
                className={`relative overflow-hidden rounded-xl bg-gradient-to-br ${card.gradient} p-5 shadow-botanical-md hover:scale-105 active:scale-95 transition-transform`}>
                <Icon className="absolute -right-2 -bottom-2 h-16 w-16 opacity-10" />
                <Icon className="h-5 w-5 text-white/80 mb-3" />
                <div className="text-2xl font-bold text-white leading-none">{card.value}</div>
                <div className="mt-1.5 text-xs text-white/75 font-medium">{card.label}</div>
              </Link>
            )
          })}
        </div>
      </div>
    </>
  )
}
