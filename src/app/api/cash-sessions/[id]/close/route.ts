import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const body = await req.json()
  const { closing_amount_declared, closing_amount_calculated, variance, notes } = body

  const { data: session, error } = await supabase
    .from('cash_sessions')
    .update({
      closing_amount_declared,
      closing_amount_calculated,
      variance,
      notes,
      closed_at: new Date().toISOString(),
      status: 'closed',
    })
    .eq('id', params.id)
    .select('*, users(full_name)')
    .single()

  if (error) return NextResponse.json({ error }, { status: 500 })

  const absVariance = Math.abs(variance)
  if (absVariance > 100) {
    const level = absVariance > 500 ? 'CRITIQUE' : 'ALERTE'
    const { data: sessionData } = await supabase.from('cash_sessions').select('entity_id').eq('id', params.id).single()
    await supabase.from('notifications').insert({
      entity_id: sessionData?.entity_id,
      from_user_id: user.id,
      to_role: 'admin',
      type: 'CASH',
      message: `[${level}] Écart de caisse: ${new Intl.NumberFormat('fr-FR').format(variance)} FCFA — Session fermée`,
      reference_id: params.id,
      channel: 'in_app',
      status: 'pending',
    })
  }

  await supabase.from('audit_logs').insert({
    user_id: user.id,
    entity_id: (session as any).entity_id,
    action: 'close_session',
    resource: 'cash_sessions',
    resource_id: params.id,
    new_value: { closing_amount_declared, closing_amount_calculated, variance },
  })

  return NextResponse.json({ success: true })
}
