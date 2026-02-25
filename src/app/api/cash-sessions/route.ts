import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const body = await req.json()

  const { data: session, error } = await supabase
    .from('cash_sessions')
    .insert({ ...body, opened_at: new Date().toISOString(), status: 'open' })
    .select()
    .single()

  if (error) return NextResponse.json({ error }, { status: 500 })

  await supabase.from('notifications').insert({
    entity_id: body.entity_id,
    from_user_id: user.id,
    to_role: 'admin',
    type: 'CASH',
    message: `Session de caisse ouverte — Fond initial: ${new Intl.NumberFormat('fr-FR').format(body.opening_amount)} FCFA`,
    reference_id: session.id,
    channel: 'in_app',
    status: 'pending',
  })

  return NextResponse.json(session)
}

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const entityId = searchParams.get('entity_id')

  let query = supabase
    .from('cash_sessions')
    .select('*, cash_movements(*), users(full_name)')
    .order('opened_at', { ascending: false })

  if (entityId) query = query.eq('entity_id', entityId)

  const { data } = await query
  return NextResponse.json(data ?? [])
}
