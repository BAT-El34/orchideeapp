import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

function toCSV(rows: Record<string, any>[], columns: string[]): string {
  const header = columns.join(';')
  const lines = rows.map((r) => columns.map((c) => {
    const v = r[c] ?? ''
    const s = String(v).replace(/"/g, '""')
    return s.includes(';') || s.includes('"') || s.includes('\n') ? `"${s}"` : s
  }).join(';'))
  return '\uFEFF' + [header, ...lines].join('\r\n')
}

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type') ?? 'activity'
  const entityId = searchParams.get('entity_id')
  const from = searchParams.get('from') ?? new Date(Date.now() - 30 * 864e5).toISOString().split('T')[0]
  const to = searchParams.get('to') ?? new Date().toISOString().split('T')[0]

  let csv = ''
  let filename = `rapport-${type}-${from}-${to}.csv`

  if (type === 'activity') {
    let q = supabase.from('invoices').select('id, date, total_buy, total_sell, margin, status, users(full_name)').gte('date', from).lte('date', to)
    if (entityId) q = q.eq('entity_id', entityId)
    const { data } = await q
    csv = toCSV((data ?? []).map((r) => ({ id: r.id.slice(0, 8), date: r.date, vendeur: (r.users as any)?.full_name ?? '', achat: r.total_buy, vente: r.total_sell, marge: r.margin, statut: r.status })), ['id', 'date', 'vendeur', 'achat', 'vente', 'marge', 'statut'])
  } else if (type === 'stock') {
    let q = supabase.from('stock').select('quantity, min_threshold, products(name, unit, product_categories(name))')
    if (entityId) q = q.eq('entity_id', entityId)
    const { data } = await q
    csv = toCSV((data ?? []).map((r: any) => ({ produit: r.products?.name, categorie: r.products?.product_categories?.name ?? '', unite: r.products?.unit, stock: r.quantity, seuil_min: r.min_threshold, statut: r.quantity <= 0 ? 'Rupture' : r.quantity <= r.min_threshold ? 'Seuil bas' : 'OK' })), ['produit', 'categorie', 'unite', 'stock', 'seuil_min', 'statut'])
  } else if (type === 'cash') {
    let q = supabase.from('cash_sessions').select('id, opened_at, closed_at, status, opening_amount, closing_amount_declared, closing_amount_calculated, variance, users(full_name)').gte('opened_at', from)
    if (entityId) q = q.eq('entity_id', entityId)
    const { data } = await q
    csv = toCSV((data ?? []).map((r) => ({ id: r.id.slice(0, 8), caissier: (r.users as any)?.full_name ?? '', ouverture: r.opened_at, fermeture: r.closed_at ?? '', statut: r.status, fond: r.opening_amount, declare: r.closing_amount_declared ?? '', calcule: r.closing_amount_calculated ?? '', ecart: r.variance ?? '' })), ['id', 'caissier', 'ouverture', 'fermeture', 'statut', 'fond', 'declare', 'calcule', 'ecart'])
  } else if (type === 'orders') {
    let q = supabase.from('orders').select('id, type, status, delivery_date_requested, created_at, users(full_name)').gte('created_at', from)
    if (entityId) q = q.eq('entity_id', entityId)
    const { data } = await q
    csv = toCSV((data ?? []).map((r) => ({ id: r.id.slice(0, 8), type: r.type, statut: r.status, date: r.created_at, livraison: r.delivery_date_requested ?? '', createur: (r.users as any)?.full_name ?? '' })), ['id', 'type', 'statut', 'date', 'livraison', 'createur'])
  }

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
