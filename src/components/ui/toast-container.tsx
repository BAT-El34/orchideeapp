'use client'

import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react'
import { useToastStore } from '@/hooks/use-toast'

const icons = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
}

const styles = {
  success: 'bg-white border-green-500 text-green-800',
  error: 'bg-white border-red-500 text-red-800',
  warning: 'bg-white border-amber-500 text-amber-800',
  info: 'bg-white border-blue-500 text-blue-800',
}

const iconStyles = {
  success: 'text-green-500',
  error: 'text-red-500',
  warning: 'text-amber-500',
  info: 'text-blue-500',
}

export function ToastContainer() {
  const { toasts, remove } = useToastStore()

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 w-72">
      {toasts.map((toast) => {
        const Icon = icons[toast.type]
        return (
          <div
            key={toast.id}
            className={`flex items-start gap-3 rounded-sm border-l-4 p-3 shadow-md text-sm ${styles[toast.type]}`}
          >
            <Icon className={`h-4 w-4 mt-0.5 flex-shrink-0 ${iconStyles[toast.type]}`} />
            <span className="flex-1 text-gray-800">{toast.message}</span>
            <button onClick={() => remove(toast.id)} className="text-gray-400 hover:text-gray-600">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )
      })}
    </div>
  )
}
