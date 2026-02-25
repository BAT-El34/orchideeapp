import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

async function getAdmin(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase.from('users').select('role, entity_id').eq('id', user.id).single()
  if (profile?.role !== 'super_admin') return null
  return { user, profile }
}

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const admin = await getAdmin(supabase)
  if (!admin) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const section = searchParams.get('section') ?? 'overview'

  if (section === 'entities') {
    const { data } = await supabase.from('entities').select('*').order('name')
    return NextResponse.json(data ?? [])
  }
  if (section === 'categories') {
    const { data } = await supabase.from('product_categories').select('*, entities(name)').order('name')
    return NextResponse.json(data ?? [])
  }
  if (section === 'users') {
    const { data } = await supabase.from('users').select('*, entities(name)').order('full_name')
    return NextResponse.json(data ?? [])
  }
  if (section === 'security') {
    const { data } = await supabase.from('security_settings').select('*').maybeSingle()
    return NextResponse.json(data ?? {
      auth_method: 'pin', session_duration_h: 8, max_login_attempts: 5,
      min_password_length: 8, require_uppercase: true, require_number: true, require_special: false
    })
  }
  if (section === 'theme') {
    const { data } = await supabase.from('theme_settings').select('*').maybeSingle()
    return NextResponse.json(data ?? {
      color_primary: '#2C5219', color_accent: '#C9881A', color_bg: '#FAF7F0',
      color_surface: '#FFFFFF', color_text: '#1E3B10', color_sidebar: '#1E3B10',
      font_heading: 'Cormorant Garamond', font_body: 'DM Sans',
      border_radius: 'sharp', sidebar_style: 'dark'
    })
  }
  if (section === 'audit') {
    const page = parseInt(searchParams.get('page') ?? '0')
    const from = searchParams.get('from')
    const to = searchParams.get('to')
    const action = searchParams.get('action')
    let q = supabase.from('audit_logs')
      .select('*, users(full_name, email)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(page * 50, page * 50 + 49)
    if (from) q = q.gte('created_at', from)
    if (to) q = q.lte('created_at', to + 'T23:59:59')
    if (action) q = q.ilike('action', `%${action}%`)
    const { data, count } = await q
    return NextResponse.json({ data: data ?? [], count: count ?? 0, page })
  }
  if (section === 'backup') {
    const [
      { data: entities }, { data: users }, { data: products }, { data: stock },
      { data: invoices }, { data: orders }, { data: cashSessions },
    ] = await Promise.all([
      supabase.from('entities').select('*'),
      supabase.from('users').select('id, email, full_name, role, entity_id, status, created_at'),
      supabase.from('products').select('*'),
      supabase.from('stock').select('*'),
      supabase.from('invoices').select('*, invoice_lines(*)').order('created_at', { ascending: false }).limit(1000),
      supabase.from('orders').select('*, order_lines(*)').order('created_at', { ascending: false }).limit(500),
      supabase.from('cash_sessions').select('*').order('created_at', { ascending: false }).limit(500),
    ])
    const backup = {
      exported_at: new Date().toISOString(), version: '3.0',
      entities, users, products, stock,
      invoices: invoices?.map((i) => ({ ...i, lines: (i as any).invoice_lines })),
      orders: orders?.map((o) => ({ ...o, lines: (o as any).order_lines })),
      cash_sessions: cashSessions,
    }
    return new NextResponse(JSON.stringify(backup, null, 2), {
      headers: { 'Content-Type': 'application/json', 'Content-Disposition': `attachment; filename="orchidee-backup-${new Date().toISOString().split('T')[0]}.json"` }
    })
  }
  return NextResponse.json({ error: 'Section inconnue' }, { status: 400 })
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const admin = await getAdmin(supabase)
  if (!admin) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })

  const body = await req.json()
  const { section, id, ...updates } = body

  if (section === 'entity') {
    const allowed = ['name', 'theme_color', 'address', 'phone', 'email']
    const safe = Object.fromEntries(Object.entries(updates).filter(([k]) => allowed.includes(k)))
    const { data, error } = await supabase.from('entities').update(safe).eq('id', id).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    await supabase.from('audit_logs').insert({ user_id: admin.user.id, action: 'update_entity', resource: 'entities', resource_id: id, new_value: safe })
    return NextResponse.json(data)
  }

  if (section === 'security') {
    const allowed = ['auth_method', 'session_duration_h', 'max_login_attempts', 'min_password_length', 'require_uppercase', 'require_number', 'require_special']
    const safe = Object.fromEntries(Object.entries(updates).filter(([k]) => allowed.includes(k)))
    // Upsert: entity_id null = global
    const { data, error } = await supabase.from('security_settings')
      .upsert({ entity_id: updates.entity_id ?? null, ...safe, updated_at: new Date().toISOString() }, { onConflict: 'entity_id' })
      .select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    await supabase.from('audit_logs').insert({ user_id: admin.user.id, action: 'update_security_settings', resource: 'security_settings', new_value: safe })
    return NextResponse.json(data)
  }

  if (section === 'theme') {
    const allowed = ['color_primary', 'color_accent', 'color_bg', 'color_surface', 'color_text', 'color_sidebar', 'font_heading', 'font_body', 'border_radius', 'sidebar_style']
    const safe = Object.fromEntries(Object.entries(updates).filter(([k]) => allowed.includes(k)))
    const { data, error } = await supabase.from('theme_settings')
      .upsert({ entity_id: updates.entity_id ?? null, ...safe, updated_at: new Date().toISOString() }, { onConflict: 'entity_id' })
      .select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    await supabase.from('audit_logs').insert({ user_id: admin.user.id, action: 'update_theme_settings', resource: 'theme_settings', new_value: safe })
    return NextResponse.json(data)
  }

  return NextResponse.json({ error: 'Section inconnue' }, { status: 400 })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const admin = await getAdmin(supabase)
  if (!admin) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })

  const body = await req.json()
  const { section } = body

  if (section === 'import_products') {
    const { rows, entity_id } = body
    const errors: string[] = []
    let imported = 0
    for (const row of rows) {
      if (!row.name || !row.price_sell) { errors.push(`Ligne invalide: ${JSON.stringify(row)}`); continue }
      const { error } = await supabase.from('products').insert({
        name: row.name, unit: row.unit ?? 'unité',
        price_buy: parseFloat(row.price_buy ?? '0'),
        price_sell: parseFloat(row.price_sell),
        category_id: row.category_id ?? null, entity_id, active: true,
      })
      if (error) errors.push(error.message)
      else imported++
    }
    await supabase.from('audit_logs').insert({ user_id: admin.user.id, action: 'import_products', resource: 'products', new_value: { entity_id, imported, errors: errors.length } })
    return NextResponse.json({ imported, errors })
  }

  if (section === 'bulk_validate_users') {
    const { userIds, status } = body
    if (!userIds?.length || !status) return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 })
    const { error } = await supabase.from('users').update({ status }).in('id', userIds)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    await supabase.from('audit_logs').insert({ user_id: admin.user.id, action: 'bulk_update_users', resource: 'users', new_value: { userIds, status } })
    return NextResponse.json({ updated: userIds.length })
  }

  if (section === 'category') {
    const { name, entity_id } = body
    const { data, error } = await supabase.from('product_categories').insert({ name, entity_id }).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  }

  return NextResponse.json({ error: 'Section inconnue' }, { status: 400 })
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient()
  const admin = await getAdmin(supabase)
  if (!admin) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const section = searchParams.get('section')
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID requis' }, { status: 400 })

  if (section === 'category') {
    const { error } = await supabase.from('product_categories').delete().eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    await supabase.from('audit_logs').insert({ user_id: admin.user.id, action: 'delete_category', resource: 'product_categories', resource_id: id })
    return NextResponse.json({ success: true })
  }
  return NextResponse.json({ error: 'Section inconnue' }, { status: 400 })
}
