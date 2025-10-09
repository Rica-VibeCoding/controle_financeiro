'use client'

// Forçar renderização dinâmica para todas as páginas protegidas
export const dynamic = 'force-dynamic'

import { useAuth } from '@/contextos/auth-contexto'
import { LayoutPrincipal } from '@/componentes/layout/layout-principal'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

interface ProtectedLayoutProps {
  children: React.ReactNode
}

function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Skeleton */}
      <div className="h-16 bg-white border-b border-gray-200 shadow-sm">
        <div className="flex items-center justify-between px-4 h-full">
          <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
          <div className="h-8 w-32 bg-gray-200 rounded animate-pulse" />
        </div>
      </div>
      
      {/* Content Skeleton */}
      <div className="flex">
        {/* Sidebar Skeleton */}
        <div className="hidden lg:block w-64 bg-white border-r border-gray-200 p-4">
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-10 bg-gray-200 rounded animate-pulse" />
            ))}
          </div>
        </div>
        
        {/* Main Content Skeleton */}
        <div className="flex-1 p-6">
          <div className="space-y-4">
            <div className="h-8 w-64 bg-gray-200 rounded animate-pulse" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded-lg animate-pulse" />
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="h-64 bg-gray-200 rounded-lg animate-pulse" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ProtectedLayout({ children }: ProtectedLayoutProps) {
  const { user, loading, workspace } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // Se não está carregando e não há usuário, redirecionar para login
    if (!loading && !user) {
      router.replace('/auth/login')
    }
  }, [user, loading, router])

  // Mostrar loading enquanto verifica autenticação
  if (loading) {
    return <LoadingSkeleton />
  }

  // Se não há usuário, não renderizar (redirecionamento em andamento)
  if (!user) {
    return <LoadingSkeleton />
  }

  // Se há usuário mas não há workspace, mostrar erro
  if (user && !workspace) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Workspace não encontrado
          </h1>
          <p className="text-gray-600 mb-4">
            Não foi possível carregar seu workspace. Tente fazer login novamente.
          </p>
          <button
            onClick={() => router.push('/auth/login')}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            Fazer Login Novamente
          </button>
        </div>
      </div>
    )
  }

  // Usuário autenticado com workspace, renderizar layout principal
  return <LayoutPrincipal>{children}</LayoutPrincipal>
}