import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

function serviceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

async function getAdmin(supabase: any) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase.from('users').select('role,entity_id').eq('id', user.id).single()
  if (!['super_admin','admin'].includes(profile?.role)) return null
  return { user, profile }
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const admin = await getAdmin(supabase)
  if (!admin) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
  const body = await req.json()
  const { email, full_name, role, entity_id, password } = body
  if (!email || !full_name || !role || !entity_id || !password)
    return NextResponse.json({ error: 'Champs manquants' }, { status: 400 })
  const svc = serviceClient()
  const { data: authUser, error: authErr } = await svc.auth.admin.createUser({
    email, password, email_confirm: true,
    user_metadata: { full_name, role },
  })
  if (authErr) return NextResponse.json({ error: authErr.message }, { status: 400 })
  await svc.from('users').upsert({ id: authUser.user.id, email, full_name, role, entity_id, status: 'active' }, { onConflict: 'id' })
  await supabase.from('audit_logs').insert({ user_id: admin.user.id, action: 'create_user', resource: 'users', resource_id: authUser.user.id, new_value: { email, full_name, role, entity_id } })
  return NextResponse.json({ id: authUser.user.id })
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const admin = await getAdmin(supabase)
  if (!admin) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
  const body = await req.json()
  const { id, action, ...updates } = body
  if (!id) return NextResponse.json({ error: 'ID requis' }, { status: 400 })
  const svc = serviceClient()
  if (action === 'reset_password') {
    const { new_password } = updates
    if (!new_password || new_password.length < 6) return NextResponse.json({ error: 'Mot de passe trop court' }, { status: 400 })
    const { error } = await svc.auth.admin.updateUserById(id, { password: new_password })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    await supabase.from('audit_logs').insert({ user_id: admin.user.id, action: 'reset_password', resource: 'users', resource_id: id })
    return NextResponse.json({ success: true })
  }
  if (action === 'update') {
    const allowed = ['full_name','role','status','entity_id']
    const safe = Object.fromEntries(Object.entries(updates).filter(([k]) => allowed.includes(k)))
    const { error } = await supabase.from('users').update(safe).eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  }
  if (action === 'validate_registration') {
    const { role, entity_id } = updates
    await svc.auth.admin.updateUserById(id, { email_confirm: true })
    const { error } = await supabase.from('users').update({ status: 'active', role, entity_id }).eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    await supabase.from('audit_logs').insert({ user_id: admin.user.id, action: 'validate_registration', resource: 'users', resource_id: id, new_value: { role, entity_id } })
    return NextResponse.json({ success: true })
  }
  if (action === 'reject_registration') {
    const { error: delErr } = await supabase.from('users').delete().eq('id', id)
    if (!delErr) await svc.auth.admin.deleteUser(id).catch(() => {})
    return NextResponse.json({ success: true })
  }
  return NextResponse.json({ error: 'Action inconnue' }, { status: 400 })
}
