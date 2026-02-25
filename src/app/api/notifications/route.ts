import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const entityId = searchParams.get('entity_id')

  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()

  let query = supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(50)

  if (profile?.role !== 'super_admin' && entityId) {
    query = query.or(`entity_id.eq.${entityId},to_user_id.eq.${user.id}`)
  }

  const { data } = await query
  return NextResponse.json(data ?? [])
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { ids, status } = await req.json()
  const { error } = await supabase.from('notifications').update({ status }).in('id', ids)
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json({ success: true })
}
