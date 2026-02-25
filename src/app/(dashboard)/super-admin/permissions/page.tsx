'use client'

import { useState, useEffect, useCallback } from 'react'
import { Shield, RotateCcw, Check, Loader2, Lock } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { ToastContainer } from '@/components/ui/toast-container'
import { InlineLoader } from '@/components/ui/page-loader'
import type { Permission, UserRole } from '@/types'

const ROLES: UserRole[] = ['admin', 'manager', 'vendeur', 'caissier', 'readonly']
const RESOURCES = ['products','stock','invoices','reports','users','cash_sessions','orders','notifications'] as const
const ACTIONS   = ['view','create','edit','delete','export','validate','notify'] as const

const RESOURCE_LABELS: Record<string, string> = {
  products: 'Produits', stock: 'Stock', invoices: 'Factures', reports: 'Rapports',
  users: 'Utilisateurs', cash_sessions: 'Caisse', orders: 'Commandes', notifications: 'Notifs',
}
const ACTION_LABELS: Record<string, string> = {
  view: 'Voir', create: 'Créer', edit: 'Modifier', delete: 'Suppr.',
  export: 'Export', validate: 'Valider', notify: 'Notifier',
}
const ROLE_LABELS: Record<UserRole, string> = {
  super_admin: 'Super Admin', admin: 'Admin', manager: 'Manager',
  vendeur: 'Vendeur', caissier: 'Caissier', readonly: 'Lecture seule',
}

// Cases verrouillées système (non modifiables)
const LOCKED = new Set([
  // Vues obligatoires
  'admin-view-products','admin-view-stock','admin-view-invoices','admin-view-orders',
  'admin-view-cash_sessions','admin-view-users','admin-view-reports','admin-view-notifications',
  'manager-view-products','manager-view-stock','manager-view-invoices','manager-view-orders','manager-view-reports',
  'vendeur-view-products','vendeur-view-invoices',
  'caissier-view-products','caissier-view-cash_sessions',
  'readonly-view-products','readonly-view-stock','readonly-view-invoices','readonly-view-reports',
  // Suppressions interdites à certains rôles
  'vendeur-delete-products','vendeur-delete-stock','vendeur-delete-invoices',
  'caissier-delete-products','caissier-delete-stock','caissier-delete-invoices','caissier-delete-cash_sessions',
  'readonly-create-products','readonly-edit-products','readonly-delete-products',
  'readonly-create-stock','readonly-edit-stock','readonly-delete-stock',
  'readonly-create-invoices','readonly-edit-invoices','readonly-delete-invoices',
])

type PermMap = Map<string, Permission>

