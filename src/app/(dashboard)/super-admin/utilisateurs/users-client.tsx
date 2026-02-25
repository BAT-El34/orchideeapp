'use client'

import { useState, useEffect } from 'react'
import { Users, Plus, Key, Check, X, Edit2, Eye, EyeOff, Search, Clock, UserCheck, UserX, Shield } from 'lucide-react'
import { formatDateTime } from '@/lib/utils'
import { roleLabels } from '@/lib/design-system'
import { useToast } from '@/hooks/use-toast'
import { ToastContainer } from '@/components/ui/toast-container'
import { InlineLoader } from '@/components/ui/page-loader'
import type { UserRole } from '@/types'

interface User {
  id: string
  full_name: string
  email: string
  role: UserRole
  status: 'active' | 'pending' | 'suspended'
  entity_id: string | null
  last_login: string | null
  created_at: string
  requested_role?: string
  entities?: { name: string }
}

interface Entity { id: string; name: string }

const ROLES: { value: UserRole; label: string }[] = [
  { value: 'manager',  label: 'Manager' },
  { value: 'vendeur',  label: 'Vendeur' },
  { value: 'caissier', label: 'Caissier' },
  { value: 'readonly', label: 'Lecture seule' },
]

const STATUS_CFG = {
  active:    { label: 'Actif',       cls: 'bg-forest-50 text-forest-700' },
  pending:   { label: 'En attente',  cls: 'bg-gold-50 text-gold-700' },
  suspended: { label: 'Suspendu',    cls: 'bg-red-50 text-red-700' },
}

const ROLE_CFG: Record<string, string> = {
  super_admin: 'bg-forest-100 text-forest-800',
  admin:       'bg-blue-50 text-blue-700',
  manager:     'bg-sage-50 text-sage-700',
  vendeur:     'bg-gold-50 text-gold-700',
  caissier:    'bg-bark-50 text-bark-700',
  readonly:    'bg-cream-300 text-bark-500',
}

