/**
 * Hook para gerenciar permissões granulares de usuários
 * Integra com o sistema de auth existente e service de permissões
 */

'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useAuth } from '@/contextos/auth-contexto'
import { 
  buscarPermissoesUsuario, 
  verificarPermissaoUsuario,
  atualizarPermissoesUsuario,
  verificarMultiplasPermissoes
} from '@/servicos/supabase/permissoes-service'
import type { 
  PermissoesUsuario, 
  TipoPermissao, 
  ResultadoPermissoes, 
  ContextoPermissoes 
} from '@/tipos/permissoes'
import { PERMISSOES_PADRAO_OWNER, PERMISSOES_PADRAO_MEMBER } from '@/tipos/permissoes'

interface UsarPermissoesReturn extends ContextoPermissoes {
  /** Estado de carregamento das permissões */
  loading: boolean
  
  /** Erro na operação de permissões */
  error: string | null
  
  /** Recarregar permissões do usuário */
  recarregarPermissoes: () => Promise<void>
  
  /** Verificar múltiplas permissões de uma vez */
  verificarMultiplasPermissoes: (permissoes: TipoPermissao[]) => Promise<Record<TipoPermissao, boolean>>
  
  /** Cache de verificações recentes para otimização */
  cachePermissoes: Record<TipoPermissao, boolean>
}

/**
 * Hook principal para gerenciar permissões granulares
 * Integra com o AuthContext existente e mantém compatibilidade
 */
