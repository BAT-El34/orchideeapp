'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  Building2, Package, Users, Bell, Shield, ClipboardList, Database,
  Save, Plus, Trash2, Upload, Download, CheckSquare, Loader2,
  RefreshCw, Eye, EyeOff, Search, Check, Palette, Type
} from 'lucide-react'
import { formatDateTime } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import { ToastContainer } from '@/components/ui/toast-container'
import { InlineLoader } from '@/components/ui/page-loader'

const TABS = [
  { id: 'entities',      label: 'Entités',        icon: Building2 },
  { id: 'theme',         label: 'Charte graphique', icon: Palette },
  { id: 'products',      label: 'Produits',        icon: Package },
  { id: 'users',         label: 'Comptes',         icon: Users },
  { id: 'notifications', label: 'Notifications',   icon: Bell },
  { id: 'security',      label: 'Sécurité',        icon: Shield },
  { id: 'audit',         label: 'Audit',           icon: ClipboardList },
  { id: 'backup',        label: 'Sauvegarde',      icon: Database },
]

// ─── Shared UI ───────────────────────────────────────────────────────────────

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-6">
      <h2 className="font-heading text-2xl font-semibold text-forest-800">{title}</h2>
      {subtitle && <p className="text-sm text-bark-500 mt-0.5">{subtitle}</p>}
    </div>
  )
}

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-sm border border-cream-400 bg-white p-5 shadow-botanical ${className}`}>{children}</div>
}

function InputField({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label className="block text-xs font-medium text-bark-600 mb-1.5">{label}</label>
      <input {...props} className={`h-9 w-full rounded-sm border border-cream-400 bg-cream-50 px-3 text-sm text-forest-900 placeholder:text-bark-300 focus:border-forest-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-forest-500 ${props.className ?? ''}`} />
    </div>
  )
}

function Btn({ children, variant = 'primary', ...props }: { variant?: 'primary'|'outline'|'danger' } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const styles = {
    primary: 'bg-forest-700 text-white hover:bg-forest-800',
    outline: 'border border-cream-400 bg-white text-bark-600 hover:bg-cream-100',
    danger:  'bg-red-600 text-white hover:bg-red-700',
  }
  return (
    <button {...props} className={`flex items-center gap-2 rounded-sm px-4 py-2 text-sm font-medium transition-colors disabled:opacity-60 ${styles[variant]} ${props.className ?? ''}`}>
      {children}
    </button>
  )
}

function Skeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-2 animate-pulse">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-10 rounded-sm bg-cream-300" style={{ opacity: 1 - i * 0.15 }} />
      ))}
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function SuperAdminSettings() {
  const [tab, setTab] = useState('entities')
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<any>(null)
  const toast = useToast()

  const load = useCallback(async (section: string) => {
    const apiSections: Record<string, string> = {
      entities: 'entities', products: 'categories', users: 'users',
      audit: 'audit', security: 'security', theme: 'theme'
    }
    const apiSection = apiSections[section]
    if (!apiSection) { setData(null); return }
    setLoading(true); setData(null)
    const res = await fetch(`/api/admin/settings?section=${apiSection}`)
    if (res.ok) setData(await res.json())
    setLoading(false)
  }, [])

  useEffect(() => { load(tab) }, [tab, load])

  return (
    <>
      <div className="flex gap-4 h-full">
        {/* Sidebar tabs */}
        <div className="w-44 shrink-0">
          <div className="rounded-sm border border-cream-400 bg-white shadow-botanical overflow-hidden">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => setTab(id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm transition-colors border-b border-cream-200 last:border-0 ${
                  tab === id
                    ? 'bg-forest-50 text-forest-700 font-medium border-l-2 border-forest-500'
                    : 'text-bark-600 hover:bg-cream-100 hover:text-forest-700'
                }`}>
                <Icon className="h-3.5 w-3.5 shrink-0" />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {tab === 'entities'      && <EntitiesSection      data={data} loading={loading} reload={() => load('entities')} toast={toast} />}
          {tab === 'theme'         && <ThemeSection         data={data} loading={loading} reload={() => load('theme')} toast={toast} />}
          {tab === 'products'      && <ProductsSection      data={data} loading={loading} reload={() => load('products')} toast={toast} />}
          {tab === 'users'         && <UsersSection         data={data} loading={loading} reload={() => load('users')} toast={toast} />}
          {tab === 'notifications' && <NotificationsSection toast={toast} />}
          {tab === 'security'      && <SecuritySection      data={data} loading={loading} reload={() => load('security')} toast={toast} />}
          {tab === 'audit'         && <AuditSection         data={data} loading={loading} reload={() => load('audit')} toast={toast} />}
          {tab === 'backup'        && <BackupSection        toast={toast} />}
        </div>
      </div>
      <ToastContainer />
    </>
  )
}

// ─── Entities ─────────────────────────────────────────────────────────────────

