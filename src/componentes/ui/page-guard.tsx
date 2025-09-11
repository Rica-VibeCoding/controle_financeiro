'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { usePermissoes } from '@/hooks/usar-permissoes'
import type { TipoPermissao } from '@/tipos/permissoes'
import { Icone } from '@/componentes/ui/icone'

interface PageGuardProps {
  /** Permissão necessária para acessar a página */
  permissaoNecessaria: TipoPermissao
  
  /** Conteúdo da página protegida */
  children: React.ReactNode
  
  /** Página para redirecionar se não tiver permissão */
  redirecionarPara?: string
  
  /** Se true, mostra mensagem de erro ao invés de redirecionar */
  mostrarErro?: boolean
}

/**
 * Componente que protege páginas inteiras baseado em permissões
 * Usado como wrapper nas páginas que precisam de proteção
 */
export function PageGuard({ 
  permissaoNecessaria, 
  children, 
  redirecionarPara = '/dashboard',
  mostrarErro = false 
}: PageGuardProps) {
  const { isOwner, verificarPermissao, loading } = usePermissoes()
  const router = useRouter()
  const [verificando, setVerificando] = useState(true)
  
  useEffect(() => {
    // Aguardar carregamento das permissões
    if (loading) return
    
    // OWNERs sempre têm acesso
    if (isOwner) {
      setVerificando(false)
      return
    }
    
    // Verificar permissão específica
    const temPermissao = verificarPermissao(permissaoNecessaria)
    
    if (!temPermissao) {
      if (mostrarErro) {
        setVerificando(false)
        return
      }
      
      // Redirecionar para página permitida
      router.replace(redirecionarPara)
      return
    }
    
    setVerificando(false)
  }, [loading, isOwner, verificarPermissao, permissaoNecessaria, router, redirecionarPara, mostrarErro])
  
  // Mostrar loading enquanto verifica
  if (loading || verificando) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Icone name="loader-2" className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-500" />
          <p className="text-gray-600">Verificando permissões...</p>
        </div>
      </div>
    )
  }
  
  // Se chegou aqui sem redirecionar e mostrarErro é true, usuário não tem permissão
  if (mostrarErro && !isOwner && !verificarPermissao(permissaoNecessaria)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <div className="bg-white rounded-lg shadow-sm border p-8">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Icone name="alert-triangle" className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Acesso Negado
            </h2>
            <p className="text-gray-600 mb-6">
              Você não possui permissão para acessar esta página. 
              Entre em contato com o administrador do workspace.
            </p>
            <button
              onClick={() => router.back()}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Icone name="chevron-left" className="w-4 h-4" />
              Voltar
            </button>
          </div>
        </div>
      </div>
    )
  }
  
  // Usuário tem permissão, mostrar conteúdo
  return <>{children}</>
}

/**
 * Hook para usar dentro de páginas para verificar permissão
 */
export function usePageGuard(permissaoNecessaria: TipoPermissao) {
  const { isOwner, verificarPermissao, loading } = usePermissoes()
  
  const temAcesso = loading ? false : (isOwner || verificarPermissao(permissaoNecessaria))
  const verificando = loading
  
  return {
    temAcesso,
    verificando,
    isOwner
  }
}