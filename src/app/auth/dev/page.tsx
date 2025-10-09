'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabaseClient } from '@/servicos/supabase/auth-client'
import { useErrorHandler, useNotifications } from '@/utilitarios/error-handler'

export default function DevLoginPage() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { showError } = useErrorHandler()
  const { showSuccess } = useNotifications()

  const handleDevLogin = async () => {
    setLoading(true)

    try {
      const { error } = await supabaseClient.auth.signInWithPassword({
        email: 'conectamovelmar@gmail.com',
        password: 'senha123',
      })

      if (error) {
        showError(error, 'Login Dev')
      } else {
        showSuccess('Login de desenvolvimento realizado com sucesso!')
        router.replace('/dashboard')
      }
    } catch (error) {
      showError(error, 'Login Dev')
    } finally {
      setLoading(false)
    }
  }

  // Só mostrar em desenvolvimento
  if (process.env.NODE_ENV !== 'development') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Página não disponível</h2>
          <p className="mt-2 text-gray-600">Esta página só está disponível em desenvolvimento.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            🚀 Login Desenvolvedor
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Controle Financeiro - Modo Desenvolvimento
          </p>
          <div className="mt-4 p-4 bg-blue-50 rounded-md">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">
                  Super Admin
                </h3>
                <div className="mt-2 text-sm text-blue-700">
                  <p>Email: conectamovelmar@gmail.com</p>
                  <p>Workspace: Conecta</p>
                  <p>Privilégios: Super Administrador</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-8">
          <button
            onClick={handleDevLogin}
            disabled={loading}
            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Entrando...' : '🔑 Login Automático'}
          </button>
        </div>

        <div className="text-center space-y-2">
          <p className="text-sm text-gray-600">
            <a 
              href="/auth/login" 
              className="font-medium text-indigo-600 hover:text-indigo-500"
            >
              ← Login Normal
            </a>
          </p>
          <p className="text-xs text-gray-500">
            Disponível apenas em desenvolvimento
          </p>
        </div>
      </div>
    </div>
  )
}