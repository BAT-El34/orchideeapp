'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { ChevronDown, Search, X } from 'lucide-react'

export interface AutocompleteOption {
  value: string
  label: string
  sub?: string
  avatar?: string
}

interface AutocompleteSelectProps {
  options: AutocompleteOption[]
  value: string
  onChange: (value: string, option?: AutocompleteOption) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  clearable?: boolean
  loading?: boolean
  noResultsText?: string
}

export function AutocompleteSelect({
  options,
  value,
  onChange,
  placeholder = 'Sélectionner...',
  disabled = false,
  className = '',
  clearable = false,
  loading = false,
  noResultsText = 'Aucun résultat',
}: AutocompleteSelectProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const selected = options.find((o) => o.value === value)

  const filtered = query.trim()
    ? options.filter(
        (o) =>
          o.label.toLowerCase().includes(query.toLowerCase()) ||
          o.sub?.toLowerCase().includes(query.toLowerCase())
      )
    : options

  const handleOpen = () => {
    if (disabled) return
    setOpen(true)
    setQuery('')
    setTimeout(() => inputRef.current?.focus(), 30)
  }

  const handleSelect = (opt: AutocompleteOption) => {
    onChange(opt.value, opt)
    setOpen(false)
    setQuery('')
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange('')
    setOpen(false)
    setQuery('')
  }

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false)
        setQuery('')
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={handleOpen}
        disabled={disabled}
        className={`flex h-9 w-full items-center justify-between gap-2 rounded-sm border px-3 text-sm transition-colors ${
          disabled
            ? 'cursor-not-allowed border-gray-200 bg-gray-50 text-gray-400'
            : open
            ? 'border-violet-500 bg-white ring-1 ring-violet-500'
            : 'border-gray-200 bg-white text-gray-900 hover:border-gray-300'
        }`}
      >
        {selected ? (
          <span className="flex items-center gap-2 truncate text-gray-900">
            {selected.avatar && (
              <span className="flex h-5 w-5 items-center justify-center rounded-sm bg-violet-100 text-xs font-bold text-violet-700 shrink-0">
                {selected.avatar}
              </span>
            )}
            <span className="truncate">{selected.label}</span>
            {selected.sub && (
              <span className="text-xs text-gray-400 shrink-0">{selected.sub}</span>
            )}
          </span>
        ) : (
          <span className="text-gray-400">{placeholder}</span>
        )}
        <span className="flex items-center gap-1 shrink-0">
          {clearable && selected && (
            <span
              onClick={handleClear}
              className="flex h-4 w-4 items-center justify-center rounded-sm text-gray-300 hover:text-gray-600"
            >
              <X className="h-3 w-3" />
            </span>
          )}
          <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
        </span>
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-sm border border-gray-200 bg-white shadow-md">
          <div className="flex items-center gap-2 border-b border-gray-100 px-3 py-2">
            <Search className="h-3.5 w-3.5 text-gray-400 shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher..."
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-gray-400"
            />
          </div>
          <div className="max-h-52 overflow-y-auto">
            {loading ? (
              <div className="px-3 py-3 text-xs text-gray-400">Chargement...</div>
            ) : filtered.length === 0 ? (
              <div className="px-3 py-3 text-xs text-gray-400">{noResultsText}</div>
            ) : (
              filtered.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleSelect(opt)}
                  className={`flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors hover:bg-violet-50 hover:text-violet-700 ${
                    opt.value === value ? 'bg-violet-50 text-violet-700 font-medium' : 'text-gray-900'
                  }`}
                >
                  {opt.avatar && (
                    <span className="flex h-5 w-5 items-center justify-center rounded-sm bg-violet-100 text-xs font-bold text-violet-700 shrink-0">
                      {opt.avatar}
                    </span>
                  )}
                  <span className="flex-1 truncate text-left">{opt.label}</span>
                  {opt.sub && <span className="text-xs text-gray-400 shrink-0">{opt.sub}</span>}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
