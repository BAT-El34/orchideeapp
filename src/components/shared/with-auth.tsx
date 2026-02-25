'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { UserRole } from '@/types'

interface WithAuthOptions {
  allowedRoles?: UserRole[]
}

export function withAuth<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  options: WithAuthOptions = {}
) {
  return function AuthGuard(props: P) {
    const router = useRouter()
    const [authorized, setAuthorized] = useState(false)

    useEffect(() => {
      const check = async () => {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
          router.replace('/login')
          return
        }

        const { data: profile } = await supabase
          .from('users')
          .select('role, status')
          .eq('id', user.id)
          .single()

        if (!profile || profile.status !== 'active') {
          router.replace('/login')
          return
        }

        if (options.allowedRoles && !options.allowedRoles.includes(profile.role as UserRole)) {
          router.replace('/unauthorized')
          return
        }

        setAuthorized(true)
      }
      check()
    }, [router])

    if (!authorized) {
      return (
        <div className="flex h-screen items-center justify-center bg-gray-50">
          <div className="h-8 w-8 animate-spin rounded-sm border-2 border-gray-200 border-t-violet-600" />
        </div>
      )
    }

    return <WrappedComponent {...props} />
  }
}