export default function PermissionsPage() {
  const [perms, setPerms] = useState<PermMap>(new Map())
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [activeRole, setActiveRole] = useState<UserRole>('admin')
  const [resetting, setResetting] = useState(false)
  const toast = useToast()

  const key = (role: string, action: string, resource: string) => `${role}-${action}-${resource}`

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/permissions')
    if (res.ok) {
      const data: Permission[] = await res.json()
      const map = new Map<string, Permission>()
      data.forEach((p) => map.set(key(p.role, p.action, p.resource), p))
      setPerms(map)
    }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const toggle = async (role: string, action: string, resource: string) => {
    const k = key(role, action, resource)
    if (LOCKED.has(k)) return

    const perm = perms.get(k)
    const nextEnabled = !(perm?.enabled ?? false)
    const savingKey = perm?.id ?? k
    setSaving(savingKey)

    const body = perm?.id
      ? { id: perm.id, enabled: nextEnabled }
      : { role, resource, action, enabled: nextEnabled }

    const res = await fetch('/api/permissions', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (res.ok) {
      const updated: Permission = await res.json()
      setPerms((prev) => new Map(prev).set(k, updated))
      toast.success(nextEnabled ? 'Permission activée' : 'Permission désactivée')
    } else {
      toast.error('Erreur sauvegarde')
    }
    setSaving(null)
  }

  const resetRole = async (role: UserRole) => {
    setResetting(true)
    const res = await fetch('/api/permissions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role }),
    })
    if (res.ok) { await load(); toast.success(`${ROLE_LABELS[role]} — permissions réinitialisées`) }
    else toast.error('Erreur réinitialisation')
    setResetting(false)
  }

  return (
    <>
      <div className="space-y-5">
        <div className="flex items-center gap-3">
          <Shield className="h-5 w-5 text-forest-600" />
          <div>
            <h1 className="font-heading text-2xl font-semibold text-forest-800">Matrice des permissions</h1>
            <p className="text-sm text-bark-500">Cliquez sur une case pour activer/désactiver. Les cases <Lock className="inline h-3 w-3 mx-0.5" /> sont verrouillées.</p>
          </div>
        </div>

        {/* Onglets rôles */}
        <div className="flex gap-2 flex-wrap">
          {ROLES.map((r) => (
            <button key={r} onClick={() => setActiveRole(r)}
              className={`rounded-sm px-3 py-1.5 text-xs font-medium border transition-colors ${
                activeRole === r
                  ? 'bg-forest-700 border-forest-700 text-white'
                  : 'border-cream-400 bg-white text-bark-600 hover:bg-cream-100 hover:text-forest-700'
              }`}>
              {ROLE_LABELS[r]}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 gap-3 text-bark-400">
            <InlineLoader size="md" />
            <span className="text-sm">Chargement des permissions...</span>
          </div>
        ) : (
          <div className="rounded-sm border border-cream-400 bg-white shadow-botanical overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-cream-300 bg-forest-50 px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-forest-800">{ROLE_LABELS[activeRole]}</span>
                <span className="text-xs text-bark-400">
                  — {Array.from(perms.values()).filter(p => p.role === activeRole && p.enabled).length} permissions actives
                </span>
              </div>
              <button onClick={() => resetRole(activeRole)} disabled={resetting}
                className="flex items-center gap-1.5 rounded-sm border border-cream-400 px-3 py-1.5 text-xs text-bark-600 hover:bg-cream-100 disabled:opacity-50 transition-colors">
                {resetting ? <InlineLoader size="sm" /> : <RotateCcw className="h-3.5 w-3.5" />}
                Réinitialiser
              </button>
            </div>

            {/* Tableau */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-cream-300 bg-cream-50">
                    <th className="sticky left-0 z-10 bg-cream-50 px-4 py-2.5 text-left text-xs font-semibold text-forest-600 uppercase tracking-wide w-36">
                      Ressource
                    </th>
                    {ACTIONS.map((a) => (
                      <th key={a} className="px-2 py-2.5 text-center text-xs font-semibold text-forest-600 uppercase tracking-wide min-w-[70px]">
                        {ACTION_LABELS[a]}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-cream-200">
                  {RESOURCES.map((resource, ri) => (
                    <tr key={resource} className={`hover:bg-cream-50/80 transition-colors ${ri % 2 === 0 ? 'bg-white' : 'bg-cream-50/40'}`}>
                      <td className="sticky left-0 z-10 px-4 py-3 font-medium text-forest-900 text-sm border-r border-cream-200"
                        style={{ background: ri % 2 === 0 ? 'white' : 'rgb(250,247,240,0.4)' }}>
                        {RESOURCE_LABELS[resource]}
                      </td>
                      {ACTIONS.map((action) => {
                        const k = key(activeRole, action, resource)
                        const perm = perms.get(k)
                        const locked = LOCKED.has(k)
                        const enabled = perm?.enabled ?? false
                        const isSaving = saving === (perm?.id ?? k)

                        return (
                          <td key={action} className="px-2 py-3 text-center">
                            <button
                              onClick={() => toggle(activeRole, action, resource)}
                              disabled={locked || isSaving}
                              title={locked ? 'Contrainte système — non modifiable' : enabled ? 'Cliquer pour désactiver' : 'Cliquer pour activer'}
                              className={`inline-flex h-7 w-7 items-center justify-center rounded-sm transition-all ${
                                locked
                                  ? 'bg-cream-200 border border-cream-300 cursor-not-allowed'
                                  : enabled
                                    ? 'bg-forest-700 text-white border border-forest-700 hover:bg-forest-800 shadow-sm cursor-pointer'
                                    : 'bg-white border border-cream-400 hover:border-forest-400 hover:bg-cream-100 cursor-pointer'
                              } ${isSaving ? 'opacity-60' : ''}`}
                            >
                              {isSaving ? (
                                <InlineLoader size="sm" />
                              ) : locked ? (
                                <Lock className="h-3 w-3 text-bark-300" />
                              ) : enabled ? (
                                <Check className="h-3.5 w-3.5" />
                              ) : null}
                            </button>
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Légende */}
            <div className="border-t border-cream-200 bg-cream-50 px-4 py-3 flex items-center gap-5 text-xs text-bark-500 flex-wrap">
              <div className="flex items-center gap-1.5">
                <div className="h-5 w-5 rounded-sm bg-forest-700 flex items-center justify-center">
                  <Check className="h-3 w-3 text-white" />
                </div>
                <span>Activé</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-5 w-5 rounded-sm bg-white border border-cream-400" />
                <span>Désactivé (cliquer pour activer)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-5 w-5 rounded-sm bg-cream-200 border border-cream-300 flex items-center justify-center">
                  <Lock className="h-3 w-3 text-bark-300" />
                </div>
                <span>Verrouillé système</span>
              </div>
            </div>
          </div>
        )}
      </div>
      <ToastContainer />
    </>
  )
}
