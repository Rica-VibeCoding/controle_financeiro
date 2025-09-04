'use client'

import { createContext, useContext, useEffect, useState, useCallback, ReactNode, useRef } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { createClient } from '@/servicos/supabase/auth-client'
import { atualizarUltimaAtividade } from '@/servicos/supabase/convites-simples'

// Definir Workspace inline para evitar dependências circulares
interface Workspace {
  id: string
  nome: string
  owner_id: string
  plano: 'free' | 'pro' | 'enterprise'
  ativo: boolean
  created_at: string
  updated_at: string
}

interface AuthContextType {
  usuario: User | null  // Alias para compatibilidade
  user: User | null
  session: Session | null
  workspace: Workspace | null
  loading: boolean
  signOut: () => Promise<void>
  refreshSession: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [workspace, setWorkspace] = useState<Workspace | null>(null)
  const [loading, setLoading] = useState(true)
  const [isClient, setIsClient] = useState(false)
  const lastActivityUpdate = useRef<number>(0)

  // Função para atualizar atividade com throttling
  const trackUserActivity = useCallback(async (userId: string) => {
    const now = Date.now()
    const FIVE_MINUTES = 5 * 60 * 1000 // 5 minutos em ms
    
    // Só atualizar se passaram mais de 5 minutos desde a última atualização
    if (now - lastActivityUpdate.current > FIVE_MINUTES) {
      lastActivityUpdate.current = now
      await atualizarUltimaAtividade(userId)
    }
  }, [])

  // Garantir que só executa no cliente para evitar problemas de hidratação
  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (!isClient) return

    const supabase = createClient()
    // Timeout de segurança reduzido - se não carregar em 5 segundos, força loading = false
    const timeoutId = setTimeout(() => {
      console.warn('⚠️ AuthProvider timeout - forçando loading = false')
      setLoading(false)
    }, 5000)
    
