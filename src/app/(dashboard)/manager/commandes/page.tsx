import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { OrdersPageClient } from './orders-client'

export default async function ManagerCommandesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('users').select('entity_id, role').eq('id', user.id).single()
  if (!profile?.entity_id) redirect('/login')

  const [{ data: orders }, { data: products }] = await Promise.all([
    supabase.from('orders').select('*, order_lines(*), users(full_name)').eq('entity_id', profile.entity_id).order('created_at', { ascending: false }),
    supabase.from('products').select('*').eq('active', true).order('name'),
  ])

  return (
    <OrdersPageClient
      orders={orders ?? []}
      products={products ?? []}
      entityId={profile.entity_id}
      userId={user.id}
      role={profile.role as any}
    />
  )
}
