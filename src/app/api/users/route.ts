import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { data: profile } = await supabase.from('users').select('role, entity_id').eq('id', user.id).single()
  const { searchParams } = new URL(req.url)
  const entityId = searchParams.get('entity_id')

  let query = supabase.from('users').select('*').order('created_at', { ascending: false })

  if (profile?.role !== 'super_admin') {
    query = query.eq('entity_id', profile?.entity_id ?? '')
  } else if (entityId) {
    query = query.eq('entity_id', entityId)
  }

  const { data } = await query
  return NextResponse.json(data ?? [])
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (!['super_admin', 'admin'].includes(profile?.role ?? '')) {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
  }

  const { email, full_name, role, entity_id, password } = await req.json()

  const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
    email,
    password: password ?? Math.random().toString(36).slice(-12),
    email_confirm: true,
  })

  if (authError || !authUser.user) {
    return NextResponse.json({ error: authError?.message ?? 'Erreur création' }, { status: 400 })
  }

  const { data: newUser, error } = await supabase.from('users').insert({
    id: authUser.user.id,
    email,
    full_name,
    role,
    entity_id: entity_id ?? null,
    status: 'active',
  }).select().single()

  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json(newUser, { status: 201 })
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { id, ...updates } = await req.json()

  const oldData = await supabase.from('users').select('*').eq('id', id).single()

  const { data, error } = await supabase.from('users').update(updates).eq('id', id).select().single()
  if (error) return NextResponse.json({ error }, { status: 500 })

  await supabase.from('audit_logs').insert({
    user_id: user.id,
    action: 'update_user',
    resource: 'users',
    resource_id: id,
    old_value: oldData.data as any,
    new_value: updates,
  })

  return NextResponse.json(data)
}
