'use client'

import { useState } from 'react'
import { Sidebar } from '@/components/shared/sidebar'
import { Header } from '@/components/shared/header'
import { MobileBottomNav } from '@/components/shared/mobile-bottom-nav'
import { MobileTopBar } from '@/components/shared/mobile-top-bar'
import { OnlineStatus } from '@/components/shared/online-status'
import { StoreInitializer } from '@/components/shared/store-initializer'
import { useDarkMode } from '@/hooks/use-dark-mode'
import type { UserRole, User, Entity } from '@/types'

export interface DashboardLayoutProps {
  children: React.ReactNode
  basePath: string
  role: UserRole
  user: User
  entity: Entity | null
}

export function DashboardLayout({ children, basePath, role, user, entity }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { theme, toggle } = useDarkMode()

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg-app, #FAF7F0)' }}>
      <StoreInitializer user={user} entity={entity} />

      {/* Overlay mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 lg:z-auto ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <Sidebar basePath={basePath} role={role} onNavigate={() => setSidebarOpen(false)} />
      </div>

      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        <OnlineStatus />

        {/* Top bar mobile — style app native */}
        <MobileTopBar
          onMenuOpen={() => setSidebarOpen(true)}
          onToggleDark={toggle}
          darkMode={theme === 'dark'}
        />

        {/* Header desktop */}
        <Header onToggleDark={toggle} darkMode={theme === 'dark'} />

        {/* Contenu */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6 pb-24 lg:pb-6">
          {children}
        </main>

        {/* Nav mobile en bas */}
        <MobileBottomNav basePath={basePath} role={role} />
      </div>
    </div>
  )
}
