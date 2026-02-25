'use client'

import { useEffect, useState } from 'react'

/* ─── Barre de progression navigation ───────────────────── */
export function ProgressVine({ progress }: { progress: number }) {
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999,
      height: 3, background: 'rgba(44,82,25,0.12)',
    }}>
      <div style={{
        height: '100%',
        width: `${progress}%`,
        background: 'linear-gradient(90deg, #2C5219, #C9881A)',
        transition: 'width 0.25s ease-out',
        borderRadius: '0 2px 2px 0',
      }} />
    </div>
  )
}

/* ─── Loader plein écran ─────────────────────────────────── */
export function PageLoader({
  message = 'Chargement',
}: {
  message?: string
  submessage?: string
}) {
  const [dots, setDots] = useState(0)
  const [bar, setBar]   = useState(15)

  useEffect(() => {
    // Points clignotants
    const d = setInterval(() => setDots((n) => (n + 1) % 4), 400)
    // Barre simulée
    const b1 = setTimeout(() => setBar(45),  300)
    const b2 = setTimeout(() => setBar(70),  700)
    const b3 = setTimeout(() => setBar(88), 1200)
    return () => { clearInterval(d); clearTimeout(b1); clearTimeout(b2); clearTimeout(b3) }
  }, [])

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 50,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: '#FAF7F0', gap: 28,
    }}>
      {/* Logo */}
      <img
        src="/logo-orchidee.png"
        alt="Orchidée"
        style={{ height: 72, width: 'auto', objectFit: 'contain' }}
      />

      {/* Texte */}
      <div style={{ textAlign: 'center' }}>
        <p style={{
          fontFamily: 'Georgia, serif',
          fontSize: 18, fontWeight: 600,
          color: '#1E3B10', letterSpacing: '0.01em',
        }}>
          {message}
          <span style={{ display: 'inline-block', width: 24, textAlign: 'left', color: '#C9881A' }}>
            {'.'.repeat(dots)}
          </span>
        </p>
      </div>

      {/* Barre */}
      <div style={{
        width: 160, height: 3, borderRadius: 4,
        background: 'rgba(44,82,25,0.12)', overflow: 'hidden',
      }}>
        <div style={{
          height: '100%', borderRadius: 4,
          background: 'linear-gradient(90deg, #2C5219, #C9881A)',
          width: `${bar}%`,
          transition: 'width 0.5s ease-out',
        }} />
      </div>

      {/* Trois feuilles animées — CSS pur, pas de SVG complexe */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        {[0, 1, 2].map((i) => (
          <div key={i} style={{
            width: 8, height: 14, borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%',
            background: i === 1 ? '#C9881A' : '#2C5219',
            opacity: 0.7,
            animation: `leaf-bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
          }} />
        ))}
      </div>

      <style>{`
        @keyframes leaf-bounce {
          0%, 100% { transform: translateY(0) rotate(-8deg); opacity: 0.5; }
          50%       { transform: translateY(-8px) rotate(8deg); opacity: 0.9; }
        }
      `}</style>
    </div>
  )
}

/* ─── Skeletons ──────────────────────────────────────────── */
export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="rounded-sm border border-cream-400 bg-white overflow-hidden animate-pulse">
      <div className="h-10 bg-forest-50 border-b border-cream-400 flex items-center px-4 gap-4">
        {[40,25,20,15].map((w, i) => (
          <div key={i} className="h-3 rounded-sm bg-forest-100" style={{ width: `${w}%` }} />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-12 border-b border-cream-200 flex items-center px-4 gap-4"
          style={{ opacity: 1 - i * 0.12 }}>
          {[35,20,25,12].map((w, j) => (
            <div key={j} className="h-2.5 rounded-sm bg-cream-300" style={{ width: `${w}%` }} />
          ))}
        </div>
      ))}
    </div>
  )
}

export function CardsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 animate-pulse">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-xl border border-cream-400 bg-white p-4 space-y-2"
          style={{ opacity: 1 - i * 0.1 }}>
          <div className="h-2 w-16 rounded-sm bg-cream-300" />
          <div className="h-6 w-24 rounded-sm bg-cream-400" />
          <div className="h-2 w-20 rounded-sm bg-cream-200" />
        </div>
      ))}
    </div>
  )
}

export function InlineLoader({ size = 'sm' }: { size?: 'sm' | 'md' }) {
  const s = size === 'sm' ? 16 : 24
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" className="animate-spin"
      style={{ animationDuration: '1s' }}>
      {[0,60,120,180,240,300].map((deg, i) => (
        <circle key={i} cx="12" cy="4" r="2.5"
          fill="#2C5219" opacity={0.15 + i * 0.14}
          transform={`rotate(${deg} 12 12)`} />
      ))}
    </svg>
  )
}
