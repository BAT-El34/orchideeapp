'use client'

import { useState, useMemo } from 'react'
import {
  ShoppingCart, ArrowLeftRight, Calculator as CalcIcon, BarChart2,
  Plus, CheckCircle, X, RefreshCw, User, Lock
} from 'lucide-react'
import { formatFCFA, formatDateTime } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import { ToastContainer } from '@/components/ui/toast-container'
import { AutocompleteSelect } from '@/components/ui/autocomplete-select'
import { ConfirmIdentityModal, type AuthMethod, type IdentityUser } from '@/components/ui/confirm-identity-modal'
import type { Product, CashSession as CashSessionType, CashMovement } from '@/types'

interface EntityUser {
  id: string
  full_name: string
  role: string
  pin_code_hash: string | null
}

interface CashInterfaceProps {
  session: (CashSessionType & { cash_movements: CashMovement[] }) | null
  products: Product[]
  entityId: string
  userId: string
  entityUsers?: EntityUser[]
  authMethod?: AuthMethod
}

type Tab = 'vente' | 'mouvements' | 'calculatrice' | 'résumé'
const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'vente', label: 'Vente', icon: ShoppingCart },
  { id: 'mouvements', label: 'Mouvements', icon: ArrowLeftRight },
  { id: 'calculatrice', label: 'Calculatrice', icon: CalcIcon },
  { id: 'résumé', label: 'Résumé', icon: BarChart2 },
]

