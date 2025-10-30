'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabaseClient } from '@/servicos/supabase/auth-client'
import { useErrorHandler } from '@/utilitarios/error-handler'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [configError, setConfigError] = useState<string | null>(null)
  const router = useRouter()
  const { showError } = useErrorHandler()

  useEffect(() => {
    // Validar configuração ao montar
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    console.log('🔍 Validando configuração:', {
      url: supabaseUrl,
      hasKey: !!supabaseKey,
      env: process.env.NODE_ENV
    })

    if (!supabaseUrl || !supabaseKey) {
      setConfigError('Variáveis de ambiente não configuradas')
    }
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Validar variáveis de ambiente
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

      console.log('🔐 Iniciando login...', {
        hasUrl: !!supabaseUrl,
        hasKey: !!supabaseKey,
        email
      })

      if (!supabaseUrl || !supabaseKey) {
        throw new Error('Configuração do Supabase não encontrada. Verifique as variáveis de ambiente.')
      }

      // Timeout de 15 segundos
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Tempo esgotado. Verifique sua conexão.')), 15000)
      )

      const loginPromise = supabaseClient.auth.signInWithPassword({
        email,
        password,
      })

      const { error } = await Promise.race([loginPromise, timeoutPromise]) as any

      if (error) {
        console.error('❌ Erro no login:', error)
        showError(error, 'Login')
      } else {
        console.log('✅ Login bem-sucedido!')
        router.replace('/dashboard')
      }
    } catch (error: any) {
      console.error('❌ Erro crítico no login:', error)
      showError(error, 'Login')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Entrar na sua conta
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Controle Financeiro
          </p>
        </div>

        {/* Alerta de erro de configuração */}
        {configError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1">
              <p className="text-sm font-medium text-red-800">Erro de Configuração</p>
              <p className="text-sm text-red-700 mt-1">{configError}</p>
              <p className="text-xs text-red-600 mt-2">
                Verifique as variáveis de ambiente na Vercel ou entre em contato com o administrador.
              </p>
            </div>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="sr-only">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Seu email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Senha
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Sua senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              Não tem conta?{' '}
              <a 
                href="/auth/register" 
                className="font-medium text-indigo-600 hover:text-indigo-500"
              >
                Criar conta
              </a>
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}