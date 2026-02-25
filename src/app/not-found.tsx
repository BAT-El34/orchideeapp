import Link from 'next/link'
import { Leaf } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-cream-100 flex items-center justify-center px-4">
      <div className="text-center">
        <div className="flex justify-center mb-6">
          <Leaf className="h-12 w-12 text-forest-300" />
        </div>
        <h1 className="font-heading text-5xl font-semibold text-forest-800 mb-2">404</h1>
        <p className="text-bark-500 mb-6">Cette page n'existe pas ou a été déplacée.</p>
        <Link href="/" className="inline-flex items-center gap-2 rounded-sm bg-forest-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-forest-800">
          Retour à l'accueil
        </Link>
      </div>
    </div>
  )
}
