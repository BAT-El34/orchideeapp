import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const entityId = searchParams.get('entity_id')

  let query = supabase
    .from('stock_thresholds')
    .select('*, products(name, unit)')
    .order('created_at', { ascending: false })

  if (entityId) query = query.eq('entity_id', entityId)

  const { data } = await query
  return NextResponse.json(data ?? [])
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const body = await req.json()

  const { data: existing } = await supabase
    .from('stock_thresholds')
    .select('id')
    .eq('product_id', body.product_id)
    .eq('entity_id', body.entity_id)
    .single()

  let result
  if (existing) {
    result = await supabase.from('stock_thresholds').update(body).eq('id', existing.id).select().single()
  } else {
    result = await supabase.from('stock_thresholds').insert(body).select().single()
  }

  if (result.error) return NextResponse.json({ error: result.error }, { status: 500 })
  return NextResponse.json(result.data)
}
