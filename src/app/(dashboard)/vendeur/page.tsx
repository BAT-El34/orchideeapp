import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { FileText, Plus, ShoppingCart } from 'lucide-react'
import { formatFCFA, formatDate, formatDateTime } from '@/lib/utils'
import Link from 'next/link'

export default async function VendeurDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('users').select('entity_id, full_name').eq('id', user.id).single()
  if (!profile?.entity_id) redirect('/login')

  const today = new Date().toISOString().split('T')[0]
  const { data: invoices } = await supabase
    .from('invoices')
    .select('id, date, total_sell, status, created_at')
    .eq('entity_id', profile.entity_id)
    .eq('date', today)
    .order('created_at', { ascending: false })
    .limit(10)

  const totalToday = invoices?.filter((i: any) => i.status === 'validated').reduce((s: number, i: any) => s + i.total_sell, 0) ?? 0

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-xl font-bold text-gray-900">Ventes</h1>
          <p className="mt-0.5 text-sm text-gray-500">{formatDate(new Date().toISOString())} — {profile.full_name}</p>
        </div>
        <Link
          href="/vendeur/factures/nouvelle"
          className="flex items-center gap-2 rounded-sm bg-violet-600 px-3 py-2 text-sm font-medium text-white hover:bg-violet-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Nouvelle facture
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-sm border border-gray-200 bg-white p-4 shadow-sm">
          <div className="mb-2 inline-flex h-7 w-7 items-center justify-center rounded-sm bg-violet-50">
            <FileText className="h-4 w-4 text-violet-600" />
          </div>
          <div className="text-xl font-bold text-gray-900">{formatFCFA(totalToday)}</div>
          <div className="text-xs text-gray-500">Ventes validées aujourd'hui</div>
        </div>
        <div className="rounded-sm border border-gray-200 bg-white p-4 shadow-sm">
          <div className="mb-2 inline-flex h-7 w-7 items-center justify-center rounded-sm bg-blue-50">
            <ShoppingCart className="h-4 w-4 text-blue-600" />
          </div>
          <div className="text-xl font-bold text-gray-900">{invoices?.length ?? 0}</div>
          <div className="text-xs text-gray-500">Factures du jour</div>
        </div>
      </div>

      <div className="rounded-sm border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-gray-200 px-4 py-3">
          <h2 className="text-sm font-semibold text-gray-700">Dernières factures</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">Heure</th>
              <th className="px-4 py-2.5 text-right text-xs font-semibold text-gray-500 uppercase">Total</th>
              <th className="px-4 py-2.5 text-right text-xs font-semibold text-gray-500 uppercase">Statut</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {invoices?.map((inv: any) => (
              <tr key={inv.id} className="hover:bg-gray-50">
                <td className="px-4 py-2.5 text-gray-500 text-xs">{formatDateTime(inv.created_at)}</td>
                <td className="px-4 py-2.5 text-right font-medium text-gray-900">{formatFCFA(inv.total_sell)}</td>
                <td className="px-4 py-2.5 text-right">
                  <span className={`inline-flex rounded-sm px-1.5 py-0.5 text-xs font-medium ${
                    inv.status === 'validated' ? 'bg-green-50 text-green-700' :
                    inv.status === 'cancelled' ? 'bg-red-50 text-red-700' :
                    'bg-amber-50 text-amber-700'
                  }`}>
                    {inv.status === 'validated' ? 'Validée' : inv.status === 'cancelled' ? 'Annulée' : 'Brouillon'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {(!invoices || invoices.length === 0) && (
          <div className="py-10 text-center text-sm text-gray-400">Aucune facture aujourd'hui</div>
        )}
      </div>
    </div>
  )
}
