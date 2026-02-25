'use client'

import { useState, useRef, useEffect } from 'react'
import { Fingerprint, KeyRound, X, Loader2, CheckCircle, AlertCircle, User } from 'lucide-react'

export type AuthMethod = 'pin' | 'fingerprint' | 'both'

export interface IdentityUser {
  id: string
  full_name: string
  role: string
  pin_set: boolean
}

interface ConfirmIdentityModalProps {
  user: IdentityUser
  authMethod: AuthMethod
  onSuccess: () => void
  onCancel: () => void
  title?: string
  message?: string
}

export function ConfirmIdentityModal({
  user,
  authMethod,
  onSuccess,
  onCancel,
  title = 'Confirmation d\'identité',
  message,
}: ConfirmIdentityModalProps) {
  const [mode, setMode] = useState<'pin' | 'fingerprint'>(
    authMethod === 'fingerprint' ? 'fingerprint' : 'pin'
  )
  const [pin, setPin] = useState(['', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [fingerprintState, setFingerprintState] = useState<'idle' | 'scanning' | 'success' | 'error'>('idle')
  const inputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ]

  useEffect(() => {
    if (mode === 'pin') {
      setTimeout(() => inputRefs[0].current?.focus(), 100)
    }
    if (mode === 'fingerprint') {
      startFingerprintScan()
    }
  }, [mode])

  const startFingerprintScan = async () => {
    setFingerprintState('scanning')
    setError('')

    if (!window.PublicKeyCredential) {
      setError('Lecteur d\'empreinte non disponible sur cet appareil.')
      setFingerprintState('error')
      return
    }

    try {
      const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
      if (!available) {
        setError('Lecteur d\'empreinte non disponible. Utilisez le code PIN.')
        setFingerprintState('error')
        if (authMethod === 'both') setMode('pin')
        return
      }

      const challenge = new Uint8Array(32)
      crypto.getRandomValues(challenge)

      await navigator.credentials.get({
        publicKey: {
          challenge,
          timeout: 30000,
          userVerification: 'required',
          rpId: window.location.hostname,
        },
      })

      setFingerprintState('success')
      await new Promise((r) => setTimeout(r, 600))
      onSuccess()
    } catch (err: any) {
      if (err.name === 'NotAllowedError') {
        setError('Empreinte non reconnue ou délai expiré.')
      } else {
        setError('Erreur lecteur. Essayez à nouveau ou utilisez le code PIN.')
      }
      setFingerprintState('error')
    }
  }

  const handlePinInput = (idx: number, val: string) => {
    if (!/^\d?$/.test(val)) return
    const next = [...pin]
    next[idx] = val
    setPin(next)
    setError('')
    if (val && idx < 3) {
      inputRefs[idx + 1].current?.focus()
    }
    if (next.every((d) => d !== '') && idx === 3) {
      verifyPin(next.join(''))
    }
  }

  const handlePinKeyDown = (idx: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !pin[idx] && idx > 0) {
      inputRefs[idx - 1].current?.focus()
      const next = [...pin]
      next[idx - 1] = ''
      setPin(next)
    }
  }

  const verifyPin = async (code: string) => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/verify-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, pin: code }),
      })
      if (res.ok) {
        onSuccess()
      } else {
        setError('Code PIN incorrect.')
        setPin(['', '', '', ''])
        setTimeout(() => inputRefs[0].current?.focus(), 50)
      }
    } catch {
      setError('Erreur de connexion.')
    }
    setLoading(false)
  }

  const initials = user.full_name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-sm border border-gray-200 bg-white shadow-lg">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-sm bg-violet-100 text-sm font-bold text-violet-700">
              {initials}
            </div>
            <div>
              <div className="text-sm font-semibold text-gray-900">{user.full_name}</div>
              <div className="text-xs text-gray-500 capitalize">{user.role}</div>
            </div>
          </div>

          {message && (
            <p className="text-xs text-gray-500 border-l-2 border-violet-300 pl-3">{message}</p>
          )}

          {authMethod === 'both' && (
            <div className="flex rounded-sm border border-gray-200 overflow-hidden">
              <button
                onClick={() => { setMode('pin'); setError('') }}
                className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-medium transition-colors ${mode === 'pin' ? 'bg-violet-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
              >
                <KeyRound className="h-3.5 w-3.5" /> Code PIN
              </button>
              <button
                onClick={() => { setMode('fingerprint'); setError('') }}
                className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-medium transition-colors border-l border-gray-200 ${mode === 'fingerprint' ? 'bg-violet-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
              >
                <Fingerprint className="h-3.5 w-3.5" /> Empreinte
              </button>
            </div>
          )}

          {mode === 'pin' && (
            <div className="space-y-4">
              <div>
                <label className="mb-3 block text-xs font-medium text-gray-700 text-center">
                  Saisissez votre code PIN à 4 chiffres
                </label>
                <div className="flex justify-center gap-3">
                  {pin.map((d, i) => (
                    <input
                      key={i}
                      ref={inputRefs[i]}
                      type="password"
                      inputMode="numeric"
                      maxLength={1}
                      value={d}
                      onChange={(e) => handlePinInput(i, e.target.value)}
                      onKeyDown={(e) => handlePinKeyDown(i, e)}
                      disabled={loading}
                      className={`h-14 w-14 rounded-sm border text-center text-2xl font-bold tracking-widest focus:outline-none focus:ring-2 transition-colors ${
                        error
                          ? 'border-red-400 focus:border-red-500 focus:ring-red-200'
                          : 'border-gray-200 focus:border-violet-500 focus:ring-violet-200'
                      } ${loading ? 'bg-gray-50 opacity-60' : 'bg-white'}`}
                    />
                  ))}
                </div>
              </div>

              {loading && (
                <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Vérification...
                </div>
              )}
            </div>
          )}

          {mode === 'fingerprint' && (
            <div className="flex flex-col items-center gap-4 py-2">
              <button
                onClick={startFingerprintScan}
                disabled={fingerprintState === 'scanning'}
                className={`relative flex h-20 w-20 items-center justify-center rounded-sm transition-all ${
                  fingerprintState === 'scanning'
                    ? 'bg-violet-50 border-2 border-violet-300'
                    : fingerprintState === 'success'
                    ? 'bg-green-50 border-2 border-green-400'
                    : fingerprintState === 'error'
                    ? 'bg-red-50 border-2 border-red-300'
                    : 'bg-gray-50 border-2 border-gray-200 hover:border-violet-300 hover:bg-violet-50 cursor-pointer'
                }`}
              >
                {fingerprintState === 'scanning' && (
                  <div className="absolute inset-0 rounded-sm border-2 border-violet-400 animate-ping opacity-30" />
                )}
                {fingerprintState === 'success' ? (
                  <CheckCircle className="h-10 w-10 text-green-500" />
                ) : fingerprintState === 'error' ? (
                  <AlertCircle className="h-10 w-10 text-red-400" />
                ) : (
                  <Fingerprint className={`h-10 w-10 ${fingerprintState === 'scanning' ? 'text-violet-500' : 'text-gray-400'}`} />
                )}
              </button>

              <p className="text-xs text-center text-gray-500">
                {fingerprintState === 'scanning'
                  ? 'Posez votre doigt sur le lecteur...'
                  : fingerprintState === 'success'
                  ? 'Identité confirmée'
                  : fingerprintState === 'error'
                  ? 'Échec — cliquez pour réessayer'
                  : 'Cliquez pour scanner votre empreinte'}
              </p>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 rounded-sm bg-red-50 border border-red-200 px-3 py-2">
              <AlertCircle className="h-3.5 w-3.5 text-red-500 shrink-0" />
              <p className="text-xs text-red-600">{error}</p>
            </div>
          )}

          <button
            onClick={onCancel}
            className="w-full h-9 rounded-sm border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Annuler
          </button>
        </div>
      </div>
    </div>
  )
}
