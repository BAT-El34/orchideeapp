'use client'

import { useState } from 'react'
import { Settings, Save, Bell, MessageSquare } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { ToastContainer } from '@/components/ui/toast-container'

export default function ParametresPage() {
  const [twilioSid, setTwilioSid] = useState('')
  const [twilioToken, setTwilioToken] = useState('')
  const [whatsappFrom, setWhatsappFrom] = useState('whatsapp:+14155238886')
  const [adminPhone, setAdminPhone] = useState('')
  const [testLoading, setTestLoading] = useState(false)
  const toast = useToast()

  const sendTest = async () => {
    if (!adminPhone) { toast.error('Numéro requis'); return }
    setTestLoading(true)
    const res = await fetch('/api/whatsapp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone_number: adminPhone,
        type: 'REPORT',
        data: { date: new Date().toISOString().split('T')[0], sales: '0', nb: '0' },
      }),
    })
    if (res.ok) {
      toast.success('Message WhatsApp de test envoyé')
    } else {
      const err = await res.json()
      toast.error(err.error ?? 'Erreur envoi WhatsApp')
    }
    setTestLoading(false)
  }

  return (
    <>
      <div className="max-w-2xl space-y-6">
        <div>
          <h1 className="font-heading text-xl font-bold text-gray-900">Paramètres</h1>
          <p className="mt-0.5 text-sm text-gray-500">Configuration de l'application</p>
        </div>

        <div className="rounded-sm border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 border-b border-gray-200 bg-gray-50 px-5 py-3">
            <MessageSquare className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-semibold text-gray-800">WhatsApp / Twilio</span>
          </div>
          <div className="p-5 space-y-4">
            <div className="rounded-sm border border-blue-200 bg-blue-50 px-4 py-3 text-xs text-blue-700">
              Ces paramètres sont à configurer dans les variables d'environnement Vercel : TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM.
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-700">
                Numéro WhatsApp de test (format: +33612345678)
              </label>
              <input
                type="text"
                value={adminPhone}
                onChange={(e) => setAdminPhone(e.target.value)}
                placeholder="+33612345678"
                className="h-9 w-full rounded-sm border border-gray-200 px-3 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
              />
            </div>

            <button
              onClick={sendTest}
              disabled={testLoading}
              className="flex items-center gap-2 h-9 rounded-sm bg-green-600 px-4 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-60 transition-colors"
            >
              <MessageSquare className="h-4 w-4" />
              {testLoading ? 'Envoi...' : 'Envoyer message de test'}
            </button>
          </div>
        </div>

        <div className="rounded-sm border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 border-b border-gray-200 bg-gray-50 px-5 py-3">
            <Bell className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-semibold text-gray-800">Alertes automatiques</span>
          </div>
          <div className="p-5 space-y-3">
            {[
              { label: 'Alerte stock bas', desc: 'Notifier quand un produit passe sous son seuil', enabled: true },
              { label: 'Rapport 20h', desc: 'Rapport quotidien automatique à 20h envoyé aux admins', enabled: true },
              { label: 'Session caisse > 12h', desc: 'Alerte si une session reste ouverte plus de 12h', enabled: true },
              { label: 'Écart de caisse', desc: 'Alerte admin sur écarts significatifs à la fermeture', enabled: true },
            ].map((item: any) => (
              <div key={item.label} className="flex items-center justify-between rounded-sm border border-gray-200 p-3">
                <div>
                  <div className="text-xs font-medium text-gray-800">{item.label}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{item.desc}</div>
                </div>
                <div className="flex h-5 w-9 items-center justify-end rounded-full bg-violet-600 px-0.5">
                  <span className="h-3.5 w-3.5 rounded-full bg-white" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <ToastContainer />
    </>
  )
}
