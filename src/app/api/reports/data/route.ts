import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type') ?? 'activity'
  const entityId = searchParams.get('entity_id')
  const from = searchParams.get('from') ?? new Date(Date.now() - 30 * 864e5).toISOString().split('T')[0]
  const to = searchParams.get('to') ?? new Date().toISOString().split('T')[0]
  const userId = searchParams.get('user_id')
  const categoryId = searchParams.get('category_id')

  if (type === 'activity') {
    let q = supabase.from('invoices').select('*, users(full_name), invoice_lines(*, products(name, category_id))')
      .gte('date', from).lte('date', to).eq('status', 'validated')
    if (entityId) q = q.eq('entity_id', entityId)
    if (userId) q = q.eq('user_id', userId)
    const { data } = await q

    const byDay: Record<string, { sales: number; buy: number; count: number }> = {}
    const byUser: Record<string, { name: string; sales: number; count: number }> = {}
    const byCategory: Record<string, { name: string; sales: number }> = {}
    let totalSell = 0, totalBuy = 0, totalMargin = 0

    data?.forEach((inv) => {
      totalSell += inv.total_sell; totalBuy += inv.total_buy; totalMargin += inv.margin
      byDay[inv.date] = { sales: (byDay[inv.date]?.sales ?? 0) + inv.total_sell, buy: (byDay[inv.date]?.buy ?? 0) + inv.total_buy, count: (byDay[inv.date]?.count ?? 0) + 1 }
      const uName = (inv.users as any)?.full_name ?? 'Inconnu'
      const uid = inv.user_id ?? 'unknown'
      byUser[uid] = { name: uName, sales: (byUser[uid]?.sales ?? 0) + inv.total_sell, count: (byUser[uid]?.count ?? 0) + 1 }
      inv.invoice_lines?.forEach((line: any) => {
        const catId = line.products?.category_id ?? 'uncategorized'
        byCategory[catId] = { name: catId, sales: (byCategory[catId]?.sales ?? 0) + line.total_sell }
      })
    })

    return NextResponse.json({
      summary: { totalSell, totalBuy, totalMargin, count: data?.length ?? 0, marginPct: totalBuy > 0 ? ((totalMargin / totalBuy) * 100).toFixed(1) : '0' },
      byDay: Object.entries(byDay).sort(([a], [b]) => a.localeCompare(b)).map(([date, v]) => ({ date, ...v })),
      byUser: Object.values(byUser).sort((a, b) => b.sales - a.sales),
      byCategory: Object.values(byCategory).sort((a, b) => b.sales - a.sales),
      rows: data?.map((inv) => ({ id: inv.id.slice(0, 8), date: inv.date, user: (inv.users as any)?.full_name, sell: inv.total_sell, buy: inv.total_buy, margin: inv.margin, lines: inv.invoice_lines?.length })),
    })
  }

  if (type === 'stock') {
    let sqStock = supabase.from('stock').select('*, products(name, unit, product_categories(name))')
    if (entityId) sqStock = sqStock.eq('entity_id', entityId)
    let sqMov = supabase.from('stock_movements').select('*, products(name), users(full_name)').gte('created_at', from).lte('created_at', to)
    if (entityId) sqMov = sqMov.eq('entity_id', entityId)

    const [{ data: stocks }, { data: movements }] = await Promise.all([sqStock, sqMov])
    const inTotal = movements?.filter((m) => m.type === 'IN').reduce((s, m) => s + m.quantity, 0) ?? 0
    const outTotal = movements?.filter((m) => m.type === 'OUT').reduce((s, m) => s + m.quantity, 0) ?? 0
    const alerts = stocks?.filter((s) => s.quantity <= s.min_threshold).length ?? 0
    const ruptures = stocks?.filter((s) => s.quantity <= 0).length ?? 0

    return NextResponse.json({
      summary: { total: stocks?.length, alerts, ruptures, inTotal, outTotal },
      stocks: stocks?.map((s) => ({ id: s.id, name: (s.products as any)?.name, category: (s.products as any)?.product_categories?.name, qty: s.quantity, threshold: s.min_threshold, unit: (s.products as any)?.unit, status: s.quantity <= 0 ? 'rupture' : s.quantity <= s.min_threshold ? 'bas' : 'ok' })),
      movements: movements?.slice(0, 100).map((m) => ({ id: m.id, type: m.type, qty: m.quantity, product: (m.products as any)?.name, user: (m.users as any)?.full_name, ref: m.reference, date: m.created_at })),
      byType: [
        { type: 'IN', count: movements?.filter((m) => m.type === 'IN').length ?? 0, qty: inTotal },
        { type: 'OUT', count: movements?.filter((m) => m.type === 'OUT').length ?? 0, qty: outTotal },
        { type: 'ADJUSTMENT', count: movements?.filter((m) => m.type === 'ADJUSTMENT').length ?? 0, qty: 0 },
      ],
    })
  }

  if (type === 'cash') {
    let q = supabase.from('cash_sessions').select('*, users(full_name), cash_movements(*)')
      .gte('opened_at', from).lte('opened_at', to)
    if (entityId) q = q.eq('entity_id', entityId)
    const { data: sessions } = await q

    const rows = sessions?.map((s) => {
      const movs: any[] = (s as any).cash_movements ?? []
      const sales = movs.filter((m) => m.type === 'SALE').reduce((a, m) => a + m.amount, 0)
      const exp = movs.filter((m) => m.type === 'EXPENSE').reduce((a, m) => a + m.amount, 0)
      return { id: s.id.slice(0, 8), cashier: (s.users as any)?.full_name, opened: s.opened_at, closed: s.closed_at, status: s.status, opening: s.opening_amount, declared: s.closing_amount_declared, calculated: s.closing_amount_calculated, variance: s.variance, sales, expenses: exp, nb: movs.filter((m) => m.type === 'SALE').length }
    }) ?? []

    const totalSales = rows.reduce((a, r) => a + r.sales, 0)
    const totalVariance = rows.filter((r) => r.variance !== null).reduce((a, r) => a + Math.abs(r.variance ?? 0), 0)
    const bigGaps = rows.filter((r) => Math.abs(r.variance ?? 0) > 500).length

    return NextResponse.json({
      summary: { sessions: rows.length, totalSales, totalVariance, bigGaps, avgVariance: rows.length ? (totalVariance / rows.length).toFixed(0) : '0' },
      rows,
      byDay: Object.entries(rows.reduce((acc: Record<string, number>, r) => {
        const d = r.opened.split('T')[0]; acc[d] = (acc[d] ?? 0) + r.sales; return acc
      }, {})).sort(([a], [b]) => a.localeCompare(b)).map(([date, sales]) => ({ date, sales })),
    })
  }

  if (type === 'orders') {
    let q = supabase.from('orders').select('*, order_lines(*, products(name)), users(full_name)').gte('created_at', from).lte('created_at', to)
    if (entityId) q = q.eq('entity_id', entityId)
    const { data: orders } = await q

    const byStatus: Record<string, number> = {}
    orders?.forEach((o) => { byStatus[o.status] = (byStatus[o.status] ?? 0) + 1 })

    return NextResponse.json({
      summary: { total: orders?.length ?? 0, pending: byStatus.pending_validation ?? 0, delivered: byStatus.delivered ?? 0, cancelled: byStatus.cancelled ?? 0, auto: orders?.filter((o) => o.type === 'AUTO').length ?? 0 },
      byStatus: Object.entries(byStatus).map(([status, count]) => ({ status, count })),
      rows: orders?.map((o) => ({ id: o.id.slice(0, 8), type: o.type, status: o.status, lines: o.order_lines?.length, date: o.created_at, delivery: o.delivery_date_requested, user: (o.users as any)?.full_name })),
    })
  }

  return NextResponse.json({ error: 'Type inconnu' }, { status: 400 })
}
