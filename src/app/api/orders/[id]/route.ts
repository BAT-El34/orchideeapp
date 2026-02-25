import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const body = await req.json()

  const { data: prev } = await supabase.from('orders').select('status, entity_id').eq('id', params.id).single()

  const { data, error } = await supabase.from('orders').update(body).eq('id', params.id).select().single()
  if (error) return NextResponse.json({ error }, { status: 500 })

  await supabase.from('audit_logs').insert({
    user_id: user.id,
    entity_id: prev?.entity_id,
    action: 'update_order_status',
    resource: 'orders',
    resource_id: params.id,
    old_value: { status: prev?.status },
    new_value: body,
  })

  return NextResponse.json(data)
}
