'use client'

import { useState, useEffect, useCallback } from 'react'
import { Bell, MessageSquare, Mail, Save, TestTube2, Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { ToastContainer } from '@/components/ui/toast-container'

interface NotifSetting {
  id?: string
  entity_id?: string
  role?: string
  whatsapp_number: string
  whatsapp_active: boolean
  email: string
  email_active: boolean
  freq_orders: 'each' | 'hourly' | 'daily'
  freq_stock: 'realtime' | 'daily' | 'off'
  freq_cash: 'each' | 'daily' | 'off'
  daily_summary_time: string
}

interface NotifSettingsPageProps {
  entityId: string
  isSuperAdmin: boolean
}

const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrateur', manager: 'Manager', vendeur: 'Vendeur', caissier: 'Caissier',
}
const FREQ_ORDER_OPTIONS = [
  { value: 'each', label: 'Chaque commande' },
  { value: 'hourly', label: 'Résumé horaire' },
  { value: 'daily', label: 'Résumé journalier' },
]
const FREQ_STOCK_OPTIONS = [
  { value: 'realtime', label: 'Temps réel' },
  { value: 'daily', label: 'Résumé journalier' },
  { value: 'off', label: 'Désactivé' },
]
const FREQ_CASH_OPTIONS = [
  { value: 'each', label: 'Chaque session' },
  { value: 'daily', label: 'Synthèse journalière 20h' },
  { value: 'off', label: 'Désactivé' },
]

const DEFAULT: NotifSetting = {
  whatsapp_number: '', whatsapp_active: false,
  email: '', email_active: false,
  freq_orders: 'each', freq_stock: 'realtime', freq_cash: 'each',
  daily_summary_time: '20:00',
}

