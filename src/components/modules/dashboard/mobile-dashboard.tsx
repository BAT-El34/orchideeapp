'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { TrendingUp, FileText, Package, Bell, CreditCard, ShoppingCart, ArrowUpRight } from 'lucide-react'
import { formatFCFA } from '@/lib/utils'

interface Stats {
  totalSalesToday: number
  invoiceCount: number
  lowStockCount: number
  pendingOrders: number
  pendingNotifications: number
  sessionOpen: boolean
}

// Couleurs vives style smart home — sur fond sombre
const PALETTE = {
  forest:  { bg: '#1E5C0F', accent: '#4E8430',  text: '#fff', sub: 'rgba(255,255,255,0.55)' },
  gold:    { bg: '#B5720A', accent: '#E4A528',  text: '#fff', sub: 'rgba(255,255,255,0.55)' },
  orange:  { bg: '#C0430A', accent: '#F06030',  text: '#fff', sub: 'rgba(255,255,255,0.55)' },
  indigo:  { bg: '#3A2F8F', accent: '#7C6EE0',  text: '#fff', sub: 'rgba(255,255,255,0.55)' },
  teal:    { bg: '#0A6B5A', accent: '#00B894',  text: '#fff', sub: 'rgba(255,255,255,0.55)' },
  red:     { bg: '#9B2335', accent: '#E74C3C',  text: '#fff', sub: 'rgba(255,255,255,0.55)' },
  graphite:{ bg: '#2A2F2A', accent: '#5A6B5A',  text: '#fff', sub: 'rgba(255,255,255,0.4)'  },
}

