import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ReportsClient } from '@/components/modules/reports/reports-client'

export default async function ManagerRapportsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('users').select('entity_id, role').eq('id', user.id).single()
  if (!profile?.entity_id) redirect('/login')

  const { data: entities } = await supabase.from('entities').select('id, name').eq('id', profile.entity_id)

  return (
    <ReportsClient
      entityId={profile.entity_id}
      role={profile.role}
      entities={entities ?? []}
    />
  )
}
