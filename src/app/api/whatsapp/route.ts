import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN
const TWILIO_WHATSAPP_FROM = process.env.TWILIO_WHATSAPP_FROM ?? 'whatsapp:+14155238886'

const TEMPLATES: Record<string, (data: Record<string, string>) => string> = {
  ORDER: (d) => `[Orchidée NMS] Nouvelle commande ${d.type === 'AUTO' ? 'automatique' : 'manuelle'} créée. ${d.lines} produit(s). Livraison souhaitée : ${d.date ?? 'non définie'}.`,
  ALERT: (d) => `[Orchidée NMS] Alerte stock : ${d.product} — Stock actuel : ${d.qty} (seuil : ${d.threshold}).`,
  CASH: (d) => `[Orchidée NMS] ${d.level === 'CRITIQUE' ? 'ALERTE CRITIQUE' : 'Alerte'} caisse — Écart : ${d.variance} FCFA. Session fermée par ${d.user}.`,
  VALIDATION: (d) => `[Orchidée NMS] Validation requise : ${d.resource} — ${d.message}.`,
  REPORT: (d) => `[Orchidée NMS] Rapport quotidien ${d.date} — Ventes : ${d.sales} FCFA | Transactions : ${d.nb}.`,
}

async function sendWhatsApp(to: string, message: string): Promise<{ success: boolean; error?: string }> {
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
    return { success: false, error: 'Twilio non configuré' }
  }

  const url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`
  const encoded = Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64')

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${encoded}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      From: TWILIO_WHATSAPP_FROM,
      To: `whatsapp:${to}`,
      Body: message,
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    return { success: false, error: err.message ?? 'Erreur Twilio' }
  }

  return { success: true }
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { notification_id, phone_number, type, data } = await req.json()

  const template = TEMPLATES[type]
  if (!template) return NextResponse.json({ error: 'Type de notification inconnu' }, { status: 400 })

  const message = template(data ?? {})
  const result = await sendWhatsApp(phone_number, message)

  if (notification_id) {
    await supabase
      .from('notifications')
      .update({ status: result.success ? 'sent' : 'pending' })
      .eq('id', notification_id)
  }

  await supabase.from('audit_logs').insert({
    user_id: user.id,
    action: 'whatsapp_notification',
    resource: 'notifications',
    new_value: { type, phone_number, success: result.success, error: result.error },
  })

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 502 })
  }

  return NextResponse.json({ success: true, message })
}

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const entityId = searchParams.get('entity_id')

  let query = supabase
    .from('notifications')
    .select('*')
    .eq('channel', 'whatsapp')
    .order('created_at', { ascending: false })
    .limit(50)

  if (entityId) query = query.eq('entity_id', entityId)

  const { data } = await query
  return NextResponse.json(data ?? [])
}