export function NotificationSettingsPage({ entityId, isSuperAdmin }: NotifSettingsPageProps) {
  const [settings, setSettings] = useState<Record<string, NotifSetting>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [testing, setTesting] = useState<string | null>(null)
  const toast = useToast()
  const roles = ['admin', 'manager', 'vendeur', 'caissier']

  const load = useCallback(async () => {
    const res = await fetch(`/api/notification-settings?entity_id=${entityId}`)
    if (res.ok) {
      const data = await res.json()
      const map: Record<string, NotifSetting> = {}
      roles.forEach((r) => {
        const existing = data.find((d: any) => d.role === r)
        map[r] = existing ? { ...DEFAULT, ...existing } : { ...DEFAULT, role: r, entity_id: entityId }
      })
      setSettings(map)
    }
    setLoading(false)
  }, [entityId])

  useEffect(() => { load() }, [load])

  const update = (role: string, field: keyof NotifSetting, value: any) => {
    setSettings((prev) => ({ ...prev, [role]: { ...prev[role], [field]: value } }))
  }

  const save = async (role: string) => {
    setSaving(role)
    const s = settings[role]
    const res = await fetch('/api/notification-settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...s, entity_id: entityId, role }),
    })
    if (res.ok) {
      const data = await res.json()
      setSettings((prev) => ({ ...prev, [role]: { ...prev[role], id: data.id } }))
      toast.success('Paramètres sauvegardés')
    } else {
      toast.error('Erreur sauvegarde')
    }
    setSaving(null)
  }

  const test = async (type: 'test_whatsapp' | 'test_email') => {
    setTesting(type)
    const res = await fetch('/api/notification-settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, entity_id: entityId }),
    })
    const data = await res.json()
    if (res.ok) toast.success(data.note ?? 'Message de test envoyé')
    else toast.error(data.error ?? 'Erreur')
    setTesting(null)
  }

  const Toggle = ({ checked, onChange }: { checked: boolean; onChange: () => void }) => (
    <button type="button" onClick={onChange}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${checked ? 'bg-violet-600' : 'bg-gray-200'}`}>
      <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${checked ? 'translate-x-4' : 'translate-x-0.5'}`} />
    </button>
  )

  const Select = ({ value, options, onChange }: { value: string; options: {value:string;label:string}[]; onChange: (v: string) => void }) => (
    <select value={value} onChange={(e) => onChange(e.target.value)}
      className="h-8 rounded-sm border border-gray-200 bg-white px-2 text-xs text-gray-700 focus:border-violet-500 focus:outline-none">
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  )

  return (
    <>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-gray-500" />
            <div>
              <h1 className="font-heading text-xl font-bold text-gray-900">Paramètres notifications</h1>
              <p className="mt-0.5 text-sm text-gray-500">Configuration par rôle</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => test('test_whatsapp')} disabled={!!testing}
              className="flex items-center gap-2 rounded-sm border border-gray-200 px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors">
              {testing === 'test_whatsapp' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <MessageSquare className="h-3.5 w-3.5" />}
              Test WhatsApp
            </button>
            <button onClick={() => test('test_email')} disabled={!!testing}
              className="flex items-center gap-2 rounded-sm border border-gray-200 px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors">
              {testing === 'test_email' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Mail className="h-3.5 w-3.5" />}
              Test Email
            </button>
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-48 rounded-sm bg-gray-100 animate-pulse" />)}</div>
        ) : (
          <div className="space-y-4">
            {roles.map((role) => {
              const s = settings[role] ?? DEFAULT
              return (
                <div key={role} className="rounded-sm border border-gray-200 bg-white shadow-sm overflow-hidden">
                  <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50 px-4 py-3">
                    <span className="text-sm font-semibold text-gray-800">{ROLE_LABELS[role]}</span>
                    <button onClick={() => save(role)} disabled={saving === role}
                      className="flex items-center gap-1.5 rounded-sm bg-violet-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-violet-700 disabled:opacity-60 transition-colors">
                      {saving === role ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                      Sauvegarder
                    </button>
                  </div>

                  <div className="p-4 grid grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-medium text-gray-700 flex items-center gap-1.5">
                          <MessageSquare className="h-3.5 w-3.5 text-green-600" /> WhatsApp
                        </label>
                        <Toggle checked={s.whatsapp_active} onChange={() => update(role, 'whatsapp_active', !s.whatsapp_active)} />
                      </div>
                      <input type="text" value={s.whatsapp_number} onChange={(e) => update(role, 'whatsapp_number', e.target.value)}
                        placeholder="+22890123456"
                        disabled={!s.whatsapp_active}
                        className="h-8 w-full rounded-sm border border-gray-200 px-3 text-xs disabled:bg-gray-50 disabled:text-gray-400 focus:border-violet-500 focus:outline-none" />

                      <div className="flex items-center justify-between mt-4">
                        <label className="text-xs font-medium text-gray-700 flex items-center gap-1.5">
                          <Mail className="h-3.5 w-3.5 text-blue-600" /> Email
                        </label>
                        <Toggle checked={s.email_active} onChange={() => update(role, 'email_active', !s.email_active)} />
                      </div>
                      <input type="email" value={s.email} onChange={(e) => update(role, 'email', e.target.value)}
                        placeholder="admin@example.com"
                        disabled={!s.email_active}
                        className="h-8 w-full rounded-sm border border-gray-200 px-3 text-xs disabled:bg-gray-50 disabled:text-gray-400 focus:border-violet-500 focus:outline-none" />
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="mb-1 block text-xs font-medium text-gray-600">Fréquence commandes</label>
                        <Select value={s.freq_orders} options={FREQ_ORDER_OPTIONS} onChange={(v) => update(role, 'freq_orders', v)} />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-gray-600">Fréquence alertes stock</label>
                        <Select value={s.freq_stock} options={FREQ_STOCK_OPTIONS} onChange={(v) => update(role, 'freq_stock', v)} />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-gray-600">Fréquence rapports caisse</label>
                        <Select value={s.freq_cash} options={FREQ_CASH_OPTIONS} onChange={(v) => update(role, 'freq_cash', v)} />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-gray-600">Heure synthèse journalière</label>
                        <input type="time" value={s.daily_summary_time}
                          onChange={(e) => update(role, 'daily_summary_time', e.target.value)}
                          className="h-8 rounded-sm border border-gray-200 px-2 text-xs focus:border-violet-500 focus:outline-none" />
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
      <ToastContainer />
    </>
  )
}
