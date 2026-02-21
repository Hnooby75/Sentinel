// ============================================
// proxy.ts — racine du projet Next.js (Next.js 16)
// Gardien de routes : vérifie auth + abonnement
// API cookies @supabase/ssr v0.8+ (getAll/setAll)
// ============================================
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Routes accessibles sans connexion
const PUBLIC_ROUTES = ['/', '/login', '/register', '/pricing', '/about', '/forgot-password', '/saas', '/web', '/services-marketing', '/packs', '/cgu', '/confidentialite', '/mentions-legales', '/site']

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  // Subdomain routing
  const host = request.headers.get('host') || ''
  if (host.startsWith('saas.')) {
    return NextResponse.rewrite(new URL('/saas', request.url))
  }
  if (host.startsWith('web.')) {
    return NextResponse.rewrite(new URL('/web', request.url))
  }
  if (host.startsWith('marketing.')) {
    return NextResponse.rewrite(new URL('/services-marketing', request.url))
  }
  if (host.startsWith('packs.')) {
    return NextResponse.rewrite(new URL('/packs', request.url))
  }

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

  // Rafraîchir la session (important pour SSR)
  const { data: { user } } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl
  const isPublic = PUBLIC_ROUTES.some(r => pathname === r || pathname.startsWith(r + '/'))
  const isDashboard = pathname.startsWith('/dashboard')
  const isAdmin = pathname.startsWith('/admin')
  const isApiPublic = pathname.startsWith('/api/v1')

  // Non connecté sur route protégée → login
  if (!user && !isPublic && !isApiPublic) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    const redirectResponse = NextResponse.redirect(loginUrl)
    supabaseResponse.cookies.getAll().forEach(cookie =>
      redirectResponse.cookies.set(cookie.name, cookie.value)
    )
    return redirectResponse
  }

  // Déjà connecté sur page auth → dashboard
  if (user && (pathname === '/login' || pathname === '/register')) {
    const dashboardResponse = NextResponse.redirect(new URL('/dashboard', request.url))
    supabaseResponse.cookies.getAll().forEach(cookie =>
      dashboardResponse.cookies.set(cookie.name, cookie.value)
    )
    return dashboardResponse
  }

  // Panel admin : auth requise, pas de vérif abonnement (gérée dans le layout)
  if (user && isAdmin) {
    return supabaseResponse
  }

  // Vérifier abonnement actif pour dashboard
  if (user && isDashboard) {
    // Récupérer entreprise_id via utilisateurs (user_metadata peut être vide)
    const { data: utilisateur } = await supabase
      .from('utilisateurs')
      .select('entreprise_id')
      .eq('id', user.id)
      .single()

    const entrepriseId = utilisateur?.entreprise_id || user.user_metadata?.entreprise_id
    if (!entrepriseId) return supabaseResponse

    const { data: entreprise } = await supabase
      .from('entreprises')
      .select('plan_actif, trial_expires_at')
      .eq('id', entrepriseId)
      .single()

    if (entreprise) {
      const trialExpired = entreprise.trial_expires_at
        && new Date(entreprise.trial_expires_at) < new Date()

      if (!entreprise.plan_actif && trialExpired && pathname !== '/dashboard/parametres/abonnement') {
        const pricingUrl = new URL('/pricing', request.url)
        pricingUrl.searchParams.set('expired', 'true')
        return NextResponse.redirect(pricingUrl)
      }
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
