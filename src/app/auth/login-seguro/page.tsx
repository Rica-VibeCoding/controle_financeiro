'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabaseClient } from '@/servicos/supabase/auth-client'
import { useErrorHandler } from '@/utilitarios/error-handler'
import { AuthValidator, SecurityLogger } from '@/utilitarios/security-validator'

export default function LoginSeguroPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [attempts, setAttempts] = useState(0)
  const [rateLimited, setRateLimited] = useState(false)
  const [remainingTime, setRemainingTime] = useState<number>(0)
  const router = useRouter()
  const { showError } = useErrorHandler()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Validação de segurança antes de tentar login
      const validation = await AuthValidator.validateLogin(email, password)
      
      if (!validation.valid) {
        if (validation.rateLimited) {
          setRateLimited(true)
          setRemainingTime(validation.remainingTime || 900000) // 15 min default
          
          // Iniciar countdown
          const countdown = setInterval(() => {
            setRemainingTime(prev => {
              if (prev <= 1000) {
                clearInterval(countdown)
                setRateLimited(false)
                return 0
              }
              return prev - 1000
            })
          }, 1000)
        }
        
        showError({ message: validation.errors.join(', ') }, 'Validação')
        return
      }

      const { data, error } = await supabaseClient.auth.signInWithPassword({
        email: email.toLowerCase().trim(),
        password,
      })

      if (error) {
        setAttempts(prev => prev + 1)
        
        // Log tentativa de login falhada
        SecurityLogger.logSecurityEvent({
          type: 'failed_login',
          email: email.toLowerCase().trim(),
          details: { 
            error: error.message,
            attempt: attempts + 1,
            timestamp: new Date().toISOString()
          }
        })
        
        showError(error, 'Login')
      } else {
        // Reset rate limit em caso de sucesso
        AuthValidator.resetRateLimit(email)
        
        // Log login bem-sucedido
        SecurityLogger.logSecurityEvent({
          type: 'login_attempt',
          userId: data.user?.id,
          email: data.user?.email,
          details: { 
            success: true,
            timestamp: new Date().toISOString()
          }
        })
        
        // Redirecionar diretamente para dashboard após login
        router.replace('/dashboard')
      }
    } catch (error) {
      showError(error, 'Login')
    } finally {
      setLoading(false)
    }
  }

  // Formatar tempo restante
  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000)
    const seconds = Math.floor((ms % 60000) / 1000)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-full mb-4">
              <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Acesso Seguro
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Controle Financeiro - Autenticação Protegida
          </p>
          {rateLimited && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    Sistema de Proteção Ativado
                  </h3>
                  <p className="mt-1 text-sm text-red-700">
                    Muitas tentativas detectadas. Aguarde {formatTime(remainingTime)} antes de tentar novamente.
                  </p>
                </div>
              </div>
            </div>
          )}
          {attempts > 2 && !rateLimited && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-800">
                    <strong>{attempts} tentativas</strong> realizadas. Verifique suas credenciais cuidadosamente.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                maxLength={255}
                className={`
                  relative block w-full px-3 py-2 border placeholder-gray-500 text-gray-900 rounded-md 
                  focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors
                  ${rateLimited 
                    ? 'border-red-300 bg-red-50 focus:ring-red-500 focus:border-red-500' 
                    : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'
                  }
                `}
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={rateLimited}
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Senha
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                minLength={6}
                maxLength={128}
                className={`
                  relative block w-full px-3 py-2 border placeholder-gray-500 text-gray-900 rounded-md 
                  focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors
                  ${rateLimited 
                    ? 'border-red-300 bg-red-50 focus:ring-red-500 focus:border-red-500' 
                    : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'
                  }
                `}
                placeholder="Mínimo 6 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={rateLimited}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading || rateLimited}
              className={`
                group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white 
                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors
                ${loading || rateLimited 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-indigo-600 hover:bg-indigo-700'
                }
              `}
            >
              <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                {loading ? (
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : rateLimited ? (
                  <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5 text-indigo-500 group-hover:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                )}
              </span>
              {loading ? 'Verificando Credenciais...' : rateLimited ? `Bloqueado - ${formatTime(remainingTime)}` : 'Entrar com Segurança'}
            </button>
          </div>

          <div className="text-center space-y-3">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-gray-50 text-gray-500">Outras opções</span>
              </div>
            </div>
            
            <p className="text-sm text-gray-600">
              Não tem conta?{' '}
              <a 
                href="/auth/register" 
                className="font-medium text-indigo-600 hover:text-indigo-500 transition-colors"
              >
                Criar conta segura
              </a>
            </p>
            
            {process.env.NODE_ENV === 'development' && (
              <div className="pt-2 border-t border-gray-200">
                <p className="text-xs text-gray-500">
                  <a 
                    href="/auth/dev" 
                    className="text-blue-600 hover:text-blue-500 transition-colors"
                  >
                    🚀 Login de Desenvolvedor
                  </a>
                </p>
              </div>
            )}
          </div>
        </form>

        {/* Indicador de segurança */}
        <div className="mt-6 p-3 bg-green-50 border border-green-200 rounded-md">
          <div className="flex items-center">
            <svg className="h-4 w-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="text-xs text-green-700">
              Conexão protegida com criptografia de ponta a ponta
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}