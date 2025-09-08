'use client'

import { createContext, useContext, useEffect, useState, useCallback, ReactNode, useRef } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { createClient } from '@/servicos/supabase/auth-client'
import { atualizarUltimaAtividade } from '@/servicos/supabase/convites-simples'
import { clearAuthData } from '@/utilitarios/clear-auth-selective'

// Cache em memória para workspace (5 minutos)
interface WorkspaceCache {
  data: Workspace | null
  timestamp: number
  userId: string
}

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
  const workspaceCache = useRef<WorkspaceCache | null>(null)

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
    // Timeout aumentado para 30 segundos - sistema demora ~10s para carregar chunks
    const timeoutId = setTimeout(() => {
      console.warn('⚠️ AuthProvider timeout após 30s - forçando loading = false')
      setLoading(false)
    }, 30000) // Aumentado de 10s para 30s
    
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
          
          // Limpar apenas dados de auth (seletivo)
          clearAuthData()
          
          // Redirecionar para login após limpeza
          setTimeout(() => {
            window.location.href = '/auth/login'
          }, 100)
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

  const loadWorkspace = useCallback(async (userId: string, retries = 3) => {
    // Validar que o userId é um UUID válido
    if (!userId || userId.length !== 36) {
      console.warn('UserId inválido para carregar workspace:', userId)
      return
    }
    
    // Loop de tentativas com retry
    for (let attempt = 0; attempt < retries; attempt++) {
      try {

      // Verificar cache (5 minutos)
      const now = Date.now()
      const CACHE_DURATION = 5 * 60 * 1000 // 5 minutos
      
      if (workspaceCache.current?.userId === userId && 
          now - workspaceCache.current.timestamp < CACHE_DURATION) {
        if (process.env.NODE_ENV === 'development') {
          console.log('🚀 Workspace carregado do cache')
        }
        setWorkspace(workspaceCache.current.data)
        return
      }

      const supabase = createClient()
      
      if (process.env.NODE_ENV === 'development') {
        console.log('🔍 Carregando workspace para usuário:', userId)
      }
      
      // AbortController para timeout de 5 segundos (aumentado de 3s)
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000)

      try {
        // Query 1: Buscar workspace_id do usuário
        const userQuery = supabase
          .from('fp_usuarios')
          .select('workspace_id')
          .eq('id', userId)
          .abortSignal(controller.signal)
          .single()

        const { data: userData, error: userError } = await userQuery

        if (userError) {
          clearTimeout(timeoutId)
          
          // Códigos de erro que devem ser silenciados
          const silentErrors = ['42P01', 'PGRST116', 'PGRST301']
          
          // Se erro 406 (Not Acceptable), pode ser usuário inválido
          if (userError.message?.includes('406') || userError.message?.includes('Not Acceptable')) {
            console.warn('❌ Usuário não encontrado na base de dados:', userId)
            console.warn('💡 Fazendo logout e redirecionando...')
            
            // Fazer logout completo via Supabase
            const supabase = createClient()
            await supabase.auth.signOut()
            
            // Limpar apenas dados de auth (seletivo)
            clearAuthData()
            
            // Usar replace para evitar loops de redirect
            window.location.replace('/auth/login')
            return
          }
          
          if (!silentErrors.includes(userError.code || '')) {
            console.error('Erro ao carregar dados do usuário:', userError)
          }
          return
        }

        if (!userData?.workspace_id) {
          console.warn('❌ Workspace ID não encontrado para usuário:', userId)
          clearTimeout(timeoutId)
          return
        }

        // Query 2: Buscar dados do workspace
        const workspaceQuery = supabase
          .from('fp_workspaces')
          .select('id, nome, owner_id, plano, ativo, created_at, updated_at')
          .eq('id', userData.workspace_id)
          .abortSignal(controller.signal)
          .single()

        const { data: workspaceData, error: workspaceError } = await workspaceQuery

        clearTimeout(timeoutId)

        if (workspaceError) {
          const silentErrors = ['42P01', 'PGRST116', 'PGRST301']
          
          if (!silentErrors.includes(workspaceError.code || '')) {
            console.error('Erro ao carregar workspace:', workspaceError)
          }
          return
        }

        if (workspaceData) {
          const workspace = workspaceData as Workspace
          setWorkspace(workspace)
          
          // Atualizar cache
          workspaceCache.current = {
            data: workspace,
            timestamp: now,
            userId
          }
          
          if (process.env.NODE_ENV === 'development') {
            console.log('✅ Workspace carregado:', workspace.nome)
          }
        } else {
          console.warn('❌ Workspace não encontrado para usuário:', userId)
        }

      } catch (queryError: any) {
        clearTimeout(timeoutId)
        
        // Tratar timeout específico do AbortController
        if (queryError.name === 'AbortError') {
          console.warn(`⏱️ Timeout ao carregar workspace (5s) - tentativa ${attempt + 1}/${retries}`)
          
          // Se não for última tentativa, tentar novamente
          if (attempt < retries - 1) {
            const delay = Math.min(1000 * Math.pow(2, attempt), 5000) // Backoff exponencial
            console.log(`🔄 Tentando novamente em ${delay}ms...`)
            await new Promise(resolve => setTimeout(resolve, delay))
            continue // Próxima tentativa
          }
          
          console.warn('❌ Timeout após todas as tentativas - continuando sem workspace')
          return
        }
        
        throw queryError
      }
      
      // Se chegou aqui, sucesso - sair do loop
      return
      
    } catch (error: any) {
      // Se for última tentativa, logar erro
      if (attempt === retries - 1) {
        // Silenciar erros de tabela inexistente completamente
        const silentCodes = ['42P01', 'PGRST116', 'PGRST301']
        if (!silentCodes.includes(error?.code)) {
          console.error(`Erro ao carregar workspace após ${retries} tentativas:`, error)
        }
      } else {
        // Não é última tentativa - aguardar e tentar novamente
        const delay = Math.min(1000 * Math.pow(2, attempt), 5000)
        console.warn(`🔄 Erro na tentativa ${attempt + 1}/${retries}. Tentando novamente em ${delay}ms...`)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
    } // Fim do loop for
  }, [])

  const signOut = useCallback(async () => {
    try {
      // Limpar estado imediatamente para evitar race conditions
      setUser(null)
      setSession(null)
      setWorkspace(null)
      setLoading(true)
      
      // Limpar cache do workspace
      workspaceCache.current = null
      
      const supabase = createClient()
      await supabase.auth.signOut()
      
      // Limpar apenas dados de auth (seletivo)
      clearAuthData()
      
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