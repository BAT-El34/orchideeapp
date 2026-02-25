'use client'

import { useState, useRef, lazy, Suspense, useCallback } from 'react'
import { Brain, Download, Loader2, BarChart2, TrendingUp, Package, CreditCard, Building2, LayoutGrid } from 'lucide-react'
import { formatFCFA, formatDate } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import { ToastContainer } from '@/components/ui/toast-container'

const RechartsBar = lazy(() => import('recharts').then(m => ({
  default: ({ data, xKey, yKey, color, height = 160 }: any) => {
    const { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } = m
    return (
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey={xKey} tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v} />
          <Tooltip formatter={(v: any) => typeof v === 'number' && v > 100 ? formatFCFA(v) : v} contentStyle={{ borderRadius: 4, border: '1px solid #e5e7eb', fontSize: 11 }} />
          <Bar dataKey={yKey} fill={color} radius={[2, 2, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    )
  }
})))

const AXES = [
  { id: 'commercial', label: 'Performance commerciale', icon: TrendingUp },
  { id: 'stock', label: 'Gestion des stocks', icon: Package },
  { id: 'cash', label: 'Activité caissiers et sécurité', icon: CreditCard },
  { id: 'products', label: 'Tendances produits', icon: BarChart2 },
  { id: 'entities', label: 'Comparaison inter-entités', icon: Building2 },
]

interface Entity { id: string; name: string }

interface AnalysePageClientProps {
  entities: Entity[]
}

function Skeleton({ lines = 4 }: { lines?: number }) {
  return <div className="space-y-2">{[...Array(lines)].map((_, i) => <div key={i} className="h-4 rounded-sm bg-gray-100 animate-pulse" style={{ width: `${70 + (i % 3) * 10}%` }} />)}</div>
}

export function AnalysePageClient({ entities }: AnalysePageClientProps) {
  const [from, setFrom] = useState(() => new Date(Date.now() - 30 * 864e5).toISOString().split('T')[0])
  const [to, setTo] = useState(() => new Date().toISOString().split('T')[0])
  const [entityId, setEntityId] = useState('all')
  const [axes, setAxes] = useState<string[]>(['commercial', 'stock'])
  const [loading, setLoading] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [kpiData, setKpiData] = useState<any>(null)
  const [narrative, setNarrative] = useState('')
  const [exportingPdf, setExportingPdf] = useState(false)
  const reportRef = useRef<HTMLDivElement>(null)
  const toast = useToast()

  const toggleAxis = (id: string) => setAxes((prev) => prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id])

  const generate = useCallback(async () => {
    if (axes.length === 0) { toast.error('Sélectionnez au moins un axe'); return }
    setLoading(true)
    setKpiData(null)
    setNarrative('')

    const res = await fetch('/api/analyse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to, entityId, axes }),
    })
    if (!res.ok) { toast.error('Erreur chargement données'); setLoading(false); return }
    const data = await res.json()
    setKpiData(data)
    setLoading(false)

    setAiLoading(true)
    try {
      const aiRes = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          system: `Tu es analyste business expert en retail africain. Génère un rapport d'analyse professionnel structuré en français incluant : résumé exécutif, analyse par axe sélectionné, points forts identifiés, alertes et risques, 3-5 recommandations actionnables prioritisées, conclusion. Données en FCFA. Ton : professionnel et factuel. Format : sections HTML légères avec <h3> et <p>, sans styles inline.`,
          messages: [{ role: 'user', content: `Analyse ces données de gestion commerciale pour la période ${from} au ${to}. Axes analysés: ${axes.join(', ')}.\n\nDonnées:\n${JSON.stringify(data, null, 2)}` }],
        }),
      })
      const aiData = await aiRes.json()
      const text = aiData.content?.map((c: any) => c.text || '').join('') ?? ''
      setNarrative(text)
    } catch {
      setNarrative('<p>Erreur lors de la génération du rapport narratif. Vérifiez la connectivité.</p>')
    }
    setAiLoading(false)
  }, [from, to, entityId, axes])

  const exportPDF = async () => {
    if (!reportRef.current) return
    setExportingPdf(true)
    try {
      const [html2canvasLib, jsPDFLib] = await Promise.all([import('html2canvas'), import('jspdf')])
      const html2canvas = html2canvasLib.default
      const { jsPDF } = jsPDFLib

      const canvas = await html2canvas(reportRef.current, { scale: 2, useCORS: true, backgroundColor: '#ffffff' })
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = pdf.internal.pageSize.getHeight()
      const ratio = canvas.width / canvas.height
      const imgWidth = pdfWidth - 20
      const imgHeight = imgWidth / ratio

      pdf.setFontSize(18)
      pdf.setFont('helvetica', 'bold')
      pdf.text('Orchidée Nature Management System', 10, 15)
      pdf.setFontSize(11)
      pdf.setFont('helvetica', 'normal')
      pdf.text(`Rapport d'analyse — Période : ${formatDate(from)} au ${formatDate(to)}`, 10, 22)
      pdf.setDrawColor(200, 200, 200)
      pdf.line(10, 25, pdfWidth - 10, 25)

      let yPos = 30
      if (yPos + imgHeight > pdfHeight - 15) {
        let remaining = canvas.height
        let srcY = 0
        while (remaining > 0) {
          const sliceH = Math.min(remaining, Math.floor(canvas.width * (pdfHeight - yPos - 15) / imgWidth))
          const sliceCanvas = document.createElement('canvas')
          sliceCanvas.width = canvas.width
          sliceCanvas.height = sliceH
          const ctx = sliceCanvas.getContext('2d')!
          ctx.drawImage(canvas, 0, srcY, canvas.width, sliceH, 0, 0, canvas.width, sliceH)
          if (srcY > 0) { pdf.addPage(); yPos = 10 }
          pdf.addImage(sliceCanvas.toDataURL('image/png'), 'PNG', 10, yPos, imgWidth, (sliceH / canvas.width) * imgWidth)
          srcY += sliceH
          remaining -= sliceH
          yPos = 10
        }
      } else {
        pdf.addImage(imgData, 'PNG', 10, yPos, imgWidth, imgHeight)
      }

      const totalPages = (pdf as any).internal.getNumberOfPages()
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i)
        pdf.setFontSize(8)
        pdf.setTextColor(150)
        pdf.text(`Généré par Orchidée Nature Management System — ${new Date().toLocaleString('fr-FR')}`, 10, pdfHeight - 5)
        pdf.text(`Page ${i} / ${totalPages}`, pdfWidth - 25, pdfHeight - 5)
      }

      pdf.save(`analyse-orchidee-${from}-${to}.pdf`)
      toast.success('PDF exporté avec succès')
    } catch (err) {
      toast.error('Erreur export PDF')
    }
    setExportingPdf(false)
  }

  return (
    <>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-violet-600" />
            <div>
              <h1 className="font-heading text-xl font-bold text-gray-900">Analyse IA</h1>
              <p className="mt-0.5 text-sm text-gray-500">Rapport narratif généré par Claude</p>
            </div>
          </div>
          {kpiData && (
            <button onClick={exportPDF} disabled={exportingPdf}
              className="flex items-center gap-2 rounded-sm bg-gray-900 px-3 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-60 transition-colors">
              {exportingPdf ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              Exporter PDF complet
            </button>
          )}
        </div>

        <div className="rounded-sm border border-gray-200 bg-white p-5 shadow-sm space-y-5">
          <h2 className="text-sm font-semibold text-gray-800">Paramètres d'analyse</h2>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-700">Entité</label>
              <select value={entityId} onChange={(e) => setEntityId(e.target.value)}
                className="h-9 w-full rounded-sm border border-gray-200 px-3 text-sm text-gray-700 focus:border-violet-500 focus:outline-none">
                <option value="all">Toutes les entités</option>
                {entities.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-700">Date début</label>
              <input type="date" value={from} onChange={(e) => setFrom(e.target.value)}
                className="h-9 w-full rounded-sm border border-gray-200 px-3 text-sm focus:border-violet-500 focus:outline-none" />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-700">Date fin</label>
              <input type="date" value={to} onChange={(e) => setTo(e.target.value)}
                className="h-9 w-full rounded-sm border border-gray-200 px-3 text-sm focus:border-violet-500 focus:outline-none" />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-xs font-medium text-gray-700">Axes d'analyse</label>
            <div className="flex flex-wrap gap-2">
              {AXES.map(({ id, label, icon: Icon }) => (
                <button key={id} onClick={() => toggleAxis(id)}
                  className={`flex items-center gap-2 rounded-sm border px-3 py-2 text-xs font-medium transition-colors ${axes.includes(id) ? 'bg-violet-600 border-violet-600 text-white' : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'}`}>
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          <button onClick={generate} disabled={loading || aiLoading || axes.length === 0}
            className="flex items-center gap-2 h-10 rounded-sm bg-violet-600 px-5 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-60 transition-colors">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Brain className="h-4 w-4" />}
            {loading ? 'Chargement des données...' : aiLoading ? 'Génération du rapport...' : 'Générer l\'analyse'}
          </button>
        </div>

        {(loading || kpiData) && (
          <div ref={reportRef} className="space-y-5">
            {loading ? (
              <div className="grid grid-cols-3 gap-3">
                {[...Array(6)].map((_, i) => <div key={i} className="h-20 rounded-sm bg-gray-100 animate-pulse" />)}
              </div>
            ) : kpiData && (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {kpiData.commercial && <>
                    <KpiCard label="Total ventes" value={formatFCFA(kpiData.commercial.totalSell)} sub={`${kpiData.commercial.count} transactions`} color="text-green-700" />
                    <KpiCard label="Marge totale" value={formatFCFA(kpiData.commercial.totalMargin)} sub={`${kpiData.commercial.marginPct}% de marge`} color="text-violet-700" />
                    <KpiCard label="Ticket moyen" value={formatFCFA(parseInt(kpiData.commercial.avgTicket))} color="text-gray-900" />
                  </>}
                  {kpiData.stock && <>
                    <KpiCard label="Produits en rupture" value={kpiData.stock.ruptures} color={kpiData.stock.ruptures > 0 ? 'text-red-700' : 'text-green-700'} />
                    <KpiCard label="Alertes stock" value={kpiData.stock.alerts} color={kpiData.stock.alerts > 0 ? 'text-amber-700' : 'text-green-700'} />
                  </>}
                  {kpiData.cash && <KpiCard label="Écarts caisse critiques" value={kpiData.cash.bigGaps} color={kpiData.cash.bigGaps > 0 ? 'text-red-700' : 'text-green-700'} sub={`Écart moyen: ${kpiData.cash.avgVariance} FCFA`} />}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {kpiData.commercial?.byDay?.length > 0 && (
                    <div className="rounded-sm border border-gray-200 bg-white p-4 shadow-sm">
                      <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3">Ventes journalières</h3>
                      <Suspense fallback={<div className="h-40 bg-gray-50 animate-pulse rounded-sm" />}>
                        <RechartsBar data={kpiData.commercial.byDay} xKey="date" yKey="sales" color="#7C3AED" />
                      </Suspense>
                    </div>
                  )}
                  {kpiData.entities?.length > 1 && (
                    <div className="rounded-sm border border-gray-200 bg-white p-4 shadow-sm">
                      <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3">Comparaison entités</h3>
                      <Suspense fallback={<div className="h-40 bg-gray-50 animate-pulse rounded-sm" />}>
                        <RechartsBar data={kpiData.entities} xKey="name" yKey="sales" color="#EA580C" />
                      </Suspense>
                    </div>
                  )}
                  {kpiData.products?.top5?.length > 0 && (
                    <div className="rounded-sm border border-gray-200 bg-white p-4 shadow-sm">
                      <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3">Top 5 produits</h3>
                      <Suspense fallback={<div className="h-40 bg-gray-50 animate-pulse rounded-sm" />}>
                        <RechartsBar data={kpiData.products.top5} xKey="name" yKey="sales" color="#16A34A" />
                      </Suspense>
                    </div>
                  )}
                  {kpiData.cash?.cashiers && Object.keys(kpiData.cash.cashiers).length > 0 && (
                    <div className="rounded-sm border border-gray-200 bg-white p-4 shadow-sm">
                      <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3">Sessions par caissier</h3>
                      <Suspense fallback={<div className="h-40 bg-gray-50 animate-pulse rounded-sm" />}>
                        <RechartsBar data={Object.entries(kpiData.cash.cashiers).map(([name, count]) => ({ name, count }))} xKey="name" yKey="count" color="#2563EB" />
                      </Suspense>
                    </div>
                  )}
                </div>

                {kpiData.stock?.topAlerts?.length > 0 && (
                  <div className="rounded-sm border border-gray-200 bg-white shadow-sm overflow-hidden">
                    <div className="border-b border-gray-100 bg-gray-50 px-4 py-2.5">
                      <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Produits en alerte stock</span>
                    </div>
                    <table className="w-full text-sm">
                      <thead><tr className="border-b border-gray-100 bg-gray-50">{['Produit', 'Stock actuel', 'Seuil minimum', 'Statut'].map((h) => <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>)}</tr></thead>
                      <tbody className="divide-y divide-gray-100">
                        {kpiData.stock.topAlerts.map((r: any, i: number) => (
                          <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                            <td className="px-4 py-2.5 font-medium text-gray-900">{r.name}</td>
                            <td className="px-4 py-2.5 text-gray-700">{r.qty}</td>
                            <td className="px-4 py-2.5 text-gray-500">{r.threshold}</td>
                            <td className="px-4 py-2.5"><span className={`inline-flex rounded-sm px-1.5 py-0.5 text-xs font-medium ${r.qty <= 0 ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'}`}>{r.qty <= 0 ? 'Rupture' : 'Seuil bas'}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}

            <div className="rounded-sm border border-gray-200 bg-white shadow-sm overflow-hidden">
              <div className="flex items-center gap-2 border-b border-gray-100 bg-gray-50 px-4 py-3">
                <Brain className="h-4 w-4 text-violet-500" />
                <span className="text-sm font-semibold text-gray-800">Rapport narratif IA</span>
                {aiLoading && <span className="text-xs text-gray-400 ml-auto flex items-center gap-1"><Loader2 className="h-3.5 w-3.5 animate-spin" />Génération en cours...</span>}
              </div>
              <div className="p-5">
                {aiLoading ? (
                  <div className="space-y-4">
                    {[6, 4, 5, 3, 5, 4].map((w, i) => <Skeleton key={i} lines={w} />)}
                  </div>
                ) : narrative ? (
                  <div className="prose prose-sm max-w-none text-gray-700 [&_h3]:font-heading [&_h3]:font-bold [&_h3]:text-gray-900 [&_h3]:text-sm [&_h3]:mt-4 [&_h3]:mb-2 [&_p]:text-sm [&_p]:leading-relaxed [&_p]:mb-3 [&_ul]:text-sm [&_li]:mb-1"
                    dangerouslySetInnerHTML={{ __html: narrative }} />
                ) : (
                  <p className="text-sm text-gray-400">Cliquez sur "Générer l'analyse" pour obtenir le rapport.</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
      <ToastContainer />
    </>
  )
}

function KpiCard({ label, value, sub, color = 'text-gray-900' }: { label: string; value: any; sub?: string; color?: string }) {
  return (
    <div className="rounded-sm border border-gray-200 bg-white p-4 shadow-sm">
      <div className="text-xs text-gray-500 mb-1">{label}</div>
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
      {sub && <div className="text-xs text-gray-400 mt-0.5">{sub}</div>}
    </div>
  )
}
