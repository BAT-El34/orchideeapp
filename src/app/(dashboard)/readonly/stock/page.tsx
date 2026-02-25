import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { StockPageClient } from './stock-client'

export default async function StockPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('users').select('entity_id, role').eq('id', user.id).single()
  if (!profile?.entity_id) redirect('/login')

  const { data: products } = await supabase
    .from('products')
    .select('*, product_categories(id, name), stock(*)')
    .eq('active', true)
    .order('name')

  return <StockPageClient products={(products as any) ?? []} entityId={profile.entity_id} />
}