export function UsersPageClient({ users: initialUsers, entities, currentUserId }: {
  users: User[]; entities: Entity[]; currentUserId: string
}) {
  const [users, setUsers] = useState(initialUsers)
  const [registrations, setRegistrations] = useState<any[]>([])
  const [loadingRegs, setLoadingRegs] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [showCreate, setShowCreate] = useState(false)
  const [editUser, setEditUser] = useState<User | null>(null)
  const [resetUser, setResetUser] = useState<User | null>(null)
  const [validateUser, setValidateUser] = useState<User | null>(null)
  const [approveReg, setApproveReg] = useState<any | null>(null)
  const toast = useToast()

  const filtered = users.filter((u: any) => {
    const matchSearch = u.full_name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase())
    const matchStatus = filterStatus === 'all' || u.status === filterStatus
    return matchSearch && matchStatus
  })

  const pending = users.filter((u: any) => u.status === 'pending')

  const reload = async () => {
    const res = await fetch('/api/admin/settings?section=users')
    if (res.ok) setUsers(await res.json())
  }

  const reloadRegs = async () => {
    setLoadingRegs(true)
    const res = await fetch('/api/registrations?status=pending')
    if (res.ok) setRegistrations(await res.json())
    setLoadingRegs(false)
  }

  useEffect(() => { reloadRegs() }, [])

  return (
    <>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="font-heading text-2xl font-semibold text-forest-800">Utilisateurs</h1>
            <p className="text-sm text-bark-500">
              {users.length} compte{users.length !== 1 ? 's' : ''}
              {pending.length > 0 && <span className="ml-2 inline-flex items-center gap-1 rounded-sm bg-gold-100 px-2 py-0.5 text-xs font-medium text-gold-700"><Clock className="h-3 w-3" />{pending.length} en attente</span>}
            </p>
          </div>
          <button onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 rounded-sm bg-forest-700 px-4 py-2 text-sm font-medium text-white hover:bg-forest-800 transition-colors">
            <Plus className="h-4 w-4" /> Créer un compte
          </button>
        </div>

        {/* Registration Requests Panel */}
        {(registrations.length > 0 || loadingRegs) && (
          <div className="rounded-sm border border-gold-300 bg-gold-50 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-gold-600" />
                <span className="text-sm font-semibold text-gold-800">
                  {loadingRegs ? 'Chargement...' : `${registrations.length} demande${registrations.length > 1 ? 's' : ''} d'inscription en attente`}
                </span>
              </div>
              <button onClick={reloadRegs} className="text-xs text-gold-600 hover:text-gold-800">Actualiser</button>
            </div>
            {!loadingRegs && (
              <div className="space-y-2">
                {registrations.map((req: any) => (
                  <div key={req.id} className="flex items-center justify-between rounded-sm bg-white border border-gold-200 px-3 py-2.5">
                    <div>
                      <span className="text-sm font-medium text-forest-900">{req.full_name}</span>
                      <span className="ml-2 text-xs text-bark-500">{req.email}</span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-gold-600">Rôle demandé : <strong>{roleLabels[req.requested_role as UserRole] ?? req.requested_role}</strong></span>
                        {req.entities?.name && <span className="text-xs text-bark-400">· {req.entities.name}</span>}
                      </div>
                      {req.motivation && <p className="text-xs text-bark-400 mt-0.5 italic">"{req.motivation}"</p>}
                    </div>
                    <div className="flex gap-2 ml-3 shrink-0">
                      <button onClick={() => setApproveReg(req)}
                        className="flex items-center gap-1 rounded-sm bg-forest-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-forest-700">
                        <UserCheck className="h-3 w-3" /> Approuver
                      </button>
                      <RejectRegButton req={req} onDone={reloadRegs} toast={toast} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Legacy pending section (users already created but not validated) */}
        {pending.length > 0 && (
          <div className="rounded-sm border border-gold-300 bg-gold-50 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="h-4 w-4 text-gold-600" />
              <span className="text-sm font-semibold text-gold-800">{pending.length} demande{pending.length > 1 ? 's' : ''} d'inscription en attente de validation</span>
            </div>
            <div className="space-y-2">
              {pending.map((u: any) => (
                <div key={u.id} className="flex items-center justify-between rounded-sm bg-white border border-gold-200 px-3 py-2">
                  <div>
                    <span className="text-sm font-medium text-forest-900">{u.full_name}</span>
                    <span className="ml-2 text-xs text-bark-500">{u.email}</span>
                    {u.requested_role && (
                      <span className="ml-2 text-xs text-gold-600">demande : {roleLabels[u.requested_role as UserRole] ?? u.requested_role}</span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setValidateUser(u)}
                      className="flex items-center gap-1 rounded-sm bg-forest-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-forest-700">
                      <UserCheck className="h-3 w-3" /> Valider
                    </button>
                    <RejectButton userId={u.id} onDone={reload} toast={toast} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-48 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-bark-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher..."
              className="h-9 w-full rounded-sm border border-cream-400 pl-9 pr-3 text-sm focus:border-forest-500 focus:outline-none" />
          </div>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
            className="h-9 rounded-sm border border-cream-400 px-3 text-sm bg-white focus:border-forest-500 focus:outline-none">
            <option value="all">Tous les statuts</option>
            <option value="active">Actifs</option>
            <option value="pending">En attente</option>
            <option value="suspended">Suspendus</option>
          </select>
        </div>

        {/* Desktop table / Mobile cards */}
        <div className="hidden md:block rounded-sm border border-cream-400 bg-white shadow-botanical overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-cream-300 bg-forest-50">
                {['Nom','Email','Rôle','Entité','Statut','Connexion','Actions'].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-forest-600 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-cream-200">
              {filtered.map((u, i) => (
                <tr key={u.id} className={`hover:bg-cream-50 transition-colors ${i % 2 === 0 ? 'bg-white' : 'bg-cream-50/30'}`}>
                  <td className="px-4 py-2.5 font-medium text-forest-900">{u.full_name}</td>
                  <td className="px-4 py-2.5 text-xs text-bark-500">{u.email}</td>
                  <td className="px-4 py-2.5">
                    <span className={`inline-flex rounded-sm px-1.5 py-0.5 text-xs font-medium ${ROLE_CFG[u.role] ?? 'bg-cream-200 text-bark-600'}`}>
                      {roleLabels[u.role] ?? u.role}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-xs text-bark-500">{u.entities?.name ?? '—'}</td>
                  <td className="px-4 py-2.5">
                    <span className={`inline-flex rounded-sm px-1.5 py-0.5 text-xs font-medium ${STATUS_CFG[u.status]?.cls ?? ''}`}>
                      {STATUS_CFG[u.status]?.label ?? u.status}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-xs text-bark-400 whitespace-nowrap">
                    {u.last_login ? formatDateTime(u.last_login) : '—'}
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => setEditUser(u)}
                        className="rounded-sm border border-cream-400 px-2 py-1 text-xs text-bark-600 hover:bg-cream-100 flex items-center gap-1">
                        <Edit2 className="h-3 w-3" /> Modifier
                      </button>
                      <button onClick={() => setResetUser(u)}
                        className="rounded-sm border border-cream-400 px-2 py-1 text-xs text-bark-600 hover:bg-cream-100 flex items-center gap-1">
                        <Key className="h-3 w-3" /> MDP
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-sm text-bark-400">Aucun utilisateur trouvé</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden space-y-3">
          {filtered.map((u: any) => (
            <div key={u.id} className="rounded-sm border border-cream-400 bg-white p-4 shadow-botanical">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-medium text-forest-900">{u.full_name}</p>
                  <p className="text-xs text-bark-400">{u.email}</p>
                </div>
                <span className={`inline-flex rounded-sm px-1.5 py-0.5 text-xs font-medium ${STATUS_CFG[u.status]?.cls ?? ''}`}>
                  {STATUS_CFG[u.status]?.label}
                </span>
              </div>
              <div className="flex items-center gap-2 mb-3">
                <span className={`inline-flex rounded-sm px-1.5 py-0.5 text-xs font-medium ${ROLE_CFG[u.role] ?? ''}`}>{roleLabels[u.role] ?? u.role}</span>
                <span className="text-xs text-bark-400">{u.entities?.name ?? '—'}</span>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setEditUser(u)} className="flex-1 rounded-sm border border-cream-400 py-1.5 text-xs text-bark-600 hover:bg-cream-100 flex items-center justify-center gap-1">
                  <Edit2 className="h-3 w-3" /> Modifier
                </button>
                <button onClick={() => setResetUser(u)} className="flex-1 rounded-sm border border-cream-400 py-1.5 text-xs text-bark-600 hover:bg-cream-100 flex items-center justify-center gap-1">
                  <Key className="h-3 w-3" /> Mot de passe
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modals */}
      {showCreate && <CreateUserModal entities={entities} onClose={() => setShowCreate(false)} onDone={() => { setShowCreate(false); reload() }} toast={toast} />}
      {editUser && <EditUserModal user={editUser} entities={entities} onClose={() => setEditUser(null)} onDone={() => { setEditUser(null); reload() }} toast={toast} />}
      {resetUser && <ResetPasswordModal user={resetUser} onClose={() => setResetUser(null)} onDone={() => { setResetUser(null) }} toast={toast} />}
      {validateUser && <ValidateModal user={validateUser} entities={entities} onClose={() => setValidateUser(null)} onDone={() => { setValidateUser(null); reload() }} toast={toast} />}
      {approveReg && <ApproveRegistrationModal req={approveReg} entities={entities} onClose={() => setApproveReg(null)} onDone={() => { setApproveReg(null); reloadRegs(); reload() }} toast={toast} />}
      <ToastContainer />
    </>
  )
}

// ─── Create User Modal ────────────────────────────────────────────────────────
function CreateUserModal({ entities, onClose, onDone, toast }: any) {
  const [form, setForm] = useState({ email: '', full_name: '', role: 'vendeur', entity_id: '', password: '' })
  const [showPwd, setShowPwd] = useState(false)
  const [saving, setSaving] = useState(false)

  const save = async () => {
    if (!form.email || !form.full_name || !form.entity_id || !form.password) { toast.error('Tous les champs sont requis'); return }
    setSaving(true)
    const res = await fetch('/api/users/manage', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
    })
    if (res.ok) { toast.success('Compte créé avec succès'); onDone() }
    else { const e = await res.json(); toast.error(e.error ?? 'Erreur création') }
    setSaving(false)
  }

  return (
    <Modal title="Créer un compte" onClose={onClose}>
      <div className="space-y-3">
        <Field label="Nom complet"><input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} className="input" placeholder="Prénom Nom" /></Field>
        <Field label="Email"><input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="input" placeholder="email@exemple.com" /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Rôle">
            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="input bg-white">
              {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </Field>
          <Field label="Entité">
            <select value={form.entity_id} onChange={(e) => setForm({ ...form, entity_id: e.target.value })} className="input bg-white">
              <option value="">— Choisir —</option>
              {entities.map((e: Entity) => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
          </Field>
        </div>
        <Field label="Mot de passe initial">
          <div className="relative">
            <input type={showPwd ? 'text' : 'password'} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="input pr-9" placeholder="Min. 6 caractères" />
            <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-bark-400">
              {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </Field>
      </div>
      <div className="flex gap-2 mt-5">
        <button onClick={save} disabled={saving} className="btn-primary flex-1 justify-center">
          {saving ? <InlineLoader /> : <Plus className="h-4 w-4" />} Créer le compte
        </button>
        <button onClick={onClose} className="btn-outline px-4">Annuler</button>
      </div>
    </Modal>
  )
}

// ─── Edit User Modal ──────────────────────────────────────────────────────────
function EditUserModal({ user, entities, onClose, onDone, toast }: any) {
  const [form, setForm] = useState({ full_name: user.full_name, role: user.role, status: user.status, entity_id: user.entity_id ?? '' })
  const [saving, setSaving] = useState(false)

  const save = async () => {
    setSaving(true)
    const res = await fetch('/api/users/manage', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: user.id, action: 'update', ...form }),
    })
    if (res.ok) { toast.success('Compte mis à jour'); onDone() }
    else { const e = await res.json(); toast.error(e.error ?? 'Erreur') }
    setSaving(false)
  }

  return (
    <Modal title={`Modifier — ${user.full_name}`} onClose={onClose}>
      <div className="space-y-3">
        <Field label="Nom complet"><input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} className="input" /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Rôle">
            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="input bg-white">
              {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
              <option value="admin">Admin</option>
            </select>
          </Field>
          <Field label="Statut">
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="input bg-white">
              <option value="active">Actif</option>
              <option value="suspended">Suspendu</option>
            </select>
          </Field>
        </div>
        <Field label="Entité">
          <select value={form.entity_id} onChange={(e) => setForm({ ...form, entity_id: e.target.value })} className="input bg-white">
            <option value="">— Aucune —</option>
            {entities.map((e: Entity) => <option key={e.id} value={e.id}>{e.name}</option>)}
          </select>
        </Field>
      </div>
      <div className="flex gap-2 mt-5">
        <button onClick={save} disabled={saving} className="btn-primary flex-1 justify-center">
          {saving ? <InlineLoader /> : <Check className="h-4 w-4" />} Sauvegarder
        </button>
        <button onClick={onClose} className="btn-outline px-4">Annuler</button>
      </div>
    </Modal>
  )
}

// ─── Reset Password Modal ─────────────────────────────────────────────────────
function ResetPasswordModal({ user, onClose, onDone, toast }: any) {
  const [pwd, setPwd] = useState('')
  const [show, setShow] = useState(false)
  const [saving, setSaving] = useState(false)

  const save = async () => {
    if (pwd.length < 6) { toast.error('Minimum 6 caractères'); return }
    setSaving(true)
    const res = await fetch('/api/users/manage', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: user.id, action: 'reset_password', new_password: pwd }),
    })
    if (res.ok) { toast.success('Mot de passe réinitialisé'); onDone() }
    else { const e = await res.json(); toast.error(e.error ?? 'Erreur') }
    setSaving(false)
  }

  return (
    <Modal title={`Réinitialiser MDP — ${user.full_name}`} onClose={onClose}>
      <Field label="Nouveau mot de passe">
        <div className="relative">
          <input type={show ? 'text' : 'password'} value={pwd} onChange={(e) => setPwd(e.target.value)}
            className="input pr-9" placeholder="Min. 6 caractères" />
          <button type="button" onClick={() => setShow(!show)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-bark-400">
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </Field>
      <div className="flex gap-2 mt-5">
        <button onClick={save} disabled={saving} className="btn-primary flex-1 justify-center">
          {saving ? <InlineLoader /> : <Key className="h-4 w-4" />} Réinitialiser
        </button>
        <button onClick={onClose} className="btn-outline px-4">Annuler</button>
      </div>
    </Modal>
  )
}

// ─── Validate Registration Modal ──────────────────────────────────────────────
function ValidateModal({ user, entities, onClose, onDone, toast }: any) {
  const [role, setRole] = useState<string>(user.requested_role ?? 'vendeur')
  const [entityId, setEntityId] = useState(user.entity_id ?? '')
  const [saving, setSaving] = useState(false)

  const validate = async () => {
    if (!entityId) { toast.error("Sélectionnez une entité"); return }
    setSaving(true)
    const res = await fetch('/api/users/manage', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: user.id, action: 'validate_registration', role, entity_id: entityId }),
    })
    if (res.ok) { toast.success('Inscription validée — compte activé'); onDone() }
    else { const e = await res.json(); toast.error(e.error ?? 'Erreur') }
    setSaving(false)
  }

  return (
    <Modal title="Valider l'inscription" onClose={onClose}>
      <div className="mb-4 rounded-sm bg-cream-100 border border-cream-400 p-3">
        <p className="text-sm font-medium text-forest-900">{user.full_name}</p>
        <p className="text-xs text-bark-500">{user.email}</p>
        {user.requested_role && <p className="text-xs text-gold-600 mt-1">Rôle demandé : {roleLabels[user.requested_role as UserRole] ?? user.requested_role}</p>}
      </div>
      <div className="space-y-3">
        <Field label="Rôle accordé">
          <select value={role} onChange={(e) => setRole(e.target.value)} className="input bg-white">
            {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
        </Field>
        <Field label="Entité assignée">
          <select value={entityId} onChange={(e) => setEntityId(e.target.value)} className="input bg-white">
            <option value="">— Choisir une entité —</option>
            {entities.map((e: Entity) => <option key={e.id} value={e.id}>{e.name}</option>)}
          </select>
        </Field>
      </div>
      <div className="flex gap-2 mt-5">
        <button onClick={validate} disabled={saving} className="btn-primary flex-1 justify-center">
          {saving ? <InlineLoader /> : <UserCheck className="h-4 w-4" />} Valider et activer
        </button>
        <button onClick={onClose} className="btn-outline px-4">Annuler</button>
      </div>
    </Modal>
  )
}

// ─── Reject Button ────────────────────────────────────────────────────────────
// ─── Approve Registration Modal ────────────────────────────────────────────────
function ApproveRegistrationModal({ req, entities, onClose, onDone, toast }: any) {
  const [role, setRole] = useState<string>(req.requested_role ?? 'vendeur')
  const [entityId, setEntityId] = useState(req.entity_id ?? '')
  const [saving, setSaving] = useState(false)

  const approve = async () => {
    if (!entityId) { toast.error('Sélectionnez une entité'); return }
    setSaving(true)
    const res = await fetch('/api/registrations', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: req.id, action: 'approve', role, entity_id: entityId }),
    })
    if (res.ok) { toast.success(`Compte créé et activé pour ${req.full_name}`); onDone() }
    else { const e = await res.json(); toast.error(e.error ?? 'Erreur') }
    setSaving(false)
  }

  return (
    <Modal title="Approuver l'inscription" onClose={onClose}>
      <div className="mb-4 rounded-sm bg-cream-100 border border-cream-400 p-3">
        <p className="text-sm font-medium text-forest-900">{req.full_name}</p>
        <p className="text-xs text-bark-500">{req.email}</p>
        <p className="text-xs text-gold-600 mt-1">Rôle demandé : {roleLabels[req.requested_role as UserRole] ?? req.requested_role}</p>
        {req.motivation && <p className="text-xs text-bark-400 mt-1 italic">"{req.motivation}"</p>}
      </div>
      <div className="space-y-3">
        <Field label="Rôle accordé">
          <select value={role} onChange={(e) => setRole(e.target.value)} className="input bg-white">
            {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
        </Field>
        <Field label="Entité assignée">
          <select value={entityId} onChange={(e) => setEntityId(e.target.value)} className="input bg-white">
            <option value="">— Choisir une entité —</option>
            {entities.map((e: Entity) => <option key={e.id} value={e.id}>{e.name}</option>)}
          </select>
        </Field>
      </div>
      <p className="mt-3 text-xs text-bark-400">Un compte Supabase Auth sera créé automatiquement. L'utilisateur devra définir son mot de passe via email.</p>
      <div className="flex gap-2 mt-4">
        <button onClick={approve} disabled={saving} className="btn-primary flex-1 justify-center">
          {saving ? <InlineLoader /> : <UserCheck className="h-4 w-4" />} Approuver & Créer le compte
        </button>
        <button onClick={onClose} className="btn-outline px-4">Annuler</button>
      </div>
    </Modal>
  )
}

// ─── Reject Registration Button ────────────────────────────────────────────────
function RejectRegButton({ req, onDone, toast }: any) {
  const [loading, setLoading] = useState(false)
  const reject = async () => {
    const reason = prompt('Raison du refus (optionnel) :')
    if (reason === null) return // annulé
    setLoading(true)
    const res = await fetch('/api/registrations', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: req.id, action: 'reject', reject_reason: reason }),
    })
    if (res.ok) { toast.success('Demande rejetée'); onDone() }
    else toast.error('Erreur')
    setLoading(false)
  }
  return (
    <button onClick={reject} disabled={loading}
      className="flex items-center gap-1 rounded-sm border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100 disabled:opacity-60">
      {loading ? <InlineLoader size="sm" /> : <UserX className="h-3 w-3" />} Rejeter
    </button>
  )
}

function RejectButton({ userId, onDone, toast }: any) {
  const [loading, setLoading] = useState(false)
  const reject = async () => {
    if (!confirm('Rejeter et supprimer cette demande ?')) return
    setLoading(true)
    const res = await fetch('/api/users/manage', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: userId, action: 'reject_registration' }),
    })
    if (res.ok) { toast.success('Demande rejetée'); onDone() }
    else toast.error('Erreur')
    setLoading(false)
  }
  return (
    <button onClick={reject} disabled={loading}
      className="flex items-center gap-1 rounded-sm border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100 disabled:opacity-60">
      {loading ? <InlineLoader size="sm" /> : <UserX className="h-3 w-3" />} Rejeter
    </button>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-sm border border-cream-400 bg-white shadow-botanical-md" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-cream-300 px-5 py-3">
          <h3 className="font-heading text-lg font-semibold text-forest-800">{title}</h3>
          <button onClick={onClose} className="text-bark-400 hover:text-forest-700"><X className="h-4 w-4" /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-bark-600 mb-1.5">{label}</label>
      {children}
    </div>
  )
}