function Calculator() {
  const [display, setDisplay] = useState('0')
  const [memory, setMemory] = useState(0)
  const [history, setHistory] = useState<string[]>([])
  const [waitingOperand, setWaitingOperand] = useState(false)
  const [pendingOp, setPendingOp] = useState<string | null>(null)
  const [pendingValue, setPendingValue] = useState<number | null>(null)

  const appendDigit = (d: string) => {
    if (waitingOperand) { setDisplay(d); setWaitingOperand(false); return }
    setDisplay(display === '0' ? d : display + d)
  }
  const appendDot = () => {
    if (waitingOperand) { setDisplay('0.'); setWaitingOperand(false); return }
    if (!display.includes('.')) setDisplay(display + '.')
  }
  const pressOp = (op: string) => {
    const val = parseFloat(display)
    if (pendingOp && !waitingOperand) {
      const r = compute(pendingValue!, val, pendingOp)
      setDisplay(String(r)); setPendingValue(r)
    } else { setPendingValue(val) }
    setPendingOp(op); setWaitingOperand(true)
  }
  const compute = (a: number, b: number, op: string) => {
    if (op === '+') return a + b
    if (op === '-') return a - b
    if (op === '×') return a * b
    if (op === '÷') return b !== 0 ? a / b : 0
    if (op === '%') return a * (b / 100)
    return b
  }
  const pressEquals = () => {
    const val = parseFloat(display)
    if (pendingOp && pendingValue !== null) {
      const r = compute(pendingValue, val, pendingOp)
      setHistory((h) => [`${pendingValue} ${pendingOp} ${val} = ${r}`, ...h].slice(0, 20))
      setDisplay(String(parseFloat(r.toFixed(4))))
      setPendingOp(null); setPendingValue(null); setWaitingOperand(true)
    }
  }
  const clear = () => { setDisplay('0'); setPendingOp(null); setPendingValue(null); setWaitingOperand(false) }
  const btn = (label: string, action: () => void, cls = '') => (
    <button key={label} onClick={action} className={`flex items-center justify-center h-12 rounded-sm text-sm font-medium transition-colors ${cls}`}>{label}</button>
  )
  return (
    <div className="space-y-3">
      <div className="rounded-sm border border-cream-400 bg-white p-4 shadow-sm">
        <div className="text-right mb-1 text-xs text-gray-400 h-4">{pendingValue !== null ? `${pendingValue} ${pendingOp}` : ''}</div>
        <div className="text-right text-2xl font-bold text-forest-900 overflow-hidden">{display}</div>
        {memory !== 0 && <div className="text-right text-xs text-forest-700 mt-1">M: {memory}</div>}
      </div>
      <div className="rounded-sm border border-cream-400 bg-white p-3 shadow-sm">
        <div className="grid grid-cols-4 gap-2 mb-2">
          {btn('MC', () => setMemory(0), 'bg-gray-100 text-gray-600 hover:bg-gray-200')}
          {btn('MR', () => { setDisplay(String(memory)); setWaitingOperand(false) }, 'bg-gray-100 text-gray-600 hover:bg-gray-200')}
          {btn('M-', () => setMemory((m) => m - parseFloat(display)), 'bg-gray-100 text-gray-600 hover:bg-gray-200')}
          {btn('M+', () => setMemory((m) => m + parseFloat(display)), 'bg-gray-100 text-gray-600 hover:bg-gray-200')}
        </div>
        <div className="grid grid-cols-4 gap-2">
          {btn('C', clear, 'bg-red-50 text-red-600 hover:bg-red-100')}
          {btn('+/-', () => setDisplay(String(-parseFloat(display))), 'bg-gray-100 text-gray-600 hover:bg-gray-200')}
          {btn('%', () => pressOp('%'), 'bg-gray-100 text-gray-600 hover:bg-gray-200')}
          {btn('÷', () => pressOp('÷'), 'bg-amber-50 text-amber-700 hover:bg-amber-100')}
          {['7','8','9'].map((d) => btn(d, () => appendDigit(d), 'bg-white border border-cream-400 text-forest-900 hover:bg-cream-100'))}
          {btn('×', () => pressOp('×'), 'bg-amber-50 text-amber-700 hover:bg-amber-100')}
          {['4','5','6'].map((d) => btn(d, () => appendDigit(d), 'bg-white border border-cream-400 text-forest-900 hover:bg-cream-100'))}
          {btn('-', () => pressOp('-'), 'bg-amber-50 text-amber-700 hover:bg-amber-100')}
          {['1','2','3'].map((d) => btn(d, () => appendDigit(d), 'bg-white border border-cream-400 text-forest-900 hover:bg-cream-100'))}
          {btn('+', () => pressOp('+'), 'bg-amber-50 text-amber-700 hover:bg-amber-100')}
          {btn('0', () => appendDigit('0'), 'col-span-2 bg-white border border-cream-400 text-forest-900 hover:bg-cream-100')}
          {btn('.', appendDot, 'bg-white border border-cream-400 text-forest-900 hover:bg-cream-100')}
          {btn('=', pressEquals, 'bg-violet-600 text-white hover:bg-violet-700')}
        </div>
      </div>
      {history.length > 0 && (
        <div className="rounded-sm border border-cream-400 bg-white shadow-sm overflow-hidden">
          <div className="border-b border-gray-100 bg-cream-100 px-3 py-2">
            <span className="text-xs font-semibold text-bark-500 uppercase tracking-wide">Historique</span>
          </div>
          <div className="max-h-32 overflow-y-auto">
            {history.map((h, i) => <div key={i} className="px-3 py-1.5 text-xs text-gray-600 border-b border-gray-50 last:border-0 font-mono">{h}</div>)}
          </div>
        </div>
      )}
    </div>
  )
}

