import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SuperAdminSettings } from '@/components/modules/settings/super-admin-settings'

export default async function SuperAdminParametresPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (profile?.role !== 'super_admin') redirect('/super-admin')

  return <SuperAdminSettings />
}
