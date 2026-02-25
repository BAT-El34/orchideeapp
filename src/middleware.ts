import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const ROLE_REDIRECTS: Record<string, string> = {
  super_admin: '/super-admin',
  admin: '/admin',
  manager: '/manager',
  vendeur: '/vendeur',
  caissier: '/caissier',
  readonly: '/readonly',
}

const FAILED_ATTEMPTS_COOKIE = 'login_attempts'
const MAX_ATTEMPTS = 5
const LOCKOUT_MINUTES = 30

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname
  const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/register')
  const isPublicPath = pathname.startsWith('/_next') || pathname.startsWith('/api/auth')

  if (isPublicPath) return supabaseResponse

  if (!user) {
    if (isAuthPage) return supabaseResponse
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (isAuthPage) {
    const { data: profile } = await supabase
      .from('users')
      .select('role, status')
      .eq('id', user.id)
      .single()

    if (profile?.status === 'suspended') {
      await supabase.auth.signOut()
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      url.searchParams.set('error', 'suspended')
      return NextResponse.redirect(url)
    }

    const redirectPath = ROLE_REDIRECTS[profile?.role ?? ''] ?? '/login'
    const url = request.nextUrl.clone()
    url.pathname = redirectPath
    return NextResponse.redirect(url)
  }

  const { data: profile } = await supabase
    .from('users')
    .select('role, status')
    .eq('id', user.id)
    .single()

  if (!profile || profile.status !== 'active') {
    await supabase.auth.signOut()
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  const role = profile.role as string
  const allowedPrefix = ROLE_REDIRECTS[role]

  if (role !== 'super_admin' && allowedPrefix && !pathname.startsWith(allowedPrefix)) {
    const url = request.nextUrl.clone()
    url.pathname = allowedPrefix
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icons|manifest.json|sw.js).*)'],
}
