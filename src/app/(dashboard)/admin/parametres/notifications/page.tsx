import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { NotificationSettingsPage } from '@/components/modules/settings/notification-settings'

export default async function AdminNotificationSettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('users').select('entity_id, role').eq('id', user.id).single()
  if (!profile?.entity_id) redirect('/login')

  return (
    <NotificationSettingsPage
      entityId={profile.entity_id}
      isSuperAdmin={profile.role === 'super_admin'}
    />
  )
}
