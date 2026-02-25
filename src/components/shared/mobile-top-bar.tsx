'use client'

import { Menu } from 'lucide-react'
import { useAppStore } from '@/stores/app-store'
import { NotificationCenter } from '@/components/shared/notification-center'
import { useDarkMode } from '@/hooks/use-dark-mode'

function SunIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>
}
function MoonIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
}

interface MobileTopBarProps {
  onMenuOpen: () => void
  onToggleDark: () => void
  darkMode: boolean
}

const ICON_BTN = (dark: boolean, accent?: boolean) => ({
  width: 40, height: 40, borderRadius: 13,
  background: dark
    ? (accent ? 'rgba(228,165,40,0.14)' : 'rgba(255,255,255,0.06)')
    : (accent ? 'rgba(201,136,26,0.10)' : 'rgba(44,82,25,0.07)'),
  border: `1px solid ${dark
    ? (accent ? 'rgba(228,165,40,0.2)' : 'rgba(255,255,255,0.08)')
    : (accent ? 'rgba(201,136,26,0.2)' : 'rgba(44,82,25,0.10)')}`,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  color: dark ? (accent ? '#E4A528' : 'rgba(255,255,255,0.7)') : (accent ? '#C9881A' : '#2C5219'),
  cursor: 'pointer', transition: 'all 0.2s',
  flexShrink: 0,
} as React.CSSProperties)

export function MobileTopBar({ onMenuOpen, onToggleDark, darkMode }: MobileTopBarProps) {
  const user = useAppStore((s) => s.user)
  const entity = useAppStore((s) => s.entity)

  return (
    <div className="lg:hidden" style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '10px 16px',
      background: darkMode ? 'rgba(10,20,7,0.95)' : 'rgba(255,255,255,0.95)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      borderBottom: `1px solid ${darkMode ? 'rgba(78,132,48,0.15)' : 'rgba(0,0,0,0.05)'}`,
      position: 'sticky', top: 0, zIndex: 20,
    }}>
      {/* Bouton menu — carré arrondi */}
      <button onClick={onMenuOpen} style={ICON_BTN(darkMode)}>
        <Menu size={19} />
      </button>

      {/* Centre — logo + entité */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, justifyContent: 'center' }}>
        <img src="/logo-orchidee.png" alt="Orchidée"
          style={{ height: 28, width: 'auto', objectFit: 'contain' }} />
        {entity && (
          <>
            <div style={{ width: 1, height: 16, background: darkMode ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)' }} />
            <span style={{
              fontSize: 12, fontWeight: 600, maxWidth: 110,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              color: darkMode ? 'rgba(255,255,255,0.55)' : '#5E3A24',
            }}>
              {entity.name}
            </span>
          </>
        )}
      </div>

      {/* Droite — notifs + toggle */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {user && (
          <div style={ICON_BTN(darkMode)}>
            <NotificationCenter userId={user.id} entityId={user.entity_id} role={user.role} />
          </div>
        )}
        <button onClick={onToggleDark} style={ICON_BTN(darkMode, true)}
          title={darkMode ? 'Mode jour' : 'Mode nuit'}>
          {darkMode ? <SunIcon /> : <MoonIcon />}
        </button>
      </div>
    </div>
  )
}
