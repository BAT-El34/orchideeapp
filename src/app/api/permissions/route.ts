import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const RESOURCES = ['products','stock','invoices','reports','users','cash_sessions','orders','notifications']
const ACTIONS   = ['view','create','edit','delete','export','validate','notify']

const DEFAULTS: Record<string, Record<string, boolean>> = {
  admin:   { view:true,  create:true,  edit:true,  delete:true,  export:true,  validate:true,  notify:true  },
  manager: { view:true,  create:false, edit:true,  delete:false, export:true,  validate:false, notify:false },
  vendeur: { view:true,  create:true,  edit:false, delete:false, export:false, validate:false, notify:false },
  caissier:{ view:true,  create:false, edit:false, delete:false, export:false, validate:false, notify:false },
  readonly:{ view:true,  create:false, edit:false, delete:false, export:false, validate:false, notify:false },
}

async function ensurePermissionsExist(supabase: any) {
  // Seed all permissions if the table is empty
  const { count } = await supabase.from('permissions').select('*', { count: 'exact', head: true })
  if (count && count > 0) return

  const rows = []
  for (const role of Object.keys(DEFAULTS)) {
    for (const resource of RESOURCES) {
      for (const action of ACTIONS) {
        rows.push({ role, resource, action, enabled: DEFAULTS[role][action] ?? false })
      }
    }
  }
  await supabase.from('permissions').upsert(rows, { onConflict: 'role,resource,action', ignoreDuplicates: true })
}

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  await ensurePermissionsExist(supabase)

  const { data } = await supabase.from('permissions').select('*').order('role').order('resource').order('action')
  return NextResponse.json(data ?? [])
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (profile?.role !== 'super_admin') return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })

  const { id, enabled, role, resource, action } = await req.json()

  // Si id fourni → update existant
  if (id) {
    const { data, error } = await supabase.from('permissions').update({ enabled }).eq('id', id).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    await supabase.from('audit_logs').insert({ user_id: user.id, action: 'update_permission', resource: 'permissions', resource_id: id, new_value: { enabled } })
    return NextResponse.json(data)
  }

  // Sinon → upsert par role+resource+action
  if (role && resource && action) {
    const { data, error } = await supabase.from('permissions')
      .upsert({ role, resource, action, enabled }, { onConflict: 'role,resource,action' })
      .select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    await supabase.from('audit_logs').insert({ user_id: user.id, action: 'update_permission', resource: 'permissions', new_value: { role, resource, action, enabled } })
    return NextResponse.json(data)
  }

  return NextResponse.json({ error: 'id ou role+resource+action requis' }, { status: 400 })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (profile?.role !== 'super_admin') return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })

  const { role } = await req.json()
  const roleDef = DEFAULTS[role] ?? DEFAULTS.readonly

  const rows = RESOURCES.flatMap((resource) =>
    ACTIONS.map((action) => ({ role, resource, action, enabled: roleDef[action] ?? false }))
  )

  const { error } = await supabase.from('permissions')
    .upsert(rows, { onConflict: 'role,resource,action' })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await supabase.from('audit_logs').insert({ user_id: user.id, action: 'reset_permissions', resource: 'permissions', new_value: { role } })
  return NextResponse.json({ success: true })
}
