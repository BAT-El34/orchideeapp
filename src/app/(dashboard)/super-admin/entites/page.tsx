import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Building2 } from 'lucide-react'
import { formatDateTime } from '@/lib/utils'

export default async function EntitesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (profile?.role !== 'super_admin') redirect('/super-admin')

  const { data: entities } = await supabase
    .from('entities')
    .select('*, users(count)')
    .order('created_at')

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-xl font-bold text-gray-900">Entités</h1>
          <p className="mt-0.5 text-sm text-gray-500">{entities?.length ?? 0} entité(s)</p>
        </div>
        <button className="flex items-center gap-2 rounded-sm bg-violet-600 px-3 py-2 text-sm font-medium text-white hover:bg-violet-700 transition-colors">
          <Building2 className="h-4 w-4" />
          Nouvelle entité
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {entities?.map((entity: any) => (
          <div key={entity.id} className="rounded-sm border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="h-10 w-1 rounded-sm flex-shrink-0" style={{ backgroundColor: entity.theme_color }} />
              <div className="flex-1">
                <h2 className="text-sm font-semibold text-gray-900">{entity.name}</h2>
                <p className="text-xs text-gray-500 mt-0.5">/{entity.slug}</p>
              </div>
              <div
                className="h-6 w-6 rounded-sm border border-gray-200"
                style={{ backgroundColor: entity.theme_color }}
                title={entity.theme_color}
              />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
              <div className="rounded-sm bg-gray-50 p-2">
                <div className="text-gray-500">Créée le</div>
                <div className="font-medium text-gray-800 mt-0.5">{formatDateTime(entity.created_at)}</div>
              </div>
              <div className="rounded-sm bg-gray-50 p-2">
                <div className="text-gray-500">Couleur</div>
                <div className="font-medium text-gray-800 mt-0.5">{entity.theme_color}</div>
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              <button className="rounded-sm border border-gray-200 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50">
                Modifier
              </button>
              <button className="rounded-sm border border-gray-200 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50">
                Voir utilisateurs
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
