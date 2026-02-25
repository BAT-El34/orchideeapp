'use client'

import { useState, useEffect, useCallback, lazy, Suspense } from 'react'
import { BarChart2, TrendingUp, Package, CreditCard, ShoppingCart, Download, FileSpreadsheet, Loader2 } from 'lucide-react'
import { formatFCFA, formatDate } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import { ToastContainer } from '@/components/ui/toast-container'

const RechartsBar = lazy(() => import('recharts').then(m => ({
  default: ({ data, dataKey, barKey, color, height = 180 }: any) => {
    const { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } = m
    return (
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey={dataKey} tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
          <Tooltip formatter={(v: any) => formatFCFA(v)} contentStyle={{ borderRadius: 4, border: '1px solid #e5e7eb', fontSize: 12 }} />
          <Bar dataKey={barKey} fill={color} radius={[2, 2, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    )
  }
})))

const RechartsPie = lazy(() => import('recharts').then(m => ({
  default: ({ data, height = 180 }: any) => {
    const { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } = m
    const COLORS = ['#2C5219', '#C9881A', '#6B8D44', '#5E3A24', '#4E8430', '#A86D13']
    return (
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
            {data.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
          </Pie>
          <Tooltip formatter={(v: any) => formatFCFA(v)} contentStyle={{ borderRadius: 4, border: '1px solid #e5e7eb', fontSize: 12 }} />
        </PieChart>
      </ResponsiveContainer>
    )
  }
})))

const REPORT_TYPES = [
  { id: 'activity', label: 'Activité', icon: TrendingUp },
  { id: 'stock', label: 'Stocks', icon: Package },
  { id: 'cash', label: 'Caissiers', icon: CreditCard },
  { id: 'orders', label: 'Commandes', icon: ShoppingCart },
]

interface ReportsClientProps {
  entityId: string
  role: string
  entities: { id: string; name: string }[]
}

function SkeletonRows() {
  return <>{[...Array(5)].map((_, i) => <tr key={i}><td colSpan={8} className="px-4 py-2.5"><div className="h-4 bg-gray-100 rounded-sm animate-pulse" /></td></tr>)}</>
}

export function ReportsClient({ entityId, role, entities }: ReportsClientProps) {
  const [type, setType] = useState('activity')
  const [from, setFrom] = useState(() => new Date(Date.now() - 30 * 864e5).toISOString().split('T')[0])
  const [to, setTo] = useState(() => new Date().toISOString().split('T')[0])
  const [selectedEntity, setSelectedEntity] = useState(entityId)
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [exportingCsv, setExportingCsv] = useState(false)
  const toast = useToast()

  const load = useCallback(async () => {
    setLoading(true)
    setData(null)
    const params = new URLSearchParams({ type, from, to, entity_id: selectedEntity })
    const res = await fetch(`/api/reports/data?${params}`)
    if (res.ok) setData(await res.json())
    else toast.error('Erreur chargement rapport')
    setLoading(false)
  }, [type, from, to, selectedEntity])

  useEffect(() => { load() }, [load])

  const exportCSV = async () => {
    setExportingCsv(true)
    const params = new URLSearchParams({ type, from, to, entity_id: selectedEntity })
    const res = await fetch(`/api/export/csv?${params}`)
    if (res.ok) {
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = `rapport-${type}-${from}.csv`; a.click()
      URL.revokeObjectURL(url)
    } else toast.error('Erreur export')
    setExportingCsv(false)
  }

  const KPI = ({ label, value, sub, color = 'text-gray-900' }: any) => (
    <div className="rounded-sm border border-gray-200 bg-white p-4 shadow-sm">
      <div className="text-xs text-gray-500 mb-1">{label}</div>
      <div className={`text-xl font-bold ${color}`}>{value}</div>
      {sub && <div className="text-xs text-gray-400 mt-0.5">{sub}</div>}
    </div>
  )

  return (
    <>
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-heading text-xl font-bold text-gray-900">Rapports</h1>
            <p className="mt-0.5 text-sm text-gray-500">Analyses et exports</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={exportCSV} disabled={exportingCsv || loading}
              className="flex items-center gap-2 rounded-sm border border-gray-200 px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors">
              {exportingCsv ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileSpreadsheet className="h-3.5 w-3.5 text-green-600" />}
              Exporter CSV
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {REPORT_TYPES.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setType(id)}
              className={`flex items-center gap-2 rounded-sm px-3 py-2 text-xs font-medium border transition-colors ${type === id ? 'bg-violet-600 border-violet-600 text-white' : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'}`}>
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-3 items-center bg-white rounded-sm border border-gray-200 p-3 shadow-sm">
          {role === 'super_admin' && (
            <select value={selectedEntity} onChange={(e) => setSelectedEntity(e.target.value)}
              className="h-8 rounded-sm border border-gray-200 px-3 text-sm text-gray-700 focus:border-violet-500 focus:outline-none">
              {entities.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
          )}
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-500">Du</label>
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="h-8 rounded-sm border border-gray-200 px-2 text-sm focus:border-violet-500 focus:outline-none" />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-500">Au</label>
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="h-8 rounded-sm border border-gray-200 px-2 text-sm focus:border-violet-500 focus:outline-none" />
          </div>
        </div>

        {loading && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[...Array(4)].map((_, i) => <div key={i} className="h-20 rounded-sm bg-gray-100 animate-pulse" />)}
            </div>
            <div className="h-48 rounded-sm bg-gray-100 animate-pulse" />
          </div>
        )}

        {!loading && data && type === 'activity' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <KPI label="Total ventes" value={formatFCFA(data.summary.totalSell)} color="text-green-700" />
              <KPI label="Total achats" value={formatFCFA(data.summary.totalBuy)} color="text-gray-900" />
              <KPI label="Marge" value={formatFCFA(data.summary.totalMargin)} sub={`${data.summary.marginPct}%`} color="text-forest-700" />
              <KPI label="Transactions" value={data.summary.count} color="text-gray-900" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-sm border border-gray-200 bg-white p-4 shadow-sm">
                <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3">Ventes par jour</h3>
                <Suspense fallback={<div className="h-44 bg-gray-50 animate-pulse rounded-sm" />}>
                  <RechartsBar data={data.byDay} dataKey="date" barKey="sales" color="#2C5219" height={180} />
                </Suspense>
              </div>
              <div className="rounded-sm border border-gray-200 bg-white p-4 shadow-sm">
                <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3">Par vendeur</h3>
                <Suspense fallback={<div className="h-44 bg-gray-50 animate-pulse rounded-sm" />}>
                  <RechartsBar data={data.byUser} dataKey="name" barKey="sales" color="#C9881A" height={180} />
                </Suspense>
              </div>
            </div>

            <div className="rounded-sm border border-gray-200 bg-white shadow-sm overflow-hidden">
              <div className="border-b border-gray-100 bg-gray-50 px-4 py-2.5">
                <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Détail factures</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0">
                    <tr className="border-b border-gray-100 bg-gray-50">
                      {['N°', 'Date', 'Vendeur', 'Achat', 'Vente', 'Marge', 'Lignes'].map((h) => (
                        <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {loading ? <SkeletonRows /> : data.rows?.map((r: any, i: number) => (
                      <tr key={r.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                        <td className="px-4 py-2.5 font-mono text-xs text-gray-400">{r.id}</td>
                        <td className="px-4 py-2.5 text-xs text-gray-600">{formatDate(r.date)}</td>
                        <td className="px-4 py-2.5 text-xs text-gray-700">{r.user}</td>
                        <td className="px-4 py-2.5 text-xs text-gray-600 whitespace-nowrap">{formatFCFA(r.buy)}</td>
                        <td className="px-4 py-2.5 text-xs font-medium text-gray-900 whitespace-nowrap">{formatFCFA(r.sell)}</td>
                        <td className="px-4 py-2.5 text-xs text-green-700 whitespace-nowrap">{formatFCFA(r.margin)}</td>
                        <td className="px-4 py-2.5 text-xs text-gray-500">{r.lines}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {!loading && data && type === 'stock' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <KPI label="Produits suivis" value={data.summary.total} />
              <KPI label="Alertes" value={data.summary.alerts} color="text-amber-700" />
              <KPI label="Ruptures" value={data.summary.ruptures} color="text-red-700" />
              <KPI label="Entrées" value={data.summary.inTotal} color="text-green-700" />
              <KPI label="Sorties" value={data.summary.outTotal} color="text-orange-700" />
            </div>

            <div className="rounded-sm border border-gray-200 bg-white p-4 shadow-sm">
              <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3">Mouvements par type</h3>
              <Suspense fallback={<div className="h-44 bg-gray-50 animate-pulse rounded-sm" />}>
                <RechartsBar data={data.byType} dataKey="type" barKey="qty" color="#2C5219" height={160} />
              </Suspense>
            </div>

            <div className="rounded-sm border border-gray-200 bg-white shadow-sm overflow-hidden">
              <div className="border-b border-gray-100 bg-gray-50 px-4 py-2.5"><span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">État des stocks</span></div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0">
                    <tr className="border-b border-gray-100 bg-gray-50">
                      {['Produit', 'Catégorie', 'Unité', 'Stock', 'Seuil', 'Statut'].map((h) => (
                        <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {data.stocks?.map((r: any, i: number) => (
                      <tr key={r.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                        <td className="px-4 py-2.5 text-xs font-medium text-gray-900">{r.name}</td>
                        <td className="px-4 py-2.5 text-xs text-gray-500">{r.category ?? '—'}</td>
                        <td className="px-4 py-2.5 text-xs text-gray-500">{r.unit}</td>
                        <td className="px-4 py-2.5 text-xs font-medium text-gray-900">{r.qty}</td>
                        <td className="px-4 py-2.5 text-xs text-gray-500">{r.threshold}</td>
                        <td className="px-4 py-2.5">
                          <span className={`inline-flex rounded-sm px-1.5 py-0.5 text-xs font-medium ${r.status === 'rupture' ? 'bg-red-50 text-red-700' : r.status === 'bas' ? 'bg-amber-50 text-amber-700' : 'bg-green-50 text-green-700'}`}>
                            {r.status === 'rupture' ? 'Rupture' : r.status === 'bas' ? 'Seuil bas' : 'OK'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {!loading && data && type === 'cash' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <KPI label="Sessions" value={data.summary.sessions} />
              <KPI label="Total ventes" value={formatFCFA(data.summary.totalSales)} color="text-green-700" />
              <KPI label="Écart total" value={formatFCFA(data.summary.totalVariance)} color="text-red-700" />
              <KPI label="Gros écarts (>500)" value={data.summary.bigGaps} color={data.summary.bigGaps > 0 ? 'text-red-700' : 'text-gray-900'} />
              <KPI label="Écart moyen" value={`${data.summary.avgVariance} FCFA`} />
            </div>

            <div className="rounded-sm border border-gray-200 bg-white p-4 shadow-sm">
              <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3">Ventes par jour (caisse)</h3>
              <Suspense fallback={<div className="h-44 bg-gray-50 animate-pulse rounded-sm" />}>
                <RechartsBar data={data.byDay} dataKey="date" barKey="sales" color="#16A34A" height={160} />
              </Suspense>
            </div>

            <div className="rounded-sm border border-gray-200 bg-white shadow-sm overflow-hidden">
              <div className="border-b border-gray-100 bg-gray-50 px-4 py-2.5"><span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Détail sessions</span></div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0">
                    <tr className="border-b border-gray-100 bg-gray-50">
                      {['N°', 'Caissier', 'Ouverture', 'Statut', 'Fond', 'Ventes', 'Écart'].map((h) => (
                        <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {data.rows?.map((r: any, i: number) => (
                      <tr key={r.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                        <td className="px-4 py-2.5 font-mono text-xs text-gray-400">{r.id}</td>
                        <td className="px-4 py-2.5 text-xs text-gray-700">{r.cashier}</td>
                        <td className="px-4 py-2.5 text-xs text-gray-500 whitespace-nowrap">{r.opened ? formatDate(r.opened) : '—'}</td>
                        <td className="px-4 py-2.5"><span className={`inline-flex rounded-sm px-1.5 py-0.5 text-xs font-medium ${r.status === 'open' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{r.status === 'open' ? 'Ouverte' : 'Fermée'}</span></td>
                        <td className="px-4 py-2.5 text-xs text-gray-600 whitespace-nowrap">{formatFCFA(r.opening)}</td>
                        <td className="px-4 py-2.5 text-xs font-medium text-green-700 whitespace-nowrap">{formatFCFA(r.sales)}</td>
                        <td className={`px-4 py-2.5 text-xs font-medium whitespace-nowrap ${Math.abs(r.variance ?? 0) > 500 ? 'text-red-700' : Math.abs(r.variance ?? 0) > 100 ? 'text-amber-700' : 'text-gray-500'}`}>
                          {r.variance !== null ? `${r.variance >= 0 ? '+' : ''}${formatFCFA(r.variance)}` : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {!loading && data && type === 'orders' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <KPI label="Total commandes" value={data.summary.total} />
              <KPI label="En attente" value={data.summary.pending} color="text-amber-700" />
              <KPI label="Livrées" value={data.summary.delivered} color="text-green-700" />
              <KPI label="Annulées" value={data.summary.cancelled} color="text-red-700" />
              <KPI label="Automatiques" value={data.summary.auto} color="text-forest-700" />
            </div>

            <div className="rounded-sm border border-gray-200 bg-white p-4 shadow-sm">
              <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3">Répartition par statut</h3>
              <Suspense fallback={<div className="h-44 bg-gray-50 animate-pulse rounded-sm" />}>
                <RechartsBar data={data.byStatus} dataKey="status" barKey="count" color="#2C5219" height={160} />
              </Suspense>
            </div>

            <div className="rounded-sm border border-gray-200 bg-white shadow-sm overflow-hidden">
              <div className="border-b border-gray-100 bg-gray-50 px-4 py-2.5"><span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Détail commandes</span></div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0">
                    <tr className="border-b border-gray-100 bg-gray-50">
                      {['N°', 'Type', 'Statut', 'Date', 'Livraison souhaitée', 'Créateur', 'Lignes'].map((h) => (
                        <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {data.rows?.map((r: any, i: number) => (
                      <tr key={r.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                        <td className="px-4 py-2.5 font-mono text-xs text-gray-400">{r.id}</td>
                        <td className="px-4 py-2.5"><span className={`inline-flex rounded-sm px-1.5 py-0.5 text-xs font-medium ${r.type === 'AUTO' ? 'bg-purple-50 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>{r.type === 'AUTO' ? 'Auto' : 'Manuel'}</span></td>
                        <td className="px-4 py-2.5 text-xs text-gray-600">{r.status}</td>
                        <td className="px-4 py-2.5 text-xs text-gray-500 whitespace-nowrap">{formatDate(r.date)}</td>
                        <td className="px-4 py-2.5 text-xs text-gray-500">{r.delivery ? formatDate(r.delivery) : '—'}</td>
                        <td className="px-4 py-2.5 text-xs text-gray-700">{r.user ?? '—'}</td>
                        <td className="px-4 py-2.5 text-xs text-gray-500">{r.lines}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
      <ToastContainer />
    </>
  )
}
