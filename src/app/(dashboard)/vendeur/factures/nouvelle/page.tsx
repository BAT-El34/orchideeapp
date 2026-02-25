import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { InvoiceForm } from '@/components/modules/invoices/invoice-form'

export default async function NouvelleFacturePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('users').select('entity_id, role').eq('id', user.id).single()
  if (!profile?.entity_id) redirect('/login')

  const { data: products } = await supabase
    .from('products')
    .select('*')
    .eq('active', true)
    .order('name')

  return (
    <InvoiceForm
      products={products ?? []}
      entityId={profile.entity_id}
      userId={user.id}
      role={profile.role}
    />
  )
}