    // Carregar sessão inicial
    supabase.auth.getSession()
      .then(({ data: { session } }: { data: { session: Session | null } }) => {
        clearTimeout(timeoutId)
        setSession(session)
        setUser(session?.user ?? null)
        if (session?.user) {
          loadWorkspace(session.user.id).finally(() => setLoading(false))
          trackUserActivity(session.user.id)
        } else {
          setLoading(false)
        }
      })
      .catch((error: Error) => {
        clearTimeout(timeoutId)
        
        // Tratamento específico para erro de refresh token
        if (error.message?.includes('Invalid Refresh Token') || 
            error.message?.includes('Refresh Token Not Found')) {
          console.warn('🔄 Refresh token inválido - limpando storage e redirecionando')
          
          // Limpar todo o storage
          if (typeof window !== 'undefined') {
            localStorage.clear()
            sessionStorage.clear()
            
            // Limpar cookies relacionados ao Supabase
            const cookies = document.cookie.split(';')
            cookies.forEach(cookie => {
              const eqPos = cookie.indexOf('=')
              const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim()
              if (name.includes('supabase') || name.includes('sb-')) {
                document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;`
              }
            })
            
            // Redirecionar para login após limpeza
            setTimeout(() => {
              window.location.href = '/auth/login'
            }, 100)
          }
        } else {
          console.error('Erro ao carregar sessão:', error)
        }
        
        setLoading(false)
      })

    // Escutar mudanças de auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event: any, session: Session | null) => {
        setSession(session)
        setUser(session?.user ?? null)
        if (session?.user) {
          await loadWorkspace(session.user.id)
          await trackUserActivity(session.user.id)
        } else {
          setWorkspace(null)
        }
      }
    )

    return () => {
      clearTimeout(timeoutId)
      subscription.unsubscribe()
    }
  }, [isClient])

  const loadWorkspace = useCallback(async (userId: string) => {
    try {
      // Validar que o userId é um UUID válido
      if (!userId || userId.length !== 36) {
        console.warn('UserId inválido para carregar workspace:', userId)
        return
      }

      const supabase = createClient()
      
      if (process.env.NODE_ENV === 'development') {
        console.log('🔍 Carregando workspace para usuário:', userId)
      }
      
      const { data, error } = await supabase
        .from('fp_usuarios')
        .select(`
          workspace_id,
          fp_workspaces!inner (
            id,
            nome,
            owner_id,
            plano,
            ativo,
            created_at,
            updated_at
          )
        `)
        .eq('id', userId)
        .single()

      if (error) {
        // Códigos de erro que devem ser silenciados
        const silentErrors = ['42P01', 'PGRST116', 'PGRST301']
        
        // Se erro 406 (Not Acceptable), pode ser usuário inválido
        if (error.message?.includes('406') || error.message?.includes('Not Acceptable')) {
          console.warn('❌ Usuário não encontrado na base de dados:', userId)
          console.warn('💡 Fazendo logout e redirecionando...')
          
          // Fazer logout completo via Supabase
          const supabase = createClient()
          await supabase.auth.signOut()
          
          // Limpar caches
          localStorage.clear()
          sessionStorage.clear()
          
          // Usar replace para evitar loops de redirect
          window.location.replace('/auth/login')
          return
        }
        
        if (!silentErrors.includes(error.code || '')) {
          console.error('Erro ao carregar workspace:', error)
        }
        return
      }

      if (data?.fp_workspaces && !Array.isArray(data.fp_workspaces)) {
        setWorkspace(data.fp_workspaces as Workspace)
        
        if (process.env.NODE_ENV === 'development') {
          console.log('✅ Workspace carregado:', data.fp_workspaces.nome)
        }
      } else {
        console.warn('❌ Workspace não encontrado para usuário:', userId)
      }
    } catch (error: any) {
      // Silenciar erros de tabela inexistente completamente
      const silentCodes = ['42P01', 'PGRST116', 'PGRST301']
      if (!silentCodes.includes(error?.code)) {
        console.error('Erro ao carregar workspace:', error)
      }
    }
  }, [])

  const signOut = useCallback(async () => {
    try {
      // Limpar estado imediatamente para evitar race conditions
      setUser(null)
      setSession(null)
      setWorkspace(null)
      setLoading(true)
      
      const supabase = createClient()
      await supabase.auth.signOut()
      
      // Limpar storage
      if (typeof window !== 'undefined') {
        localStorage.clear()
        sessionStorage.clear()
      }
      
      // Redirect imediato sem setTimeout
      window.location.replace('/auth/login')
    } catch (error) {
      console.error('Erro ao fazer logout:', error)
      // Em caso de erro, ainda assim redirecionar
      window.location.replace('/auth/login')
    }
  }, [])

  const refreshSession = useCallback(async () => {
    try {
      const supabase = createClient()
      const { data: { session }, error } = await supabase.auth.refreshSession()
      
      if (error) {
        // Tratar especificamente erros de refresh token
        if (error.message?.includes('Invalid Refresh Token') || 
            error.message?.includes('Refresh Token Not Found')) {
          console.warn('🔄 Erro ao atualizar sessão - refresh token inválido')
          await signOut() // Fazer logout automático
          return
        }
        throw error
      }
      
      setSession(session)
      setUser(session?.user ?? null)
    } catch (error) {
      console.error('Erro ao atualizar sessão:', error)
      // Em caso de erro crítico, fazer logout
      await signOut()
    }
  }, [])

  return (
    <AuthContext.Provider value={{
      usuario: user,  // Alias para compatibilidade
      user,
      session,
      workspace,
      loading,
      signOut,
      refreshSession
    }}>
      {/* Renderização condicional para evitar hidratação mismatch */}
      {isClient ? children : <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Carregando...</div>
      </div>}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider')
  }
  // Alias para compatibilidade
  return {
    ...context,
    usuario: context.user
  }
}