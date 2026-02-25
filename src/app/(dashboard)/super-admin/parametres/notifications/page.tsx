import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { NotificationSettingsPage } from '@/components/modules/settings/notification-settings'

export default async function SuperAdminNotificationSettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('users').select('role, entity_id').eq('id', user.id).single()
  if (profile?.role !== 'super_admin') redirect('/super-admin')

  const { data: entities } = await supabase.from('entities').select('id, name').order('name')
  const entityId = entities?.[0]?.id ?? profile.entity_id ?? ''

  return (
    <NotificationSettingsPage
      entityId={entityId}
      isSuperAdmin
    />
  )
}
