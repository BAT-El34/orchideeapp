'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'
import Link from 'next/link'
import { Eye, EyeOff, Leaf, Check, User, Mail, Lock, Briefcase, ArrowLeft, Clock } from 'lucide-react'

const ROLES = [
  { value: 'manager',  label: 'Manager',       desc: 'Supervision des ventes, stocks, commandes et rapports', icon: '📊' },
  { value: 'vendeur',  label: 'Vendeur',        desc: 'Création et gestion des factures de vente',             icon: '🛍️' },
  { value: 'caissier', label: 'Caissier',       desc: 'Gestion de la caisse et des encaissements',             icon: '💵' },
  { value: 'readonly', label: 'Lecture seule',  desc: 'Consultation des données sans modification',            icon: '👁️' },
]

type Step = 'role' | 'info' | 'done'

export default function RegisterPage() {
  const [step, setStep] = useState<Step>('role')
  const [selectedRole, setSelectedRole] = useState('')
  const [form, setForm] = useState({ full_name: '', email: '', password: '', confirm: '' })
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleRegister = async () => {
    setError('')
    if (!form.full_name.trim())            { setError('Nom requis'); return }
    if (!form.email.includes('@'))          { setError('Email invalide'); return }
    if (form.password.length < 6)           { setError('Mot de passe : 6 caractères minimum'); return }
    if (form.password !== form.confirm)     { setError('Les mots de passe ne correspondent pas'); return }

    setLoading(true)
    const supabase = createClient()

    const { data, error: authErr } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: { data: { full_name: form.full_name, requested_role: selectedRole, role: 'readonly' } },
    })

    if (authErr) { setError(authErr.message); setLoading(false); return }

    if (data.user) {
      await supabase.from('users').upsert({
        id: data.user.id, email: form.email, full_name: form.full_name,
        role: 'readonly', requested_role: selectedRole, status: 'pending',
      }, { onConflict: 'id' })
    }

    setStep('done')
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-cream-100">
      {/* Left branding panel */}
      <div className="hidden md:flex md:w-5/12 bg-forest-800 flex-col items-center justify-center p-10 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 h-64 w-64 rounded-full bg-gold-400 blur-3xl" />
          <div className="absolute bottom-20 right-10 h-48 w-48 rounded-full bg-sage-400 blur-2xl" />
        </div>
        <div className="relative z-10 text-center">
          <div className="mb-8 flex justify-center">
            <Image src="/logo-orchidee.png" alt="Orchidée" width={90} height={90} className="filter brightness-0 invert opacity-90" />
          </div>
          <h1 className="font-heading text-3xl font-bold text-cream-100 mb-3">Rejoindre l'équipe</h1>
          <p className="text-forest-300 text-sm leading-relaxed max-w-xs mb-8">
            Votre demande sera examinée par un administrateur avant l'activation de votre compte.
          </p>
          <div className="space-y-3 text-left">
            {['Choisissez votre type de compte','Remplissez vos informations','Validation par un super admin','Compte activé — accès accordé'].map((s, i) => (
              <div key={i} className="flex items-center gap-3 text-sm text-forest-300">
                <div className="h-6 w-6 rounded-sm bg-gold-500/20 border border-gold-500/40 flex items-center justify-center flex-shrink-0">
                  <span className="text-gold-400 text-xs font-bold">{i + 1}</span>
                </div>
                {s}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-12">
        <div className="md:hidden mb-6">
          <Image src="/logo-orchidee.png" alt="Orchidée" width={56} height={56} />
        </div>

        <div className="w-full max-w-md">
          <Link href="/login" className="inline-flex items-center gap-1.5 text-xs text-bark-500 hover:text-forest-700 mb-6 transition-colors">
            <ArrowLeft className="h-3.5 w-3.5" /> Retour à la connexion
          </Link>

          {/* ─── Step 1: Role ─────────────────────── */}
          {step === 'role' && (
            <div>
              <h2 className="font-heading text-2xl font-semibold text-forest-800 mb-1">Créer un compte</h2>
              <p className="text-sm text-bark-500 mb-5">Quel type de compte souhaitez-vous obtenir ?</p>

              <div className="space-y-3 mb-6">
                {ROLES.map((r) => (
                  <button key={r.value} onClick={() => setSelectedRole(r.value)}
                    className={`w-full flex items-start gap-4 rounded-sm border p-4 text-left transition-all ${
                      selectedRole === r.value
                        ? 'border-forest-500 bg-forest-50 shadow-botanical'
                        : 'border-cream-400 bg-white hover:border-forest-300 hover:bg-cream-50'
                    }`}>
                    <span className="text-2xl flex-shrink-0">{r.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-forest-900 text-sm">{r.label}</p>
                      <p className="text-xs text-bark-500 mt-0.5 leading-relaxed">{r.desc}</p>
                    </div>
                    <div className={`h-5 w-5 rounded-sm border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors ${
                      selectedRole === r.value ? 'border-forest-600 bg-forest-600' : 'border-cream-400'
                    }`}>
                      {selectedRole === r.value && <Check className="h-3 w-3 text-white" />}
                    </div>
                  </button>
                ))}
              </div>

              <button onClick={() => selectedRole && setStep('info')} disabled={!selectedRole}
                className="w-full h-11 rounded-sm bg-forest-700 text-white font-semibold text-sm hover:bg-forest-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                Continuer →
              </button>
            </div>
          )}

          {/* ─── Step 2: Info ─────────────────────── */}
          {step === 'info' && (
            <div>
              <div className="flex items-center gap-2 mb-1">
                <button onClick={() => setStep('role')} className="text-bark-400 hover:text-forest-700 transition-colors">
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <h2 className="font-heading text-2xl font-semibold text-forest-800">Vos informations</h2>
              </div>

              <div className="mb-5 mt-1">
                {(() => { const r = ROLES.find((x) => x.value === selectedRole)
                  return r ? <span className="inline-flex items-center gap-1.5 rounded-sm bg-forest-100 px-2.5 py-1 text-xs font-medium text-forest-700"><Briefcase className="h-3 w-3" />{r.label}</span> : null
                })()}
              </div>

              <div className="space-y-4">
                {[
                  { key: 'full_name', label: 'Nom complet', type: 'text', placeholder: 'Prénom Nom', icon: User },
                  { key: 'email',     label: 'Email',       type: 'email', placeholder: 'vous@exemple.com', icon: Mail },
                ].map(({ key, label, type, placeholder, icon: Icon }) => (
                  <div key={key}>
                    <label className="block text-xs font-medium text-bark-600 mb-1.5">{label}</label>
                    <div className="relative">
                      <Icon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-bark-400" />
                      <input type={type} value={form[key as keyof typeof form]}
                        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                        placeholder={placeholder}
                        className="h-10 w-full rounded-sm border border-cream-400 bg-cream-50 pl-9 pr-3 text-sm focus:border-forest-500 focus:bg-white focus:outline-none" />
                    </div>
                  </div>
                ))}

                {['password','confirm'].map((key) => (
                  <div key={key}>
                    <label className="block text-xs font-medium text-bark-600 mb-1.5">
                      {key === 'password' ? 'Mot de passe' : 'Confirmer le mot de passe'}
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-bark-400" />
                      <input type={showPwd ? 'text' : 'password'}
                        value={form[key as keyof typeof form]}
                        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                        onKeyDown={(e) => e.key === 'Enter' && handleRegister()}
                        placeholder={key === 'password' ? 'Minimum 6 caractères' : 'Répétez le mot de passe'}
                        className={`h-10 w-full rounded-sm border bg-cream-50 pl-9 pr-10 text-sm focus:outline-none focus:bg-white ${
                          key === 'confirm' && form.confirm && form.password !== form.confirm
                            ? 'border-red-300 focus:border-red-400'
                            : 'border-cream-400 focus:border-forest-500'
                        }`} />
                      {key === 'password' && (
                        <button type="button" onClick={() => setShowPwd(!showPwd)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-bark-400 hover:text-bark-600">
                          {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      )}
                    </div>
                    {key === 'confirm' && form.confirm && form.password !== form.confirm && (
                      <p className="text-xs text-red-500 mt-1">Les mots de passe ne correspondent pas</p>
                    )}
                  </div>
                ))}
              </div>

              {error && (
                <div className="mt-4 rounded-sm border border-red-200 bg-red-50 px-3 py-2.5 text-xs text-red-700">{error}</div>
              )}

              <button onClick={handleRegister} disabled={loading}
                className="mt-5 w-full h-11 rounded-sm bg-forest-700 text-white font-semibold text-sm hover:bg-forest-800 disabled:opacity-60 transition-colors flex items-center justify-center gap-2">
                {loading
                  ? <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                  : <Leaf className="h-4 w-4" />}
                {loading ? 'Envoi...' : 'Soumettre ma demande'}
              </button>

              <p className="mt-4 text-center text-xs text-bark-400">
                Déjà un compte ?{' '}
                <Link href="/login" className="text-forest-600 hover:text-forest-800 font-medium">Se connecter</Link>
              </p>
            </div>
          )}

          {/* ─── Step 3: Done ─────────────────────── */}
          {step === 'done' && (
            <div className="text-center py-6">
              <div className="mb-5 mx-auto h-16 w-16 rounded-full bg-forest-100 flex items-center justify-center">
                <Clock className="h-8 w-8 text-forest-600" />
              </div>
              <h2 className="font-heading text-2xl font-semibold text-forest-800 mb-2">Demande envoyée !</h2>
              <p className="text-sm text-bark-500 leading-relaxed mb-2">
                Votre demande de compte <strong className="text-forest-700">{ROLES.find((r) => r.value === selectedRole)?.label}</strong> a bien été soumise.
              </p>
              <p className="text-sm text-bark-400 mb-6">Un administrateur examinera votre dossier et activera votre compte. Vous serez notifié par email.</p>
              <div className="rounded-sm border border-gold-200 bg-gold-50 p-4 mb-6 text-left space-y-1">
                <p className="text-xs font-semibold text-gold-800 mb-1">En attendant</p>
                <p className="text-xs text-gold-700">· Vérifiez votre email de confirmation</p>
                <p className="text-xs text-gold-700">· Conservez vos identifiants dans un endroit sûr</p>
                <p className="text-xs text-gold-700">· Délai habituel : 24 à 48 heures</p>
              </div>
              <Link href="/login" className="inline-flex items-center gap-2 rounded-sm bg-forest-700 px-6 py-2.5 text-sm font-medium text-white hover:bg-forest-800 transition-colors">
                <ArrowLeft className="h-4 w-4" /> Retour à la connexion
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
