'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabaseClient } from '@/servicos/supabase/auth-client'

export default function AuthCallbackPage() {
  const router = useRouter()

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const { data, error } = await supabaseClient.auth.getSession()
        
        if (error) {
          console.error('Erro no callback de autenticação:', error)
          router.push('/auth/login?error=callback_error')
          return
        }

        if (data.session) {
          // Usuário autenticado com sucesso
          router.push('/')
          router.refresh()
        } else {
          // Sem sessão, redirecionar para login
          router.push('/auth/login')
        }
      } catch (error) {
        console.error('Erro no processamento do callback:', error)
        router.push('/auth/login?error=callback_error')
      }
    }

    handleAuthCallback()
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto mb-4"></div>
        <p className="text-gray-600">Confirmando autenticação...</p>
      </div>
    </div>
  )
}