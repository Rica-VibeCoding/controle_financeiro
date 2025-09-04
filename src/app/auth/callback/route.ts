import { createClient } from '@/servicos/supabase/server'
import { NextResponse, type NextRequest } from 'next/server'
import { SecurityLogger } from '@/utilitarios/security-validator'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')
  
  // Obter IP para logs de segurança
  const clientIP = (request as any).ip || 
    request.headers.get('x-forwarded-for')?.split(',')[0] ||
    request.headers.get('x-real-ip') ||
    'unknown'

  // Se há erro na URL, redirecionar imediatamente
  if (error) {
    console.warn('Erro no callback de autenticação:', { error, errorDescription, ip: clientIP })
    
    SecurityLogger.logSecurityEvent({
      type: 'failed_login',
      ip: clientIP,
      details: { 
        error,
        error_description: errorDescription,
        source: 'auth_callback',
        timestamp: new Date().toISOString()
      }
    })
    
    return NextResponse.redirect(
      new URL(`/auth/login?error=${encodeURIComponent(error)}`, request.url)
    )
  }

  if (code) {
    try {
      const supabase = await createClient()
      
      const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
      
      if (!exchangeError && data.user) {
        // Log sucesso na autenticação
        SecurityLogger.logSecurityEvent({
          type: 'login_attempt',
          userId: data.user.id,
          email: data.user.email,
          ip: clientIP,
          details: { 
            success: true,
            source: 'auth_callback',
            next_url: next,
            timestamp: new Date().toISOString()
          }
        })
        
        console.log('✅ Callback de autenticação bem-sucedido:', {
          userId: data.user.id,
          email: data.user.email,
          nextUrl: next
        })
        
        return NextResponse.redirect(new URL(next, request.url))
      } else {
        // Log falha no exchange
        SecurityLogger.logSecurityEvent({
          type: 'failed_login',
          ip: clientIP,
          details: { 
            error: exchangeError?.message || 'Exchange code failed',
            source: 'auth_callback',
            code_provided: !!code,
            timestamp: new Date().toISOString()
          }
        })
        
        console.error('❌ Erro no exchange do código:', exchangeError)
      }
    } catch (err: any) {
      console.error('💥 Erro crítico no callback:', err)
      
      SecurityLogger.logSecurityEvent({
        type: 'suspicious_activity',
        ip: clientIP,
        details: { 
          error: err.message,
          source: 'auth_callback_exception',
          timestamp: new Date().toISOString()
        }
      })
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(
    new URL('/auth/login?error=auth-code-error&message=Falha na confirmação do email', request.url)
  )
}