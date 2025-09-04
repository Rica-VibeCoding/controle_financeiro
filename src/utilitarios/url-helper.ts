/**
 * Utilitário para gerenciar URLs de callback em diferentes ambientes
 */

export function getRedirectUrl(): string {
  // Em desenvolvimento sempre usar IP personalizado
  if (process.env.NODE_ENV === 'development') {
    return process.env.NEXT_PUBLIC_DEV_URL || 'http://172.19.112.1:3000'
  }

  // Em produção (Vercel)
  if (process.env.NEXT_PUBLIC_VERCEL_URL) {
    return `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
  }

  // URL personalizada de produção
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL
  }

  // Fallback - no cliente usar origem atual, no servidor usar localhost
  if (typeof window !== 'undefined') {
    return window.location.origin
  }
  
  return 'http://localhost:3000'
}

export function getCallbackUrl(): string {
  return `${getRedirectUrl()}/auth/callback`
}

export function getDashboardUrl(): string {
  return `${getRedirectUrl()}/dashboard`
}