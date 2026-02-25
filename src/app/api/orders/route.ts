import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { lines, ...orderData } = await req.json()

  const { data: order, error } = await supabase.from('orders').insert(orderData).select().single()
  if (error) return NextResponse.json({ error }, { status: 500 })

  if (lines?.length) {
    await supabase.from('order_lines').insert(lines.map((l: any) => ({ ...l, order_id: order.id })))
  }

  await supabase.from('notifications').insert({
    entity_id: orderData.entity_id,
    from_user_id: user.id,
    to_role: 'admin',
    type: 'ORDER',
    message: `Nouvelle commande manuelle — ${lines?.length ?? 0} produit(s) — Livraison: ${orderData.delivery_date_requested ?? 'Non définie'}`,
    reference_id: order.id,
    channel: 'in_app',
    status: 'pending',
  })

  return NextResponse.json({ id: order.id })
}

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const entityId = searchParams.get('entity_id')
  const status = searchParams.get('status')

  let query = supabase
    .from('orders')
    .select('*, order_lines(*), users(full_name)')
    .order('created_at', { ascending: false })

  if (entityId) query = query.eq('entity_id', entityId)
  if (status) query = query.eq('status', status)

  const { data } = await query
  return NextResponse.json(data ?? [])
}
