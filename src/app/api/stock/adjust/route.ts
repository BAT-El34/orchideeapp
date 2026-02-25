import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { product_id, entity_id, type, quantity, reference } = await req.json()

  const { data: stock } = await supabase
    .from('stock')
    .select('id, quantity')
    .eq('product_id', product_id)
    .eq('entity_id', entity_id)
    .single()

  let newQty = quantity
  if (type === 'IN') newQty = (stock?.quantity ?? 0) + quantity
  if (type === 'OUT') newQty = Math.max(0, (stock?.quantity ?? 0) - quantity)

  if (stock) {
    await supabase.from('stock').update({ quantity: newQty, updated_at: new Date().toISOString() }).eq('id', stock.id)
  } else {
    await supabase.from('stock').insert({ product_id, entity_id, quantity: newQty, min_threshold: 0 })
  }

  await supabase.from('stock_movements').insert({
    product_id,
    entity_id,
    type,
    quantity,
    reference: reference || null,
    user_id: user.id,
  })

  await supabase.from('audit_logs').insert({
    user_id: user.id,
    entity_id,
    action: 'stock_adjustment',
    resource: 'stock',
    resource_id: product_id,
    new_value: { type, quantity: newQty, reference },
  })

  return NextResponse.json({ success: true, new_quantity: newQty })
}
