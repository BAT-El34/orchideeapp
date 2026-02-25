'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCw, WifiOff, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function DashboardError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error('Dashboard error:', error)
  }, [error])

  const isNetwork = error.message?.toLowerCase().includes('fetch') ||
    error.message?.toLowerCase().includes('network') ||
    !navigator.onLine

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      <div className={`flex h-14 w-14 items-center justify-center rounded-full mb-5 ${isNetwork ? 'bg-blue-50' : 'bg-red-50'}`}>
        {isNetwork
          ? <WifiOff className="h-6 w-6 text-blue-500" />
          : <AlertTriangle className="h-6 w-6 text-red-500" />
        }
      </div>
      <h2 className="font-heading text-xl font-semibold text-forest-800 mb-2">
        {isNetwork ? 'Problème de connexion' : 'Erreur de chargement'}
      </h2>
      <p className="text-sm text-bark-500 mb-6 max-w-xs">
        {isNetwork
          ? 'Impossible de contacter le serveur. Vérifiez votre connexion et réessayez.'
          : 'Cette page n\'a pas pu se charger correctement. Réessayez ou revenez au tableau de bord.'
        }
      </p>
      <div className="flex gap-3">
        <button onClick={reset}
          className="flex items-center gap-2 rounded-sm bg-forest-700 px-4 py-2 text-sm font-medium text-white hover:bg-forest-800 transition-colors">
          <RefreshCw className="h-4 w-4" /> Réessayer
        </button>
        <Link href=".."
          className="flex items-center gap-2 rounded-sm border border-cream-400 px-4 py-2 text-sm text-bark-600 hover:bg-cream-100 transition-colors">
          <ArrowLeft className="h-4 w-4" /> Retour
        </Link>
      </div>
      {error.digest && (
        <p className="mt-4 text-xs text-bark-300 font-mono">Code : {error.digest}</p>
      )}
    </div>
  )
}
