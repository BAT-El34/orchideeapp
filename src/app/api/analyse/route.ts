import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (profile?.role !== 'super_admin') return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })

  const { from, to, entityId, axes } = await req.json()

  const buildResult: Record<string, any> = { period: { from, to }, entityId, axes }

  if (axes.includes('commercial')) {
    let q = supabase.from('invoices').select('date, total_buy, total_sell, margin, entity_id').gte('date', from).lte('date', to).eq('status', 'validated')
    if (entityId !== 'all') q = q.eq('entity_id', entityId)
    const { data: inv } = await q
    const totalSell = inv?.reduce((s, i) => s + i.total_sell, 0) ?? 0
    const totalBuy = inv?.reduce((s, i) => s + i.total_buy, 0) ?? 0
    const totalMargin = inv?.reduce((s, i) => s + i.margin, 0) ?? 0
    const byDay: Record<string, number> = {}
    inv?.forEach((i) => { byDay[i.date] = (byDay[i.date] ?? 0) + i.total_sell })
    buildResult.commercial = { totalSell, totalBuy, totalMargin, marginPct: totalBuy > 0 ? ((totalMargin / totalBuy) * 100).toFixed(2) : '0', count: inv?.length ?? 0, avgTicket: (inv?.length ?? 0) > 0 ? (totalSell / inv!.length).toFixed(0) : '0', byDay: Object.entries(byDay).sort(([a], [b]) => a.localeCompare(b)).map(([date, sales]) => ({ date, sales })) }
  }

  if (axes.includes('stock')) {
    let q = supabase.from('stock').select('quantity, min_threshold, entity_id, products(name, unit)')
    if (entityId !== 'all') q = q.eq('entity_id', entityId)
    const { data: stocks } = await q
    const alerts = stocks?.filter((s) => s.quantity <= s.min_threshold && s.quantity > 0).length ?? 0
    const ruptures = stocks?.filter((s) => s.quantity <= 0).length ?? 0
    let movQ = supabase.from('stock_movements').select('type, quantity, created_at').gte('created_at', from).lte('created_at', to)
    if (entityId !== 'all') movQ = movQ.eq('entity_id', entityId)
    const { data: movs } = await movQ
    buildResult.stock = { total: stocks?.length ?? 0, alerts, ruptures, okCount: (stocks?.length ?? 0) - alerts - ruptures, inTotal: movs?.filter((m) => m.type === 'IN').reduce((s, m) => s + m.quantity, 0) ?? 0, outTotal: movs?.filter((m) => m.type === 'OUT').reduce((s, m) => s + m.quantity, 0) ?? 0, topAlerts: stocks?.filter((s) => s.quantity <= s.min_threshold).slice(0, 5).map((s) => ({ name: (s.products as any)?.name, qty: s.quantity, threshold: s.min_threshold })) ?? [] }
  }

  if (axes.includes('cash')) {
    let q = supabase.from('cash_sessions').select('variance, status, opening_amount, closing_amount_calculated, opened_at, users(full_name)').gte('opened_at', from).lte('opened_at', to)
    if (entityId !== 'all') q = q.eq('entity_id', entityId)
    const { data: sessions } = await q
    const closed = sessions?.filter((s) => s.status === 'closed') ?? []
    const totalVariance = closed.reduce((a, s) => a + Math.abs(s.variance ?? 0), 0)
    buildResult.cash = { sessions: sessions?.length ?? 0, closed: closed.length, bigGaps: closed.filter((s) => Math.abs(s.variance ?? 0) > 500).length, totalVariance, avgVariance: closed.length ? (totalVariance / closed.length).toFixed(0) : '0', cashiers: sessions?.reduce((acc: Record<string, number>, s) => { const n = (s.users as any)?.full_name ?? 'Inconnu'; acc[n] = (acc[n] ?? 0) + 1; return acc }, {}) ?? {} }
  }

  if (axes.includes('products')) {
    let q = supabase.from('invoice_lines').select('product_name_snapshot, quantity, total_sell, product_id, invoices!inner(date, entity_id, status)').gte('invoices.date', from).lte('invoices.date', to).eq('invoices.status', 'validated')
    const { data: lines } = await q
    const byProduct: Record<string, { name: string; qty: number; sales: number }> = {}
    lines?.forEach((l) => { byProduct[l.product_id ?? l.product_name_snapshot] = { name: l.product_name_snapshot, qty: (byProduct[l.product_id ?? l.product_name_snapshot]?.qty ?? 0) + l.quantity, sales: (byProduct[l.product_id ?? l.product_name_snapshot]?.sales ?? 0) + l.total_sell } })
    const sorted = Object.values(byProduct).sort((a, b) => b.sales - a.sales)
    buildResult.products = { top5: sorted.slice(0, 5), bottom5: sorted.slice(-5).reverse(), total: sorted.length }
  }

  if (axes.includes('entities')) {
    const { data: allEntities } = await supabase.from('entities').select('id, name, theme_color')
    const entityStats: any[] = []
    for (const ent of allEntities ?? []) {
      const { data: inv } = await supabase.from('invoices').select('total_sell, margin').eq('entity_id', ent.id).gte('date', from).lte('date', to).eq('status', 'validated')
      entityStats.push({ name: ent.name, color: ent.theme_color, sales: inv?.reduce((s, i) => s + i.total_sell, 0) ?? 0, margin: inv?.reduce((s, i) => s + i.margin, 0) ?? 0, count: inv?.length ?? 0 })
    }
    buildResult.entities = entityStats
  }

  return NextResponse.json(buildResult)
}
