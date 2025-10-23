import { useState } from 'react'
import { supabaseClient } from '@/servicos/supabase/auth-client'
import { aceitarConvite, verificarSeEmailJaTemConta } from '@/servicos/supabase/convites-simples'
import { getCallbackUrl } from '@/utilitarios/url-helper'
import { logger } from '@/utilitarios/logger'
import type { Resultado } from '@/tipos/convites'

/**
 * Dados de convite validados
 */
type DadosConvite = {
  codigo: string
  workspace: { id: string; nome: string }
  criadorNome?: string
}

/**
 * Dados para registro de novo usuário
 */
type DadosRegistro = {
  nome: string
  email: string
  password: string
  workspaceName?: string
}

/**
 * Resultado do processo de registro
 */
type ResultadoRegistro = {
  sucesso: boolean
  mensagem: string
  redirecionarPara?: string
}

/**
 * Hook customizado para gerenciar registro de usuários com convites
 *
 * Centraliza e orquestra todo o fluxo de registro de novos usuários,
 * incluindo validação de email, registro via Supabase Auth e aceitação
 * automática de convites quando aplicável.
 *
 * Funcionalidades:
 * - Validação de email (apenas para convites)
 * - Registro via Supabase Auth com metadata apropriada
 * - Processamento automático de convite após registro
 * - Gerenciamento de estado de loading
 *
 * @returns Objeto contendo loading e executarRegistro
 *
 * @example
 * ```typescript
 * // Usar no componente de registro
 * function RegistroPage() {
 *   const { loading, executarRegistro } = usarRegistroConvite()
 *
 *   async function handleSubmit() {
 *     const resultado = await executarRegistro({
 *       nome: 'João Silva',
 *       email: 'joao@exemplo.com',
 *       password: 'senha123',
 *       workspaceName: 'Minha Empresa'
 *     }, null) // null = sem convite
 *
 *     if (resultado.sucesso) {
 *       router.push(resultado.redirecionarPara)
 *     }
 *   }
 * }
 * ```
 */
export function usarRegistroConvite() {
  const [loading, setLoading] = useState(false)

  /**
   * Valida se email já existe no sistema
   * Apenas realiza validação quando é registro via convite
   */
  async function validarEmail(
    email: string,
    dadosConvite: DadosConvite | null
  ): Promise<Resultado<void>> {
    // Apenas validar se é registro via convite
    if (!dadosConvite) {
      return { success: true, data: undefined }
    }

    try {
      const emailJaExiste = await verificarSeEmailJaTemConta(email)

      if (emailJaExiste) {
        return {
          success: false,
          error: 'Este email já possui conta no sistema. Use outro email ou acesse sua conta própria.'
        }
      }

      return { success: true, data: undefined }
    } catch (error) {
      logger.error('Erro ao validar email', { error, email })
      return {
        success: false,
        error: 'Erro ao validar email. Tente novamente.'
      }
    }
  }

  /**
   * Registra novo usuário via Supabase Auth
   * Ajusta workspace_name conforme contexto (convite ou registro normal)
   */
  async function registrarUsuario(
    dados: DadosRegistro,
    dadosConvite: DadosConvite | null
  ): Promise<Resultado<void>> {
    try {
      // workspace_name null = registro via convite
      // workspace_name preenchido = registro normal
      const workspaceNameParaSignup = dadosConvite
        ? null
        : (dados.workspaceName || 'Meu Workspace')

      logger.info('Iniciando signUp', {
        email: dados.email.substring(0, 3) + '***',
        hasConvite: !!dadosConvite,
        workspaceName: workspaceNameParaSignup,
        conviteCodigo: dadosConvite?.codigo
      })

      const { error } = await supabaseClient.auth.signUp({
        email: dados.email,
        password: dados.password,
        options: {
          data: {
            full_name: dados.nome,
            workspace_name: workspaceNameParaSignup,
            invite_code: dadosConvite?.codigo || null
          },
          emailRedirectTo: getCallbackUrl()
        }
      })

      if (error) {
        logger.error('Erro no signUp', {
          error,
          message: error.message,
          status: error.status
        })
        return {
          success: false,
          error: error.message
        }
      }

      logger.info('SignUp realizado com sucesso')
      return { success: true, data: undefined }

    } catch (error) {
      logger.error('Erro ao registrar usuário', { error })
      return {
        success: false,
        error: 'Erro ao criar conta. Tente novamente.'
      }
    }
  }

  /**
   * Processa convite após registro bem-sucedido
   * Aceita o convite automaticamente para o usuário recém-criado
   */
  async function processarConvite(
    dadosConvite: DadosConvite,
    email: string,
    nome: string
  ): Promise<Resultado<string>> {
    try {
      logger.info('Processando convite para usuário recém-criado')

      const resultado = await aceitarConvite(dadosConvite.codigo, email, nome)

      if (resultado.success) {
        logger.info('Convite processado com sucesso durante registro')
        return {
          success: true,
          data: `Conta criada e você foi adicionado ao workspace "${dadosConvite.workspace.nome}"! Verifique seu email para confirmar.`
        }
      } else {
        logger.warn('Falha no convite', { error: resultado.error })
        return {
          success: true,
          data: 'Conta criada! Verifique seu email para confirmar o cadastro. O convite será processado após a confirmação.'
        }
      }
    } catch (error) {
      logger.error('Erro ao aceitar convite automaticamente', { error })
      return {
        success: true,
        data: 'Conta criada! Verifique seu email para confirmar o cadastro.'
      }
    }
  }

  /**
   * Executa fluxo completo de registro
   *
   * Passos:
   * 1. Validar email (apenas se convite)
   * 2. Registrar usuário
   * 3. Processar convite (se houver)
   */
  async function executarRegistro(
    dados: DadosRegistro,
    dadosConvite: DadosConvite | null
  ): Promise<ResultadoRegistro> {
    setLoading(true)

    try {
      // 1. Validar email
      const validacaoEmail = await validarEmail(dados.email, dadosConvite)
      if (!validacaoEmail.success) {
        return {
          sucesso: false,
          mensagem: validacaoEmail.error || 'Erro ao validar email'
        }
      }

      // 2. Registrar usuário
      const registroResult = await registrarUsuario(dados, dadosConvite)
      if (!registroResult.success) {
        return {
          sucesso: false,
          mensagem: registroResult.error || 'Erro ao registrar usuário'
        }
      }

      // 3. Processar convite (se houver)
      let mensagemFinal = 'Verifique seu email para confirmar o cadastro!'

      if (dadosConvite) {
        const conviteResult = await processarConvite(
          dadosConvite,
          dados.email,
          dados.nome
        )
        if (conviteResult.success) {
          mensagemFinal = conviteResult.data
        }
      }

      return {
        sucesso: true,
        mensagem: mensagemFinal,
        redirecionarPara: '/auth/login'
      }

    } catch (error) {
      logger.error('Erro no fluxo de registro', { error })
      return {
        sucesso: false,
        mensagem: 'Erro ao criar conta. Tente novamente.'
      }
    } finally {
      setLoading(false)
    }
  }

  return {
    loading,
    executarRegistro
  }
}
