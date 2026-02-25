import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const body = await req.json()
  const { lines, ...invoiceData } = body

  const { data: invoice, error } = await supabase
    .from('invoices')
    .insert(invoiceData)
    .select()
    .single()

  if (error || !invoice) return NextResponse.json({ error: 'Erreur création facture' }, { status: 500 })

  if (lines?.length) {
    await supabase.from('invoice_lines').insert(
      lines.map((l: any) => ({ ...l, invoice_id: invoice.id }))
    )
  }

  if (invoiceData.status === 'validated') {
    for (const line of lines ?? []) {
      const { data: stock } = await supabase
        .from('stock')
        .select('id, quantity')
        .eq('product_id', line.product_id)
        .eq('entity_id', invoiceData.entity_id)
        .single()

      if (stock) {
        const newQty = Math.max(0, stock.quantity - line.quantity)
        await supabase.from('stock').update({ quantity: newQty, updated_at: new Date().toISOString() }).eq('id', stock.id)
        await supabase.from('stock_movements').insert({
          product_id: line.product_id,
          entity_id: invoiceData.entity_id,
          type: 'OUT',
          quantity: line.quantity,
          reference: `FAC-${invoice.id.slice(0, 8)}`,
          user_id: user.id,
        })

        const { data: threshold } = await supabase
          .from('stock_thresholds')
          .select('*')
          .eq('product_id', line.product_id)
          .eq('entity_id', invoiceData.entity_id)
          .eq('active', true)
          .single()

        if (threshold && newQty <= threshold.min_stock) {
          if (threshold.auto_order) {
            const orderStatus = threshold.manual_validation_required ? 'pending_validation' : 'sent'
            const { data: order } = await supabase.from('orders').insert({
              entity_id: invoiceData.entity_id,
              user_id: user.id,
              type: 'AUTO',
              status: orderStatus,
            }).select().single()

            if (order) {
              await supabase.from('order_lines').insert({
                order_id: order.id,
                product_id: line.product_id,
                product_name_snapshot: line.product_name_snapshot,
                quantity_ordered: threshold.reorder_qty,
              })
              await supabase.from('notifications').insert({
                entity_id: invoiceData.entity_id,
                from_user_id: user.id,
                to_role: 'admin',
                type: 'ORDER',
                message: `Commande automatique créée pour ${line.product_name_snapshot} (stock: ${newQty})`,
                reference_id: order.id,
                channel: 'in_app',
                status: 'pending',
              })
            }
          } else {
            await supabase.from('notifications').insert({
              entity_id: invoiceData.entity_id,
              from_user_id: user.id,
              to_role: 'manager',
              type: 'ALERT',
              message: `Stock bas pour ${line.product_name_snapshot} (${newQty} restant — seuil: ${threshold.min_stock})`,
              reference_id: line.product_id,
              channel: 'in_app',
              status: 'pending',
            })
          }
        }
      }
    }
  }

  return NextResponse.json({ id: invoice.id, status: invoice.status })
}

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const entityId = searchParams.get('entity_id')
  const limit = parseInt(searchParams.get('limit') ?? '20')

  let query = supabase
    .from('invoices')
    .select('*, invoice_lines(*), users(full_name)')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (entityId) query = query.eq('entity_id', entityId)

  const { data } = await query
  return NextResponse.json(data ?? [])
}