export function usePermissoes(): UsarPermissoesReturn {
  const { user, workspace, loading: authLoading } = useAuth()
  const [permissoesUsuario, setPermissoesUsuario] = useState<PermissoesUsuario | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [cachePermissoes, setCachePermissoes] = useState<Record<TipoPermissao, boolean>>({} as any)

  // Verificar se usuário atual é owner
  const isOwner = useMemo(() => {
    if (!user || !workspace) return false
    return workspace.owner_id === user.id
  }, [user, workspace])

  /**
   * Carregar permissões do usuário atual
   */
  const carregarPermissoesUsuario = useCallback(async () => {
    if (!user || !workspace) {
      setPermissoesUsuario(null)
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const permissoes = await buscarPermissoesUsuario(user.id, workspace.id)
      
      if (!permissoes) {
        // Se não conseguiu carregar, usar padrão baseado no role
        const permissoesPadrao = isOwner ? PERMISSOES_PADRAO_OWNER : PERMISSOES_PADRAO_MEMBER
        setPermissoesUsuario(permissoesPadrao)
      } else {
        setPermissoesUsuario(permissoes)
      }

    } catch (err: any) {
      console.error('Erro ao carregar permissões:', err)
      setError(err.message || 'Erro ao carregar permissões')
      
      // Em caso de erro, usar padrão baseado no role
      const permissoesPadrao = isOwner ? PERMISSOES_PADRAO_OWNER : PERMISSOES_PADRAO_MEMBER
      setPermissoesUsuario(permissoesPadrao)
      
    } finally {
      setLoading(false)
    }
  }, [user, workspace, isOwner])

  /**
   * Verificar se usuário tem uma permissão específica
   */
  const verificarPermissao = useCallback((permissao: TipoPermissao): boolean => {
    // Se ainda está carregando auth, negar acesso
    if (authLoading || loading) return false
    
    // Se não tem usuário/workspace, negar acesso
    if (!user || !workspace) return false
    
    // OWNERs sempre têm todas as permissões
    if (isOwner) return true
    
    // Para MEMBERs, verificar permissões carregadas
    if (!permissoesUsuario) return false
    
    return permissoesUsuario[permissao] === true
  }, [authLoading, loading, user, workspace, isOwner, permissoesUsuario])

  /**
   * Atualizar permissões de outro usuário (apenas owners)
   */
  const atualizarPermissoes = useCallback(async (
    usuarioId: string, 
    novasPermissoes: PermissoesUsuario
  ): Promise<ResultadoPermissoes> => {
    if (!user || !workspace) {
      return {
        success: false,
        error: 'Usuário não autenticado ou workspace não carregado'
      }
    }

    if (!isOwner) {
      return {
        success: false,
        error: 'Apenas proprietários podem alterar permissões'
      }
    }

    try {
      const resultado = await atualizarPermissoesUsuario(
        usuarioId,
        workspace.id,
        novasPermissoes
      )

      return resultado

    } catch (err: any) {
      return {
        success: false,
        error: err.message || 'Erro ao atualizar permissões'
      }
    }
  }, [user, workspace, isOwner])

  /**
   * Verificar múltiplas permissões de uma vez (otimização)
   */
  const verificarMultiplasPermissoesCallback = useCallback(async (
    permissoes: TipoPermissao[]
  ): Promise<Record<TipoPermissao, boolean>> => {
    if (!user || !workspace) {
      return permissoes.reduce((acc, perm) => {
        acc[perm] = false
        return acc
      }, {} as Record<TipoPermissao, boolean>)
    }

    // Se é OWNER, todas as permissões são true
    if (isOwner) {
      return permissoes.reduce((acc, perm) => {
        acc[perm] = true
        return acc
      }, {} as Record<TipoPermissao, boolean>)
    }

    try {
      const resultado = await verificarMultiplasPermissoes(
        user.id,
        workspace.id,
        permissoes
      )

      // Atualizar cache local
      setCachePermissoes(prev => ({ ...prev, ...resultado }))

      return resultado

    } catch (error) {
      console.error('Erro ao verificar múltiplas permissões:', error)
      return permissoes.reduce((acc, perm) => {
        acc[perm] = false
        return acc
      }, {} as Record<TipoPermissao, boolean>)
    }
  }, [user, workspace, isOwner])

  /**
   * Recarregar permissões do usuário
   */
  const recarregarPermissoes = useCallback(async () => {
    await carregarPermissoesUsuario()
    setCachePermissoes({} as any) // Limpar cache
  }, [carregarPermissoesUsuario])

  // Efeito para carregar permissões quando auth estiver pronto
  useEffect(() => {
    if (!authLoading && user && workspace) {
      carregarPermissoesUsuario()
    }
  }, [authLoading, user, workspace, carregarPermissoesUsuario])

  // Limpar estado quando usuário faz logout
  useEffect(() => {
    if (!user) {
      setPermissoesUsuario(null)
      setCachePermissoes({} as any)
      setError(null)
      setLoading(false)
    }
  }, [user])

  return {
    // ContextoPermissoes interface
    verificarPermissao,
    isOwner,
    permissoesUsuario,
    atualizarPermissoes,
    
    // Extras específicos do hook
    loading,
    error,
    recarregarPermissoes,
    verificarMultiplasPermissoes: verificarMultiplasPermissoesCallback,
    cachePermissoes
  }
}

/**
 * Hook simplificado apenas para verificação de permissões
 * Para componentes que só precisam verificar acesso
 */
export function useVerificarPermissao(permissao: TipoPermissao): boolean {
  const { verificarPermissao } = usePermissoes()
  return verificarPermissao(permissao)
}

/**
 * Hook para verificar múltiplas permissões
 * Para componentes que precisam verificar várias permissões
 */
export function useVerificarMultiplasPermissoes(permissoes: TipoPermissao[]): Record<TipoPermissao, boolean> {
  const { verificarPermissao } = usePermissoes()
  
  return useMemo(() => {
    return permissoes.reduce((acc, perm) => {
      acc[perm] = verificarPermissao(perm)
      return acc
    }, {} as Record<TipoPermissao, boolean>)
  }, [permissoes, verificarPermissao])
}

/**
 * Hook apenas para owners
 * Para páginas/componentes que só owners devem acessar
 */
export function useOwnerOnly(): { isOwner: boolean; loading: boolean } {
  const { isOwner, loading } = usePermissoes()
  
  return { isOwner, loading }
}