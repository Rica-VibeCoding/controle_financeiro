'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabaseClient } from '@/servicos/supabase/auth-client'

export default function DevAuthPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    if (process.env.NEXT_PUBLIC_DEV_MODE === 'true') {
      autoLogin()
    } else {
      router.push('/auth/login')
    }
  }, [router])

  const autoLogin = async () => {
    try {
      // Verificar se já está logado
      const { data: { session } } = await supabaseClient.auth.getSession()
      
      if (!session) {
        console.log('🔧 Fazendo auto-login para desenvolvimento...')
        const { error } = await supabaseClient.auth.signInWithPassword({
          email: 'ricardo@dev.com',
          password: 'senha123'
        })

        if (error) {
          console.error('Erro no auto-login:', error)
          setError('Erro no auto-login. Verifique se o usuário de dev foi criado no Supabase.')
          return
        }
      }

      console.log('✅ Auto-login realizado com sucesso')
      router.push('/')
      router.refresh()
    } catch (error) {
      console.error('Erro:', error)
      setError('Erro inesperado no auto-login')
    } finally {
      setLoading(false)
    }
  }

  const goToManualLogin = () => {
    router.push('/auth/login')
  }

  if (!loading && error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md">
          <div className="mb-6">
            <div className="mx-auto h-12 w-12 text-red-500">
              ⚠️
            </div>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Erro no Auto-login
          </h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="space-y-3">
            <button
              onClick={() => window.location.reload()}
              className="w-full px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
            >
              Tentar novamente
            </button>
            <button
              onClick={goToManualLogin}
              className="w-full px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Login manual
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Fazendo login automático para desenvolvimento...</p>
          <p className="text-sm text-gray-500 mt-2">🔧 Modo Desenvolvimento</p>
        </div>
      </div>
    )
  }

  return null
}