import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { CashInterface } from '@/components/modules/cash/cash-interface'

export default async function CaissierPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('entity_id, full_name, role')
    .eq('id', user.id)
    .single()

  if (!profile?.entity_id) redirect('/login')

  const [{ data: session }, { data: products }, { data: entityUsers }, { data: secSettings }] = await Promise.all([
    supabase
      .from('cash_sessions')
      .select('*, cash_movements(*)')
      .eq('entity_id', profile.entity_id)
      .eq('status', 'open')
      .order('opened_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase.from('products').select('*').eq('entity_id', profile.entity_id).eq('active', true).order('name'),
    supabase.from('users').select('id, full_name, role, pin_code_hash').eq('entity_id', profile.entity_id).eq('status', 'active'),
    supabase.from('security_settings').select('auth_method').eq('entity_id', profile.entity_id).maybeSingle(),
  ])

  const authMethod = (secSettings?.auth_method as 'pin' | 'fingerprint' | 'both') ?? 'pin'

  return (
    <CashInterface
      session={session as any}
      products={products ?? []}
      entityId={profile.entity_id}
      userId={user.id}
      entityUsers={entityUsers ?? []}
      authMethod={authMethod}
    />
  )
}
