import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { entity_id, date } = await req.json()
  const reportDate = date ?? new Date().toISOString().split('T')[0]

  const [{ data: invoices }, { data: cashMovements }] = await Promise.all([
    supabase
      .from('invoices')
      .select('total_sell, status')
      .eq('entity_id', entity_id)
      .eq('date', reportDate)
      .eq('status', 'validated'),
    supabase
      .from('cash_movements')
      .select('type, amount, cash_sessions!inner(entity_id, status)')
      .eq('cash_sessions.entity_id', entity_id),
  ])

  const totalSales = invoices?.reduce((s, i) => s + i.total_sell, 0) ?? 0
  const nbTransactions = invoices?.length ?? 0
  const totalExpenses = cashMovements?.filter((m) => m.type === 'EXPENSE').reduce((s, m) => s + m.amount, 0) ?? 0
  const nbReturns = cashMovements?.filter((m) => m.type === 'REFUND').length ?? 0

  const { data: existing } = await supabase
    .from('daily_reports')
    .select('id')
    .eq('entity_id', entity_id)
    .eq('date', reportDate)
    .single()

  const payload = {
    entity_id,
    user_id: user.id,
    date: reportDate,
    total_sales: totalSales,
    total_expenses: totalExpenses,
    nb_transactions: nbTransactions,
    nb_returns: nbReturns,
  }

  let report
  if (existing) {
    const { data } = await supabase.from('daily_reports').update(payload).eq('id', existing.id).select().single()
    report = data
  } else {
    const { data } = await supabase.from('daily_reports').insert(payload).select().single()
    report = data
  }

  await supabase.from('notifications').insert({
    entity_id,
    from_user_id: user.id,
    to_role: 'admin',
    type: 'REPORT',
    message: `Rapport ${reportDate} — Ventes: ${new Intl.NumberFormat('fr-FR').format(totalSales)} FCFA | ${nbTransactions} transaction(s)`,
    reference_id: report?.id,
    channel: 'in_app',
    status: 'pending',
  })

  return NextResponse.json(report)
}

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const entityId = searchParams.get('entity_id')

  let query = supabase
    .from('daily_reports')
    .select('*')
    .order('date', { ascending: false })
    .limit(90)

  if (entityId) query = query.eq('entity_id', entityId)

  const { data } = await query
  return NextResponse.json(data ?? [])
}
