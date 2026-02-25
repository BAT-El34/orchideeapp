import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

function serviceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { searchParams } = new URL(req.url)
  const section = searchParams.get('section')

  // Entités — accessible publiquement pour le formulaire d'inscription
  if (section === 'entities') {
    const { data } = await supabase.from('entities').select('id, name').order('name')
    return NextResponse.json(data ?? [])
  }

  // Liste des demandes — réservé au super_admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (profile?.role !== 'super_admin') return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })

  const status = searchParams.get('status') ?? 'pending'
  const { data } = await supabase
    .from('registration_requests')
    .select('*, entities(name)')
    .eq('status', status)
    .order('created_at', { ascending: false })

  return NextResponse.json(data ?? [])
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (profile?.role !== 'super_admin') return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })

  const body = await req.json()
  const { id, action, role, entity_id, reject_reason } = body

  if (!id) return NextResponse.json({ error: 'ID requis' }, { status: 400 })

  // Récupérer la demande
  const { data: request } = await supabase
    .from('registration_requests')
    .select('*')
    .eq('id', id)
    .single()
  if (!request) return NextResponse.json({ error: 'Demande introuvable' }, { status: 404 })

  if (action === 'approve') {
    if (!entity_id) return NextResponse.json({ error: 'Entité requise' }, { status: 400 })
    const finalRole = role ?? request.requested_role
    const svc = serviceClient()

    // Créer le compte Supabase Auth
    const { data: authUser, error: authErr } = await svc.auth.admin.createUser({
      email: request.email,
      email_confirm: true,
      user_metadata: { full_name: request.full_name, role: finalRole },
    })
    if (authErr) return NextResponse.json({ error: authErr.message }, { status: 400 })

    // Créer le profil dans public.users
    const { error: profileErr } = await svc.from('users').insert({
      id: authUser.user.id,
      email: request.email,
      full_name: request.full_name,
      role: finalRole,
      entity_id,
      status: 'active',
    })
    if (profileErr) {
      await svc.auth.admin.deleteUser(authUser.user.id)
      return NextResponse.json({ error: profileErr.message }, { status: 500 })
    }

    // Marquer la demande comme approuvée
    await supabase.from('registration_requests').update({
      status: 'approved',
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
    }).eq('id', id)

    // Notification de bienvenue
    await supabase.from('notifications').insert({
      type: 'VALIDATION',
      message: `Bienvenue ${request.full_name} ! Votre compte ${finalRole} a été activé.`,
      to_user_id: authUser.user.id,
      status: 'pending',
      channel: 'in_app',
    }).catch(() => {})

    await supabase.from('audit_logs').insert({
      user_id: user.id,
      action: 'approve_registration',
      resource: 'registration_requests',
      resource_id: id,
      new_value: { email: request.email, role: finalRole, entity_id },
    })

    return NextResponse.json({ success: true, userId: authUser.user.id })
  }

  if (action === 'reject') {
    await supabase.from('registration_requests').update({
      status: 'rejected',
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
      reject_reason: reject_reason ?? null,
    }).eq('id', id)

    await supabase.from('audit_logs').insert({
      user_id: user.id,
      action: 'reject_registration',
      resource: 'registration_requests',
      resource_id: id,
      new_value: { email: request.email, reject_reason },
    })

    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: 'Action inconnue' }, { status: 400 })
}
