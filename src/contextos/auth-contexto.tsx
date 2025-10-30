'use client'

import { createContext, useContext, useEffect, useState, useCallback, ReactNode, useRef } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { createClient } from '@/servicos/supabase/auth-client'
import { atualizarUltimaAtividade } from '@/servicos/supabase/convites-simples'
import { clearAuthData } from '@/utilitarios/clear-auth-selective'
import { logger } from '@/utilitarios/logger'

// Cache em memória para workspace (30 minutos)
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
  slowLoading: boolean  // Indica se carregamento está demorando (cold start)
  signOut: () => Promise<void>
  refreshSession: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [workspace, setWorkspace] = useState<Workspace | null>(null)
  const [loading, setLoading] = useState(true)
  const [slowLoading, setSlowLoading] = useState(false)
  const [isClient, setIsClient] = useState(false)
  const lastActivityUpdate = useRef<number>(0)
  const workspaceCache = useRef<WorkspaceCache | null>(null)
  const slowLoadingTimer = useRef<NodeJS.Timeout | null>(null)

  // Função para atualizar atividade com throttling
  const trackUserActivity = useCallback(async (userId: string) => {
    const now = Date.now()
    const THIRTY_MINUTES = 30 * 60 * 1000 // 30 minutos em ms

    // Só atualizar se passaram mais de 30 minutos desde a última atualização
    if (now - lastActivityUpdate.current > THIRTY_MINUTES) {
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
      logger.warn('AuthProvider timeout após 30s - forçando loading = false')
      setLoading(false)
    }, 30000) // Aumentado de 10s para 30s
    
    // Função assíncrona para carregar sessão com tratamento robusto
    const loadInitialSession = async () => {
      try {
        // Tentar obter sessão
        const { data: { session }, error } = await supabase.auth.getSession()
        
        clearTimeout(timeoutId)
        
        // Se houver erro específico, tratar
        if (error) {
          // Erros de token são agora tratados silenciosamente no auth-client
          // mas vamos adicionar uma verificação adicional
          if (error.message?.includes('refresh_token') ||
              error.message?.includes('Invalid Refresh Token')) {
            logger.warn('Sessão inválida detectada - redirecionando para login')
            setLoading(false)
            window.location.replace('/auth/login')
            return
          }

          // Para outros erros, apenas logar e continuar
          logger.warn('Erro não crítico ao carregar sessão:', error.message)
        }
        
        // Processar sessão (pode ser null se não houver)
        setSession(session)
        setUser(session?.user ?? null)
        
        if (session?.user) {
          await loadWorkspace(session.user.id)
          await trackUserActivity(session.user.id)
        }
      } catch (error: any) {
        clearTimeout(timeoutId)

        // Tratamento de fallback para qualquer erro não capturado
        logger.warn('Erro ao inicializar auth:', error?.message || 'Erro desconhecido')

        // Se for erro de autenticação, limpar e redirecionar
        if (error?.message?.includes('auth') || 
            error?.message?.includes('token') ||
            error?.message?.includes('session')) {
          clearAuthData()
          // Pequeno delay para garantir limpeza
          setTimeout(() => {
            window.location.replace('/auth/login')
          }, 100)
        }
      } finally {
        // Sempre desabilitar loading ao final
        setLoading(false)
      }
    }
    
    // Executar carregamento inicial
    loadInitialSession()

    // Escutar mudanças de auth com timeout
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event: any, session: Session | null) => {
        try {
          setSession(session)
          setUser(session?.user ?? null)

          if (session?.user) {
            // Timeout de 10s para operações no onAuthStateChange
            const timeoutPromise = new Promise((_, reject) =>
              setTimeout(() => reject(new Error('Timeout em onAuthStateChange')), 10000)
            )

            const workspacePromise = loadWorkspace(session.user.id)
            const activityPromise = trackUserActivity(session.user.id)

            await Promise.race([
              Promise.all([workspacePromise, activityPromise]),
              timeoutPromise
            ])
          } else {
            setWorkspace(null)
          }
        } catch (error: any) {
          logger.warn('⚠️ Erro crítico em `onAuthStateChange`:', error?.message || 'Erro desconhecido')
          // Não travar a aplicação por erro no listener
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
      logger.warn('UserId inválido para carregar workspace:', userId)
      return
    }

    // Iniciar timer para detectar slow loading (cold start)
    slowLoadingTimer.current = setTimeout(() => {
      setSlowLoading(true)
      logger.info('⏳ Carregamento lento detectado - possível cold start do Supabase')
    }, 5000) // 5 segundos

    // Loop de tentativas com retry
    for (let attempt = 0; attempt < retries; attempt++) {
      try {

      // Verificar cache (30 minutos)
      const now = Date.now()
      const CACHE_DURATION = 30 * 60 * 1000 // 30 minutos

      if (workspaceCache.current?.userId === userId &&
          now - workspaceCache.current.timestamp < CACHE_DURATION) {
        // Workspace carregado do cache
        setWorkspace(workspaceCache.current.data)

        // Limpar timer de slow loading
        if (slowLoadingTimer.current) {
          clearTimeout(slowLoadingTimer.current)
          slowLoadingTimer.current = null
        }
        setSlowLoading(false)
        return
      }

      const supabase = createClient()
      
      // Carregando workspace para usuário
      
      // AbortController para timeout de 15 segundos (suporte cold start Supabase)
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 15000)

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
            logger.warn('Usuário não encontrado na base de dados:', userId)
            logger.warn('Fazendo logout e redirecionando...')

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
            logger.error('Erro ao carregar dados do usuário:', userError)
          }
          return
        }

        if (!userData?.workspace_id) {
          logger.warn('Workspace ID não encontrado para usuário:', userId)
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
            logger.error('Erro ao carregar workspace:', workspaceError)
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

          // Limpar timer de slow loading
          if (slowLoadingTimer.current) {
            clearTimeout(slowLoadingTimer.current)
            slowLoadingTimer.current = null
          }
          setSlowLoading(false)

          // Workspace carregado com sucesso
        } else {
          logger.warn('Workspace não encontrado para usuário:', userId)

          // Limpar timer mesmo em caso de erro
          if (slowLoadingTimer.current) {
            clearTimeout(slowLoadingTimer.current)
            slowLoadingTimer.current = null
          }
          setSlowLoading(false)
        }

      } catch (queryError: any) {
        clearTimeout(timeoutId)
        
        // Tratar timeout específico do AbortController
        if (queryError.name === 'AbortError') {
          logger.warn(`Timeout ao carregar workspace (15s) - tentativa ${attempt + 1}/${retries} - Aguardando resposta do servidor...`)

          // Se não for última tentativa, tentar novamente
          if (attempt < retries - 1) {
            const delay = Math.min(1000 * Math.pow(2, attempt), 5000) // Backoff exponencial
            // Tentando novamente com backoff exponencial
            await new Promise(resolve => setTimeout(resolve, delay))
            continue // Próxima tentativa
          }

          logger.warn('Timeout após todas as tentativas - continuando sem workspace')

          // Limpar timer de slow loading
          if (slowLoadingTimer.current) {
            clearTimeout(slowLoadingTimer.current)
            slowLoadingTimer.current = null
          }
          setSlowLoading(false)

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
          logger.error(`Erro ao carregar workspace após ${retries} tentativas:`, error)
        }

        // Limpar timer de slow loading em erro final
        if (slowLoadingTimer.current) {
          clearTimeout(slowLoadingTimer.current)
          slowLoadingTimer.current = null
        }
        setSlowLoading(false)
      } else {
        // Não é última tentativa - aguardar e tentar novamente
        const delay = Math.min(1000 * Math.pow(2, attempt), 5000)
        logger.warn(`Erro na tentativa ${attempt + 1}/${retries}. Tentando novamente em ${delay}ms...`)
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
      logger.error('Erro ao fazer logout:', error)
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
          logger.warn('Erro ao atualizar sessão - refresh token inválido')
          await signOut() // Fazer logout automático
          return
        }
        throw error
      }

      setSession(session)
      setUser(session?.user ?? null)
    } catch (error) {
      logger.error('Erro ao atualizar sessão:', error)
      // Em caso de erro crítico, fazer logout
      await signOut()
    }
  }, [signOut])

  // Detectar quando usuário volta à aba e verificar sessão
  useEffect(() => {
    if (!isClient) return

    const handleVisibilityChange = async () => {
      // Só agir quando a aba ficar visível novamente
      if (document.visibilityState !== 'visible') return

      const supabase = createClient()

      try {
        // Verificar sessão atual
        const { data: { session }, error } = await supabase.auth.getSession()

        if (error || !session) {
          logger.warn('Sessão inválida detectada ao retornar - fazendo logout')
          await signOut()
          return
        }

        // Verificar se sessão vai expirar em breve (menos de 5 minutos)
        const expiresAt = session.expires_at
        if (expiresAt) {
          const now = Math.floor(Date.now() / 1000)
          const timeUntilExpiry = expiresAt - now

          // Se sessão expira em menos de 5 minutos, fazer refresh
          if (timeUntilExpiry < 5 * 60) {
            logger.info('Sessão próxima de expirar - fazendo refresh automático')
            await refreshSession()
          }
        }

        // Verificar se workspace está no cache e ainda válido
        if (session.user && workspaceCache.current) {
          const now = Date.now()
          const CACHE_DURATION = 30 * 60 * 1000
          const cacheAge = now - workspaceCache.current.timestamp

          // Se cache expirou, limpar cache (será recarregado na próxima requisição)
          if (cacheAge >= CACHE_DURATION) {
            logger.info('Cache de workspace expirado - limpando para próxima requisição')
            workspaceCache.current = null
          }
        }

      } catch (error: any) {
        logger.warn('Erro ao verificar sessão ao retornar:', error?.message)
        // Não fazer nada crítico aqui - deixar usuário continuar usando
      }
    }

    // Adicionar listener
    document.addEventListener('visibilitychange', handleVisibilityChange)

    // Cleanup
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [isClient, signOut, refreshSession])

  return (
    <AuthContext.Provider value={{
      usuario: user,  // Alias para compatibilidade
      user,
      session,
      workspace,
      loading,
      slowLoading,
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