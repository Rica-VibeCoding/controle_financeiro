/**
 * Utilitário para limpeza seletiva de dados de autenticação
 * Substitui localStorage.clear() agressivo por limpeza específica
 */

/**
 * Limpa apenas dados relacionados à autenticação Supabase
 * Preserva outros dados do usuário no localStorage
 */
export function clearSupabaseAuth(): void {
  if (typeof window === 'undefined') return

  // Chaves específicas do Supabase a serem removidas
  const supabaseKeys = [
    // Chaves padrão do Supabase Auth
    'supabase.auth.token',
    'sb-nzgifjdewdfibcopolof-auth-token',
    'sb-auth-token',
    'supabase.auth.token.expires',
    'supabase.auth.refresh_token',
    'supabase.auth.user',
    
    // Chaves específicas do projeto
    'workspace-cache',
    'user-preferences',
    'auth-state'
  ]

  // Limpar localStorage seletivamente
  supabaseKeys.forEach(key => {
    localStorage.removeItem(key)
  })

  // Limpar todas as chaves que começam com 'sb-' ou 'supabase' ou contém 'auth'
  const allKeys: string[] = []
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key) allKeys.push(key)
  }
  
  allKeys.forEach(key => {
    if (key.startsWith('sb-') || 
        key.startsWith('supabase') || 
        key.includes('auth-token') ||
        key.includes('refresh_token') ||
        key.includes('auth.token')) {
      localStorage.removeItem(key)
    }
  })

  // Limpar sessionStorage de forma similar
  const sessionAllKeys: string[] = []
  for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i)
    if (key) sessionAllKeys.push(key)
  }
  
  sessionAllKeys.forEach(key => {
    if (key.startsWith('sb-') || 
        key.startsWith('supabase') || 
        key.includes('auth-token') ||
        key.includes('refresh_token') ||
        key.includes('auth.token')) {
      sessionStorage.removeItem(key)
    }
  })
}

/**
 * Limpa cookies relacionados ao Supabase
 */
export function clearSupabaseCookies(): void {
  if (typeof window === 'undefined') return

  const cookies = document.cookie.split(';')
  
  cookies.forEach(cookie => {
    const eqPos = cookie.indexOf('=')
    const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim()
    
    // Limpar apenas cookies relacionados ao Supabase
    if (name.includes('supabase') || 
        name.includes('sb-') || 
        name.includes('auth-token')) {
      // Definir cookie como expirado para removê-lo
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;`
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${window.location.hostname};`
    }
  })
}

/**
 * Limpeza completa de autenticação (storage + cookies)
 * Substitui a limpeza agressiva por limpeza seletiva
 */
export function clearAuthData(): void {
  clearSupabaseAuth()
  clearSupabaseCookies()
}