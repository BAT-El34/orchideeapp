import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AnalysePageClient } from '@/components/modules/reports/analyse-client'

export default async function AnalysePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (profile?.role !== 'super_admin') redirect('/super-admin')

  const { data: entities } = await supabase.from('entities').select('id, name').order('name')

  return <AnalysePageClient entities={entities ?? []} />
}
