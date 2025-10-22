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

// Atualizar última atividade do usuário
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

// Verificar se email já possui conta no sistema
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

// Criar link de convite
export async function criarLinkConvite(workspaceId: string): Promise<{
  link?: string
  codigo?: string
  error?: string
}> {
  try {
    // Validar dados de criação
    const validacao = validarConviteCompleto('criar', { workspaceId })
    if (!validacao.valid) {
      return { error: validacao.error }
    }

    // Verificar se é owner
    const { data: user } = await supabase.auth.getUser()
    if (!user.user) return { error: 'Usuário não autenticado' }

    const isOwner = await validarOwnerWorkspace(supabase, workspaceId, user.user.id)
    if (!isOwner) {
      return { error: 'Apenas proprietários podem criar convites' }
    }

    // Verificar rate limit
    const rateLimitCheck = ConviteRateLimiter.podecriarConvite(workspaceId)
    if (!rateLimitCheck.valid) {
      return { error: rateLimitCheck.error }
    }

    // Gerar código válido
    const codigo = ValidadorCodigoConvite.gerarCodigo()
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7) // 7 dias

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

    if (error) return { error: error.message }

    // Registrar no rate limiter
    ConviteRateLimiter.registrarConvite(workspaceId)

    const link = `${process.env.NEXT_PUBLIC_APP_URL}/auth/register?invite=${codigo}`
    
    return { 
      link,
      codigo: ValidadorCodigoConvite.formatarCodigo(codigo)
    }
  } catch {
    return { error: 'Erro ao criar convite' }
  }
}

// Validar e usar código de convite
export async function usarCodigoConvite(codigo: string): Promise<{
  workspace?: any
  criadorNome?: string
  error?: string
}> {
  try {
    // Sanitizar e validar código
    const codigoLimpo = SanitizadorConvite.sanitizarCodigo(codigo)
    const validacaoCodigo = ValidadorCodigoConvite.validarFormato(codigoLimpo)
    
    if (!validacaoCodigo.valid) {
      return { error: validacaoCodigo.error }
    }

    // Primeiro buscar o convite
    const { data: convite, error: conviteError } = await supabase
      .from('fp_convites_links')
      .select('*')
      .eq('codigo', codigoLimpo)
      .eq('ativo', true)
      .gte('expires_at', new Date().toISOString())
      .single()

    logger.info('🔍 Debug convite:', { convite, conviteError, codigo: codigoLimpo })

    if (!convite || conviteError) {
      return { error: 'Código inválido ou expirado' }
    }

    // Buscar dados do workspace
    const { data: workspace } = await supabase
      .from('fp_workspaces')
      .select('*')
      .eq('id', convite.workspace_id)
      .single()

    // Buscar dados do criador
    const { data: criador } = await supabase
      .from('fp_usuarios')
      .select('nome')
      .eq('id', convite.criado_por)
      .single()

    logger.info('🔍 Debug dados:', { workspace, criador })

    // Validar expiração
    const validacaoExpiracao = ValidadorDadosConvite.validarExpiracao(convite.expires_at)
    if (!validacaoExpiracao.valid) {
      return { error: validacaoExpiracao.error }
    }

    return { 
      workspace: workspace,
      criadorNome: criador?.nome || 'um membro'
    }
  } catch {
    return { error: 'Erro ao validar código' }
  }
}

