import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { InvoicesList } from '@/components/modules/invoices/invoices-list'

export default async function FacturesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('users').select('entity_id, role').eq('id', user.id).single()
  if (!profile?.entity_id) redirect('/login')

  const { data: invoices } = await supabase
    .from('invoices')
    .select('*, users(full_name)')
    .eq('entity_id', profile.entity_id)
    .order('created_at', { ascending: false })
    .limit(100)

  return <InvoicesList invoices={(invoices as any) ?? []} role={profile.role as any} newHref="/admin/factures/nouvelle" />
}
