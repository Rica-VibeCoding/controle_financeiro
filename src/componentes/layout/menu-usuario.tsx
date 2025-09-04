'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useAuth } from '@/contextos/auth-contexto'
import { Button } from '@/componentes/ui/button'
import { Icone } from '@/componentes/ui/icone'
import { useRouter } from 'next/navigation'

export function MenuUsuario() {
  const { user, workspace, signOut } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  
  // Verificar se usuário é owner do workspace
  const isOwner = workspace?.owner_id === user?.id
  const userRole = isOwner ? 'Proprietário' : 'Membro'

  // Função otimizada para fechar menu ao clicar fora
  const handleClickOutside = useCallback((event: MouseEvent) => {
    if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
      setIsOpen(false)
    }
  }, [])

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, handleClickOutside])

  // Função para obter iniciais do nome
  const getInitials = (name: string): string => {
    if (!name) return 'U'
    const names = name.split(' ')
    if (names.length === 1) {
      return names[0].charAt(0).toUpperCase()
    }
    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase()
  }

  const handleLogout = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    // Prevenir múltiplos cliques
    if (e.currentTarget.getAttribute('data-logging-out') === 'true') {
      return
    }
    
    e.currentTarget.setAttribute('data-logging-out', 'true')
    setIsOpen(false)
    
    try {
      await signOut()
    } catch (error) {
      console.error('Erro ao fazer logout:', error)
      // Fallback direto (sem router para evitar race conditions)
      window.location.replace('/auth/login')
    }
  }, [signOut])

  const handleConfiguracoes = useCallback(() => {
    setIsOpen(false)
    router.push('/configuracoes')
  }, [router])
  
  const handleGerenciarEquipe = useCallback(() => {
    setIsOpen(false)
    router.push('/configuracoes/usuarios')
  }, [router])

  // Obter nome do usuário (email ou metadata)
  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Usuário'
  const userEmail = user?.email || ''
  const workspaceName = workspace?.nome || 'Workspace'

  return (
    <div className="relative" ref={menuRef}>
      <Button
        variant="ghost"
        size="icon"
        className="relative"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <div className="w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
          {getInitials(userName)}
        </div>
        <span className="sr-only">Menu do usuário</span>
      </Button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-72 bg-white border border-gray-200 rounded-lg shadow-lg z-50 animate-in slide-in-from-top-2 duration-200">
          {/* Header do Menu */}
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                {getInitials(userName)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {userName}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {userEmail}
                </p>
              </div>
            </div>
          </div>

          {/* Workspace Info */}
          <div className="px-4 py-2 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <Icone name="building" className="w-3 h-3" />
                <span className="truncate">{workspaceName}</span>
              </div>
              <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                {userRole}
              </span>
            </div>
          </div>

          {/* Menu Items */}
          <div className="py-1">
            <button
              onClick={handleConfiguracoes}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
            >
              <Icone name="settings" className="w-4 h-4" />
              Configurações
            </button>
            
            {/* Gerenciar Equipe - apenas para owners */}
            {isOwner && (
              <button
                onClick={handleGerenciarEquipe}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
              >
                <Icone name="users" className="w-4 h-4" />
                Gerenciar Equipe
              </button>
            )}
            
            <div className="border-t border-gray-100 my-1" />
            
            <button
              onClick={handleLogout}
              className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
            >
              <Icone name="log-out" className="w-4 h-4" />
              Sair
            </button>
          </div>

        </div>
      )}
    </div>
  )
}