// Aceitar convite e adicionar usuário ao workspace
// NOVA VERSÃO: Funciona tanto para usuários autenticados quanto recém-criados
export async function aceitarConvite(codigo: string, email?: string, nome?: string): Promise<{
  success: boolean
  error?: string
}> {
  try {
    logger.info('🔄 Iniciando aceitarConvite:', { codigo: codigo.substring(0, 3) + '***', email: email?.substring(0, 3) + '***' })
    
    // Sanitizar código
    const codigoLimpo = SanitizadorConvite.sanitizarCodigo(codigo)
    
    // Validar convite completo
    const validacao = validarConviteCompleto('aceitar', { codigo: codigoLimpo })
    if (!validacao.valid) {
      return { success: false, error: validacao.error }
    }

    // Validar código e obter workspace
    const { workspace, error: validateError } = await usarCodigoConvite(codigoLimpo)
    if (validateError || !workspace) {
      return { success: false, error: validateError || 'Workspace não encontrado' }
    }

    logger.info('✅ Workspace do convite:', workspace.nome)

    // Tentar obter usuário atual (pode falhar se ainda não estiver autenticado)
    const { data: userData } = await supabase.auth.getUser()
    
    // Determinar dados do usuário
    let userId: string
    let userEmail: string
    let userNome: string

    if (userData.user) {
      // Usuário já autenticado - usar dados da sessão
      userId = userData.user.id
      userEmail = userData.user.email || email || ''
      userNome = userData.user.user_metadata?.full_name || nome || userData.user.email?.split('@')[0] || 'Usuário'
      logger.info('👤 Usuário autenticado encontrado:', userEmail)
    } else if (email) {
      // Usuário recém-criado - usar dados fornecidos
      // Buscar o ID do usuário pelo email (quando ainda não está autenticado)
      logger.info('🔍 Buscando usuário recém-criado por email:', email)
      
      const { data: userList } = await supabase.auth.admin.listUsers()
      const foundUser = userList?.users.find(u => u.email?.toLowerCase() === email.toLowerCase())
      
      if (!foundUser) {
        logger.warn('❌ Usuário não encontrado para email:', email)
        return { success: false, error: 'Usuário não encontrado. Tente novamente após confirmar o email.' }
      }
      
      userId = foundUser.id
      userEmail = email
      userNome = nome || email.split('@')[0] || 'Usuário'
      logger.info('👤 Usuário recém-criado encontrado:', userEmail)
    } else {
      return { success: false, error: 'Usuário não autenticado e dados não fornecidos' }
    }

    // Verificar se usuário já possui workspace
    const { data: existingWorkspace } = await supabase
      .from('fp_usuarios')
      .select('id, workspace_id, role')
      .eq('id', userId)
      .single()

    // Verificar se usuário já está no workspace do convite
    if (existingWorkspace) {
      if (existingWorkspace.workspace_id === workspace.id) {
        logger.info('Usuário já está no workspace do convite', { userId, workspaceId: workspace.id })
        return { success: true }
      }

      // Se está em workspace diferente, trigger falhou - retornar erro
      logger.error('Usuário criado em workspace incorreto - trigger SQL falhou', {
        userId,
        workspaceEsperado: workspace.id,
        workspaceAtual: existingWorkspace.workspace_id,
        codigoConvite: codigoLimpo
      })

      return {
        success: false,
        error: 'Erro ao processar convite. Entre em contato com o suporte.'
      }
    }

    // Sanitizar dados do usuário para primeira inserção
    const dadosUsuario = SanitizadorConvite.sanitizarDadosUsuario({
      id: userId,
      workspace_id: workspace.id,
      email: userEmail,
      nome: userNome,
      role: 'member',
      ativo: true
    })

    logger.info('💾 Inserindo usuário no workspace:', { workspace_id: workspace.id, email: userEmail })

    // Inserir usuário no workspace (primeira vez apenas)
    const { error: insertError } = await supabase
      .from('fp_usuarios')
      .insert({
        ...dadosUsuario,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })

    if (insertError) {
      logger.error('❌ Erro no insert:', insertError)
      return { success: false, error: 'Erro ao adicionar usuário ao workspace: ' + insertError.message }
    }

    // Registrar log de auditoria
    await supabase
      .from('fp_audit_logs')
      .insert({
        workspace_id: workspace.id,
        user_id: userId,
        action: 'convite_usado',
        entity_type: 'convite',
        entity_id: null,
        metadata: {
          codigo: codigoLimpo,
          email: userEmail,
          processamento: userData.user ? 'usuario_autenticado' : 'usuario_recem_criado',
          timestamp: new Date().toISOString()
        }
      })

    // Deletar convite após uso bem-sucedido (não pode ser reutilizado)
    await desativarConvite(codigoLimpo)

    logger.info('✅ Convite aceito com sucesso! Usuário adicionado ao workspace:', workspace.nome)
    return { success: true }
  } catch (err) {
    logger.error('💥 Erro ao aceitar convite:', err)
    return { success: false, error: 'Erro ao processar convite' }
  }
}

