import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// ---------------------------------------------------------------------------
// Route configuration
// ---------------------------------------------------------------------------

/** Role values as stored in the `users` table. */
type Role = 'admin' | 'coach' | 'student'

/**
 * Maps each role to the route prefix it owns.
 * A user may only visit the prefix that matches their own role.
 */
const ROLE_HOME: Record<Role, string> = {
  admin: '/admin',
  coach: '/coach',
  student: '/student',
}

/** All protected route prefixes — require an authenticated session. */
const PROTECTED_PREFIXES = Object.values(ROLE_HOME) // ['/admin', '/coach', '/student']

/** Routes that should NOT be accessible to already-authenticated users. */
const AUTH_ROUTES = ['/login']

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

/**
 * Returns which Role "owns" the given pathname, or null if the path is not
 * under any role-protected prefix.
 */
function getRequiredRole(pathname: string): Role | null {
  for (const [role, prefix] of Object.entries(ROLE_HOME) as [Role, string][]) {
    if (pathname.startsWith(prefix)) return role
  }
  return null
}

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------

export async function middleware(request: NextRequest) {
  // Always carry the supabaseResponse so refreshed session cookies are
  // forwarded to the browser (required by @supabase/ssr).
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
          // Write cookies onto the request …
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          // … and onto the response so the browser receives them.
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // ⚠️  Use getUser() (not getSession()) — it validates the JWT server-side.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p))
  const isAuthRoute = AUTH_ROUTES.some((p) => pathname.startsWith(p))

  // -----------------------------------------------------------------
  // 1. Unauthenticated user hitting a protected route → /login
  // -----------------------------------------------------------------
  if (!user && isProtected) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/login'
    // Preserve intended destination so the login page can redirect back after auth
    loginUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // -----------------------------------------------------------------
  // 2. Authenticated user — fetch role, then enforce RBAC
  // -----------------------------------------------------------------
  if (user) {
    // Fetch the user's role from the `users` table.
    // The anon client has the user's session, so RLS can validate
    // "SELECT role WHERE auth_id = auth.uid()" automatically.
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('role')
      .eq('auth_id', user.id)
      .single()

    if (profileError || !profile) {
      // Cannot determine role — sign the user out and send to /login
      await supabase.auth.signOut()
      const loginUrl = request.nextUrl.clone()
      loginUrl.pathname = '/login'
      loginUrl.searchParams.set('error', 'profile_not_found')
      return NextResponse.redirect(loginUrl)
    }

    const role = profile.role as Role

    // Guard against unexpected role values
    if (!(role in ROLE_HOME)) {
      await supabase.auth.signOut()
      const loginUrl = request.nextUrl.clone()
      loginUrl.pathname = '/login'
      loginUrl.searchParams.set('error', 'unknown_role')
      return NextResponse.redirect(loginUrl)
    }

    const userHome = ROLE_HOME[role] // e.g. '/student'

    // 2a. Authenticated user visiting /login → send to their dashboard
    if (isAuthRoute) {
      const homeUrl = request.nextUrl.clone()
      homeUrl.pathname = userHome
      return NextResponse.redirect(homeUrl)
    }

    // 2b. Authenticated user visiting another role's protected prefix
    //     e.g. a student hitting /coach/anything → redirect to /student
    const requiredRole = getRequiredRole(pathname)
    if (requiredRole !== null && requiredRole !== role && role !== 'admin') {
      const homeUrl = request.nextUrl.clone()
      homeUrl.pathname = userHome
      return NextResponse.redirect(homeUrl)
    }
  }

  // -----------------------------------------------------------------
  // 3. All checks passed — continue, forwarding refreshed cookies
  // -----------------------------------------------------------------
  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     *  - _next/static  (static files)
     *  - _next/image   (image optimisation)
     *  - favicon.ico and common static asset extensions
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
