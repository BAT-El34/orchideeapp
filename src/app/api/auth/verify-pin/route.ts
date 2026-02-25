import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createHash } from 'crypto'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { userId, pin } = await req.json()
  if (!userId || !pin || !/^\d{4}$/.test(pin)) {
    return NextResponse.json({ error: 'Données invalides' }, { status: 400 })
  }

  const pinHash = createHash('sha256').update(pin).digest('hex')

  const { data: target } = await supabase
    .from('users')
    .select('pin_code_hash, status')
    .eq('id', userId)
    .single()

  if (!target || target.status !== 'active') {
    return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 })
  }

  if (!target.pin_code_hash) {
    return NextResponse.json({ error: 'Aucun code PIN défini pour cet utilisateur' }, { status: 400 })
  }

  if (target.pin_code_hash !== pinHash) {
    await supabase.from('audit_logs').insert({
      user_id: user.id,
      action: 'pin_verification_failed',
      resource: 'users',
      resource_id: userId,
      details: { attempted_by: user.id },
    })
    return NextResponse.json({ error: 'Code PIN incorrect' }, { status: 401 })
  }

  await supabase.from('audit_logs').insert({
    user_id: user.id,
    action: 'pin_verification_success',
    resource: 'users',
    resource_id: userId,
    details: { verified_by: user.id },
  })

  return NextResponse.json({ ok: true })
}
