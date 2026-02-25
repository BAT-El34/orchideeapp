import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const entityId = searchParams.get('entity_id')

  let query = supabase
    .from('products')
    .select('*, product_categories(id, name), stock(*)')
    .eq('active', true)
    .order('name')

  const { data } = await query
  return NextResponse.json(data ?? [])
}
