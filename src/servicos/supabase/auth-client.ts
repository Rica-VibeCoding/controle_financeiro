import { createBrowserClient } from '@supabase/ssr'

// Função para garantir URL válida (evitar malformação)
function getValidUrl() {
  // Usar variável de ambiente primeiro
  let url = process.env.NEXT_PUBLIC_SUPABASE_URL
  
  // Fallback para hardcoded se necessário
  if (!url || url.includes('ant_type') || !url.includes('.supabase.co')) {
    url = 'https://nzgifjdewdfibcopolof.supabase.co'
  }
  
  // Garantir que não há caracteres malformados
  url = url.replace(/\.ant_type.*$/, '.supabase.co')
  
  return url
}

function getValidKey() {
  return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im56Z2lmamRld2RmaWJjb3BvbG9mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc0NjA4NDAsImV4cCI6MjA2MzAzNjg0MH0.O7MKZNx_Cd-Z12iq8h0pq6Sq0bmJazcxDHvlVb4VJQc'
}

// Instância singleton do cliente
let clientInstance: ReturnType<typeof createBrowserClient> | null = null

// Cliente para componentes cliente usando @supabase/ssr
export function createClient() {
  // Retornar instância existente se já criada
  if (clientInstance) {
    return clientInstance
  }

  const url = getValidUrl()
  const key = getValidKey()
  
  // Validar se as funções existem antes de usar
  if (!url || !key) {
    throw new Error('Erro na configuração do Supabase - URL ou Key inválidos')
  }
  
  // Log apenas uma vez na primeira criação
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    console.log('🔧 AUTH CLIENT: Usando cliente @supabase/ssr unificado')
  }
  
  try {
    clientInstance = createBrowserClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    })
  } catch (error) {
    console.error('🚨 Erro ao criar cliente Supabase:', error)
    throw new Error('Falha na inicialização do cliente Supabase')
  }

  // Função auxiliar para limpar dados de auth
  const cleanupAuthData = () => {
    // Limpar storage
    const keysToRemove: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && (key.includes('supabase') || key.includes('sb-'))) {
        keysToRemove.push(key)
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key))
    
    // Limpar sessionStorage
    const sessionKeysToRemove: string[] = []
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i)
      if (key && (key.includes('supabase') || key.includes('sb-'))) {
        sessionKeysToRemove.push(key)
      }
    }
    sessionKeysToRemove.forEach(key => sessionStorage.removeItem(key))
    
    // Limpar cookies do Supabase
    const cookies = document.cookie.split(';')
    cookies.forEach(cookie => {
      const eqPos = cookie.indexOf('=')
      const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim()
      if (name.includes('supabase') || name.includes('sb-')) {
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;`
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${window.location.hostname};`
      }
    })
  }

  // Interceptar erros de refresh token e limpar storage automaticamente
  if (typeof window !== 'undefined') {
    // Interceptar getSession para tratar erros silenciosamente
    const originalGetSession = clientInstance.auth.getSession.bind(clientInstance.auth)
    clientInstance.auth.getSession = async () => {
      try {
        const result = await originalGetSession()
        
        // Se não há sessão mas há dados de auth no storage, limpar
        if (!result.data.session) {
          const hasAuthData = localStorage.getItem('supabase.auth.token') || 
                            sessionStorage.getItem('supabase.auth.token')
          if (hasAuthData) {
            console.warn('🧹 Sessão inválida detectada - limpando dados antigos')
            cleanupAuthData()
          }
        }
        
        return result
      } catch (error: any) {
        // Tratar erro de refresh token silenciosamente
        if (error.message?.includes('Invalid Refresh Token') || 
            error.message?.includes('Refresh Token Not Found') ||
            error.message?.includes('refresh_token')) {
          
          console.warn('🔄 Token inválido - fazendo limpeza silenciosa')
          cleanupAuthData()
          
          // Retornar sessão nula ao invés de lançar erro
          return { data: { session: null }, error: null }
        }
        // Para outros erros, propagar normalmente
        throw error
      }
    }
    
    // Interceptar refreshSession também
    const originalRefreshSession = clientInstance.auth.refreshSession.bind(clientInstance.auth)
    clientInstance.auth.refreshSession = async () => {
      try {
        const result = await originalRefreshSession()
        return result
      } catch (error: any) {
        // Se erro de refresh token, limpar e retornar sessão nula
        if (error.message?.includes('Invalid Refresh Token') || 
            error.message?.includes('Refresh Token Not Found') ||
            error.message?.includes('refresh_token')) {
          
          console.warn('🧹 Refresh token inválido - limpando e retornando sessão nula')
          cleanupAuthData()
          
          // Retornar sessão nula ao invés de lançar erro
          return { data: { session: null }, error: null }
        }
        throw error
      }
    }
  }

  return clientInstance
}

// Cliente legado para componentes que ainda não foram migrados
export const supabaseClient = createClient()