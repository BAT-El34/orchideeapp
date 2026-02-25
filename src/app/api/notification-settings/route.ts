import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const entityId = searchParams.get('entity_id')

  let query = supabase.from('notification_settings').select('*').order('role')
  if (entityId) query = query.eq('entity_id', entityId)

  const { data } = await query
  return NextResponse.json(data ?? [])
}

export async function PUT(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const body = await req.json()
  const { id, ...updates } = body

  updates.updated_at = new Date().toISOString()

  let result
  if (id) {
    result = await supabase.from('notification_settings').update(updates).eq('id', id).select().single()
  } else {
    result = await supabase.from('notification_settings').insert(updates).select().single()
  }

  if (result.error) return NextResponse.json({ error: result.error }, { status: 500 })

  await supabase.from('audit_logs').insert({
    user_id: user.id,
    action: 'update_notification_settings',
    resource: 'notification_settings',
    resource_id: result.data?.id,
    new_value: updates,
  })

  return NextResponse.json(result.data)
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { type, entity_id } = await req.json()

  if (type === 'test_whatsapp') {
    const { data: settings } = await supabase
      .from('notification_settings')
      .select('whatsapp_number')
      .eq('entity_id', entity_id)
      .not('whatsapp_number', 'is', null)
      .limit(1)
      .single()

    if (!settings?.whatsapp_number) {
      return NextResponse.json({ error: 'Aucun numéro WhatsApp configuré' }, { status: 400 })
    }

    const res = await fetch(`${req.nextUrl.origin}/api/whatsapp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', cookie: req.headers.get('cookie') ?? '' },
      body: JSON.stringify({
        phone_number: settings.whatsapp_number,
        type: 'REPORT',
        data: { date: new Date().toISOString().split('T')[0], sales: '0 FCFA', nb: '0' },
      }),
    })
    return res.ok ? NextResponse.json({ success: true }) : NextResponse.json({ error: 'Échec WhatsApp' }, { status: 502 })
  }

  if (type === 'test_email') {
    return NextResponse.json({ success: true, note: 'Configurer SMTP pour activer les emails' })
  }

  return NextResponse.json({ error: 'Type inconnu' }, { status: 400 })
}
