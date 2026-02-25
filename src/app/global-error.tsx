'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCw, WifiOff } from 'lucide-react'

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function GlobalError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error('App error:', error)
  }, [error])

  const isNetwork = error.message?.toLowerCase().includes('fetch') ||
    error.message?.toLowerCase().includes('network') ||
    error.message?.toLowerCase().includes('failed')

  return (
    <html lang="fr">
      <body className="min-h-screen bg-cream-100 flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="flex justify-center mb-5">
            <div className={`flex h-16 w-16 items-center justify-center rounded-full ${isNetwork ? 'bg-blue-100' : 'bg-red-100'}`}>
              {isNetwork
                ? <WifiOff className="h-7 w-7 text-blue-600" />
                : <AlertTriangle className="h-7 w-7 text-red-600" />
              }
            </div>
          </div>
          <h1 className="text-xl font-semibold text-forest-800 mb-2">
            {isNetwork ? 'Connexion interrompue' : 'Une erreur est survenue'}
          </h1>
          <p className="text-sm text-bark-500 mb-6">
            {isNetwork
              ? 'Vérifiez votre connexion internet et réessayez.'
              : 'Une erreur inattendue s\'est produite. L\'équipe technique a été notifiée.'
            }
          </p>
          <button onClick={reset}
            className="inline-flex items-center gap-2 rounded-sm bg-forest-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-forest-800 transition-colors">
            <RefreshCw className="h-4 w-4" />
            Réessayer
          </button>
        </div>
      </body>
    </html>
  )
}
