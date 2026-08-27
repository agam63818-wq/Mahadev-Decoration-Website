import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

// ════════════════════════════════════════════════════════════════════════════
// ROUTE GUARD — runs BEFORE any protected page renders.
//
// Fixes the critical hole where /admin loaded the dashboard directly with no
// authentication check at all. Because this runs in middleware (edge, before
// the React render), an unauthenticated visitor is redirected without a single
// byte of admin markup ever being produced — no "flash of content then
// redirect", and no admin data fetched.
//
// Protected:
//   /admin/*      → requires a session whose profiles.role is 'admin' or 'team'
//   /dashboard/*  → requires any signed-in user
//
// This is defence in depth alongside:
//   • the server-side check in app/admin/layout.tsx (belt & braces if
//     middleware is ever misconfigured)
//   • Supabase RLS policies, which are the final authority on data access
// ════════════════════════════════════════════════════════════════════════════

const ADMIN_ROLES = ['admin', 'team']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // The login page itself must stay reachable, or we'd loop forever.
  const isAdminRoute = pathname.startsWith('/admin') && pathname !== '/admin/login'
  const isDashboardRoute = pathname.startsWith('/dashboard')

  if (!isAdminRoute && !isDashboardRoute) {
    return NextResponse.next()
  }

  const url = request.nextUrl.clone()
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Fail CLOSED. If auth is not configured we must not serve the dashboard —
  // an unconfigured backend is not a reason to expose business data.
  if (!supabaseUrl || !supabaseAnonKey) {
    url.pathname = isAdminRoute ? '/admin/login' : '/login'
    url.searchParams.set('redirectTo', pathname)
    url.searchParams.set('reason', 'auth-unconfigured')
    return NextResponse.redirect(url)
  }

  // `response` is threaded through the cookie setters so that a refreshed
  // access token is written back to the browser. This is what keeps the admin
  // logged in across refreshes and browser restarts.
  let response = NextResponse.next({ request: { headers: request.headers } })

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return request.cookies.get(name)?.value
      },
      set(name: string, value: string, options: CookieOptions) {
        request.cookies.set({ name, value, ...options })
        response = NextResponse.next({ request: { headers: request.headers } })
        response.cookies.set({ name, value, ...options })
      },
      remove(name: string, options: CookieOptions) {
        request.cookies.set({ name, value: '', ...options })
        response = NextResponse.next({ request: { headers: request.headers } })
        response.cookies.set({ name, value: '', ...options })
      },
    },
  })

  // getUser() validates the JWT with the auth server — a forged or expired
  // cookie cannot satisfy this.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    url.pathname = isAdminRoute ? '/admin/login' : '/login'
    url.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(url)
  }

  if (isAdminRoute) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()

    if (!profile || !ADMIN_ROLES.includes(profile.role as string)) {
      // Signed in, but not staff. Send them to the admin login with a clear
      // reason rather than silently 404-ing.
      url.pathname = '/admin/login'
      url.searchParams.set('reason', 'not-admin')
      return NextResponse.redirect(url)
    }
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match /admin and /dashboard (and everything beneath them), skipping
     * static assets and image optimisation requests.
     */
    '/admin',
    '/admin/:path*',
    '/dashboard',
    '/dashboard/:path*',
  ],
}
