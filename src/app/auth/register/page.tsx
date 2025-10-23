'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabaseClient } from '@/servicos/supabase/auth-client'
import { useErrorHandler, useNotifications } from '@/utilitarios/error-handler'
import { getCallbackUrl } from '@/utilitarios/url-helper'
import { usarCodigoConvite, aceitarConvite, verificarSeEmailJaTemConta } from '@/servicos/supabase/convites-simples'
import { Icone } from '@/componentes/ui/icone'
import { logger } from '@/utilitarios/logger'

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nome, setNome] = useState('')
  const [workspaceName, setWorkspaceName] = useState('')
  const [loading, setLoading] = useState(false)
  const [validandoConvite, setValidandoConvite] = useState(false)
  const [dadosConvite, setDadosConvite] = useState<{
    codigo: string
    workspace: { id: string; nome: string }
    criadorNome?: string
  } | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { showError } = useErrorHandler()
  const { showSuccess } = useNotifications()

  // Validar convite ao carregar a página
  useEffect(() => {
    const codigoConvite = searchParams.get('invite')
    logger.log('Debug convite - URL params:', { invite: codigoConvite, allParams: Object.fromEntries(searchParams.entries()) })
    if (codigoConvite) {
      logger.info('Código de convite encontrado:', codigoConvite)
      validarConvite(codigoConvite)
    } else {
      logger.log('Nenhum código de convite na URL')
    }
  }, [searchParams])

  const validarConvite = async (codigo: string) => {
    logger.info('Iniciando validação do convite:', codigo)
    setValidandoConvite(true)
    try {
      const resultado = await usarCodigoConvite(codigo)
      logger.log('Resultado da validação:', resultado)

      if (!resultado.success) {
        logger.error('Erro na validação:', resultado.error)
        showError(new Error(resultado.error), 'Convite')
      } else {
        logger.info('Workspace encontrado:', resultado.data.workspace.nome)
        logger.log('Criador:', resultado.data.criadorNome)
        setDadosConvite({
          codigo,
          workspace: resultado.data.workspace,
          criadorNome: resultado.data.criadorNome
        })
        // 🔒 IMPORTANTE: NÃO setar workspaceName quando é convite
        // Isso garante que workspace_name seja null no signUp
        // setWorkspaceName(resultado.data.workspace.nome) ❌ REMOVIDO - causava bug
      }
    } catch (error) {
      logger.error('Erro na validação de convite:', error)
      showError(error, 'Validação de convite')
    } finally {
      setValidandoConvite(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Se há convite, verificar se email já existe no sistema
      if (dadosConvite) {
        const emailJaExiste = await verificarSeEmailJaTemConta(email)
        if (emailJaExiste) {
          showError(
            new Error('Este email já possui conta no sistema. Use outro email ou acesse sua conta própria.'), 
            'Email já em uso'
          )
          setLoading(false)
          return
        }
      }

      // Registrar usuário primeiro
      // 🔒 IMPORTANTE: workspace_name DEVE ser null quando há convite
      const workspaceNameParaSignup = dadosConvite ? null : (workspaceName || 'Meu Workspace')

      logger.info('Iniciando signUp...', {
        email: email.substring(0, 3) + '***',
        hasConvite: !!dadosConvite,
        workspaceName: workspaceNameParaSignup,
        conviteCodigo: dadosConvite?.codigo
      })

      const { error } = await supabaseClient.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: nome,
            // ⚠️ CRÍTICO: workspace_name null = convite | workspace_name preenchido = registro normal
            workspace_name: workspaceNameParaSignup,
            invite_code: dadosConvite?.codigo || null  // ✨ Passa código para trigger
          },
          emailRedirectTo: getCallbackUrl()
        }
      })

      if (error) {
        logger.error('Erro no signUp:', error)
        logger.error('Detalhes do erro:', {
          message: error.message,
          status: error.status,
          code: error.code || 'N/A'
        })
        showError(error, 'Registro')
        return
      }

      logger.info('SignUp realizado com sucesso!')

      // Se há convite, aceitar automaticamente após registro
      if (dadosConvite) {
        try {
          logger.info('Processando convite para usuário recém-criado...')

          // NOVA LÓGICA: Aceitar convite imediatamente com os dados do registro
          const resultadoConvite = await aceitarConvite(dadosConvite.codigo, email, nome)

          if (resultadoConvite.success) {
            logger.info('Convite processado com sucesso durante registro!')
            showSuccess(`🎉 Conta criada e você foi adicionado ao workspace "${dadosConvite.workspace.nome}"! Verifique seu email para confirmar.`)
          } else {
            logger.warn('Falha no convite:', resultadoConvite.error)
            showSuccess('Conta criada! Verifique seu email para confirmar o cadastro. O convite será processado após a confirmação.')
          }
        } catch (conviteError) {
          logger.warn('Erro ao aceitar convite automaticamente:', conviteError)
          showSuccess('Conta criada! Verifique seu email para confirmar o cadastro.')
        }
      } else {
        showSuccess('Verifique seu email para confirmar o cadastro!')
      }
      
      router.push('/auth/login')
    } catch (error) {
      showError(error, 'Registro')
    } finally {
      setLoading(false)
    }
  }

  if (validandoConvite) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
          <Icone name="loader-2" className="w-8 h-8 text-blue-500 mx-auto mb-4 animate-spin" />
          <h1 className="text-xl font-bold mb-2">Validando Convite</h1>
          <p className="text-gray-600">
            Verificando código de convite...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        {/* Cabeçalho com contexto do convite */}
        <div>
          {dadosConvite ? (
            <>
              <div className="text-center mb-6">
                <Icone name="user-plus" className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-900">
                  Você foi convidado!
                </h2>
                <p className="mt-2 text-sm text-gray-600">
                  👤 <strong>{dadosConvite.criadorNome}</strong> está te convidando para ingressar na workspace:
                </p>
                <div className="mt-3 bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="font-semibold text-green-800">
                    "{dadosConvite.workspace.nome}"
                  </p>
                  <p className="text-xs text-green-600 mt-1">
                    Crie sua conta e comece a usar!
                  </p>
                </div>
              </div>
            </>
          ) : (
            <>
              <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                Criar nova conta
              </h2>
              <p className="mt-2 text-center text-sm text-gray-600">
                Comece a controlar suas finanças hoje
              </p>
            </>
          )}
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleRegister}>
          <div className="space-y-4">
            <div>
              <label htmlFor="nome" className="sr-only">
                Nome completo
              </label>
              <input
                id="nome"
                name="nome"
                type="text"
                required
                className="relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Seu nome completo"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
              />
            </div>

            {!dadosConvite && (
              <div>
                <label htmlFor="workspaceName" className="sr-only">
                  Nome do workspace
                </label>
                <input
                  id="workspaceName"
                  name="workspaceName"
                  type="text"
                  className="relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Nome do workspace (ex: Família Silva)"
                  value={workspaceName}
                  onChange={(e) => setWorkspaceName(e.target.value)}
                />
              </div>
            )}
            
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
                autoComplete="new-password"
                required
                minLength={6}
                className="relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Senha (mínimo 6 caracteres)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <Icone name="loader-2" className="w-4 h-4 animate-spin" />
                  Criando conta...
                </span>
              ) : dadosConvite ? (
                <span className="flex items-center gap-2">
                  <Icone name="user-plus" className="w-4 h-4" />
                  Criar Conta e Ingressar na Workspace
                </span>
              ) : (
                'Criar conta'
              )}
            </button>
          </div>

          {/* Link de login removido intencionalmente para convites */}
          {!dadosConvite && (
            <div className="text-center">
              <p className="text-sm text-gray-600">
                Já tem conta?{' '}
                <a 
                  href="/auth/login" 
                  className="font-medium text-indigo-600 hover:text-indigo-500"
                >
                  Fazer login
                </a>
              </p>
            </div>
          )}
        </form>
      </div>
    </div>
  )
}