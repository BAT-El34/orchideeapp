'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Package, FileText, CreditCard, ShoppingCart, BarChart2, Bell, Settings } from 'lucide-react'
import { useDarkMode } from '@/hooks/use-dark-mode'
import type { UserRole } from '@/types'

const ALL_NAV = [
  { label: 'Accueil',   href: '',           icon: LayoutDashboard, roles: ['super_admin','admin','manager','vendeur','caissier','readonly'] },
  { label: 'Produits',  href: '/produits',  icon: Package,         roles: ['super_admin','admin','manager','vendeur','readonly'] },
  { label: 'Factures',  href: '/factures',  icon: FileText,        roles: ['super_admin','admin','manager','vendeur','caissier','readonly'] },
  { label: 'Caisse',    href: '/caissier',  icon: CreditCard,      roles: ['caissier'] },
  { label: 'Commandes', href: '/commandes', icon: ShoppingCart,    roles: ['super_admin','admin','manager','vendeur'] },
  { label: 'Rapports',  href: '/rapports',  icon: BarChart2,       roles: ['super_admin','admin','manager','readonly'] },
  { label: 'Notifs',    href: '/notifications', icon: Bell,        roles: ['super_admin','admin','manager','vendeur','caissier'] },
  { label: 'Réglages',  href: '/parametres', icon: Settings,       roles: ['super_admin','admin'] },
]

export function MobileBottomNav({ basePath, role }: { basePath: string; role: UserRole }) {
  const pathname = usePathname()
  const { theme } = useDarkMode()
  const dark = theme === 'dark'

  const items = ALL_NAV.filter((i) => i.roles.includes(role)).slice(0, 5)

  return (
    <nav className="lg:hidden" style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 30,
      paddingBottom: 'env(safe-area-inset-bottom)',
    }}>
      {/* Fond flouté — style iOS */}
      <div style={{
        position: 'absolute', inset: 0,
        background: dark ? 'rgba(10,20,7,0.85)' : 'rgba(255,255,255,0.85)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        borderTop: `1px solid ${dark ? 'rgba(78,132,48,0.2)' : 'rgba(0,0,0,0.06)'}`,
      }} />

      {/* Items */}
      <div style={{
        position: 'relative', display: 'flex',
        alignItems: 'stretch', paddingTop: 6, paddingBottom: 6,
      }}>
        {items.map((item) => {
          const href = `${basePath}${item.href}`
          const isActive = pathname === href || (item.href !== '' && pathname.startsWith(href))
          const Icon = item.icon

          return (
            <Link key={item.href} href={href} style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              gap: 3, paddingTop: 6, paddingBottom: 6,
              color: isActive
                ? (dark ? '#E4A528' : '#2C5219')
                : (dark ? '#3A5030' : '#B8C4A8'),
              textDecoration: 'none', position: 'relative',
              transition: 'color 0.2s',
            }}>
              {/* Fond pill si actif */}
              {isActive && (
                <div style={{
                  position: 'absolute', top: 4, left: '50%', transform: 'translateX(-50%)',
                  width: 44, height: 30, borderRadius: 10,
                  background: dark ? 'rgba(228,165,40,0.12)' : 'rgba(44,82,25,0.09)',
                }} />
              )}

              <span style={{ position: 'relative' }}>
                <Icon
                  size={21}
                  strokeWidth={isActive ? 2.2 : 1.7}
                />
                {/* Point actif */}
                {isActive && (
                  <span style={{
                    position: 'absolute', bottom: -4, left: '50%', transform: 'translateX(-50%)',
                    width: 3, height: 3, borderRadius: '50%',
                    background: dark ? '#E4A528' : '#2C5219',
                  }} />
                )}
              </span>

              <span style={{
                fontSize: 9.5, fontWeight: isActive ? 700 : 500,
                letterSpacing: '0.01em', lineHeight: 1, position: 'relative',
              }}>
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
