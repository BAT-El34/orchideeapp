import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const body = await req.json()
  const { full_name, email, requested_role, entity_id, motivation } = body

  // Validation
  if (!full_name || !email || !requested_role || !entity_id)
    return NextResponse.json({ error: 'Champs obligatoires manquants' }, { status: 400 })

  const ALLOWED_ROLES = ['manager', 'vendeur', 'caissier', 'readonly']
  if (!ALLOWED_ROLES.includes(requested_role))
    return NextResponse.json({ error: 'Rôle non autorisé' }, { status: 400 })

  if (!email.includes('@'))
    return NextResponse.json({ error: 'Email invalide' }, { status: 400 })

  // Vérifier que l'entité existe
  const { data: entity } = await supabase
    .from('entities')
    .select('id')
    .eq('id', entity_id)
    .single()
  if (!entity)
    return NextResponse.json({ error: 'Entité introuvable' }, { status: 400 })

  // Vérifier qu'aucune demande en attente n'existe déjà pour cet email
  const { data: existing } = await supabase
    .from('registration_requests')
    .select('id, status')
    .eq('email', email)
    .eq('status', 'pending')
    .maybeSingle()

  if (existing)
    return NextResponse.json({ error: 'Une demande est déjà en cours pour cet email' }, { status: 409 })

  // Insérer la demande
  const { error } = await supabase.from('registration_requests').insert({
    full_name,
    email: email.toLowerCase().trim(),
    requested_role,
    entity_id,
    motivation: motivation?.trim() || null,
    status: 'pending',
  })

  if (error) {
    console.error('Registration error:', error)
    return NextResponse.json({ error: 'Erreur lors de l\'enregistrement' }, { status: 500 })
  }

  // Notifier le super_admin (insertion notification)
  await supabase.from('notifications').insert({
    type: 'VALIDATION',
    message: `Nouvelle demande d'inscription : ${full_name} (${email}) — ${requested_role}`,
    to_role: 'super_admin',
    status: 'pending',
    channel: 'in_app',
  }).catch(() => {}) // ne pas bloquer si ça échoue

  return NextResponse.json({ success: true })
}