function EntitiesSection({ data, loading, reload, toast }: any) {
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState<any>({})
  const [saving, setSaving] = useState(false)

  const save = async () => {
    setSaving(true)
    const res = await fetch('/api/admin/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ section: 'entity', id: editId, ...form }),
    })
    if (res.ok) { toast.success('Entité mise à jour'); setEditId(null); reload() }
    else toast.error('Erreur lors de la sauvegarde')
    setSaving(false)
  }

  return (
    <div>
      <SectionHeader title="Entités" subtitle="Modifier les informations et l'apparence de chaque entité" />
      {loading ? <Skeleton /> : (
        <div className="space-y-3">
          {(data ?? []).map((entity: any) => (
            <Card key={entity.id} className="overflow-hidden p-0">
              <div className="flex items-center justify-between px-4 py-3 bg-cream-100 border-b border-cream-300">
                <div className="flex items-center gap-3">
                  <div className="h-4 w-4 rounded-sm border border-cream-400" style={{ backgroundColor: entity.theme_color }} />
                  <span className="font-medium text-forest-900 text-sm">{entity.name}</span>
                  <span className="text-xs text-bark-400 font-mono">{entity.slug}</span>
                </div>
                <Btn variant="outline" onClick={() => { setEditId(entity.id); setForm({ name: entity.name, theme_color: entity.theme_color }) }}
                  className="text-xs py-1.5">
                  Modifier
                </Btn>
              </div>
              {editId === entity.id && (
                <div className="p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <InputField label="Nom" value={form.name ?? ''} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                    <div>
                      <label className="block text-xs font-medium text-bark-600 mb-1.5">Couleur principale</label>
                      <div className="flex items-center gap-2">
                        <input type="color" value={form.theme_color ?? '#2C5219'}
                          onChange={(e) => setForm({ ...form, theme_color: e.target.value })}
                          className="h-9 w-12 rounded-sm border border-cream-400 p-0.5 cursor-pointer" />
                        <input value={form.theme_color ?? ''} onChange={(e) => setForm({ ...form, theme_color: e.target.value })}
                          className="h-9 flex-1 rounded-sm border border-cream-400 px-3 text-sm font-mono focus:border-forest-500 focus:outline-none" />
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <Btn onClick={save} disabled={saving}>
                      {saving ? <InlineLoader /> : <Save className="h-3.5 w-3.5" />}
                      Sauvegarder
                    </Btn>
                    <Btn variant="outline" onClick={() => setEditId(null)}>Annuler</Btn>
                  </div>
                </div>
              )}
            </Card>
          ))}
          {(data ?? []).length === 0 && !loading && (
            <p className="text-sm text-bark-400 text-center py-8">Aucune entité trouvée</p>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Charte Graphique ─────────────────────────────────────────────────────────

const PRESET_PALETTES = [
  { label: 'Orchidée (défaut)', primary: '#2C5219', accent: '#C9881A', bg: '#FAF7F0', sidebar: '#1E3B10' },
  { label: 'Océan Profond',     primary: '#0F4C6B', accent: '#D4A853', bg: '#F0F7FF', sidebar: '#0A2F42' },
  { label: 'Bordeaux Luxe',     primary: '#6B1F2A', accent: '#C9A84C', bg: '#FDF5F5', sidebar: '#3D0D15' },
  { label: 'Ardoise Moderne',   primary: '#2D3748', accent: '#68B984', bg: '#F7FAFC', sidebar: '#1A202C' },
  { label: 'Terre Cuite',       primary: '#7B3F2E', accent: '#E8A87C', bg: '#FDF0EB', sidebar: '#4A2418' },
]

const HEADING_FONTS = ['Cormorant Garamond', 'Playfair Display', 'Lora', 'Merriweather', 'DM Serif Display']
const BODY_FONTS = ['DM Sans', 'Inter', 'Nunito', 'Outfit', 'Plus Jakarta Sans']

function ThemeSection({ data, loading, reload, toast }: any) {
  const [form, setForm] = useState({
    color_primary: '#2C5219', color_accent: '#C9881A', color_bg: '#FAF7F0',
    color_surface: '#FFFFFF', color_text: '#1E3B10', color_sidebar: '#1E3B10',
    font_heading: 'Cormorant Garamond', font_body: 'DM Sans',
    border_radius: 'sharp', sidebar_style: 'dark',
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (data && data.color_primary) setForm({ ...form, ...data })
  }, [data])

  const applyPreset = (preset: typeof PRESET_PALETTES[0]) => {
    setForm((f: any) => ({ ...f, color_primary: preset.primary, color_accent: preset.accent, color_bg: preset.bg, color_sidebar: preset.sidebar }))
  }

  const save = async () => {
    setSaving(true)
    const res = await fetch('/api/admin/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ section: 'theme', ...form }),
    })
    if (res.ok) { toast.success('Charte graphique sauvegardée'); reload() }
    else { const e = await res.json(); toast.error(e.error ?? 'Erreur sauvegarde') }
    setSaving(false)
  }

  const resetDefault = () => setForm({
    color_primary: '#2C5219', color_accent: '#C9881A', color_bg: '#FAF7F0',
    color_surface: '#FFFFFF', color_text: '#1E3B10', color_sidebar: '#1E3B10',
    font_heading: 'Cormorant Garamond', font_body: 'DM Sans',
    border_radius: 'sharp', sidebar_style: 'dark',
  })

  return (
    <div className="space-y-5">
      <SectionHeader title="Charte Graphique" subtitle="Personnalisez les couleurs, polices et l'apparence globale du système" />

      {/* Palettes preset */}
      <Card>
        <h3 className="text-xs font-semibold text-bark-600 uppercase tracking-wide mb-3">Palettes prédéfinies</h3>
        <div className="flex flex-wrap gap-2">
          {PRESET_PALETTES.map((p) => (
            <button key={p.label} onClick={() => applyPreset(p)}
              className="flex items-center gap-2 rounded-sm border border-cream-400 px-3 py-2 text-xs hover:border-forest-400 hover:bg-cream-100 transition-colors">
              <div className="flex gap-0.5">
                <div className="h-3 w-3 rounded-sm" style={{ backgroundColor: p.primary }} />
                <div className="h-3 w-3 rounded-sm" style={{ backgroundColor: p.accent }} />
                <div className="h-3 w-3 rounded-sm border border-cream-400" style={{ backgroundColor: p.bg }} />
              </div>
              <span className="text-bark-700">{p.label}</span>
            </button>
          ))}
        </div>
      </Card>

      {/* Couleurs */}
      <Card>
        <h3 className="text-xs font-semibold text-bark-600 uppercase tracking-wide mb-4">Palette de couleurs</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {[
            { key: 'color_primary', label: 'Couleur principale', desc: 'Boutons, liens actifs' },
            { key: 'color_accent',  label: 'Couleur accent',     desc: 'Or, highlights' },
            { key: 'color_bg',      label: 'Fond de l\'app',     desc: 'Arrière-plan général' },
            { key: 'color_surface', label: 'Fond des cartes',    desc: 'Cards, modals' },
            { key: 'color_text',    label: 'Texte principal',    desc: 'Couleur des titres' },
            { key: 'color_sidebar', label: 'Fond sidebar',       desc: 'Menu de navigation' },
          ].map(({ key, label, desc }) => (
            <div key={key}>
              <label className="block text-xs font-medium text-bark-700 mb-1">{label}</label>
              <p className="text-xs text-bark-400 mb-2">{desc}</p>
              <div className="flex items-center gap-2">
                <input type="color" value={form[key as keyof typeof form] as string}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  className="h-8 w-10 rounded-sm border border-cream-400 p-0.5 cursor-pointer" />
                <input value={form[key as keyof typeof form] as string}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  className="h-8 flex-1 rounded-sm border border-cream-400 px-2 text-xs font-mono focus:border-forest-500 focus:outline-none" />
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Typographie */}
      <Card>
        <h3 className="text-xs font-semibold text-bark-600 uppercase tracking-wide mb-4">Typographie</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-bark-700 mb-1.5">Police des titres (Serif)</label>
            <select value={form.font_heading} onChange={(e) => setForm({ ...form, font_heading: e.target.value })}
              className="h-9 w-full rounded-sm border border-cream-400 px-3 text-sm bg-white focus:border-forest-500 focus:outline-none">
              {HEADING_FONTS.map((f) => <option key={f} value={f}>{f}</option>)}
            </select>
            <p className="mt-2 text-base" style={{ fontFamily: form.font_heading }}>
              Orchidée Nature — Cosmetiques & Épices
            </p>
          </div>
          <div>
            <label className="block text-xs font-medium text-bark-700 mb-1.5">Police du corps (Sans-serif)</label>
            <select value={form.font_body} onChange={(e) => setForm({ ...form, font_body: e.target.value })}
              className="h-9 w-full rounded-sm border border-cream-400 px-3 text-sm bg-white focus:border-forest-500 focus:outline-none">
              {BODY_FONTS.map((f) => <option key={f} value={f}>{f}</option>)}
            </select>
            <p className="mt-2 text-sm text-bark-600" style={{ fontFamily: form.font_body }}>
              Système de gestion commerciale multi-entités
            </p>
          </div>
        </div>
      </Card>

      {/* UI Options */}
      <Card>
        <h3 className="text-xs font-semibold text-bark-600 uppercase tracking-wide mb-4">Interface</h3>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-medium text-bark-700 mb-3">Arrondi des éléments</label>
            <div className="space-y-2">
              {[
                { id: 'sharp',  label: 'Angulaire', desc: 'Coins carrés (professionnel)' },
                { id: 'soft',   label: 'Doux',      desc: 'Léger arrondi (4px)' },
                { id: 'rounded',label: 'Arrondi',   desc: 'Arrondi prononcé (8px)' },
              ].map(({ id, label, desc }) => (
                <label key={id} className={`flex items-center gap-3 cursor-pointer rounded-sm border p-2.5 transition-colors ${form.border_radius === id ? 'border-forest-500 bg-forest-50' : 'border-cream-400 hover:border-forest-300'}`}>
                  <input type="radio" name="border_radius" value={id} checked={form.border_radius === id}
                    onChange={() => setForm({ ...form, border_radius: id })}
                    className="text-forest-600 focus:ring-forest-500" />
                  <div>
                    <div className="text-sm font-medium text-forest-900">{label}</div>
                    <div className="text-xs text-bark-500">{desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-bark-700 mb-3">Style de la sidebar</label>
            <div className="space-y-2">
              {[
                { id: 'dark',  label: 'Foncée',  desc: 'Fond sombre (actuel)' },
                { id: 'light', label: 'Claire',  desc: 'Fond blanc avec bordure' },
                { id: 'color', label: 'Colorée', desc: 'Couleur principale' },
              ].map(({ id, label, desc }) => (
                <label key={id} className={`flex items-center gap-3 cursor-pointer rounded-sm border p-2.5 transition-colors ${form.sidebar_style === id ? 'border-forest-500 bg-forest-50' : 'border-cream-400 hover:border-forest-300'}`}>
                  <input type="radio" name="sidebar_style" value={id} checked={form.sidebar_style === id}
                    onChange={() => setForm({ ...form, sidebar_style: id })}
                    className="text-forest-600 focus:ring-forest-500" />
                  <div>
                    <div className="text-sm font-medium text-forest-900">{label}</div>
                    <div className="text-xs text-bark-500">{desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Aperçu */}
      <Card>
        <h3 className="text-xs font-semibold text-bark-600 uppercase tracking-wide mb-3">Aperçu en temps réel</h3>
        <div className="flex rounded-sm overflow-hidden border border-cream-400 h-28">
          <div className="w-28 flex flex-col p-2 gap-1" style={{ backgroundColor: form.color_sidebar }}>
            <div className="h-2 w-14 rounded-sm opacity-60 bg-white" />
            {['Dashboard','Produits','Stock','Factures'].map((item) => (
              <div key={item} className="h-4 flex items-center gap-1 px-1 rounded-sm opacity-50 hover:opacity-100">
                <div className="h-1.5 w-1.5 rounded-sm" style={{ backgroundColor: form.color_accent }} />
                <div className="h-1.5 flex-1 rounded-sm bg-white opacity-60" />
              </div>
            ))}
          </div>
          <div className="flex-1 p-3" style={{ backgroundColor: form.color_bg }}>
            <div className="h-3 w-24 rounded-sm mb-2" style={{ backgroundColor: form.color_primary, opacity: 0.8 }} />
            <div className="grid grid-cols-3 gap-1.5 mb-2">
              {[1,2,3].map((i) => (
                <div key={i} className="h-8 rounded-sm border p-1.5" style={{ backgroundColor: form.color_surface, borderColor: '#E8DDD3' }}>
                  <div className="h-1 w-8 rounded-sm mb-1" style={{ backgroundColor: form.color_accent, opacity: 0.5 }} />
                  <div className="h-2 w-10 rounded-sm" style={{ backgroundColor: form.color_text, opacity: 0.7 }} />
                </div>
              ))}
            </div>
            <div className="h-6 rounded-sm flex items-center px-2 gap-1" style={{ backgroundColor: form.color_primary }}>
              <div className="h-1.5 w-12 rounded-sm bg-white opacity-80" />
            </div>
          </div>
        </div>
      </Card>

      <div className="flex gap-3">
        <Btn onClick={save} disabled={saving}>
          {saving ? <InlineLoader /> : <Save className="h-3.5 w-3.5" />}
          Appliquer la charte
        </Btn>
        <Btn variant="outline" onClick={resetDefault}>
          <RefreshCw className="h-3.5 w-3.5" />
          Réinitialiser
        </Btn>
      </div>
    </div>
  )
}

// ─── Products ─────────────────────────────────────────────────────────────────

function ProductsSection({ data, loading, reload, toast }: any) {
  const [importing, setImporting] = useState(false)
  const [exportingCsv, setExportingCsv] = useState(false)
  const [newCat, setNewCat] = useState('')
  const [selectedEntity, setSelectedEntity] = useState('')
  const [addingCat, setAddingCat] = useState(false)
  const [entities, setEntities] = useState<any[]>([])
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch('/api/admin/settings?section=entities').then((r) => r.json()).then(setEntities).catch(() => {})
  }, [])

  const addCategory = async () => {
    if (!newCat || !selectedEntity) return
    setAddingCat(true)
    const res = await fetch('/api/admin/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ section: 'category', name: newCat, entity_id: selectedEntity }),
    })
    if (res.ok) { toast.success('Catégorie ajoutée'); setNewCat(''); reload() }
    else toast.error('Erreur')
    setAddingCat(false)
  }

  const deleteCategory = async (id: string) => {
    if (!confirm('Supprimer cette catégorie ?')) return
    const res = await fetch(`/api/admin/settings?section=category&id=${id}`, { method: 'DELETE' })
    if (res.ok) { toast.success('Catégorie supprimée'); reload() }
    else toast.error('Impossible — des produits utilisent cette catégorie')
  }

  const importCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !selectedEntity) { toast.error("Sélectionnez une entité d'abord"); return }
    setImporting(true)
    const text = await file.text()
    const lines = text.split('\n').slice(1)
    const rows = lines.filter((l) => l.trim()).map((line) => {
      const parts = line.split(';').map((p) => p.trim().replace(/^"|"$/g, ''))
      return { name: parts[0], unit: parts[1] || 'unité', price_buy: parts[2] || '0', price_sell: parts[3] || '0', category_id: parts[4] || null }
    })
    const res = await fetch('/api/admin/settings', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ section: 'import_products', rows, entity_id: selectedEntity }),
    })
    if (res.ok) {
      const result = await res.json()
      toast.success(`${result.imported} produits importés${result.errors.length > 0 ? ` (${result.errors.length} erreurs)` : ''}`)
    } else toast.error('Erreur import')
    setImporting(false)
    if (fileRef.current) fileRef.current.value = ''
  }

  const exportCSV = async () => {
    if (!selectedEntity) { toast.error('Sélectionnez une entité'); return }
    setExportingCsv(true)
    const res = await fetch(`/api/export/csv?type=stock&entity_id=${selectedEntity}`)
    if (res.ok) {
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a'); a.href = url; a.download = 'catalogue-produits.csv'; a.click()
      URL.revokeObjectURL(url)
    } else toast.error('Erreur export')
    setExportingCsv(false)
  }

  return (
    <div>
      <SectionHeader title="Produits" subtitle="Import CSV, export catalogue, gestion des catégories" />
      <div className="space-y-4">
        <Card>
          <label className="block text-xs font-medium text-bark-600 mb-1.5">Entité cible</label>
          <select value={selectedEntity} onChange={(e) => setSelectedEntity(e.target.value)}
            className="h-9 w-64 rounded-sm border border-cream-400 px-3 text-sm bg-white focus:border-forest-500 focus:outline-none">
            <option value="">— Sélectionner —</option>
            {entities.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
          </select>
          <div className="flex gap-3 mt-3">
            <label className={`flex items-center gap-2 rounded-sm border px-4 py-2 text-sm font-medium cursor-pointer transition-colors ${selectedEntity ? 'border-forest-300 bg-forest-50 text-forest-700 hover:bg-forest-100' : 'border-cream-400 text-bark-400 cursor-not-allowed'}`}>
              {importing ? <InlineLoader /> : <Upload className="h-4 w-4" />}
              Importer CSV
              <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={importCSV} disabled={!selectedEntity} />
            </label>
            <Btn variant="outline" onClick={exportCSV} disabled={exportingCsv || !selectedEntity}>
              {exportingCsv ? <InlineLoader /> : <Download className="h-4 w-4" />}
              Exporter catalogue
            </Btn>
          </div>
          <div className="mt-3 rounded-sm bg-cream-100 border border-cream-300 px-3 py-2 text-xs text-bark-500 font-mono">
            Format : nom;unite;prix_achat;prix_vente;category_id
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-forest-800">Catégories</span>
          </div>
          <div className="flex gap-2 mb-3">
            <input value={newCat} onChange={(e) => setNewCat(e.target.value)}
              placeholder="Nom de la catégorie" onKeyDown={(e) => e.key === 'Enter' && addCategory()}
              className="h-8 flex-1 rounded-sm border border-cream-400 px-3 text-sm focus:border-forest-500 focus:outline-none" />
            <button onClick={addCategory} disabled={!newCat || !selectedEntity || addingCat}
              className="flex items-center gap-1.5 rounded-sm bg-forest-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-forest-800 disabled:opacity-60 transition-colors">
              {addingCat ? <InlineLoader size="sm" /> : <Plus className="h-3.5 w-3.5" />}
              Ajouter
            </button>
          </div>
          {loading ? <Skeleton rows={5} /> : (
            <div className="space-y-1">
              {(data ?? []).map((cat: any, i: number) => (
                <div key={cat.id} className={`flex items-center justify-between px-3 py-2 rounded-sm ${i % 2 === 0 ? 'bg-white' : 'bg-cream-50'}`}>
                  <div>
                    <span className="text-sm text-forest-800">{cat.name}</span>
                    <span className="ml-2 text-xs text-bark-400">{cat.entities?.name ?? 'Global'}</span>
                  </div>
                  <button onClick={() => deleteCategory(cat.id)} className="p-1 text-bark-300 hover:text-red-500 transition-colors">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
              {(data ?? []).length === 0 && <p className="text-sm text-bark-400 py-2 text-center">Aucune catégorie</p>}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}

// ─── Users ────────────────────────────────────────────────────────────────────

function UsersSection({ data, loading, reload, toast }: any) {
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [bulkStatus, setBulkStatus] = useState<'active' | 'suspended'>('active')
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')

  const filtered = (data ?? []).filter((u: any) =>
    u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  )

  const toggle = (id: string) => setSelected((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  const toggleAll = () => setSelected((prev) => prev.size === filtered.length ? new Set() : new Set(filtered.map((u: any) => u.id)))

  const bulkUpdate = async () => {
    if (selected.size === 0) return
    setSaving(true)
    const res = await fetch('/api/admin/settings', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ section: 'bulk_validate_users', userIds: [...selected], status: bulkStatus }),
    })
    if (res.ok) { toast.success(`${selected.size} compte(s) mis à jour`); setSelected(new Set()); reload() }
    else toast.error('Erreur lors de la mise à jour')
    setSaving(false)
  }

  const ROLE_COLORS: Record<string, string> = {
    super_admin: 'bg-forest-100 text-forest-700', admin: 'bg-blue-50 text-blue-700',
    manager: 'bg-sage-50 text-sage-700', vendeur: 'bg-gold-50 text-gold-700',
    caissier: 'bg-bark-50 text-bark-700', readonly: 'bg-cream-300 text-bark-500',
  }

  return (
    <div>
      <SectionHeader title="Comptes utilisateurs" subtitle="Validation et gestion de tous les comptes" />
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-bark-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher..."
            className="h-9 w-full rounded-sm border border-cream-400 pl-9 pr-3 text-sm focus:border-forest-500 focus:outline-none" />
        </div>
        {selected.size > 0 && (
          <>
            <select value={bulkStatus} onChange={(e) => setBulkStatus(e.target.value as any)}
              className="h-9 rounded-sm border border-cream-400 px-3 text-sm bg-white focus:border-forest-500 focus:outline-none">
              <option value="active">Activer</option>
              <option value="suspended">Suspendre</option>
            </select>
            <Btn onClick={bulkUpdate} disabled={saving}>
              {saving ? <InlineLoader /> : <CheckSquare className="h-3.5 w-3.5" />}
              Appliquer ({selected.size})
            </Btn>
          </>
        )}
      </div>

      <div className="rounded-sm border border-cream-400 bg-white shadow-botanical overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-cream-300 bg-forest-50">
              <th className="w-10 px-4 py-2.5">
                <input type="checkbox"
                  checked={selected.size === filtered.length && filtered.length > 0}
                  onChange={toggleAll}
                  className="rounded-sm border-cream-400 text-forest-600 focus:ring-forest-500 cursor-pointer" />
              </th>
              {['Nom', 'Email', 'Rôle', 'Entité', 'Statut', 'Connexion'].map((h) => (
                <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-forest-600 uppercase tracking-wide whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-cream-200">
            {loading ? (
              <tr><td colSpan={7} className="px-4 py-8"><Skeleton rows={5} /></td></tr>
            ) : filtered.map((u: any, i: number) => (
              <tr key={u.id} className={`transition-colors hover:bg-cream-50 ${i % 2 === 0 ? 'bg-white' : 'bg-cream-50/50'}`}>
                <td className="px-4 py-2.5">
                  <input type="checkbox" checked={selected.has(u.id)} onChange={() => toggle(u.id)}
                    className="rounded-sm border-cream-400 text-forest-600 focus:ring-forest-500 cursor-pointer" />
                </td>
                <td className="px-4 py-2.5 font-medium text-forest-900">{u.full_name}</td>
                <td className="px-4 py-2.5 text-xs text-bark-500">{u.email}</td>
                <td className="px-4 py-2.5">
                  <span className={`inline-flex rounded-sm px-1.5 py-0.5 text-xs font-medium ${ROLE_COLORS[u.role] ?? 'bg-cream-200 text-bark-600'}`}>{u.role}</span>
                </td>
                <td className="px-4 py-2.5 text-xs text-bark-500">{u.entities?.name ?? '—'}</td>
                <td className="px-4 py-2.5">
                  <span className={`inline-flex rounded-sm px-1.5 py-0.5 text-xs font-medium ${
                    u.status === 'active' ? 'bg-forest-50 text-forest-700' :
                    u.status === 'pending' ? 'bg-gold-50 text-gold-700' : 'bg-red-50 text-red-700'
                  }`}>
                    {u.status === 'active' ? 'Actif' : u.status === 'pending' ? 'En attente' : 'Suspendu'}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-xs text-bark-400">{u.last_login ? formatDateTime(u.last_login) : '—'}</td>
              </tr>
            ))}
            {!loading && filtered.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-sm text-bark-400">Aucun utilisateur trouvé</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── Notifications ────────────────────────────────────────────────────────────

function NotificationsSection({ toast }: any) {
  const [form, setForm] = useState({
    twilio_sid: '', twilio_token: '', twilio_from: '',
    smtp_host: '', smtp_port: '587', smtp_user: '', smtp_pass: '', smtp_from: ''
  })
  const [showTokens, setShowTokens] = useState(false)
  const [saving, setSaving] = useState(false)

  const save = async () => {
    setSaving(true)
    await new Promise((r) => setTimeout(r, 500))
    toast.success("Configuration affichée — mettez à jour les variables d'env dans votre hébergeur")
    setSaving(false)
  }

  return (
    <div>
      <SectionHeader title="Notifications" subtitle="Configuration Twilio WhatsApp et SMTP Email" />
      <div className="space-y-4">
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-forest-800">Twilio WhatsApp</h3>
            <button onClick={() => setShowTokens(!showTokens)} className="text-xs text-bark-400 flex items-center gap-1 hover:text-forest-600">
              {showTokens ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              {showTokens ? 'Masquer' : 'Afficher'}
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { key: 'twilio_sid',   label: 'Account SID',          placeholder: 'ACxxxxxxxxxxxxxxxx', full: false },
              { key: 'twilio_token', label: 'Auth Token',           placeholder: '••••••••••••••',    full: false },
              { key: 'twilio_from',  label: 'Numéro From (WA)',     placeholder: 'whatsapp:+1415…',   full: true  },
            ].map(({ key, label, placeholder, full }) => (
              <div key={key} className={full ? 'col-span-2' : ''}>
                <label className="block text-xs font-medium text-bark-600 mb-1.5">{label}</label>
                <input type={showTokens || key === 'twilio_from' ? 'text' : 'password'}
                  value={form[key as keyof typeof form]} onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  placeholder={placeholder}
                  className="h-9 w-full rounded-sm border border-cream-400 px-3 text-sm font-mono focus:border-forest-500 focus:outline-none" />
              </div>
            ))}
          </div>
          <div className="mt-3 rounded-sm bg-gold-50 border border-gold-200 px-3 py-2 text-xs text-gold-700">
            Variables Vercel : TWILIO_ACCOUNT_SID • TWILIO_AUTH_TOKEN • TWILIO_WHATSAPP_FROM
          </div>
        </Card>

        <Card>
          <h3 className="text-sm font-semibold text-forest-800 mb-4">Serveur SMTP (Email)</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { key: 'smtp_host', label: 'Hôte SMTP',         placeholder: 'smtp.gmail.com' },
              { key: 'smtp_port', label: 'Port',              placeholder: '587' },
              { key: 'smtp_user', label: 'Utilisateur',       placeholder: 'user@gmail.com' },
              { key: 'smtp_pass', label: 'Mot de passe',      placeholder: '••••••••' },
              { key: 'smtp_from', label: 'Adresse expéditeur',placeholder: 'noreply@orchidee.com' },
            ].map(({ key, label, placeholder }) => (
              <div key={key}>
                <label className="block text-xs font-medium text-bark-600 mb-1.5">{label}</label>
                <input type={key === 'smtp_pass' && !showTokens ? 'password' : 'text'}
                  value={form[key as keyof typeof form]} onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  placeholder={placeholder}
                  className="h-9 w-full rounded-sm border border-cream-400 px-3 text-sm focus:border-forest-500 focus:outline-none" />
              </div>
            ))}
          </div>
        </Card>

        <Btn onClick={save} disabled={saving}>
          {saving ? <InlineLoader /> : <Save className="h-4 w-4" />}
          Sauvegarder la configuration
        </Btn>
      </div>
    </div>
  )
}

// ─── Security ─────────────────────────────────────────────────────────────────

function SecuritySection({ data, loading, reload, toast }: any) {
  const [form, setForm] = useState({
    auth_method: 'pin' as 'pin'|'fingerprint'|'both',
    session_duration_h: 8,
    max_login_attempts: 5,
    min_password_length: 8,
    require_uppercase: true,
    require_number: true,
    require_special: false,
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (data && data.auth_method) {
      setForm({
        auth_method: data.auth_method,
        session_duration_h: data.session_duration_h ?? 8,
        max_login_attempts: data.max_login_attempts ?? 5,
        min_password_length: data.min_password_length ?? 8,
        require_uppercase: data.require_uppercase ?? true,
        require_number: data.require_number ?? true,
        require_special: data.require_special ?? false,
      })
    }
  }, [data])

  const save = async () => {
    setSaving(true)
    const res = await fetch('/api/admin/settings', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ section: 'security', ...form }),
    })
    if (res.ok) { toast.success('Paramètres de sécurité sauvegardés'); reload() }
    else { const e = await res.json(); toast.error(e.error ?? 'Erreur sauvegarde') }
    setSaving(false)
  }

  return (
    <div className="space-y-5">
      <SectionHeader title="Sécurité" subtitle="Méthode d'authentification, sessions, politique de mots de passe" />

      {/* Auth method */}
      <Card>
        <h3 className="text-xs font-semibold text-bark-600 uppercase tracking-wide mb-1">Méthode de confirmation d'identité (Caisse)</h3>
        <p className="text-xs text-bark-400 mb-3">Utilisée lorsqu'une opération caisse concerne un utilisateur spécifique.</p>
        <div className="space-y-2">
          {[
            { id: 'pin' as const,         label: 'Code PIN uniquement',    desc: "Code 4 chiffres défini par l'utilisateur" },
            { id: 'fingerprint' as const, label: 'Empreinte digitale',     desc: 'Biométrie via le lecteur de l\'appareil' },
            { id: 'both' as const,        label: 'PIN ou Empreinte',       desc: "L'utilisateur choisit à chaque opération" },
          ].map(({ id, label, desc }) => (
            <label key={id} className={`flex items-center gap-3 cursor-pointer rounded-sm border p-3 transition-colors ${form.auth_method === id ? 'border-forest-500 bg-forest-50' : 'border-cream-400 hover:border-forest-300'}`}>
              <input type="radio" name="auth_method" value={id} checked={form.auth_method === id}
                onChange={() => setForm({ ...form, auth_method: id })}
                className="text-forest-600 focus:ring-forest-500" />
              <div className="flex-1">
                <div className="text-sm font-medium text-forest-900">{label}</div>
                <div className="text-xs text-bark-500">{desc}</div>
              </div>
              {form.auth_method === id && <Check className="h-4 w-4 text-forest-600 shrink-0" />}
            </label>
          ))}
        </div>
      </Card>

      {/* Sessions */}
      <Card>
        <h3 className="text-xs font-semibold text-bark-600 uppercase tracking-wide mb-4">Sessions & connexions</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-bark-700 mb-1.5">Durée de session (heures)</label>
            <input type="number" min={1} max={72} value={form.session_duration_h}
              onChange={(e) => setForm({ ...form, session_duration_h: parseInt(e.target.value) })}
              className="h-9 w-full rounded-sm border border-cream-400 px-3 text-sm focus:border-forest-500 focus:outline-none" />
            <p className="text-xs text-bark-400 mt-1">Déconnexion après inactivité</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-bark-700 mb-1.5">Tentatives max avant blocage</label>
            <input type="number" min={3} max={20} value={form.max_login_attempts}
              onChange={(e) => setForm({ ...form, max_login_attempts: parseInt(e.target.value) })}
              className="h-9 w-full rounded-sm border border-cream-400 px-3 text-sm focus:border-forest-500 focus:outline-none" />
          </div>
        </div>
      </Card>

      {/* Password policy */}
      <Card>
        <h3 className="text-xs font-semibold text-bark-600 uppercase tracking-wide mb-4">Politique de mots de passe</h3>
        <div className="mb-4">
          <label className="block text-xs font-medium text-bark-700 mb-1.5">Longueur minimale</label>
          <input type="number" min={6} max={32} value={form.min_password_length}
            onChange={(e) => setForm({ ...form, min_password_length: parseInt(e.target.value) })}
            className="h-9 w-28 rounded-sm border border-cream-400 px-3 text-sm focus:border-forest-500 focus:outline-none" />
        </div>
        <div className="space-y-3">
          {[
            { key: 'require_uppercase', label: 'Majuscule obligatoire (A-Z)' },
            { key: 'require_number',    label: 'Chiffre obligatoire (0-9)' },
            { key: 'require_special',   label: 'Caractère spécial (!@#...)' },
          ].map(({ key, label }) => (
            <label key={key} className="flex items-center gap-3 cursor-pointer group">
              <div className={`relative h-5 w-5 rounded-sm border-2 transition-colors flex items-center justify-center ${form[key as keyof typeof form] ? 'border-forest-600 bg-forest-600' : 'border-cream-400 bg-white group-hover:border-forest-400'}`}>
                <input type="checkbox" checked={!!form[key as keyof typeof form]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.checked })}
                  className="sr-only" />
                {form[key as keyof typeof form] && <Check className="h-3 w-3 text-white" />}
              </div>
              <span className="text-sm text-forest-800">{label}</span>
            </label>
          ))}
        </div>
      </Card>

      <Btn onClick={save} disabled={saving || loading}>
        {saving ? <InlineLoader /> : <Save className="h-3.5 w-3.5" />}
        Sauvegarder tout
      </Btn>
    </div>
  )
}

// ─── Audit ────────────────────────────────────────────────────────────────────

function AuditSection({ data, loading, reload, toast }: any) {
  const [filters, setFilters] = useState({ from: '', to: '', action: '' })

  const search = async () => {
    const params = new URLSearchParams({ section: 'audit' })
    if (filters.from) params.set('from', filters.from)
    if (filters.to) params.set('to', filters.to)
    if (filters.action) params.set('action', filters.action)
    const res = await fetch(`/api/admin/settings?${params}`)
    if (res.ok) reload()
  }

  const rows = data?.data ?? []
  const count = data?.count ?? 0

  return (
    <div>
      <SectionHeader title="Journal d'audit" subtitle={`${count} entrées au total`} />
      <div className="flex gap-3 mb-4 flex-wrap">
        <input type="date" value={filters.from} onChange={(e) => setFilters({ ...filters, from: e.target.value })}
          className="h-9 rounded-sm border border-cream-400 px-3 text-sm focus:border-forest-500 focus:outline-none" />
        <input type="date" value={filters.to} onChange={(e) => setFilters({ ...filters, to: e.target.value })}
          className="h-9 rounded-sm border border-cream-400 px-3 text-sm focus:border-forest-500 focus:outline-none" />
        <input value={filters.action} onChange={(e) => setFilters({ ...filters, action: e.target.value })}
          placeholder="Filtrer par action"
          className="h-9 w-48 rounded-sm border border-cream-400 px-3 text-sm focus:border-forest-500 focus:outline-none" />
        <Btn onClick={search}><Search className="h-3.5 w-3.5" /> Filtrer</Btn>
        <Btn variant="outline" onClick={() => reload()}><RefreshCw className="h-3.5 w-3.5" /></Btn>
      </div>

      <div className="rounded-sm border border-cream-400 bg-white shadow-botanical overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-cream-300 bg-forest-50">
              {['Date', 'Utilisateur', 'Action', 'Ressource', 'ID'].map((h) => (
                <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-forest-600 uppercase tracking-wide whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-cream-200">
            {loading ? (
              <tr><td colSpan={5} className="px-4 py-8"><Skeleton rows={6} /></td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-sm text-bark-400">Aucune entrée d'audit</td></tr>
            ) : rows.map((r: any, i: number) => (
              <tr key={r.id} className={`hover:bg-cream-50 ${i % 2 === 0 ? 'bg-white' : 'bg-cream-50/50'}`}>
                <td className="px-4 py-2.5 text-xs text-bark-500 whitespace-nowrap">{formatDateTime(r.created_at)}</td>
                <td className="px-4 py-2.5 text-xs text-forest-700">{r.users?.full_name ?? r.users?.email ?? '—'}</td>
                <td className="px-4 py-2.5">
                  <span className="inline-flex rounded-sm bg-forest-50 px-1.5 py-0.5 text-xs font-mono text-forest-700">{r.action}</span>
                </td>
                <td className="px-4 py-2.5 text-xs text-bark-500">{r.resource}</td>
                <td className="px-4 py-2.5 text-xs font-mono text-bark-400">{r.resource_id?.slice(0, 8) ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── Backup ───────────────────────────────────────────────────────────────────

function BackupSection({ toast }: any) {
  const [downloading, setDownloading] = useState(false)

  const download = async () => {
    setDownloading(true)
    const res = await fetch('/api/admin/settings?section=backup')
    if (res.ok) {
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = `orchidee-backup-${new Date().toISOString().split('T')[0]}.json`; a.click()
      URL.revokeObjectURL(url)
      toast.success('Sauvegarde téléchargée')
    } else toast.error('Erreur lors de la sauvegarde')
    setDownloading(false)
  }

  return (
    <div>
      <SectionHeader title="Sauvegarde" subtitle="Export complet de la base de données en JSON" />
      <div className="space-y-4">
        <Card>
          <h3 className="text-sm font-semibold text-forest-800 mb-2">Export JSON complet</h3>
          <p className="text-sm text-bark-500 mb-4">
            Télécharge toutes les données : entités, utilisateurs, produits, stocks, factures, commandes, sessions caisse.
          </p>
          <div className="rounded-sm bg-cream-100 border border-cream-300 p-3 mb-4 text-xs text-bark-500 font-mono space-y-1">
            <div>Format : JSON — UTF-8</div>
            <div>Contenu : entités + utilisateurs + produits + stocks + factures + commandes + sessions</div>
            <div>Sensibilité : <span className="text-gold-700 font-medium">Données commerciales confidentielles</span></div>
          </div>
          <Btn onClick={download} disabled={downloading} className="bg-forest-900 hover:bg-forest-800">
            {downloading ? <InlineLoader /> : <Download className="h-4 w-4" />}
            Télécharger la sauvegarde
          </Btn>
        </Card>
        <div className="rounded-sm border border-gold-200 bg-gold-50 p-4">
          <p className="text-xs text-gold-800 font-medium mb-1">Sauvegarde automatique Supabase</p>
          <p className="text-xs text-gold-700">Pour des sauvegardes planifiées, activez le backup natif dans Supabase → Project Settings → Backups (plans Pro+).</p>
        </div>
      </div>
    </div>
  )
}
