import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { UsersPageClient } from './users-client'

export default async function UtilisateursPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('users').select('role,entity_id').eq('id', user.id).single()
  if (profile?.role !== 'super_admin') redirect('/login')

  const [{ data: users }, { data: entities }] = await Promise.all([
    supabase.from('users').select('*, entities(name)').order('created_at', { ascending: false }),
    supabase.from('entities').select('id,name').order('name'),
  ])

  return <UsersPageClient users={users ?? []} entities={entities ?? []} currentUserId={user.id} />
}
