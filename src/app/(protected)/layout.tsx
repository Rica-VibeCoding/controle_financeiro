'use client'

import { useAuth } from '@/contextos/auth-contexto'
import { LayoutPrincipal } from '@/componentes/layout/layout-principal'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

interface ProtectedLayoutProps {
  children: React.ReactNode
}

function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="relative mb-6">
          <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto"></div>
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Verificando autenticação...
        </h2>
        <p className="text-gray-600 text-sm">
          Aguarde um momento
        </p>
      </div>
    </div>
  )
}

export default function ProtectedLayout({ children }: ProtectedLayoutProps) {
  const { user, loading, workspace, slowLoading } = useAuth()
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

  // Se há usuário mas não há workspace, mostrar loading com mensagem informativa
  if (user && !workspace) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md px-4">
          <div className="relative mb-6">
            <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto"></div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {slowLoading ? 'Iniciando servidor...' : 'Carregando seu workspace...'}
          </h1>
          <p className="text-gray-600 mb-4">
            {slowLoading ? (
              <>
                O servidor estava inativo e está sendo iniciado.
                <br />
                <span className="text-sm text-gray-500 mt-2 block">
                  Isso acontece no primeiro acesso e pode levar até 30 segundos.
                </span>
              </>
            ) : (
              <>
                Aguarde enquanto preparamos seu ambiente de trabalho.
                <br />
                <span className="text-sm text-gray-500 mt-2 block">
                  Carregando dados do seu workspace...
                </span>
              </>
            )}
          </p>
          {slowLoading && (
            <div className="mt-6 p-4 bg-amber-50 rounded-lg border border-amber-200">
              <p className="text-sm text-amber-800">
                ⏳ <strong>Aguarde:</strong> O servidor Supabase está iniciando. Isso é normal após períodos de inatividade.
              </p>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Usuário autenticado com workspace, renderizar layout principal
  return <LayoutPrincipal>{children}</LayoutPrincipal>
}