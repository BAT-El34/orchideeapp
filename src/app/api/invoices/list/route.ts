import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const entityId = searchParams.get('entity_id')
  const status = searchParams.get('status')
  const limit = parseInt(searchParams.get('limit') ?? '100')

  let query = supabase
    .from('invoices')
    .select('*, users(full_name), invoice_lines(*)')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (entityId) query = query.eq('entity_id', entityId)
  if (status) query = query.eq('status', status)

  const { data } = await query
  return NextResponse.json(data ?? [])
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { id, ...updates } = await req.json()
  const { data, error } = await supabase.from('invoices').update(updates).eq('id', id).select().single()
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json(data)
}