function Tile({
  icon: Icon, label, value, sub, color, href,
  span = 1, delay = 0,
}: {
  icon: React.ElementType
  label: string; value: string; sub?: string
  color: typeof PALETTE[keyof typeof PALETTE]
  href: string
  span?: 1 | 2
  delay?: number
}) {
  const [show, setShow] = useState(false)
  useEffect(() => { const t = setTimeout(() => setShow(true), delay); return () => clearTimeout(t) }, [delay])

  return (
    <Link href={href}
      style={{
        gridColumn: span === 2 ? 'span 2' : 'span 1',
        position: 'relative', overflow: 'hidden',
        borderRadius: 22,
        background: `linear-gradient(145deg, ${color.bg} 0%, ${color.accent} 130%)`,
        padding: '18px 18px 16px',
        minHeight: span === 2 ? 120 : 130,
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        textDecoration: 'none',
        boxShadow: `0 4px 20px ${color.bg}80`,
        opacity: show ? 1 : 0,
        transform: show ? 'scale(1) translateY(0)' : 'scale(0.92) translateY(12px)',
        transition: `opacity 0.38s ease ${delay}ms, transform 0.38s cubic-bezier(0.34,1.2,0.64,1) ${delay}ms, transform 0.12s ease`,
      }}
      className="active:scale-95">

      {/* Cercle déco fond */}
      <div style={{
        position: 'absolute', right: -24, bottom: -24,
        width: 110, height: 110, borderRadius: '50%',
        background: 'rgba(255,255,255,0.07)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', right: 12, top: -18,
        width: 70, height: 70, borderRadius: '50%',
        background: 'rgba(255,255,255,0.05)',
        pointerEvents: 'none',
      }} />

      {/* Icône */}
      <div style={{
        width: 38, height: 38, borderRadius: 12,
        background: 'rgba(255,255,255,0.16)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon size={19} color="white" strokeWidth={2} />
      </div>

      {/* Valeur + label */}
      <div>
        <div style={{
          fontSize: span === 2 ? 26 : 24, fontWeight: 800,
          color: color.text, lineHeight: 1, letterSpacing: '-0.5px',
          fontFamily: 'Georgia, serif',
        }}>
          {value}
        </div>
        <div style={{ fontSize: 12, fontWeight: 600, color: color.text, opacity: 0.85, marginTop: 3 }}>
          {label}
        </div>
        {sub && <div style={{ fontSize: 10, color: color.sub, marginTop: 2 }}>{sub}</div>}
      </div>

      {/* Flèche */}
      <ArrowUpRight size={14} style={{
        position: 'absolute', top: 14, right: 14,
        color: 'rgba(255,255,255,0.4)',
      }} />
    </Link>
  )
}

export function MobileDashboard({ stats, userName, basePath }: {
  stats: Stats; userName: string; basePath: string
}) {
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Bonjour,' : hour < 18 ? 'Bon aprèm,' : 'Bonsoir,'
  const firstName = userName.split(' ')[0]
  const [headerIn, setHeaderIn] = useState(false)
  useEffect(() => { const t = setTimeout(() => setHeaderIn(true), 60); return () => clearTimeout(t) }, [])

  const stockColor = stats.lowStockCount > 0 ? PALETTE.red : PALETTE.teal
  const caisseColor = stats.sessionOpen ? PALETTE.teal : PALETTE.graphite

  return (
    <div style={{ paddingBottom: 100, minHeight: '100%' }}>

      {/* Header "Morning / Wills" style */}
      <div style={{
        marginBottom: 24,
        opacity: headerIn ? 1 : 0,
        transform: headerIn ? 'none' : 'translateY(-8px)',
        transition: 'opacity 0.4s ease, transform 0.4s ease',
      }}>
        <p style={{
          fontSize: 15, fontWeight: 500,
          color: 'var(--text-muted, #8B9E6F)',
          marginBottom: 2, lineHeight: 1,
        }}>
          {greeting}
        </p>
        <h1 style={{
          fontSize: 38, fontWeight: 800, lineHeight: 1.05,
          letterSpacing: '-1px',
          fontFamily: 'Georgia, serif',
          color: 'var(--text-primary, #1E3B10)',
        }}>
          {firstName}
        </h1>
      </div>

      {/* Grille asymétrique — inspirée smart home */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>

        {/* Ventes — pleine largeur en haut */}
        <Tile
          icon={TrendingUp} span={2}
          label="Ventes aujourd'hui"
          value={formatFCFA(stats.totalSalesToday)}
          sub={`${stats.invoiceCount} facture${stats.invoiceCount > 1 ? 's' : ''} validée${stats.invoiceCount > 1 ? 's' : ''}`}
          color={PALETTE.forest}
          href={`${basePath}/factures`}
          delay={0}
        />

        {/* Factures */}
        <Tile
          icon={FileText}
          label="Factures"
          value={stats.invoiceCount.toString()}
          sub="Aujourd'hui"
          color={PALETTE.gold}
          href={`${basePath}/factures`}
          delay={80}
        />

        {/* Commandes */}
        <Tile
          icon={ShoppingCart}
          label="Commandes"
          value={stats.pendingOrders.toString()}
          sub="En attente"
          color={PALETTE.indigo}
          href={`${basePath}/commandes`}
          delay={160}
        />

        {/* Stock — pleine largeur */}
        <Tile
          icon={Package} span={2}
          label={stats.lowStockCount > 0 ? `${stats.lowStockCount} alerte${stats.lowStockCount > 1 ? 's' : ''} stock` : 'Stock en ordre'}
          value={stats.lowStockCount > 0 ? '⚠ Stock bas' : '✓ Tout OK'}
          sub={stats.lowStockCount > 0 ? 'Produits sous le seuil minimum' : 'Aucun produit en rupture'}
          color={stockColor}
          href={`${basePath}/stock`}
          delay={240}
        />

        {/* Notifications */}
        <Tile
          icon={Bell}
          label="Notifications"
          value={stats.pendingNotifications.toString()}
          sub="Non lues"
          color={PALETTE.orange}
          href={`${basePath}/notifications`}
          delay={320}
        />

        {/* Caisse */}
        <Tile
          icon={CreditCard}
          label="Caisse"
          value={stats.sessionOpen ? 'Active' : 'Fermée'}
          sub={stats.sessionOpen ? 'Session en cours' : 'Aucune session'}
          color={caisseColor}
          href={`${basePath}/factures`}
          delay={400}
        />
      </div>
    </div>
  )
}