// Deletar convite permanentemente
export async function desativarConvite(codigo: string): Promise<{
  success: boolean
  error?: string
}> {
  try {
    // Sanitizar código
    const codigoLimpo = SanitizadorConvite.sanitizarCodigo(codigo)
    
    // Verificar se é owner antes de deletar
    const { data: user } = await supabase.auth.getUser()
    if (!user.user) {
      return { success: false, error: 'Usuário não autenticado' }
    }

    // Verificar se o convite pertence a um workspace que o usuário é owner
    const { data: convite } = await supabase
      .from('fp_convites_links')
      .select('workspace_id')
      .eq('codigo', codigoLimpo)
      .single()

    if (!convite) {
      return { success: false, error: 'Convite não encontrado' }
    }

    const isOwner = await validarOwnerWorkspace(supabase, convite.workspace_id, user.user.id)
    if (!isOwner) {
      return { success: false, error: 'Apenas proprietários podem deletar convites' }
    }
    
    // Hard delete - remover permanentemente
    const { error, count } = await supabase
      .from('fp_convites_links')
      .delete()
      .eq('codigo', codigoLimpo)

    if (error) {
      logger.error('Erro ao deletar convite:', error)
      return { success: false, error: error.message }
    }

    // Log para debug
    logger.info(`Convite ${codigoLimpo} deletado. Registros afetados:`, count)

    return { success: true }
  } catch (error: any) {
    logger.error('Erro ao desativar convite:', error)
    return { success: false, error: 'Erro ao desativar convite' }
  }
}

// Remover usuário do workspace
export async function removerUsuarioWorkspace(usuarioId: string, workspaceId: string): Promise<{
  success: boolean
  error?: string
}> {
  try {
    // Verificar se quem remove é owner do workspace
    const { data: user } = await supabase.auth.getUser()
    if (!user.user) {
      return { success: false, error: 'Usuário não autenticado' }
    }

    const isOwner = await validarOwnerWorkspace(supabase, workspaceId, user.user.id)
    if (!isOwner) {
      return { success: false, error: 'Apenas proprietários podem remover usuários' }
    }

    // Verificar se o usuário pertence ao workspace
    const { data: targetUser, error: userError } = await supabase
      .from('fp_usuarios')
      .select('id, role, ativo')
      .eq('id', usuarioId)
      .eq('workspace_id', workspaceId)
      .single()

    if (userError || !targetUser) {
      return { success: false, error: 'Usuário não encontrado no workspace' }
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
        return { success: false, error: 'Não é possível remover o último proprietário do workspace' }
      }
    }

    // Atualizar ativo = false (não deletar)
    const { error } = await supabase
      .from('fp_usuarios')
      .update({ ativo: false, updated_at: new Date().toISOString() })
      .eq('id', usuarioId)
      .eq('workspace_id', workspaceId)

    if (error) throw error

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
    
    return { success: true }
  } catch (error: any) {
    logger.error('Erro ao remover usuário:', error)
    return { success: false, error: error.message || 'Erro ao remover usuário' }
  }
}

// Alterar role do usuário
export async function alterarRoleUsuario(usuarioId: string, workspaceId: string, novaRole: 'owner' | 'member'): Promise<{
  success: boolean
  error?: string
}> {
  try {
    // Verificar se quem altera é owner do workspace
    const { data: user } = await supabase.auth.getUser()
    if (!user.user) {
      return { success: false, error: 'Usuário não autenticado' }
    }

    const isOwner = await validarOwnerWorkspace(supabase, workspaceId, user.user.id)
    if (!isOwner) {
      return { success: false, error: 'Apenas proprietários podem alterar roles' }
    }

    // Verificar se o usuário pertence ao workspace
    const { data: targetUser, error: userError } = await supabase
      .from('fp_usuarios')
      .select('id, role, ativo')
      .eq('id', usuarioId)
      .eq('workspace_id', workspaceId)
      .single()

    if (userError || !targetUser) {
      return { success: false, error: 'Usuário não encontrado no workspace' }
    }

    if (!targetUser.ativo) {
      return { success: false, error: 'Usuário não está ativo no workspace' }
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
        return { success: false, error: 'Não é possível rebaixar o último proprietário do workspace' }
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
        return { success: false, error: 'Você não pode se rebaixar sendo o único proprietário do workspace' }
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

    if (error) throw error

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
    
    return { success: true }
  } catch (error: any) {
    logger.error('Erro ao alterar role do usuário:', error)
    return { success: false, error: error.message || 'Erro ao alterar role do usuário' }
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