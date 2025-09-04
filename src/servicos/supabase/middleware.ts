import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Cache de URLs válidas para evitar recalcular
let cachedUrl: string | null = null
let cachedKey: string | null = null

// Função para garantir URL válida (evitar malformação)
function getValidUrl() {
  if (cachedUrl) return cachedUrl
  
  let url = process.env.NEXT_PUBLIC_SUPABASE_URL
  
  if (!url || url.includes('ant_type') || !url.includes('.supabase.co')) {
    url = 'https://nzgifjdewdfibcopolof.supabase.co'
  }
  
  // Garantir que não há caracteres malformados
  url = url.replace(/\.ant_type.*$/, '.supabase.co')
  cachedUrl = url
  
  return url
}

function getValidKey() {
  if (cachedKey) return cachedKey
  
  cachedKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im56Z2lmamRld2RmaWJjb3BvbG9mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc0NjA4NDAsImV4cCI6MjA2MzAzNjg0MH0.O7MKZNx_Cd-Z12iq8h0pq6Sq0bmJazcxDHvlVb4VJQc'
  
  return cachedKey
}

export async function updateSession(request: NextRequest) {
  // Skip middleware para arquivos estáticos e API routes
  const path = request.nextUrl.pathname
  if (
    path.startsWith('/_next') ||
    path.startsWith('/api') ||
    path.includes('.') || // arquivos estáticos
    path.startsWith('/sw.js') ||
    path.startsWith('/favicon') ||
    path.startsWith('/manifest')
  ) {
    return NextResponse.next()
  }

  // Redirect da página inicial para dashboard (exceto se vindo de auth)
  if (path === '/') {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  // Não aplicar middleware em rotas de auth
  if (path.startsWith('/auth/')) {
    return NextResponse.next()
  }
  
  let supabaseResponse = NextResponse.next({
    request,
  })

  // Adicionar headers de segurança básicos
  supabaseResponse.headers.set('X-Content-Type-Options', 'nosniff')
  supabaseResponse.headers.set('X-Frame-Options', 'DENY')
  supabaseResponse.headers.set('X-XSS-Protection', '1; mode=block')
  supabaseResponse.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  
  // CSP básico apenas em produção
  if (process.env.NODE_ENV === 'production') {
    const cspHeader = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://nzgifjdewdfibcopolof.supabase.co",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self' data:",
      "connect-src 'self' https://nzgifjdewdfibcopolof.supabase.co wss://nzgifjdewdfibcopolof.supabase.co",
      "frame-ancestors 'none'"
    ].join('; ')
    
    supabaseResponse.headers.set('Content-Security-Policy', cspHeader)
  }

  const url = getValidUrl()
  const key = getValidKey()

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
        supabaseResponse = NextResponse.next({
          request,
        })
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        )
      },
    },
  })

  try {
    // Apenas verificar auth se for rota protegida (não auth)
    if (!path.startsWith('/auth/') && path !== '/') {
      const { data: { user }, error } = await supabase.auth.getUser()
      
      // Se há erro de autenticação em rota protegida, redirecionar
      if (error || !user) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('⚠️ Erro de autenticação no middleware:', error?.message || 'Usuário não encontrado')
        }
        
        const url = request.nextUrl.clone()
        url.pathname = '/auth/login'
        url.searchParams.set('redirect', path)
        return NextResponse.redirect(url)
      }
    }
    
  } catch (authError: any) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('⚠️ Erro de autenticação no middleware:', authError.message)
    }
    
    // Em caso de erro, redirecionar para login
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    url.searchParams.set('redirect', path)
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}