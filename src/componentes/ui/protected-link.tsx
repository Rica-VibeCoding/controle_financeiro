'use client'

import React from 'react'
import { usePermissoes, useVerificarPermissao } from '@/hooks/usar-permissoes'
import type { TipoPermissao } from '@/tipos/permissoes'

interface ProtectedLinkProps {
  /** Permissão necessária para mostrar o conteúdo */
  permissaoNecessaria: TipoPermissao
  
  /** Conteúdo a ser mostrado se tiver permissão */
  children: React.ReactNode
  
  /** Conteúdo alternativo se não tiver permissão (opcional) */
  fallback?: React.ReactNode
  
  /** Se true, sempre mostra para OWNERs independente da permissão */
  sempreParaOwners?: boolean
}

/**
 * Componente que protege links/conteúdo baseado em permissões do usuário
 * Esconde automaticamente se o usuário não tiver a permissão necessária
 */
export function ProtectedLink({ 
  permissaoNecessaria, 
  children, 
  fallback = null,
  sempreParaOwners = true
}: ProtectedLinkProps) {
  const { isOwner } = usePermissoes()
  const temPermissao = useVerificarPermissao(permissaoNecessaria)
  
  // Se é owner e sempreParaOwners é true, sempre mostrar
  if (sempreParaOwners && isOwner) {
    return <>{children}</>
  }
  
  // Se tem permissão específica, mostrar
  if (temPermissao) {
    return <>{children}</>
  }
  
  // Se não tem permissão, mostrar fallback (geralmente null)
  return <>{fallback}</>
}

/**
 * Hook simplificado para verificar se deve mostrar um elemento
 * Para casos onde não precisa do componente wrapper
 */
export function useDeveExibir(permissaoNecessaria: TipoPermissao, sempreParaOwners: boolean = true): boolean {
  const { isOwner } = usePermissoes()
  const temPermissao = useVerificarPermissao(permissaoNecessaria)
  
  if (sempreParaOwners && isOwner) {
    return true
  }
  
  return temPermissao
}

/**
 * Versão mais específica do ProtectedLink para itens de navegação
 * Adiciona algumas otimizações para menus
 */
interface ProtectedNavItemProps extends ProtectedLinkProps {
  /** Se true, não renderiza nada no DOM quando não tem permissão */
  esconderCompletamente?: boolean
}

export function ProtectedNavItem({ 
  esconderCompletamente = true,
  ...props 
}: ProtectedNavItemProps) {
  const { isOwner } = usePermissoes()
  const temPermissao = useVerificarPermissao(props.permissaoNecessaria)
  
  // Se é owner e sempreParaOwners é true, sempre mostrar
  if (props.sempreParaOwners !== false && isOwner) {
    return <>{props.children}</>
  }
  
  // Se tem permissão específica, mostrar
  if (temPermissao) {
    return <>{props.children}</>
  }
  
  // Se deve esconder completamente, não renderizar nada
  if (esconderCompletamente) {
    return null
  }
  
  // Senão, mostrar fallback
  return <>{props.fallback}</>
}

/**
 * Componente para proteger seções inteiras baseado em múltiplas permissões
 */
interface ProtectedSectionProps {
  /** Lista de permissões - usuário precisa ter pelo menos uma */
  permissoesNecessarias: TipoPermissao[]
  
  /** Se true, usuário precisa ter TODAS as permissões */
  requererTodas?: boolean
  
  /** Conteúdo protegido */
  children: React.ReactNode
  
  /** Conteúdo alternativo */
  fallback?: React.ReactNode
  
  /** Se true, sempre mostra para OWNERs */
  sempreParaOwners?: boolean
}

export function ProtectedSection({ 
  permissoesNecessarias, 
  requererTodas = false,
  children, 
  fallback = null,
  sempreParaOwners = true
}: ProtectedSectionProps) {
  const { isOwner, verificarPermissao } = usePermissoes()
  
  // Se é owner e sempreParaOwners é true, sempre mostrar
  if (sempreParaOwners && isOwner) {
    return <>{children}</>
  }
  
  // Verificar permissões
  const temPermissao = requererTodas
    ? permissoesNecessarias.every(p => verificarPermissao(p))
    : permissoesNecessarias.some(p => verificarPermissao(p))
  
  if (temPermissao) {
    return <>{children}</>
  }
  
  return <>{fallback}</>
}