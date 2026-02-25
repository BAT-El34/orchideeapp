'use client'

import { useEffect } from 'react'

interface ThemeConfig {
  color_primary: string
  color_accent: string
  color_bg: string
  color_surface: string
  color_text: string
  color_sidebar: string
  font_heading: string
  font_body: string
  border_radius: string
  sidebar_style: string
}

const DEFAULTS: ThemeConfig = {
  color_primary: '#2C5219',
  color_accent: '#C9881A',
  color_bg: '#FAF7F0',
  color_surface: '#FFFFFF',
  color_text: '#1E3B10',
  color_sidebar: '#1E3B10',
  font_heading: 'Cormorant Garamond',
  font_body: 'DM Sans',
  border_radius: 'sharp',
  sidebar_style: 'dark',
}

function hexToHsl(hex: string): [number, number, number] {
  const clean = hex.replace('#', '')
  const r = parseInt(clean.slice(0, 2), 16) / 255
  const g = parseInt(clean.slice(2, 4), 16) / 255
  const b = parseInt(clean.slice(4, 6), 16) / 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  let h = 0, s = 0
  const l = (max + min) / 2
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
      case g: h = ((b - r) / d + 2) / 6; break
      case b: h = ((r - g) / d + 4) / 6; break
    }
  }
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)]
}

export function applyTheme(theme: Partial<ThemeConfig>) {
  const t = { ...DEFAULTS, ...theme }
  const root = document.documentElement
  root.style.setProperty('--color-primary', t.color_primary)
  root.style.setProperty('--color-accent', t.color_accent)
  root.style.setProperty('--color-bg', t.color_bg)
  root.style.setProperty('--color-surface', t.color_surface)
  root.style.setProperty('--color-text', t.color_text)
  root.style.setProperty('--color-sidebar', t.color_sidebar)
  try {
    const [h, s] = hexToHsl(t.color_primary)
    const pShades: Record<string, number> = { 50: 96, 100: 92, 200: 84, 300: 70, 400: 55, 500: 42, 600: 34, 700: 27, 800: 19, 900: 12 }
    Object.entries(pShades).forEach(([shade, lightness]) => {
      root.style.setProperty(`--forest-${shade}`, `hsl(${h}, ${Math.min(s + 5, 100)}%, ${lightness}%)`)
    })
  } catch {}
  try {
    const [h, s] = hexToHsl(t.color_accent)
    const aShades: Record<string, number> = { 50: 97, 100: 94, 200: 86, 300: 73, 400: 60, 500: 50, 600: 42, 700: 33 }
    Object.entries(aShades).forEach(([shade, lightness]) => {
      root.style.setProperty(`--gold-${shade}`, `hsl(${h}, ${s}%, ${lightness}%)`)
    })
  } catch {}
  root.style.setProperty('--font-heading', `"${t.font_heading}", Georgia, serif`)
  root.style.setProperty('--font-body', `"${t.font_body}", system-ui, sans-serif`)
  const radiusMap: Record<string, string> = { sharp: '2px', soft: '4px', rounded: '8px' }
  root.style.setProperty('--radius', radiusMap[t.border_radius] ?? '2px')
  root.style.setProperty('--sidebar-style', t.sidebar_style)
}

// ✅ Accepte theme= ET initialTheme= (compatibilité toutes versions)
export function ThemeProvider(props: {
  initialTheme?: Partial<ThemeConfig> | null
  theme?: Partial<ThemeConfig> | null
}) {
  useEffect(() => {
    const t = props.initialTheme ?? props.theme
    if (t) applyTheme(t)
    fetch('/api/theme')
      .then((r) => r.ok ? r.json() : null)
      .then((remote) => { if (remote) applyTheme(remote) })
      .catch(() => {})
  }, [])
  return null
}
