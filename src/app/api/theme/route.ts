import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('theme_settings')
    .select('*')
    .is('entity_id', null)
    .maybeSingle()
  return NextResponse.json(data ?? {})
}
