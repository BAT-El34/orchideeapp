'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Package, TrendingUp, FileText, ShoppingCart,
  Users, Bell, Settings, LogOut, Building2, CreditCard, BarChart2, Shield
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useAppStore } from '@/stores/app-store'
import type { UserRole } from '@/types'

interface NavItem {
  label: string
  href: string
  icon: React.ElementType
  roles: UserRole[]
}

interface SidebarProps {
  basePath: string
  role: UserRole
  onNavigate?: () => void
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Tableau de bord', href: '', icon: LayoutDashboard, roles: ['super_admin','admin','manager','vendeur','caissier','readonly'] },
  { label: 'Produits', href: '/produits', icon: Package, roles: ['super_admin','admin','manager','vendeur','readonly'] },
  { label: 'Stock', href: '/stock', icon: TrendingUp, roles: ['super_admin','admin','manager','readonly'] },
  { label: 'Factures', href: '/factures', icon: FileText, roles: ['super_admin','admin','manager','vendeur','caissier','readonly'] },
  { label: 'Caisse', href: '/caissier', icon: CreditCard, roles: ['caissier'] },
  { label: 'Commandes', href: '/commandes', icon: ShoppingCart, roles: ['super_admin','admin','manager','vendeur'] },
  { label: 'Rapports', href: '/rapports', icon: BarChart2, roles: ['super_admin','admin','manager','readonly'] },
  { label: 'Notifications', href: '/notifications', icon: Bell, roles: ['super_admin','admin','manager','vendeur','caissier'] },
  { label: 'Utilisateurs', href: '/utilisateurs', icon: Users, roles: ['super_admin','admin'] },
  { label: 'Entités', href: '/entites', icon: Building2, roles: ['super_admin'] },
  { label: 'Audit', href: '/audit', icon: Shield, roles: ['super_admin'] },
  { label: 'Paramètres', href: '/parametres', icon: Settings, roles: ['super_admin','admin'] },
  { label: 'Permissions', href: '/permissions', icon: Shield, roles: ['super_admin'] },
  { label: 'Analyse IA', href: '/analyse', icon: BarChart2, roles: ['super_admin'] },
]

export function Sidebar({ basePath, role, onNavigate }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const entity = useAppStore((s) => s.entity)
  const { setUser, setEntity } = useAppStore()

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    setUser(null)
    setEntity(null)
    router.push('/login')
  }

  const filteredItems = NAV_ITEMS.filter((item) => item.roles.includes(role))

  return (
    <aside className="flex h-screen w-56 flex-shrink-0 flex-col bg-forest-800 border-r border-forest-900">
      <div className="border-b border-forest-700 px-4 py-4">
        <img src="/logo-orchidee.png" alt="Orchidée Nature" className="h-10 w-auto object-contain filter brightness-0 invert" />
        {entity && (
          <div className="mt-2 text-xs text-forest-400 truncate">{entity.name}</div>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto py-3 space-y-0.5 px-2">
        {filteredItems.map((item) => {
          const href = `${basePath}${item.href}`
          const isActive = pathname === href || (item.href !== '' && pathname.startsWith(href))
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={href}
              onClick={onNavigate}
              className={`flex items-center gap-3 px-3 py-2 text-sm rounded-sm transition-all ${
                isActive
                  ? 'bg-forest-700 text-gold-300 font-medium border-l-2 border-gold-400 pl-2.5'
                  : 'text-forest-300 hover:bg-forest-700 hover:text-white'
              }`}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-forest-700 p-3">
        <button
          onClick={handleSignOut}
          className="flex w-full items-center gap-3 px-3 py-2 text-sm text-forest-400 hover:text-red-300 hover:bg-forest-700 rounded-sm transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Déconnexion
        </button>
      </div>
    </aside>
  )
}
