import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Rotas públicas
  const publicRoutes = ['/auth/login', '/auth/register', '/auth/callback', '/auth/dev']
  const isPublicRoute = publicRoutes.some(route => 
    req.nextUrl.pathname.startsWith(route)
  )

  // Redirecionar se não autenticado
  if (!session && !isPublicRoute) {
    // Em desenvolvimento, redirecionar para auto-login
    if (process.env.NEXT_PUBLIC_DEV_MODE === 'true') {
      return NextResponse.redirect(new URL('/auth/dev', req.url))
    }
    return NextResponse.redirect(new URL('/auth/login', req.url))
  }

  // Redirecionar se autenticado e tentando acessar rota pública
  if (session && isPublicRoute && !req.nextUrl.pathname.includes('convite')) {
    return NextResponse.redirect(new URL('/', req.url))
  }

  return res
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}