'use client'

import { Search } from 'lucide-react'
import { useAppStore } from '@/stores/app-store'
import { roleLabels } from '@/lib/design-system'
import { NotificationCenter } from '@/components/shared/notification-center'
import type { UserRole } from '@/types'

interface HeaderProps {
  onToggleDark?: () => void
  darkMode?: boolean
}

function SunIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4"/>
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>
  )
}

export function Header({ onToggleDark, darkMode }: HeaderProps) {
  const user = useAppStore((s) => s.user)
  const entity = useAppStore((s) => s.entity)

  const initials = user?.full_name
    ?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() ?? '?'

  return (
    <header className="hidden lg:flex h-14 items-center justify-between border-b border-cream-400 dark:border-[#2A3D1E] bg-white dark:bg-[#162010] px-6 flex-shrink-0">
      <div className="flex items-center gap-3">
        {entity && <div className="h-5 w-0.5 rounded-full bg-gold-500" />}
        <span className="text-sm font-medium text-bark-600 dark:text-forest-400">{entity?.name ?? 'Toutes entités'}</span>
      </div>

      <div className="flex items-center gap-2">
        {/* Recherche */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-bark-300" />
          <input type="text" placeholder="Rechercher..."
            className="h-8 w-48 rounded-sm border border-cream-400 dark:border-[#2A3D1E] bg-cream-50 dark:bg-[#1A2912] pl-8 pr-3 text-sm placeholder:text-bark-300 focus:border-forest-500 focus:outline-none focus:ring-1 focus:ring-forest-500 text-forest-900 dark:text-forest-200" />
        </div>

        {/* Toggle Soleil / Lune */}
        {onToggleDark && (
          <button onClick={onToggleDark}
            className={`flex h-8 w-8 items-center justify-center rounded-sm border transition-all ${
              darkMode
                ? 'border-gold-500/40 bg-gold-500/10 text-gold-400 hover:bg-gold-500/20'
                : 'border-cream-400 text-bark-500 hover:bg-cream-100'
            }`}
            title={darkMode ? 'Mode jour' : 'Mode nuit'}>
            {darkMode ? <SunIcon /> : <MoonIcon />}
          </button>
        )}

        {/* Notifications */}
        {user && (
          <NotificationCenter userId={user.id} entityId={user.entity_id} role={user.role} />
        )}

        {/* Avatar */}
        <div className="flex items-center gap-2 border-l border-cream-400 dark:border-[#2A3D1E] pl-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-sm bg-forest-100 dark:bg-forest-900 text-xs font-semibold text-forest-700 dark:text-forest-300">
            {initials}
          </div>
          <div>
            <div className="text-xs font-medium text-forest-900 dark:text-forest-200">{user?.full_name}</div>
            <div className="text-xs text-bark-400">{roleLabels[user?.role as UserRole] ?? ''}</div>
          </div>
        </div>
      </div>
    </header>
  )
}
