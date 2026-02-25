'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, AlertCircle, ArrowRight, ChevronUp } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const LOCKOUT_KEY = 'login_attempts'
const MAX_ATTEMPTS = 5
const LOCKOUT_MS = 30 * 60 * 1000

function getAttemptData() {
  try { return JSON.parse(localStorage.getItem(LOCKOUT_KEY) ?? '{"count":0,"since":0}') }
  catch { return { count: 0, since: 0 } }
}
function isLockedOut() {
  const { count, since } = getAttemptData()
  if (count >= MAX_ATTEMPTS) {
    if (Date.now() - since < LOCKOUT_MS) return true
    localStorage.removeItem(LOCKOUT_KEY)
  }
  return false
}
function recordFailedAttempt() {
  const d = getAttemptData()
  if (d.count === 0) d.since = Date.now()
  d.count += 1
  localStorage.setItem(LOCKOUT_KEY, JSON.stringify(d))
}
function clearAttempts() { localStorage.removeItem(LOCKOUT_KEY) }

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 100)
    return () => clearTimeout(t)
  }, [])

  const getRemainingAttempts = () => Math.max(0, MAX_ATTEMPTS - getAttemptData().count)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isLockedOut()) { setError('Compte temporairement bloqué. Réessayez dans 30 minutes.'); return }
    setLoading(true); setError('')
    const supabase = createClient()
    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password })
    if (authError || !data.user) {
      recordFailedAttempt()
      const r = getRemainingAttempts()
      setError(r > 0 ? `Identifiants invalides. ${r} tentative${r > 1 ? 's' : ''} restante${r > 1 ? 's' : ''}.` : 'Compte bloqué.')
      setLoading(false); return
    }
    clearAttempts()
    const { data: profile } = await supabase.from('users').select('role').eq('id', data.user.id).single()
    const routes: Record<string, string> = {
      super_admin: '/super-admin', admin: '/admin', manager: '/manager',
      vendeur: '/vendeur', caissier: '/caissier', readonly: '/readonly',
    }
    router.push(routes[profile?.role ?? 'vendeur'] ?? '/admin')
  }

  return (
    <>
      {/* ── MOBILE ─────────────────────────────────────────────── */}
      <div className="lg:hidden" style={{ minHeight: '100svh', background: '#0B1A08', position: 'relative', overflow: 'hidden' }}>

        {/* Orbes décoratifs en arrière-plan */}
        <div style={{
          position: 'absolute', top: -120, left: -80, width: 320, height: 320, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(78,132,48,0.35) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', top: 80, right: -100, width: 260, height: 260, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(201,136,26,0.20) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', bottom: 200, left: -60, width: 200, height: 200, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(44,82,25,0.30) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        {/* Section haute — illustration + branding */}
        <div style={{
          paddingTop: 60, paddingBottom: 40,
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          opacity: mounted ? 1 : 0,
          transform: mounted ? 'none' : 'translateY(-16px)',
          transition: 'opacity 0.6s ease, transform 0.6s ease',
        }}>
          {/* Badge pill */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: 'rgba(78,132,48,0.18)', border: '1px solid rgba(78,132,48,0.35)',
            borderRadius: 50, padding: '6px 14px', marginBottom: 32,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4E8430', display: 'block' }} />
            <span style={{ color: '#98C07D', fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Gestion commerciale
            </span>
          </div>

          {/* SVG botanique — orchidée stylisée */}
          <div style={{
            width: 220, height: 220, position: 'relative',
            animation: 'float 4s ease-in-out infinite',
          }}>
            <svg viewBox="0 0 220 220" width="220" height="220" style={{ overflow: 'visible' }}>
              {/* Halo lumineux */}
              <ellipse cx="110" cy="175" rx="70" ry="18" fill="rgba(78,132,48,0.15)" />

              {/* Tige */}
              <path d="M110 175 Q107 155 110 135 Q113 115 109 95 Q106 78 110 60 Q112 50 110 40"
                stroke="#4E8430" strokeWidth="3" fill="none" strokeLinecap="round"
                style={{ strokeDasharray: 145, strokeDashoffset: 0 }} />

              {/* Feuilles */}
              {[
                { x: -18, y: 155, r: -45, rx: 7, ry: 14, c: '#2C5219' },
                { x: 20,  y: 130, r: 40,  rx: 6, ry: 12, c: '#3A6822' },
                { x: -16, y: 108, r: -48, rx: 5.5, ry: 11, c: '#4E8430' },
                { x: 17,  y: 90,  r: 38,  rx: 5, ry: 10, c: '#3A6822' },
              ].map((l, i) => (
                <g key={i} transform={`translate(${l.x + 110},${l.y}) rotate(${l.r})`}>
                  <ellipse cx="0" cy={-l.ry / 2} rx={l.rx} ry={l.ry} fill={l.c} opacity="0.9" />
                  <line x1="0" y1="0" x2="0" y2={-l.ry * 1.1} stroke="#2C5219" strokeWidth="0.8" opacity="0.5" />
                </g>
              ))}

              {/* Fleur orchidée */}
              <g transform="translate(110, 36)">
                {[0, 60, 120, 180, 240, 300].map((deg, i) => (
                  <ellipse key={i} cx="0" cy="-13" rx="6" ry="12"
                    fill={i % 2 === 0 ? '#C9881A' : '#E4A528'} opacity="0.95"
                    transform={`rotate(${deg})`}
                    style={{ transformOrigin: '0 0' }} />
                ))}
                <circle cx="0" cy="0" r="7" fill="#8B5E0A" />
                <circle cx="0" cy="0" r="4" fill="#FDF0D0" />
                <circle cx="0" cy="0" r="1.5" fill="#C9881A" />
              </g>

              {/* Racines */}
              {[-1, 0, 1].map((i) => (
                <path key={i}
                  d={`M110 175 Q${110 + i * 12} 182 ${110 + i * 20} 186`}
                  stroke="#2C5219" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.5" />
              ))}
            </svg>
          </div>

          {/* Titre */}
          <div style={{ textAlign: 'center', padding: '0 24px', marginTop: 8 }}>
            <h1 style={{
              fontFamily: 'Georgia, serif',
              fontSize: 36, fontWeight: 700, lineHeight: 1.1,
              color: '#ffffff', letterSpacing: '-0.5px',
            }}>
              Orchidée<br />
              <span style={{ color: '#C9881A' }}>Nature</span>
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13, marginTop: 10, lineHeight: 1.5 }}>
              Gérez vos stocks, ventes et caisse<br />depuis votre mobile
            </p>
          </div>
        </div>

        {/* Section basse — formulaire dans un sheet */}
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          background: '#111E0D',
          borderRadius: formOpen ? '24px 24px 0 0' : '28px 28px 0 0',
          border: '1px solid rgba(78,132,48,0.25)',
          borderBottom: 'none',
          padding: formOpen ? '24px 24px 40px' : '20px 24px 36px',
          boxShadow: '0 -20px 60px rgba(0,0,0,0.5)',
          transition: 'all 0.4s cubic-bezier(0.32, 0.72, 0, 1)',
          opacity: mounted ? 1 : 0,
          transform: mounted ? 'none' : 'translateY(40px)',
          zIndex: 10,
        }}>
          {/* Handle */}
          <div style={{
            width: 36, height: 4, borderRadius: 2,
            background: 'rgba(255,255,255,0.15)',
            margin: '0 auto 20px',
            cursor: 'pointer',
          }} onClick={() => setFormOpen(!formOpen)} />

          {!formOpen ? (
            /* Mode fermé — juste le bouton "Se connecter" */
            <div>
              <button onClick={() => setFormOpen(true)}
                style={{
                  width: '100%', height: 56, borderRadius: 50,
                  background: 'linear-gradient(135deg, #4E8430, #2C5219)',
                  color: '#fff', fontSize: 16, fontWeight: 700,
                  border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                  boxShadow: '0 8px 32px rgba(44,82,25,0.5)',
                  letterSpacing: '0.01em',
                }}>
                Se connecter
                <ArrowRight size={18} />
              </button>
              <p style={{ textAlign: 'center', marginTop: 16, fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>
                Accès réservé au personnel autorisé
              </p>
              <p style={{ textAlign: 'center', marginTop: 8, fontSize: 12 }}>
                <span style={{ color: 'rgba(255,255,255,0.35)' }}>Pas de compte ? </span>
                <a href="/register" style={{ color: '#C9881A', fontWeight: 600, textDecoration: 'none' }}>
                  Faire une demande
                </a>
              </p>
            </div>
          ) : (
            /* Mode ouvert — formulaire complet */
            <form onSubmit={handleLogin}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <h2 style={{ color: '#fff', fontSize: 20, fontWeight: 700, fontFamily: 'Georgia, serif' }}>
                  Connexion
                </h2>
                <button type="button" onClick={() => setFormOpen(false)}
                  style={{ background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: 8,
                    width: 32, height: 32, color: 'rgba(255,255,255,0.5)', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ChevronUp size={18} />
                </button>
              </div>

              {error && (
                <div style={{
                  display: 'flex', alignItems: 'flex-start', gap: 8,
                  background: 'rgba(192,57,43,0.15)', border: '1px solid rgba(192,57,43,0.4)',
                  borderRadius: 12, padding: '10px 14px', marginBottom: 16,
                  color: '#FF8A80', fontSize: 13,
                }}>
                  <AlertCircle size={15} style={{ marginTop: 1, flexShrink: 0 }} />
                  {error}
                </div>
              )}

              {/* Email */}
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', color: 'rgba(255,255,255,0.5)', fontSize: 11,
                  fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>
                  Adresse e-mail
                </label>
                <input type="email" required autoComplete="email"
                  value={email} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                  placeholder="prenom@orchidee.com"
                  style={{
                    width: '100%', height: 50, borderRadius: 14, boxSizing: 'border-box',
                    background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)',
                    color: '#fff', fontSize: 15, padding: '0 16px',
                    outline: 'none', transition: 'border-color 0.2s',
                  }}
                  onFocus={(e: React.FocusEvent<HTMLInputElement>) => e.target.style.borderColor = 'rgba(78,132,48,0.7)'}
                  onBlur={(e: React.FocusEvent<HTMLInputElement>) => e.target.style.borderColor = 'rgba(255,255,255,0.12)'}
                />
              </div>

              {/* Mot de passe */}
              <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', color: 'rgba(255,255,255,0.5)', fontSize: 11,
                  fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>
                  Mot de passe
                </label>
                <div style={{ position: 'relative' }}>
                  <input type={showPassword ? 'text' : 'password'} required autoComplete="current-password"
                    value={password} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    style={{
                      width: '100%', height: 50, borderRadius: 14, boxSizing: 'border-box',
                      background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)',
                      color: '#fff', fontSize: 15, padding: '0 48px 0 16px',
                      outline: 'none', transition: 'border-color 0.2s',
                    }}
                    onFocus={(e: React.FocusEvent<HTMLInputElement>) => e.target.style.borderColor = 'rgba(78,132,48,0.7)'}
                    onBlur={(e: React.FocusEvent<HTMLInputElement>) => e.target.style.borderColor = 'rgba(255,255,255,0.12)'}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', color: 'rgba(255,255,255,0.35)',
                      cursor: 'pointer', padding: 4,
                    }}>
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>

              {/* CTA pill */}
              <button type="submit" disabled={loading || !email || !password}
                style={{
                  width: '100%', height: 56, borderRadius: 50,
                  background: loading ? 'rgba(78,132,48,0.5)' : 'linear-gradient(135deg, #4E8430, #2C5219)',
                  color: '#fff', fontSize: 16, fontWeight: 700, border: 'none',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                  boxShadow: '0 8px 32px rgba(44,82,25,0.4)',
                  transition: 'all 0.2s',
                }}>
                {loading ? (
                  <div style={{
                    width: 20, height: 20, borderRadius: '50%',
                    border: '2px solid rgba(255,255,255,0.3)',
                    borderTopColor: '#fff',
                    animation: 'spin 0.8s linear infinite',
                  }} />
                ) : (
                  <>Accéder à l'espace <ArrowRight size={18} /></>
                )}
              </button>

              <p style={{ textAlign: 'center', marginTop: 16, fontSize: 12 }}>
                <span style={{ color: 'rgba(255,255,255,0.35)' }}>Pas de compte ? </span>
                <a href="/register" style={{ color: '#C9881A', fontWeight: 600, textDecoration: 'none' }}>
                  Faire une demande
                </a>
              </p>
            </form>
          )}
        </div>

        <style>{`
          @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-12px); }
          }
          @keyframes spin { to { transform: rotate(360deg); } }
          input::placeholder { color: rgba(255,255,255,0.2) !important; }
        `}</style>
      </div>

      {/* ── DESKTOP ────────────────────────────────────────────── */}
      <div className="hidden lg:flex min-h-screen">
        {/* Panneau gauche */}
        <div className="lg:w-1/2 flex flex-col justify-between bg-forest-800 p-12 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <div className="absolute top-0 right-0 h-96 w-96 rounded-full bg-gold-400 blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 h-72 w-72 rounded-full bg-sage-400 blur-3xl translate-y-1/2 -translate-x-1/2" />
          </div>
          <div className="relative">
            <div className="inline-flex items-center gap-2 mb-4 bg-forest-900/50 border border-forest-600/30 rounded-full px-4 py-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-gold-400 block" />
              <span className="text-gold-300 text-xs font-semibold tracking-widest uppercase">Gestion commerciale</span>
            </div>
            <h1 className="font-heading text-5xl font-bold text-white leading-tight">
              Orchidée<br /><span className="text-gold-300">Nature</span>
            </h1>
            <p className="mt-4 text-forest-300 text-sm leading-relaxed max-w-xs">
              Système de gestion multi-entités pour vos cosmétiques et épices.
            </p>
          </div>
          <div className="relative space-y-4">
            {[
              { l: 'Gestion des stocks', d: 'Suivi en temps réel, alertes automatiques' },
              { l: 'Interface caisse', d: 'Ventes rapides, sessions sécurisées' },
              { l: 'Analyse & rapports', d: 'Insights intelligents multi-agences' },
            ].map(({ l, d }) => (
              <div key={l} className="flex items-start gap-3">
                <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-gold-400 shrink-0" />
                <div>
                  <div className="text-sm font-semibold text-white">{l}</div>
                  <div className="text-xs text-forest-400">{d}</div>
                </div>
              </div>
            ))}
            <div className="pt-4 border-t border-forest-700">
              <p className="text-xs text-forest-500">© 2026 Orchidée Nature</p>
            </div>
          </div>
        </div>

        {/* Panneau droit */}
        <div className="flex flex-1 flex-col items-center justify-center bg-cream-100 px-6 py-12">
          <div className="w-full max-w-sm">
            <div className="mb-8 text-center">
              <img src="/logo-orchidee.png" alt="Orchidée" className="h-16 w-auto object-contain mx-auto" />
              <div className="h-px w-16 bg-gradient-to-r from-transparent via-gold-400 to-transparent mx-auto mt-3" />
              <p className="text-xs text-bark-400 tracking-widest uppercase mt-2">Espace de connexion</p>
            </div>
            <div className="rounded-2xl border border-cream-400 bg-white p-7 shadow-botanical-md">
              <h2 className="font-heading text-2xl font-semibold text-forest-800 mb-6">Connexion</h2>
              <form onSubmit={handleLogin} className="space-y-4">
                {error && (
                  <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /><span>{error}</span>
                  </div>
                )}
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-bark-600 uppercase tracking-wide">E-mail</label>
                  <input type="email" required autoComplete="email" value={email}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                    placeholder="utilisateur@orchidee.com"
                    className="h-11 w-full rounded-xl border border-cream-400 bg-cream-50 px-3 text-sm text-forest-900 transition-colors placeholder:text-bark-300 focus:border-forest-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-forest-500/20" />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-bark-600 uppercase tracking-wide">Mot de passe</label>
                  <div className="relative">
                    <input type={showPassword ? 'text' : 'password'} required autoComplete="current-password"
                      value={password} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="h-11 w-full rounded-xl border border-cream-400 bg-cream-50 px-3 pr-10 text-sm text-forest-900 transition-colors placeholder:text-bark-300 focus:border-forest-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-forest-500/20" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-bark-400 hover:text-forest-600">
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <button type="submit" disabled={loading || !email || !password}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-forest-700 text-sm font-bold text-white transition-all hover:bg-forest-800 hover:shadow-lg disabled:opacity-60">
                  {loading ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : null}
                  {loading ? 'Connexion...' : 'Se connecter'}
                  {!loading && <ArrowRight className="h-4 w-4" />}
                </button>
              </form>
              <p className="mt-5 text-center text-xs">
                <span className="text-bark-400">Pas de compte ? </span>
                <a href="/register" className="text-forest-600 hover:underline font-semibold">Faire une demande</a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
