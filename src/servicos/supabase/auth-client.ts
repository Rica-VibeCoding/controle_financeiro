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
  
  // Log apenas uma vez na primeira criação
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    console.log('🔧 AUTH CLIENT: Usando cliente @supabase/ssr unificado')
  }
  
  clientInstance = createBrowserClient(url, key, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  })

  // Interceptar erros de refresh token e limpar storage automaticamente
  if (typeof window !== 'undefined') {
    const originalRequest = clientInstance.auth.refreshSession.bind(clientInstance.auth)
    
    clientInstance.auth.refreshSession = async () => {
      try {
        return await originalRequest()
      } catch (error: any) {
        // Se erro de refresh token, limpar tudo
        if (error.message?.includes('Invalid Refresh Token') || 
            error.message?.includes('Refresh Token Not Found')) {
          
          console.warn('🧹 Limpeza automática: refresh token inválido detectado')
          
          // Limpar storage completamente
          localStorage.clear()
          sessionStorage.clear()
          
          // Limpar cookies do Supabase
          const cookies = document.cookie.split(';')
          cookies.forEach(cookie => {
            const eqPos = cookie.indexOf('=')
            const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim()
            if (name.includes('supabase') || name.includes('sb-')) {
              document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;`
            }
          })
        }
        throw error
      }
    }
  }

  return clientInstance
}

// Cliente legado para componentes que ainda não foram migrados
export const supabaseClient = createClient()