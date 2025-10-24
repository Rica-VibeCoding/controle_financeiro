import { supabase } from './cliente'
import {
  ConviteRateLimiter,
  ValidadorCodigoConvite,
  ValidadorDadosConvite,
  SanitizadorConvite,
  validarConviteCompleto
} from '../convites/validador-convites'
import { validarOwnerWorkspace } from './middleware-workspace'
import { logger } from '@/utilitarios/logger'
import { CONVITES_CONFIG } from '@/constantes/convites'
import {
  ERROS_AUTENTICACAO,
  ERROS_PERMISSOES,
  ERROS_CONVITE,
  ERROS_WORKSPACE,
  ERROS_USUARIO,
} from '@/constantes/mensagens-convites'
import type {
  Resultado,
  ResultadoCriacaoConvite,
  DadosConvite,
  RateLimitValidacao
} from '@/tipos/convites'

/**
 * Atualiza a última atividade do usuário no workspace
 *
 * Registra o timestamp da última atividade do usuário na tabela fp_usuarios.
 * Falhas são silenciadas para não interromper o fluxo principal.
 *
 * @param userId - UUID do usuário
 * @returns Promise que resolve quando a atualização é concluída
 */
export async function atualizarUltimaAtividade(userId: string): Promise<void> {
  try {
    await supabase
      .from('fp_usuarios')
      .update({ 
        last_activity: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
  } catch (error) {
    // Silenciar erro para não interromper o fluxo principal
    logger.warn('Erro ao atualizar última atividade:', error)
  }
}

/**
 * Verifica se um email já possui conta cadastrada no sistema
 *
 * Consulta tanto a tabela auth.users (Supabase Auth) quanto fp_usuarios
 * para determinar se o email já está em uso. Em caso de erro na verificação,
 * retorna false para permitir o fluxo de convite.
 *
 * @param email - Email a ser verificado
 * @returns true se o email já possui conta, false caso contrário
 *
 * @example
 * ```typescript
 * const existe = await verificarSeEmailJaTemConta('usuario@exemplo.com')
 * if (existe) {
 *   console.log('Email já cadastrado')
 * }
 * ```
 */
export async function verificarSeEmailJaTemConta(email: string): Promise<boolean> {
  try {
    // Sanitizar email
    const emailLimpo = email.toLowerCase().trim()
    
    // Verificar na tabela auth.users através do Supabase Auth Admin
    const { data: userData, error: authError } = await supabase.auth.admin.listUsers()
    
    if (authError) {
      // Se falhar na consulta admin, verificar na nossa tabela fp_usuarios
      const { data: usuarios, error: usuariosError } = await supabase
        .from('fp_usuarios')
        .select('email')
        .eq('email', emailLimpo)
        .limit(1)
      
      if (usuariosError) {
        logger.warn('Erro ao verificar email:', usuariosError)
        return false // Em caso de erro, permitir convite
      }
      
      return (usuarios && usuarios.length > 0)
    }
    
    // Verificar se email existe na lista de usuários auth
    const emailExists = userData.users.some(user => 
      user.email?.toLowerCase() === emailLimpo
    )
    
    return emailExists
  } catch (error) {
    logger.warn('Erro ao verificar se email já tem conta:', error)
    return false // Em caso de erro, permitir convite
  }
}

/**
 * Valida rate limit no servidor (banco de dados)
 * Chama função SQL pode_criar_convite() que conta convites das últimas 24h
 *
 * @param workspaceId - UUID do workspace
 * @returns Validação com informações de rate limit
 *
 * @example
 * ```typescript
 * const validacao = await validarRateLimitServidor(workspaceId)
 * if (!validacao.permitido) {
 *   logger.warn('Rate limit atingido', { convites_criados: validacao.convites_criados })
 *   return { success: false, error: validacao.motivo }
 * }
 * ```
 */
async function validarRateLimitServidor(
  workspaceId: string
): Promise<RateLimitValidacao> {
  try {
    // Chamar função SQL
    const { data, error } = await supabase
      .rpc('pode_criar_convite', {
        p_workspace_id: workspaceId
      })

    if (error) {
      logger.error('Erro ao validar rate limit no servidor', { error, workspaceId })

      // Em caso de erro, permitir (fail-open para não bloquear operação)
      // Mas logar para investigação
      return {
        permitido: true,
        convites_criados: 0,
        limite_maximo: 50
      }
    }

    // Retornar validação do servidor
    return data as RateLimitValidacao

  } catch (error) {
    logger.error('Exceção ao validar rate limit', { error, workspaceId })

    // Fail-open: permitir em caso de exceção
    return {
      permitido: true,
      convites_criados: 0,
      limite_maximo: 50
    }
  }
}

/**
 * Cria um link de convite para o workspace especificado
 *
 * Apenas proprietários (owners) podem criar convites. O convite expira em 7 dias
 * e possui código único de 6 caracteres. Aplica rate limit de 50 convites por dia
 * em desenvolvimento e 10 em produção.
 *
 * @param workspaceId - UUID do workspace
 * @returns Objeto com sucesso contendo link e código, ou erro
 *
 * @example
 * ```typescript
 * const resultado = await criarLinkConvite('uuid-workspace')
 * if (resultado.success) {
 *   console.log(resultado.data.link)   // https://app.com/auth/register?invite=ABC123
 *   console.log(resultado.data.codigo) // ABC123
 * } else {
 *   console.error(resultado.error)
 * }
 * ```
 *
 * @see {@link usarCodigoConvite} para validar convite
 * @see {@link aceitarConvite} para aceitar convite
 */
export async function criarLinkConvite(
  workspaceId: string
): Promise<ResultadoCriacaoConvite> {
  try {
    // Validar dados de criação
    const validacao = validarConviteCompleto('criar', { workspaceId })
    if (!validacao.valid) {
      return {
        success: false,
        error: validacao.error || ERROS_CONVITE.DADOS_INVALIDOS
      }
    }

    // Verificar se é owner
    const { data: user } = await supabase.auth.getUser()
    if (!user.user) {
      return {
        success: false,
        error: ERROS_AUTENTICACAO.USUARIO_NAO_AUTENTICADO
      }
    }

    const isOwner = await validarOwnerWorkspace(supabase, workspaceId, user.user.id)
    if (!isOwner) {
      return {
        success: false,
        error: ERROS_PERMISSOES.APENAS_OWNER_CRIAR
      }
    }

    // Validar rate limit no SERVIDOR (principal validação)
    logger.info('Validando rate limit no servidor', { workspaceId })

    const rateLimitServidor = await validarRateLimitServidor(workspaceId)

    if (!rateLimitServidor.permitido) {
      logger.warn('Rate limit atingido', {
        workspaceId,
        convites_criados: rateLimitServidor.convites_criados,
        limite: rateLimitServidor.limite_maximo
      })

      return {
        success: false,
        error: ERROS_CONVITE.LIMITE_EXCEDIDO,
        details: rateLimitServidor.motivo || `Limite de ${rateLimitServidor.limite_maximo} convites por dia atingido. Criados: ${rateLimitServidor.convites_criados}.`
      }
    }

    logger.info('Rate limit OK', {
      convites_criados: rateLimitServidor.convites_criados,
      convites_restantes: rateLimitServidor.convites_restantes
    })

    // Verificar rate limit no cliente (camada adicional de proteção)
    const rateLimitCheck = ConviteRateLimiter.podecriarConvite(workspaceId)
    if (!rateLimitCheck.valid) {
      logger.info('Rate limit do cliente também bloqueou', { workspaceId })
      // Não retorna erro pois servidor já validou e permitiu
    }

    // Gerar código válido
    const codigo = ValidadorCodigoConvite.gerarCodigo()
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + CONVITES_CONFIG.EXPIRACAO_DIAS)

    const { error } = await supabase
      .from('fp_convites_links')
      .insert({
        workspace_id: workspaceId,
        codigo,
        criado_por: user.user.id,
        expires_at: expiresAt.toISOString()
      })
      .select()
      .single()

    if (error) {
      return {
        success: false,
        error: error.message
      }
    }

    // Registrar no rate limiter
    ConviteRateLimiter.registrarConvite(workspaceId)

    const link = `${process.env.NEXT_PUBLIC_APP_URL}/auth/register?invite=${codigo}`

    return {
      success: true,
      data: {
        link,
        codigo: ValidadorCodigoConvite.formatarCodigo(codigo)
      }
    }
  } catch (error) {
    logger.error('Erro ao criar convite', { error, workspaceId })
    return {
      success: false,
      error: ERROS_CONVITE.ERRO_CRIAR,
      details: error
    }
  }
}

/**
 * Valida e retorna dados de um código de convite
 *
 * Verifica se o código é válido, não expirou e pertence a um workspace ativo.
 * Retorna informações sobre o workspace e quem criou o convite.
 *
 * @param codigo - Código do convite (6 caracteres alfanuméricos)
 * @returns Objeto com dados do convite ou erro
 *
 * @example
 * ```typescript
 * const resultado = await usarCodigoConvite('ABC123')
 * if (resultado.success) {
 *   console.log(resultado.data.workspace.nome)  // Nome do workspace
 *   console.log(resultado.data.criadorNome)      // Nome de quem convidou
 * } else {
 *   console.error(resultado.error) // Código inválido ou expirado
 * }
 * ```
 *
 * @see {@link criarLinkConvite} para criar convite
 */
export async function usarCodigoConvite(
  codigo: string
): Promise<Resultado<DadosConvite>> {
  try {
    // Sanitizar e validar código
    const codigoLimpo = SanitizadorConvite.sanitizarCodigo(codigo)
    const validacaoCodigo = ValidadorCodigoConvite.validarFormato(codigoLimpo)

    if (!validacaoCodigo.valid) {
      return {
        success: false,
        error: validacaoCodigo.error || ERROS_CONVITE.CODIGO_INVALIDO
      }
    }

    // Primeiro buscar o convite
    const { data: convite, error: conviteError } = await supabase
      .from('fp_convites_links')
      .select('*')
      .eq('codigo', codigoLimpo)
      .eq('ativo', true)
      .gte('expires_at', new Date().toISOString())
      .single()

    logger.info('Validando convite', { codigo: codigoLimpo, encontrado: !!convite })

    if (!convite || conviteError) {
      return {
        success: false,
        error: ERROS_CONVITE.CODIGO_INVALIDO_OU_EXPIRADO
      }
    }

    // Buscar dados do workspace
    const { data: workspace } = await supabase
      .from('fp_workspaces')
      .select('*')
      .eq('id', convite.workspace_id)
      .single()

    if (!workspace) {
      return {
        success: false,
        error: ERROS_WORKSPACE.NAO_ENCONTRADO
      }
    }

    // Buscar dados do criador
    const { data: criador } = await supabase
      .from('fp_usuarios')
      .select('nome')
      .eq('id', convite.criado_por)
      .single()

    logger.info('Dados do convite carregados', { workspace: workspace.nome })

    // Validar expiração
    const validacaoExpiracao = ValidadorDadosConvite.validarExpiracao(convite.expires_at)
    if (!validacaoExpiracao.valid) {
      return {
        success: false,
        error: validacaoExpiracao.error || ERROS_CONVITE.CONVITE_EXPIRADO
      }
    }

    return {
      success: true,
      data: {
        codigo: codigoLimpo,
        workspace: {
          id: workspace.id,
          nome: workspace.nome
        },
        criadorNome: criador?.nome || 'um membro'
      }
    }
  } catch (error) {
    logger.error('Erro ao validar código', { error, codigo })
    return {
      success: false,
      error: ERROS_CONVITE.ERRO_VALIDAR,
      details: error
    }
  }
}

// ============================================================================
// FUNÇÕES AUXILIARES PARA ACEITAR CONVITE
// ============================================================================

/**
 * Busca dados do usuário para aceitar convite
 * Trata tanto usuário autenticado quanto recém-criado
 */
async function buscarUsuarioConvite(
  email?: string,
  nome?: string
): Promise<Resultado<{
  userId: string
  userEmail: string
  userNome: string
}>> {
  try {
    // Tentar obter usuário atual
    const { data: userData } = await supabase.auth.getUser()

    if (userData.user) {
      // Usuário já autenticado
      return {
        success: true,
        data: {
          userId: userData.user.id,
          userEmail: userData.user.email || email || '',
          userNome: userData.user.user_metadata?.full_name || nome || userData.user.email?.split('@')[0] || 'Usuário'
        }
      }
    }

    if (!email) {
      return {
        success: false,
        error: ERROS_AUTENTICACAO.EMAIL_NAO_FORNECIDO
      }
    }

    // Buscar usuário recém-criado por email
    logger.info('Buscando usuário recém-criado por email', { email })

    const { data: userList } = await supabase.auth.admin.listUsers()
    const foundUser = userList?.users.find(u => u.email?.toLowerCase() === email.toLowerCase())

    if (!foundUser) {
      logger.warn('Usuário não encontrado para email', { email })
      return {
        success: false,
        error: ERROS_AUTENTICACAO.USUARIO_NAO_ENCONTRADO
      }
    }

    logger.info('Usuário recém-criado encontrado', { email })

    return {
      success: true,
      data: {
        userId: foundUser.id,
        userEmail: email,
        userNome: nome || email.split('@')[0] || 'Usuário'
      }
    }
  } catch (error) {
    logger.error('Erro ao buscar usuário para convite', { error, email })
    return {
      success: false,
      error: ERROS_USUARIO.ERRO_BUSCAR,
      details: error
    }
  }
}

/**
 * Verifica se usuário já possui workspace
 * Retorna workspace atual ou null se não existe
 */
async function verificarWorkspaceUsuario(
  userId: string
): Promise<Resultado<{
  workspaceId: string
  role: string
} | null>> {
  try {
    const { data: existingWorkspace, error } = await supabase
      .from('fp_usuarios')
      .select('id, workspace_id, role')
      .eq('id', userId)
      .single()

    if (error) {
      // Usuário não existe em fp_usuarios ainda (primeira vez)
      logger.info('Usuário não encontrado em fp_usuarios', { userId })
      return { success: true, data: null }
    }

    logger.info('Workspace atual do usuário', {
      userId,
      workspaceId: existingWorkspace.workspace_id
    })

    return {
      success: true,
      data: {
        workspaceId: existingWorkspace.workspace_id,
        role: existingWorkspace.role
      }
    }
  } catch (error) {
    logger.error('Erro ao verificar workspace do usuário', { error, userId })
    return {
      success: false,
      error: ERROS_WORKSPACE.ERRO_VERIFICAR,
      details: error
    }
  }
}

/**
 * Adiciona usuário ao workspace do convite
 */
async function adicionarUsuarioAoWorkspace(
  userId: string,
  workspaceId: string,
  email: string,
  nome: string
): Promise<Resultado<void>> {
  try {
    // Sanitizar dados
    const dadosUsuario = SanitizadorConvite.sanitizarDadosUsuario({
      id: userId,
      workspace_id: workspaceId,
      email,
      nome,
      role: 'member',
      ativo: true
    })

    logger.info('Inserindo usuário no workspace', {
      workspaceId,
      email: email.substring(0, 3) + '***'
    })

    const { error: insertError } = await supabase
      .from('fp_usuarios')
      .insert({
        ...dadosUsuario,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })

    if (insertError) {
      logger.error('Erro ao inserir usuário no workspace', {
        error: insertError,
        workspaceId
      })
      return {
        success: false,
        error: ERROS_USUARIO.ERRO_ADICIONAR + ': ' + insertError.message,
        details: insertError
      }
    }

    logger.info('Usuário adicionado ao workspace com sucesso', { workspaceId })

    return { success: true, data: undefined }
  } catch (error) {
    logger.error('Erro ao adicionar usuário ao workspace', { error })
    return {
      success: false,
      error: ERROS_USUARIO.ERRO_ADICIONAR,
      details: error
    }
  }
}

/**
 * Registra log de auditoria para convite aceito
 */
async function registrarAuditoriaConvite(
  workspaceId: string,
  userId: string,
  codigo: string,
  email: string,
  processoTipo: 'usuario_autenticado' | 'usuario_recem_criado'
): Promise<void> {
  try {
    await supabase
      .from('fp_audit_logs')
      .insert({
        workspace_id: workspaceId,
        user_id: userId,
        action: 'convite_usado',
        entity_type: 'convite',
        entity_id: null,
        metadata: {
          codigo,
          email,
          processamento: processoTipo,
          timestamp: new Date().toISOString()
        }
      })

    logger.info('Auditoria de convite registrada', { workspaceId, userId })
  } catch (error) {
    // Apenas logar erro, não falhar operação por causa de auditoria
    logger.error('Erro ao registrar auditoria de convite', { error, workspaceId })
  }
}

// ============================================================================
// FUNÇÃO PRINCIPAL
// ============================================================================

/**
 * Aceita convite e adiciona usuário ao workspace
 *
 * Processa a aceitação de um convite, funcionando tanto para usuários já
 * autenticados quanto para usuários recém-criados. Realiza validações de
 * segurança, verifica se o usuário já pertence ao workspace e adiciona
 * o usuário com role 'member'. Após aceitar, o convite é deletado.
 *
 * @param codigo - Código do convite (6 caracteres, será sanitizado)
 * @param email - Email do usuário (obrigatório para usuários recém-criados)
 * @param nome - Nome do usuário (obrigatório para usuários recém-criados)
 * @returns Resultado da operação com sucesso ou erro detalhado
 *
 * @example
 * ```typescript
 * // Usuário autenticado
 * const resultado = await aceitarConvite('ABC123')
 *
 * // Usuário recém-criado
 * const resultado = await aceitarConvite('ABC123', 'user@email.com', 'João Silva')
 *
 * if (resultado.success) {
 *   console.log('Convite aceito com sucesso')
 * } else {
 *   console.error(resultado.error)
 * }
 * ```
 *
 * @see {@link usarCodigoConvite} para validar convite antes de aceitar
 * @see {@link criarLinkConvite} para criar convite
 */
export async function aceitarConvite(
  codigo: string,
  email?: string,
  nome?: string
): Promise<Resultado<void>> {
  try {
    logger.info('Iniciando aceitação de convite', {
      codigo: codigo.substring(0, 3) + '***',
      email: email?.substring(0, 3) + '***'
    })

    // 1. Sanitizar e validar código
    const codigoLimpo = SanitizadorConvite.sanitizarCodigo(codigo)
    const validacao = validarConviteCompleto('aceitar', { codigo: codigoLimpo })

    if (!validacao.valid) {
      return { success: false, error: validacao.error || ERROS_CONVITE.CODIGO_INVALIDO }
    }

    // 2. Validar convite e obter workspace
    const resultadoValidacao = await usarCodigoConvite(codigoLimpo)

    if (!resultadoValidacao.success) {
      return {
        success: false,
        error: resultadoValidacao.error
      }
    }

    const { workspace } = resultadoValidacao.data
    logger.info('Workspace do convite encontrado', { workspaceName: workspace.nome })

    // 3. Buscar dados do usuário
    const resultadoUsuario = await buscarUsuarioConvite(email, nome)

    if (!resultadoUsuario.success) {
      return resultadoUsuario
    }

    const { userId, userEmail, userNome } = resultadoUsuario.data
    const processoTipo = email ? 'usuario_recem_criado' : 'usuario_autenticado'

    // 4. Verificar se usuário já tem workspace
    const resultadoWorkspace = await verificarWorkspaceUsuario(userId)

    if (!resultadoWorkspace.success) {
      return resultadoWorkspace
    }

    if (resultadoWorkspace.data) {
      // Usuário já existe em fp_usuarios
      if (resultadoWorkspace.data.workspaceId === workspace.id) {
        logger.info('Usuário já está no workspace do convite', { userId, workspaceId: workspace.id })
        return { success: true, data: undefined }
      }

      // Usuário está em workspace diferente - trigger SQL falhou
      logger.error('Usuário criado em workspace incorreto - trigger SQL falhou', {
        userId,
        workspaceEsperado: workspace.id,
        workspaceAtual: resultadoWorkspace.data.workspaceId,
        codigoConvite: codigoLimpo
      })

      return {
        success: false,
        error: ERROS_CONVITE.ERRO_PROCESSAR_SUPORTE
      }
    }

    // 5. Adicionar usuário ao workspace
    const resultadoAdicao = await adicionarUsuarioAoWorkspace(
      userId,
      workspace.id,
      userEmail,
      userNome
    )

    if (!resultadoAdicao.success) {
      return resultadoAdicao
    }

    // 6. Registrar auditoria
    await registrarAuditoriaConvite(
      workspace.id,
      userId,
      codigoLimpo,
      userEmail,
      processoTipo
    )

    // 7. Deletar convite (não pode ser reutilizado)
    await deletarConvitePermanentemente(codigoLimpo)

    logger.info('Convite aceito com sucesso', {
      workspaceName: workspace.nome,
      userEmail: userEmail.substring(0, 3) + '***'
    })

    return { success: true, data: undefined }

  } catch (error) {
    logger.error('Erro ao aceitar convite', { error })
    return {
      success: false,
      error: ERROS_CONVITE.ERRO_PROCESSAR,
      details: error
    }
  }
}

/**
 * Deleta convite permanentemente do sistema
 *
 * Remove permanentemente um convite da base de dados (hard delete).
 * Apenas proprietários (owners) do workspace podem deletar convites.
 * Esta ação é irreversível.
 *
 * @param codigo - Código do convite a ser deletado
 * @returns Resultado da operação
 *
 * @example
 * ```typescript
 * const resultado = await deletarConvitePermanentemente('ABC123')
 * if (resultado.success) {
 *   console.log('Convite deletado permanentemente')
 * } else {
 *   console.error(resultado.error)
 * }
 * ```
 */
export async function deletarConvitePermanentemente(
  codigo: string
): Promise<Resultado<void>> {
  try {
    // Sanitizar código
    const codigoLimpo = SanitizadorConvite.sanitizarCodigo(codigo)

    // Verificar se é owner antes de deletar
    const { data: user } = await supabase.auth.getUser()
    if (!user.user) {
      return {
        success: false,
        error: ERROS_AUTENTICACAO.USUARIO_NAO_AUTENTICADO
      }
    }

    // Verificar se o convite pertence a um workspace que o usuário é owner
    const { data: convite } = await supabase
      .from('fp_convites_links')
      .select('workspace_id')
      .eq('codigo', codigoLimpo)
      .single()

    if (!convite) {
      return {
        success: false,
        error: ERROS_CONVITE.CONVITE_NAO_ENCONTRADO
      }
    }

    const isOwner = await validarOwnerWorkspace(supabase, convite.workspace_id, user.user.id)
    if (!isOwner) {
      return {
        success: false,
        error: ERROS_PERMISSOES.APENAS_OWNER_DELETAR
      }
    }

    // Hard delete - remover permanentemente
    const { error, count } = await supabase
      .from('fp_convites_links')
      .delete()
      .eq('codigo', codigoLimpo)

    if (error) {
      logger.error('Erro ao deletar convite', { error })
      return {
        success: false,
        error: error.message
      }
    }

    // Log para debug
    logger.info('Convite deletado', { codigo: codigoLimpo, registrosAfetados: count })

    return { success: true, data: undefined }
  } catch (error) {
    logger.error('Erro ao desativar convite', { error })
    return {
      success: false,
      error: ERROS_CONVITE.ERRO_DESATIVAR,
      details: error
    }
  }
}

/**
 * @deprecated Use deletarConvitePermanentemente() - Nome mais descritivo da ação irreversível
 */
export const desativarConvite = deletarConvitePermanentemente

/**
 * Remove usuário de um workspace
 *
 * Apenas proprietários (owners) podem remover usuários do workspace.
 * Não é possível remover o próprio proprietário do workspace.
 * O usuário é marcado como inativo ao invés de ser deletado.
 *
 * @param usuarioId - UUID do usuário a ser removido
 * @param workspaceId - UUID do workspace
 * @returns Resultado da operação
 *
 * @example
 * ```typescript
 * const resultado = await removerUsuarioWorkspace('user-uuid', 'workspace-uuid')
 * if (resultado.success) {
 *   console.log('Usuário removido do workspace')
 * } else {
 *   console.error(resultado.error)
 * }
 * ```
 */
export async function removerUsuarioWorkspace(
  usuarioId: string,
  workspaceId: string
): Promise<Resultado<void>> {
  try {
    // Verificar se quem remove é owner do workspace
    const { data: user } = await supabase.auth.getUser()
    if (!user.user) {
      return {
        success: false,
        error: ERROS_AUTENTICACAO.USUARIO_NAO_AUTENTICADO
      }
    }

    const isOwner = await validarOwnerWorkspace(supabase, workspaceId, user.user.id)
    if (!isOwner) {
      return {
        success: false,
        error: ERROS_PERMISSOES.APENAS_OWNER_REMOVER
      }
    }

    // Verificar se o usuário pertence ao workspace
    const { data: targetUser, error: userError } = await supabase
      .from('fp_usuarios')
      .select('id, role, ativo')
      .eq('id', usuarioId)
      .eq('workspace_id', workspaceId)
      .single()

    if (userError || !targetUser) {
      return {
        success: false,
        error: ERROS_USUARIO.NAO_ENCONTRADO_WORKSPACE
      }
    }

    // Não permitir auto-remoção se único owner
    if (targetUser.id === user.user.id) {
      // Verificar se é o único owner
      const { data: owners } = await supabase
        .from('fp_usuarios')
        .select('id')
        .eq('workspace_id', workspaceId)
        .eq('role', 'owner')
        .eq('ativo', true)

      if (owners && owners.length <= 1) {
        return {
          success: false,
          error: ERROS_WORKSPACE.ULTIMO_PROPRIETARIO
        }
      }
    }

    // Atualizar ativo = false (não deletar)
    const { error } = await supabase
      .from('fp_usuarios')
      .update({ ativo: false, updated_at: new Date().toISOString() })
      .eq('id', usuarioId)
      .eq('workspace_id', workspaceId)

    if (error) {
      return {
        success: false,
        error: error.message
      }
    }

    // Registrar em fp_audit_logs
    await supabase
      .from('fp_audit_logs')
      .insert({
        workspace_id: workspaceId,
        user_id: user.user.id,
        action: 'user_removed',
        entity_type: 'usuario',
        entity_id: usuarioId,
        metadata: {
          removed_user_id: usuarioId,
          removed_by: user.user.id,
          timestamp: new Date().toISOString()
        }
      })

    return { success: true, data: undefined }
  } catch (error) {
    logger.error('Erro ao remover usuário', { error })
    return {
      success: false,
      error: ERROS_USUARIO.ERRO_REMOVER,
      details: error
    }
  }
}

/**
 * Altera a role (permissão) de um usuário no workspace
 *
 * Apenas proprietários (owners) podem alterar roles. Permite promover
 * um membro a proprietário ou rebaixar um proprietário a membro.
 *
 * @param usuarioId - UUID do usuário a ter a role alterada
 * @param workspaceId - UUID do workspace
 * @param novaRole - Nova role: 'owner' ou 'member'
 * @returns Resultado da operação
 *
 * @example
 * ```typescript
 * // Promover usuário a owner
 * const resultado = await alterarRoleUsuario('user-uuid', 'workspace-uuid', 'owner')
 *
 * // Rebaixar para member
 * const resultado = await alterarRoleUsuario('user-uuid', 'workspace-uuid', 'member')
 *
 * if (resultado.success) {
 *   console.log('Role alterada com sucesso')
 * }
 * ```
 */
export async function alterarRoleUsuario(
  usuarioId: string,
  workspaceId: string,
  novaRole: 'owner' | 'member'
): Promise<Resultado<void>> {
  try {
    // Verificar se quem altera é owner do workspace
    const { data: user } = await supabase.auth.getUser()
    if (!user.user) {
      return {
        success: false,
        error: ERROS_AUTENTICACAO.USUARIO_NAO_AUTENTICADO
      }
    }

    const isOwner = await validarOwnerWorkspace(supabase, workspaceId, user.user.id)
    if (!isOwner) {
      return {
        success: false,
        error: ERROS_PERMISSOES.APENAS_OWNER_ALTERAR_ROLE
      }
    }

    // Verificar se o usuário pertence ao workspace
    const { data: targetUser, error: userError } = await supabase
      .from('fp_usuarios')
      .select('id, role, ativo')
      .eq('id', usuarioId)
      .eq('workspace_id', workspaceId)
      .single()

    if (userError || !targetUser) {
      return {
        success: false,
        error: ERROS_USUARIO.NAO_ENCONTRADO_WORKSPACE
      }
    }

    if (!targetUser.ativo) {
      return {
        success: false,
        error: ERROS_USUARIO.NAO_ATIVO
      }
    }

    // Se está rebaixando de owner para member, verificar se não é o único owner
    if (targetUser.role === 'owner' && novaRole === 'member') {
      const { data: owners } = await supabase
        .from('fp_usuarios')
        .select('id')
        .eq('workspace_id', workspaceId)
        .eq('role', 'owner')
        .eq('ativo', true)

      if (owners && owners.length <= 1) {
        return {
          success: false,
          error: ERROS_WORKSPACE.ULTIMO_PROPRIETARIO_REBAIXAR
        }
      }
    }

    // Não permitir que o usuário altere seu próprio role se for único owner
    if (targetUser.id === user.user.id && targetUser.role === 'owner' && novaRole === 'member') {
      const { data: owners } = await supabase
        .from('fp_usuarios')
        .select('id')
        .eq('workspace_id', workspaceId)
        .eq('role', 'owner')
        .eq('ativo', true)

      if (owners && owners.length <= 1) {
        return {
          success: false,
          error: ERROS_WORKSPACE.AUTO_REBAIXAMENTO
        }
      }
    }

    // Atualizar role do usuário
    const { error } = await supabase
      .from('fp_usuarios')
      .update({
        role: novaRole,
        updated_at: new Date().toISOString()
      })
      .eq('id', usuarioId)
      .eq('workspace_id', workspaceId)

    if (error) {
      return {
        success: false,
        error: error.message
      }
    }

    // Registrar em fp_audit_logs
    await supabase
      .from('fp_audit_logs')
      .insert({
        workspace_id: workspaceId,
        user_id: user.user.id,
        action: 'user_role_changed',
        entity_type: 'usuario',
        entity_id: usuarioId,
        metadata: {
          target_user_id: usuarioId,
          old_role: targetUser.role,
          new_role: novaRole,
          changed_by: user.user.id,
          timestamp: new Date().toISOString()
        }
      })

    return { success: true, data: undefined }
  } catch (error) {
    logger.error('Erro ao alterar role do usuário', { error })
    return {
      success: false,
      error: ERROS_USUARIO.ERRO_ALTERAR_ROLE,
      details: error
    }
  }
}

// Buscar histórico de convites
export async function buscarHistoricoConvites(workspaceId: string) {
  try {
    const { data, error } = await supabase
      .from('fp_convites_links')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) throw error
    
    return { data, success: true }
  } catch (error: any) {
    return { error: error.message }
  }
}