export function CashInterface({ session: initialSession, products, entityId, userId, entityUsers = [], authMethod = 'pin' }: CashInterfaceProps) {
  const [session, setSession] = useState(initialSession)
  const [tab, setTab] = useState<Tab>('vente')
  const [movements, setMovements] = useState<CashMovement[]>(initialSession?.cash_movements ?? [])
  const [cart, setCart] = useState<{ product: Product; qty: number; discount: number }[]>([])
  const [globalDiscount, setGlobalDiscount] = useState(0)
  const [amountReceived, setAmountReceived] = useState('')
  const [movType, setMovType] = useState<'EXPENSE' | 'DEPOSIT' | 'REFUND'>('EXPENSE')
  const [movAmount, setMovAmount] = useState('')
  const [movDesc, setMovDesc] = useState('')
  const [movPersonId, setMovPersonId] = useState('')
  const [openingAmount, setOpeningAmount] = useState('')
  const [openingNotes, setOpeningNotes] = useState('')
  const [opening, setOpening] = useState(false)
  const [validating, setValidating] = useState(false)
  const [showCloseForm, setShowCloseForm] = useState(false)
  const [closingAmount, setClosingAmount] = useState('')
  const [closingNotes, setClosingNotes] = useState('')
  const [closing, setClosing] = useState(false)
  const [confirmAction, setConfirmAction] = useState<null | { user: IdentityUser; onSuccess: () => void }>(null)
  const toast = useToast()

  const cartSubtotal = useMemo(() => cart.reduce((s, l) => {
    const linePrice = l.product.price_sell * l.qty
    const lineDiscount = l.discount > 0 ? linePrice * (l.discount / 100) : 0
    return s + linePrice - lineDiscount
  }, 0), [cart])
  const cartTotal = useMemo(() => {
    const disc = globalDiscount > 0 ? cartSubtotal * (globalDiscount / 100) : 0
    return Math.max(0, cartSubtotal - disc)
  }, [cartSubtotal, globalDiscount])
  const change = amountReceived ? parseFloat(amountReceived) - cartTotal : null
  const totalSales = useMemo(() => movements.filter((m) => m.type === 'SALE').reduce((s, m) => s + m.amount, 0), [movements])
  const totalExpenses = useMemo(() => movements.filter((m) => m.type === 'EXPENSE').reduce((s, m) => s + m.amount, 0), [movements])
  const totalDeposits = useMemo(() => movements.filter((m) => m.type === 'DEPOSIT').reduce((s, m) => s + m.amount, 0), [movements])
  const totalRefunds = useMemo(() => movements.filter((m) => m.type === 'REFUND').reduce((s, m) => s + m.amount, 0), [movements])
  const calculated = session ? session.opening_amount + totalSales + totalDeposits - totalExpenses - totalRefunds : 0

  const productOptions = useMemo(() => products.map((p) => ({
    value: p.id, label: p.name, sub: formatFCFA(p.price_sell),
  })), [products])

  const userOptions = useMemo(() => entityUsers.map((u) => ({
    value: u.id,
    label: u.full_name,
    avatar: u.full_name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase(),
    sub: u.role,
  })), [entityUsers])

  const withIdentityCheck = (personId: string, action: () => void) => {
    if (personId && personId !== userId) {
      const u = entityUsers.find((u) => u.id === personId)
      if (u) {
        setConfirmAction({
          user: { id: u.id, full_name: u.full_name, role: u.role, pin_set: !!u.pin_code_hash },
          onSuccess: () => { setConfirmAction(null); action() },
        })
        return
      }
    }
    action()
  }

  const openSession = async () => {
    if (!openingAmount || parseFloat(openingAmount) < 0) { toast.error('Fond de caisse invalide'); return }
    setOpening(true)
    const res = await fetch('/api/cash-sessions', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entity_id: entityId, opening_amount: parseFloat(openingAmount), notes: openingNotes }),
    })
    if (res.ok) { const d = await res.json(); setSession({ ...d, cash_movements: [] }); setMovements([]); toast.success('Session ouverte') }
    else toast.error('Erreur ouverture')
    setOpening(false)
  }

  const doValidateSale = async () => {
    if (!session) return
    setValidating(true)
    const lines = cart.map((l) => ({
      product_id: l.product.id, product_name_snapshot: l.product.name, quantity: l.qty,
      price_buy: l.product.price_buy, price_sell: l.product.price_sell,
      total_buy: l.product.price_buy * l.qty, total_sell: l.product.price_sell * l.qty,
    }))
    const res = await fetch('/api/invoices', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entity_id: entityId, session_id: session.id, total_buy: lines.reduce((s, l) => s + l.total_buy, 0), total_sell: cartTotal, margin: lines.reduce((s, l) => s + (l.total_sell - l.total_buy), 0), lines }),
    })
    if (res.ok) {
      const mov = { id: crypto.randomUUID(), cash_session_id: session.id, type: 'SALE', amount: cartTotal, description: `${cart.length} produit(s)`, created_at: new Date().toISOString() } as CashMovement
      setMovements((m) => [...m, mov]); setCart([]); setAmountReceived(''); toast.success('Vente enregistrée')
    } else toast.error('Erreur validation')
    setValidating(false)
  }

  const validateSale = () => {
    if (cart.length === 0) { toast.error('Panier vide'); return }
    if (!change || change < 0) { toast.error('Montant insuffisant'); return }
    doValidateSale()
  }

  const doAddMovement = async () => {
    if (!session || !movAmount || parseFloat(movAmount) <= 0) { toast.error('Montant invalide'); return }
    const res = await fetch('/api/cash-movements', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cash_session_id: session.id, entity_id: entityId, type: movType, amount: parseFloat(movAmount), description: movDesc || undefined, person_id: movPersonId || undefined }),
    })
    if (res.ok) { const d = await res.json(); setMovements((m) => [...m, d]); setMovAmount(''); setMovDesc(''); setMovPersonId(''); toast.success('Mouvement enregistré') }
    else toast.error('Erreur enregistrement')
  }

  const addMovement = () => withIdentityCheck(movPersonId, doAddMovement)

  const closeSession = async () => {
    if (!session || !closingAmount) { toast.error('Saisissez le montant compté'); return }
    setClosing(true)
    const res = await fetch(`/api/cash-sessions/${session.id}/close`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ closing_amount_declared: parseFloat(closingAmount), notes: closingNotes }),
    })
    if (res.ok) { toast.success('Session fermée'); setTimeout(() => window.location.reload(), 1200) }
    else toast.error('Erreur fermeture')
    setClosing(false)
  }

  if (!session) {
    return (
      <>
        <div className="mx-auto max-w-md space-y-5">
          <div>
            <h1 className="font-heading text-xl font-bold text-forest-900">Nouvelle session caisse</h1>
            <p className="text-sm text-bark-500 mt-0.5">Déclarez le fond de caisse initial pour commencer</p>
          </div>
          <div className="rounded-sm border border-cream-400 bg-white p-6 shadow-sm space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-700">Fond de caisse initial (FCFA)</label>
              <input type="number" min="0" value={openingAmount} onChange={(e) => setOpeningAmount(e.target.value)} placeholder="Ex : 50 000"
                className="h-12 w-full rounded-sm border border-cream-400 px-3 text-lg font-semibold focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500" />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-700">Notes d'ouverture (optionnel)</label>
              <input type="text" value={openingNotes} onChange={(e) => setOpeningNotes(e.target.value)} placeholder="Remarques..."
                className="h-9 w-full rounded-sm border border-cream-400 px-3 text-sm focus:border-violet-500 focus:outline-none" />
            </div>
            <button onClick={openSession} disabled={opening || !openingAmount}
              className="flex w-full items-center justify-center gap-2 h-11 rounded-sm bg-violet-600 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-60 transition-colors">
              {opening ? 'Ouverture...' : 'Ouvrir la session'}
            </button>
          </div>
        </div>
        <ToastContainer />
      </>
    )
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-2.5 w-2.5 rounded-full bg-green-500" />
            <div>
              <h1 className="font-heading text-lg font-bold text-forest-900">Session active</h1>
              <p className="text-xs text-bark-500">Fond initial : {formatFCFA(session.opening_amount)} · Solde : {formatFCFA(calculated)}</p>
            </div>
          </div>
          <button onClick={() => setShowCloseForm(true)}
            className="flex items-center gap-2 h-9 rounded-sm border border-cream-400 px-3 text-sm text-gray-600 hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-colors">
            <RefreshCw className="h-3.5 w-3.5" />Fermer session
          </button>
        </div>

        <div className="flex border-b border-cream-400">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setTab(id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${tab === id ? 'border-forest-600 text-forest-700' : 'border-transparent text-bark-500 hover:text-gray-700'}`}>
              <Icon className="h-4 w-4" />{label}
            </button>
          ))}
        </div>

        {tab === 'vente' && (
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-700">Ajouter un produit</label>
              <AutocompleteSelect
                options={productOptions}
                value=""
                onChange={(val) => {
                  if (!val) return
                  const product = products.find((p) => p.id === val)
                  if (!product) return
                  setCart((c) => {
                    const exists = c.find((x) => x.product.id === val)
                    return exists ? c.map((x) => x.product.id === val ? { ...x, qty: x.qty + 1 } : x) : [...c, { product, qty: 1, discount: 0 }]
                  })
                }}
                placeholder="Tapez pour rechercher un produit..."
                clearable={false}
                noResultsText="Aucun produit trouvé"
              />
            </div>

            {cart.length > 0 && (
              <>
                <div className="rounded-sm border border-cream-400 bg-white shadow-botanical overflow-hidden">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b border-cream-300 bg-forest-50">
                      {['Produit','Qté','P.U.','Remise %','Total',''].map((h) => (
                        <th key={h} className="px-3 py-2 text-left text-xs font-semibold text-forest-600 uppercase tracking-wide">{h}</th>
                      ))}
                    </tr></thead>
                    <tbody className="divide-y divide-cream-200">
                      {cart.map((l) => {
                        const lineBase = l.product.price_sell * l.qty
                        const lineDisc = l.discount > 0 ? lineBase * (l.discount / 100) : 0
                        const lineTotal = lineBase - lineDisc
                        return (
                          <tr key={l.product.id} className="hover:bg-cream-50">
                            <td className="px-3 py-2 font-medium text-forest-900 text-xs">{l.product.name}</td>
                            <td className="px-3 py-2">
                              <input type="number" min="1" value={l.qty}
                                onChange={(e) => setCart((c) => c.map((x) => x.product.id === l.product.id ? { ...x, qty: parseInt(e.target.value) || 1 } : x))}
                                className="h-7 w-14 rounded-sm border border-cream-400 text-center text-xs focus:border-forest-500 focus:outline-none" />
                            </td>
                            <td className="px-3 py-2 text-xs text-bark-600 whitespace-nowrap">{formatFCFA(l.product.price_sell)}</td>
                            <td className="px-3 py-2">
                              <div className="flex items-center gap-1">
                                <input type="number" min="0" max="100" value={l.discount}
                                  onChange={(e) => setCart((c) => c.map((x) => x.product.id === l.product.id ? { ...x, discount: Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)) } : x))}
                                  className="h-7 w-14 rounded-sm border border-cream-400 text-center text-xs focus:border-gold-500 focus:outline-none" />
                                <span className="text-xs text-bark-400">%</span>
                              </div>
                            </td>
                            <td className="px-3 py-2 text-xs font-semibold text-forest-900 whitespace-nowrap">
                              {lineDisc > 0 && <span className="line-through text-bark-300 mr-1">{formatFCFA(lineBase)}</span>}
                              {formatFCFA(lineTotal)}
                            </td>
                            <td className="px-3 py-2">
                              <button onClick={() => setCart((c) => c.filter((x) => x.product.id !== l.product.id))} className="text-bark-300 hover:text-red-500">
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Global discount + subtotal */}
                <div className="rounded-sm border border-cream-400 bg-cream-50 px-4 py-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-bark-600">Sous-total</span>
                    <span className="text-sm font-semibold text-forest-900">{formatFCFA(cartSubtotal)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="text-xs text-bark-600">Remise globale</label>
                    <div className="flex items-center gap-1">
                      <input type="number" min="0" max="100" value={globalDiscount}
                        onChange={(e) => setGlobalDiscount(Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)))}
                        className="h-7 w-16 rounded-sm border border-cream-400 text-center text-xs focus:border-gold-500 focus:outline-none" />
                      <span className="text-xs text-bark-400">%</span>
                      {globalDiscount > 0 && (
                        <span className="text-xs text-gold-600 ml-1">−{formatFCFA(cartSubtotal * globalDiscount / 100)}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between border-t border-cream-300 pt-2">
                    <span className="text-sm font-semibold text-forest-800">Total</span>
                    <span className="text-xl font-bold text-forest-900">{formatFCFA(cartTotal)}</span>
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-medium text-bark-700">Montant reçu</label>
                  <input type="number" min="0" value={amountReceived} onChange={(e) => setAmountReceived(e.target.value)}
                    className="h-11 w-full rounded-sm border border-cream-400 px-3 text-lg font-semibold focus:border-forest-500 focus:outline-none focus:ring-1 focus:ring-forest-500" />
                  {change !== null && (
                    <div className={`mt-2 rounded-sm p-3 text-center ${change >= 0 ? 'bg-forest-50 border border-forest-200' : 'bg-red-50 border border-red-200'}`}>
                      <div className="text-xs text-bark-500 mb-0.5">Rendu monnaie</div>
                      <div className={`text-3xl font-bold ${change >= 0 ? 'text-forest-700' : 'text-red-700'}`}>{change >= 0 ? '+' : ''}{formatFCFA(Math.abs(change))}</div>
                    </div>
                  )}
                </div>

                {/* Validate + Return buttons */}
                <div className="flex gap-2">
                  <button onClick={validateSale} disabled={validating}
                    className="flex flex-1 items-center justify-center gap-2 h-11 rounded-sm bg-forest-700 text-sm font-semibold text-white hover:bg-forest-800 disabled:opacity-60 transition-colors">
                    <CheckCircle className="h-4 w-4" />
                    {validating ? 'Validation...' : `Valider — ${formatFCFA(cartTotal)}`}
                  </button>
                  <button onClick={() => { setCart([]); setGlobalDiscount(0); setAmountReceived('') }}
                    className="h-11 rounded-sm border border-red-200 bg-red-50 px-4 text-sm font-medium text-red-600 hover:bg-red-100 transition-colors">
                    Annuler
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {tab === 'mouvements' && (
          <div className="space-y-4">
            <div className="rounded-sm border border-cream-400 bg-white p-4 shadow-sm space-y-4">
              <h3 className="text-sm font-semibold text-gray-800">Enregistrer un mouvement</h3>
              <div className="flex gap-2">
                {(['EXPENSE','DEPOSIT','REFUND'] as const).map((t) => (
                  <button key={t} onClick={() => setMovType(t)}
                    className={`flex-1 py-2 text-xs font-medium rounded-sm border transition-colors ${movType === t ? t === 'EXPENSE' ? 'bg-red-600 border-red-600 text-white' : t === 'DEPOSIT' ? 'bg-green-600 border-green-600 text-white' : 'bg-amber-600 border-amber-600 text-white' : 'border-cream-400 bg-white text-gray-600 hover:bg-cream-100'}`}>
                    {t === 'EXPENSE' ? 'Dépense' : t === 'DEPOSIT' ? 'Apport' : 'Remboursement'}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-700">Montant (FCFA)</label>
                  <input type="number" min="0" value={movAmount} onChange={(e) => setMovAmount(e.target.value)}
                    className="h-9 w-full rounded-sm border border-cream-400 px-3 text-sm focus:border-violet-500 focus:outline-none" />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-700">Description</label>
                  <input type="text" value={movDesc} onChange={(e) => setMovDesc(e.target.value)}
                    className="h-9 w-full rounded-sm border border-cream-400 px-3 text-sm focus:border-violet-500 focus:outline-none" />
                </div>
              </div>
              {userOptions.length > 0 && (
                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-gray-700">
                    <User className="h-3.5 w-3.5" />
                    Concerne une personne spécifique
                    {movPersonId && movPersonId !== userId && (
                      <span className="ml-1 flex items-center gap-1 text-amber-600 text-xs font-normal">
                        <Lock className="h-3 w-3" /> Confirmation requise
                      </span>
                    )}
                  </label>
                  <AutocompleteSelect
                    options={userOptions}
                    value={movPersonId}
                    onChange={setMovPersonId}
                    placeholder="Optionnel — sélectionner une personne..."
                    clearable
                    noResultsText="Aucun utilisateur"
                  />
                </div>
              )}
              <button onClick={addMovement}
                className="flex items-center gap-2 h-9 rounded-sm bg-gray-900 px-4 text-sm font-medium text-white hover:bg-gray-800 transition-colors">
                {movPersonId && movPersonId !== userId
                  ? <><Lock className="h-3.5 w-3.5" />Enregistrer avec confirmation</>
                  : <><Plus className="h-4 w-4" />Enregistrer</>}
              </button>
            </div>

            <div className="rounded-sm border border-cream-400 bg-white shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-gray-100 bg-cream-100">{['Heure','Type','Description','Montant'].map((h) => <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-bark-500 uppercase">{h}</th>)}</tr></thead>
                <tbody className="divide-y divide-gray-100">
                  {[...movements].reverse().map((m) => (
                    <tr key={m.id} className="hover:bg-cream-100">
                      <td className="px-4 py-2.5 text-xs text-bark-500 whitespace-nowrap">{formatDateTime(m.created_at)}</td>
                      <td className="px-4 py-2.5">
                        <span className={`inline-flex rounded-sm px-1.5 py-0.5 text-xs font-medium ${m.type === 'SALE' ? 'bg-green-50 text-green-700' : m.type === 'EXPENSE' ? 'bg-red-50 text-red-700' : m.type === 'DEPOSIT' ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-700'}`}>
                          {m.type === 'SALE' ? 'Vente' : m.type === 'EXPENSE' ? 'Dépense' : m.type === 'DEPOSIT' ? 'Apport' : 'Remboursement'}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-xs text-gray-600">{m.description ?? '—'}</td>
                      <td className={`px-4 py-2.5 text-xs font-semibold whitespace-nowrap ${m.type === 'EXPENSE' || m.type === 'REFUND' ? 'text-red-600' : 'text-green-600'}`}>
                        {m.type === 'EXPENSE' || m.type === 'REFUND' ? '-' : '+'}{formatFCFA(m.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {movements.length === 0 && <div className="py-8 text-center text-sm text-gray-400">Aucun mouvement</div>}
            </div>
          </div>
        )}

        {tab === 'calculatrice' && <Calculator />}

        {tab === 'résumé' && (
          <div className="space-y-3">
            {[
              { l: 'Fond initial', v: formatFCFA(session.opening_amount), c: 'text-forest-900' },
              { l: 'Total ventes', v: `+${formatFCFA(totalSales)}`, c: 'text-green-700' },
              { l: 'Total dépenses', v: `-${formatFCFA(totalExpenses)}`, c: 'text-red-700' },
              { l: 'Total remboursements', v: `-${formatFCFA(totalRefunds)}`, c: 'text-amber-700' },
              { l: 'Total apports', v: `+${formatFCFA(totalDeposits)}`, c: 'text-blue-700' },
              { l: 'Solde calculé', v: formatFCFA(calculated), c: 'text-violet-700 text-lg font-bold' },
            ].map(({ l, v, c }) => (
              <div key={l} className="flex items-center justify-between rounded-sm border border-cream-400 bg-white px-4 py-3 shadow-sm">
                <span className="text-sm text-gray-600">{l}</span>
                <span className={`font-semibold text-sm ${c}`}>{v}</span>
              </div>
            ))}
            <div className="rounded-sm border border-cream-400 bg-white p-4 shadow-sm">
              <div className="text-xs font-semibold text-bark-500 uppercase tracking-wide mb-3">Transactions</div>
              <div className="grid grid-cols-4 gap-2 text-center text-xs">
                {[
                  { n: movements.filter((m) => m.type === 'SALE').length, l: 'Ventes', c: 'text-green-700' },
                  { n: movements.filter((m) => m.type === 'EXPENSE').length, l: 'Dépenses', c: 'text-red-700' },
                  { n: movements.filter((m) => m.type === 'REFUND').length, l: 'Rembourst.', c: 'text-amber-700' },
                  { n: movements.filter((m) => m.type === 'DEPOSIT').length, l: 'Apports', c: 'text-blue-700' },
                ].map(({ n, l, c }) => (
                  <div key={l}><div className={`font-bold text-xl ${c}`}>{n}</div><div className="text-bark-500">{l}</div></div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {showCloseForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-sm border border-cream-400 bg-white shadow-md">
            <div className="flex items-center justify-between border-b border-cream-400 px-5 py-4">
              <h2 className="text-sm font-semibold text-forest-900">Fermeture de session</h2>
              <button onClick={() => setShowCloseForm(false)} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex justify-between items-center rounded-sm bg-cream-100 p-3 text-sm">
                <span className="text-gray-600">Solde théorique</span>
                <span className="font-bold text-violet-700">{formatFCFA(calculated)}</span>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-700">Montant compté (FCFA)</label>
                <input type="number" min="0" value={closingAmount} onChange={(e) => setClosingAmount(e.target.value)}
                  className="h-11 w-full rounded-sm border border-cream-400 px-3 text-lg font-semibold focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500" />
              </div>
              {closingAmount && (() => {
                const ecart = parseFloat(closingAmount) - calculated
                const abs = Math.abs(ecart)
                const lvl = abs > 500 ? 'red' : abs > 100 ? 'amber' : 'green'
                return (
                  <div className={`rounded-sm p-3 text-center ${lvl === 'red' ? 'bg-red-50 border border-red-200' : lvl === 'amber' ? 'bg-amber-50 border border-amber-200' : 'bg-green-50 border border-green-200'}`}>
                    <div className="text-xs text-bark-500 mb-1">Écart</div>
                    <div className={`text-2xl font-bold ${lvl === 'red' ? 'text-red-700' : lvl === 'amber' ? 'text-amber-700' : 'text-green-700'}`}>
                      {ecart >= 0 ? '+' : ''}{formatFCFA(ecart)}
                    </div>
                    {lvl === 'red' && <div className="mt-1 text-xs font-medium text-red-600">Alerte critique — notification admin</div>}
                    {lvl === 'amber' && <div className="mt-1 text-xs text-amber-600">Écart notable — vérifiez les mouvements</div>}
                  </div>
                )
              })()}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-700">Notes de fermeture</label>
                <textarea value={closingNotes} onChange={(e) => setClosingNotes(e.target.value)} rows={2}
                  className="w-full rounded-sm border border-cream-400 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none resize-none" />
              </div>
              <div className="flex gap-2">
                <button onClick={() => setShowCloseForm(false)} className="flex-1 h-9 rounded-sm border border-cream-400 text-sm text-gray-600 hover:bg-cream-100">Annuler</button>
                <button onClick={closeSession} disabled={closing || !closingAmount}
                  className="flex-1 h-9 rounded-sm bg-gray-900 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-60 transition-colors">
                  {closing ? 'Fermeture...' : 'Confirmer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {confirmAction && (
        <ConfirmIdentityModal
          user={confirmAction.user}
          authMethod={authMethod}
          onSuccess={confirmAction.onSuccess}
          onCancel={() => setConfirmAction(null)}
          title="Confirmation d'identité"
          message={`Cette opération concerne ${confirmAction.user.full_name}. Veuillez confirmer son identité pour continuer.`}
        />
      )}

      <ToastContainer />
    </>
  )
}
