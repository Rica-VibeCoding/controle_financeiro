/**
 * Utilitário para limpar completamente o estado de autenticação
 * Usado quando há problemas de refresh token corrompido
 */

export function clearAuthState() {
  if (typeof window === 'undefined') return

  console.log('🧹 Limpando estado de autenticação...')

  try {
    // 1. Limpar localStorage
    localStorage.clear()
    
    // 2. Limpar sessionStorage
    sessionStorage.clear()
    
    // 3. Limpar todos os cookies
    const cookies = document.cookie.split(';')
    cookies.forEach(cookie => {
      const eqPos = cookie.indexOf('=')
      const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim()
      
      // Limpar todos os cookies, não apenas do Supabase
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${window.location.hostname}`
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;`
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=.${window.location.hostname}`
    })
    
    // 4. Limpar dados específicos do Supabase que podem estar em outros locais
    const keysToRemove = [
      'supabase.auth.token',
      'sb-auth-token',
      'supabase-auth-token',
      'supabase_auth_token'
    ]
    
    keysToRemove.forEach(key => {
      try {
        localStorage.removeItem(key)
        sessionStorage.removeItem(key)
      } catch (e) {
        // Ignorar erros
      }
    })

    console.log('✅ Estado de autenticação limpo')
    
    return true
  } catch (error) {
    console.error('❌ Erro ao limpar estado:', error)
    return false
  }
}

export function redirectToLogin() {
  if (typeof window === 'undefined') return
  
  console.log('🔄 Redirecionando para login...')
  
  // Usar replace para evitar voltar na história
  window.location.replace('/auth/login')
}

export function clearAndRedirect() {
  clearAuthState()
  
  // Aguardar um pouco para garantir que a limpeza foi feita
  setTimeout(() => {
    redirectToLogin()
  }, 100)
}