import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { formatFCFA, formatDate, formatDateTime } from '@/lib/utils'
import { ArrowLeft, Printer } from 'lucide-react'
import Link from 'next/link'

const STATUS_CFG = {
  draft: { label: 'Brouillon', cls: 'bg-amber-50 text-amber-700 border border-amber-200' },
  validated: { label: 'Validée', cls: 'bg-green-50 text-green-700 border border-green-200' },
  cancelled: { label: 'Annulée', cls: 'bg-red-50 text-red-700 border border-red-200' },
}

export default async function FactureDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: invoice } = await supabase
    .from('invoices')
    .select('*, users(full_name), invoice_lines(*), entities(name, theme_color)')
    .eq('id', params.id)
    .single()

  if (!invoice) notFound()

  const cfg = STATUS_CFG[invoice.status as keyof typeof STATUS_CFG] ?? STATUS_CFG.draft
  const marginPct = invoice.total_buy > 0 ? ((invoice.margin / invoice.total_buy) * 100).toFixed(1) : '0'

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <Link href="/admin/factures" className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
          <ArrowLeft className="h-4 w-4" />
          Retour aux factures
        </Link>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 rounded-sm border border-gray-200 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
        >
          <Printer className="h-4 w-4" />
          Imprimer
        </button>
      </div>

      <div className="rounded-sm border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="h-5 w-1 rounded-sm" style={{ backgroundColor: (invoice as any).entities?.theme_color ?? '#7C3AED' }} />
              <h1 className="font-heading text-lg font-bold text-gray-900">{(invoice as any).entities?.name}</h1>
            </div>
            <p className="text-xs text-gray-400 font-mono">FAC-{invoice.id.slice(0, 8).toUpperCase()}</p>
          </div>
          <span className={`inline-flex rounded-sm px-2.5 py-1 text-xs font-medium ${cfg.cls}`}>
            {cfg.label}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
          <div>
            <div className="text-xs text-gray-500 mb-0.5">Date</div>
            <div className="font-medium text-gray-900">{formatDate(invoice.date)}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-0.5">Créée par</div>
            <div className="font-medium text-gray-900">{(invoice as any).users?.full_name ?? '—'}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-0.5">Créée le</div>
            <div className="text-gray-700">{formatDateTime(invoice.created_at)}</div>
          </div>
        </div>

        <div className="overflow-hidden rounded-sm border border-gray-200 mb-5">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                {['Produit', 'QTE', 'Prix achat', 'Prix vente', 'Total achat', 'Total vente'].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(invoice as any).invoice_lines?.map((line: any) => (
                <tr key={line.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2.5 font-medium text-gray-900">{line.product_name_snapshot}</td>
                  <td className="px-4 py-2.5 text-gray-600">{line.quantity}</td>
                  <td className="px-4 py-2.5 text-gray-500 text-xs">{formatFCFA(line.price_buy)}</td>
                  <td className="px-4 py-2.5 text-gray-700 text-xs">{formatFCFA(line.price_sell)}</td>
                  <td className="px-4 py-2.5 text-gray-600">{formatFCFA(line.total_buy)}</td>
                  <td className="px-4 py-2.5 font-medium text-gray-900">{formatFCFA(line.total_sell)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="space-y-2 text-sm border-t border-gray-200 pt-4">
          <div className="flex justify-between">
            <span className="text-gray-500">Total achats</span>
            <span className="text-gray-700">{formatFCFA(invoice.total_buy)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Total ventes</span>
            <span className="font-semibold text-gray-900">{formatFCFA(invoice.total_sell)}</span>
          </div>
          <div className="flex justify-between border-t border-gray-100 pt-2">
            <span className="text-gray-500">Marge</span>
            <span className="font-semibold text-green-700">{formatFCFA(invoice.margin)} ({marginPct}%)</span>
          </div>
        </div>

        {invoice.notes && (
          <div className="mt-4 rounded-sm bg-gray-50 p-3 text-sm text-gray-600">
            {invoice.notes}
          </div>
        )}
      </div>
    </div>
  )
}
