import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { formatDateTime } from '@/lib/utils'
import { Shield } from 'lucide-react'

export default async function AuditPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (profile?.role !== 'super_admin') redirect('/super-admin')

  const { data: logs } = await supabase
    .from('audit_logs')
    .select('*, users(full_name, email)')
    .order('created_at', { ascending: false })
    .limit(200)

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <Shield className="h-5 w-5 text-gray-500" />
        <div>
          <h1 className="font-heading text-xl font-bold text-gray-900">Journal d'audit</h1>
          <p className="mt-0.5 text-sm text-gray-500">{logs?.length ?? 0} entrées récentes</p>
        </div>
      </div>

      <div className="rounded-sm border border-gray-200 bg-white shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              {['Date', 'Utilisateur', 'Action', 'Ressource', 'IP'].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {logs?.map((log: any) => (
              <tr key={log.id} className="hover:bg-gray-50">
                <td className="px-4 py-2.5 text-xs text-gray-500 whitespace-nowrap">{formatDateTime(log.created_at)}</td>
                <td className="px-4 py-2.5 text-xs text-gray-700">{(log as any).users?.full_name ?? '—'}</td>
                <td className="px-4 py-2.5">
                  <span className="inline-flex rounded-sm bg-gray-100 px-2 py-0.5 text-xs font-mono text-gray-700">
                    {log.action}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-xs text-gray-600">{log.resource}</td>
                <td className="px-4 py-2.5 text-xs text-gray-400 font-mono">{log.ip_address ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {(!logs || logs.length === 0) && (
          <div className="py-10 text-center text-sm text-gray-400">Aucune entrée d'audit</div>
        )}
      </div>
    </div>
  )
}
