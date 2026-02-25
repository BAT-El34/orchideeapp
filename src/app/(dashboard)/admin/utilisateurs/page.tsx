import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Users } from 'lucide-react'
import { formatDateTime } from '@/lib/utils'
import { roleLabels } from '@/lib/design-system'
import type { UserRole } from '@/types'

const STATUS_CFG = {
  active: { label: 'Actif', cls: 'bg-green-50 text-green-700' },
  pending: { label: 'En attente', cls: 'bg-amber-50 text-amber-700' },
  suspended: { label: 'Suspendu', cls: 'bg-red-50 text-red-700' },
}

export default async function UtilisateursPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('users').select('entity_id, role').eq('id', user.id).single()

  let query = supabase.from('users').select('*').order('created_at', { ascending: false })
  if (profile?.role !== 'super_admin' && profile?.entity_id) {
    query = query.eq('entity_id', profile.entity_id)
  }
  const { data: users } = await query

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-xl font-bold text-gray-900">Utilisateurs</h1>
          <p className="mt-0.5 text-sm text-gray-500">{users?.length ?? 0} utilisateur{(users?.length ?? 0) !== 1 ? 's' : ''}</p>
        </div>
        <button className="flex items-center gap-2 rounded-sm bg-violet-600 px-3 py-2 text-sm font-medium text-white hover:bg-violet-700 transition-colors">
          <Users className="h-4 w-4" />
          Inviter
        </button>
      </div>

      <div className="rounded-sm border border-gray-200 bg-white shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              {['Nom', 'Email', 'Rôle', 'Statut', 'Dernière connexion', 'Actions'].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users?.map((u: any) => {
              const statusCfg = STATUS_CFG[u.status as keyof typeof STATUS_CFG] ?? STATUS_CFG.pending
              return (
                <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900">{u.full_name}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-sm bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
                      {roleLabels[u.role as UserRole] ?? u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-sm px-2 py-0.5 text-xs font-medium ${statusCfg.cls}`}>
                      {statusCfg.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {u.last_login ? formatDateTime(u.last_login) : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <button className="rounded-sm border border-gray-200 px-2 py-1 text-xs text-gray-600 hover:bg-gray-50">
                        Modifier
                      </button>
                      {u.status === 'active' && u.id !== user.id && (
                        <button className="rounded-sm border border-red-200 bg-red-50 px-2 py-1 text-xs text-red-700 hover:bg-red-100">
                          Suspendre
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {(!users || users.length === 0) && (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <Users className="mb-2 h-6 w-6" />
            <p className="text-sm">Aucun utilisateur</p>
          </div>
        )}
      </div>
    </div>
  )
}
