'use client'

import { useState } from 'react'
import { Plus, FileText, Eye, TrendingUp } from 'lucide-react'
import { formatFCFA, formatDateTime } from '@/lib/utils'
import Link from 'next/link'
import type { Invoice, UserRole } from '@/types'

const STATUS_CFG = {
  draft:     { label: 'Brouillon', cls: 'bg-gold-50 text-gold-700' },
  validated: { label: 'Validée',   cls: 'bg-forest-50 text-forest-700' },
  cancelled: { label: 'Annulée',   cls: 'bg-red-50 text-red-700' },
}

interface InvoicesListProps {
  invoices: (Invoice & { users?: { full_name: string } })[]
  role: UserRole
  newHref: string
}

export function InvoicesList({ invoices, role, newHref }: InvoicesListProps) {
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')

  const filtered = invoices.filter((i) => {
    const matchStatus = !statusFilter || i.status === statusFilter
    const matchSearch = !search || i.reference?.toLowerCase().includes(search.toLowerCase()) || i.users?.full_name?.toLowerCase().includes(search.toLowerCase())
    return matchStatus && matchSearch
  })

  const totalValidated = invoices.filter((i) => i.status === 'validated').reduce((s, i) => s + i.total_sell, 0)

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-forest-800">Factures</h1>
          <p className="text-sm text-bark-500">
            {filtered.length} facture{filtered.length !== 1 ? 's' : ''}
            <span className="ml-2 text-bark-400">·</span>
            <span className="ml-2 text-forest-700 font-medium">{formatFCFA(totalValidated)} validées</span>
          </p>
        </div>
        <Link href={newHref}
          className="btn-primary">
          <Plus className="h-4 w-4" /> Nouvelle facture
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Référence, vendeur..."
          className="h-9 flex-1 min-w-40 max-w-xs rounded-sm border border-cream-400 px-3 text-sm focus:border-forest-500 focus:outline-none" />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          className="h-9 rounded-sm border border-cream-400 px-3 text-sm bg-white focus:border-forest-500 focus:outline-none">
          <option value="">Tous les statuts</option>
          <option value="draft">Brouillon</option>
          <option value="validated">Validée</option>
          <option value="cancelled">Annulée</option>
        </select>
      </div>

      {/* Desktop table */}
      <div className="hidden md:block rounded-sm border border-cream-400 bg-white shadow-botanical overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-cream-300 bg-forest-50">
              {['Référence','Vendeur','Date','Total HT','Marge','Statut','Actions'].map((h) => (
                <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-forest-600 uppercase tracking-wide whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-cream-200">
            {filtered.map((inv, i) => {
              const cfg = STATUS_CFG[inv.status as keyof typeof STATUS_CFG] ?? STATUS_CFG.draft
              const marginPct = inv.total_buy > 0 ? ((inv.margin / inv.total_buy) * 100).toFixed(1) : '—'
              return (
                <tr key={inv.id} className={`hover:bg-cream-50 transition-colors ${i % 2 === 0 ? 'bg-white' : 'bg-cream-50/30'}`}>
                  <td className="px-4 py-2.5 font-mono text-xs font-semibold text-forest-700">{inv.reference}</td>
                  <td className="px-4 py-2.5 text-xs text-bark-600">{inv.users?.full_name ?? '—'}</td>
                  <td className="px-4 py-2.5 text-xs text-bark-500 whitespace-nowrap">{formatDateTime(inv.created_at)}</td>
                  <td className="px-4 py-2.5 text-sm font-semibold text-forest-900 whitespace-nowrap">{formatFCFA(inv.total_sell)}</td>
                  <td className="px-4 py-2.5">
                    <span className={`text-xs font-medium ${inv.margin >= 0 ? 'text-forest-600' : 'text-red-600'}`}>
                      {formatFCFA(inv.margin)} ({marginPct}%)
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    <span className={`inline-flex rounded-sm px-1.5 py-0.5 text-xs font-medium ${cfg.cls}`}>{cfg.label}</span>
                  </td>
                  <td className="px-4 py-2.5">
                    <Link href={`${newHref.replace('/nouvelle', '')}/${inv.id}`}
                      className="inline-flex items-center gap-1 rounded-sm border border-cream-400 px-2 py-1 text-xs text-bark-600 hover:bg-cream-100 transition-colors">
                      <Eye className="h-3 w-3" /> Voir
                    </Link>
                  </td>
                </tr>
              )
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-sm text-bark-400">Aucune facture</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {filtered.map((inv) => {
          const cfg = STATUS_CFG[inv.status as keyof typeof STATUS_CFG] ?? STATUS_CFG.draft
          return (
            <div key={inv.id} className="rounded-sm border border-cream-400 bg-white p-4 shadow-botanical">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-mono text-sm font-semibold text-forest-700">{inv.reference}</p>
                  <p className="text-xs text-bark-400">{inv.users?.full_name ?? '—'} · {formatDateTime(inv.created_at)}</p>
                </div>
                <span className={`inline-flex rounded-sm px-1.5 py-0.5 text-xs font-medium ${cfg.cls}`}>{cfg.label}</span>
              </div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-lg font-bold text-forest-900">{formatFCFA(inv.total_sell)}</span>
                <span className={`text-xs font-medium flex items-center gap-1 ${inv.margin >= 0 ? 'text-forest-600' : 'text-red-600'}`}>
                  <TrendingUp className="h-3 w-3" /> {formatFCFA(inv.margin)}
                </span>
              </div>
              <Link href={`${newHref.replace('/nouvelle', '')}/${inv.id}`}
                className="flex items-center justify-center gap-2 w-full rounded-sm border border-cream-400 py-2 text-sm text-bark-600 hover:bg-cream-100 transition-colors">
                <Eye className="h-4 w-4" /> Voir la facture
              </Link>
            </div>
          )
        })}
        {filtered.length === 0 && (
          <div className="flex flex-col items-center py-12 text-bark-400">
            <FileText className="h-8 w-8 mb-2 opacity-40" />
            <p className="text-sm">Aucune facture</p>
          </div>
        )}
      </div>
    </div>
  )
}
