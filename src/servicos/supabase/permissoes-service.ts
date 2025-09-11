import { supabase } from './cliente'
import type { PermissoesUsuario, ResultadoPermissoes, TipoPermissao } from '@/tipos/permissoes'
import { validarEstruturalPermissoes, PERMISSOES_PADRAO_MEMBER } from '@/tipos/permissoes'
import { validarOwnerWorkspace } from './middleware-workspace'

/**
 * Service para gerenciar permissões granulares de usuários
 * Segue o padrão dos services existentes (convites-simples.ts)
 */

/**
 * Atualizar permissões de um usuário MEMBER
 * Apenas OWNERs podem executar esta operação
 */
export async function atualizarPermissoesUsuario(
  usuarioId: string,
  workspaceId: string,
  novasPermissoes: PermissoesUsuario
): Promise<ResultadoPermissoes> {
  try {
    // 1. Validar estrutura das permissões
    if (!validarEstruturalPermissoes(novasPermissoes)) {
      return {
        success: false,
        error: 'Estrutura de permissões inválida. Verifique se todas as chaves estão presentes.'
      }
    }

    // 2. Obter sessão atual
    const { data: { user }, error: sessionError } = await supabase.auth.getUser()
    
    if (sessionError || !user) {
      return {
        success: false,
        error: 'Usuário não autenticado'
      }
    }

    // 3. Verificar se usuário atual é OWNER do workspace
    const isOwner = await validarOwnerWorkspace(supabase, workspaceId, user.id)
    if (!isOwner) {
      return {
        success: false,
        error: 'Apenas proprietários podem alterar permissões'
      }
    }

    // 4. Verificar se usuário alvo existe e é MEMBER
    const { data: targetUser, error: userError } = await supabase
      .from('fp_usuarios')
      .select('id, role, ativo, nome')
      .eq('id', usuarioId)
      .eq('workspace_id', workspaceId)
      .single()

    if (userError || !targetUser) {
      return {
        success: false,
        error: 'Usuário não encontrado no workspace'
      }
    }

    if (!targetUser.ativo) {
      return {
        success: false,
        error: 'Usuário não está ativo no workspace'
      }
    }

    if (targetUser.role === 'owner') {
      return {
        success: false,
        error: 'Não é possível alterar permissões de proprietários'
      }
    }

    // 5. Usar a função SQL para atualizar (mais seguro e com auditoria)
    const { data, error } = await supabase
      .rpc('atualizar_permissoes_usuario', {
        p_user_id: usuarioId,
        p_workspace_id: workspaceId,
        p_permissoes: novasPermissoes,
        p_changed_by: user.id
      })

    if (error) {
      return {
        success: false,
        error: error.message || 'Erro ao atualizar permissões'
      }
    }

    return {
      success: true,
      permissoesAtualizadas: novasPermissoes
    }

  } catch (error: any) {
    console.error('Erro ao atualizar permissões:', error)
    return {
      success: false,
      error: error.message || 'Erro inesperado ao atualizar permissões'
    }
  }
}

/**
 * Verificar se usuário tem uma permissão específica
 */
export async function verificarPermissaoUsuario(
  usuarioId: string,
  workspaceId: string,
  permissao: TipoPermissao
): Promise<boolean> {
  try {
    // Usar função SQL para verificação (mais eficiente e segura)
    const { data, error } = await supabase
      .rpc('verificar_permissao_usuario', {
        p_user_id: usuarioId,
        p_workspace_id: workspaceId,
        p_permissao: permissao
      })

    if (error) {
      console.warn(`Erro ao verificar permissão ${permissao}:`, error)
      return false
    }

    return data === true

  } catch (error) {
    console.error('Erro ao verificar permissão:', error)
    return false
  }
}

/**
 * Buscar permissões completas de um usuário
 */
export async function buscarPermissoesUsuario(
  usuarioId: string,
  workspaceId: string
): Promise<PermissoesUsuario | null> {
  try {
    const { data, error } = await supabase
      .from('fp_usuarios')
      .select('role, permissoes, ativo')
      .eq('id', usuarioId)
      .eq('workspace_id', workspaceId)
      .single()

    if (error || !data) {
      console.warn('Erro ao buscar permissões:', error)
      return null
    }

    // Se usuário não está ativo, retorna null
    if (!data.ativo) {
      return null
    }

    // Se é OWNER, retorna todas as permissões como true
    if (data.role === 'owner') {
      return {
        dashboard: true,
        receitas: true,
        despesas: true,
        recorrentes: true,
        previstas: true,
        relatorios: true,
        configuracoes: true,
        cadastramentos: true,
        backup: true
      }
    }

    // Se é MEMBER, retorna permissões do JSON ou padrão restritivo
    const permissoes = data.permissoes as PermissoesUsuario
    
    if (!permissoes || !validarEstruturalPermissoes(permissoes)) {
      return PERMISSOES_PADRAO_MEMBER
    }

    return permissoes

  } catch (error) {
    console.error('Erro ao buscar permissões:', error)
    return null
  }
}

/**
 * Listar todos os usuários de um workspace com suas permissões
 * Para uso na página de gestão de usuários
 */
export async function listarUsuariosComPermissoes(workspaceId: string) {
  try {
    // 1. Verificar se usuário atual é OWNER
    const { data: { user }, error: sessionError } = await supabase.auth.getUser()
    
    if (sessionError || !user) {
      return { success: false, error: 'Usuário não autenticado' }
    }

    const isOwner = await validarOwnerWorkspace(supabase, workspaceId, user.id)
    if (!isOwner) {
      return { 
        success: false, 
        error: 'Apenas proprietários podem ver permissões de outros usuários' 
      }
    }

    // 2. Buscar todos os usuários do workspace
    const { data: usuarios, error } = await supabase
      .from('fp_usuarios')
      .select(`
        id,
        workspace_id,
        nome,
        email,
        role,
        ativo,
        permissoes,
        last_activity,
        created_at,
        updated_at
      `)
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false })

    if (error) {
      return { success: false, error: 'Erro ao listar usuários' }
    }

    // 3. Processar permissões para cada usuário
    const usuariosComPermissoes = usuarios?.map(usuario => ({
      ...usuario,
      // OWNERs sempre têm todas as permissões
      permissoes: usuario.role === 'owner' ? {
        dashboard: true,
        receitas: true,
        despesas: true,
        recorrentes: true,
        previstas: true,
        relatorios: true,
        configuracoes: true,
        cadastramentos: true,
        backup: true
      } : (
        validarEstruturalPermissoes(usuario.permissoes) 
          ? usuario.permissoes 
          : PERMISSOES_PADRAO_MEMBER
      )
    }))

    return { 
      success: true, 
      usuarios: usuariosComPermissoes 
    }

  } catch (error: any) {
    console.error('Erro ao listar usuários com permissões:', error)
    return { 
      success: false, 
      error: error.message || 'Erro inesperado ao listar usuários' 
    }
  }
}

/**
 * Aplicar permissões padrão para novo usuário MEMBER
 * Chamada automaticamente ao aceitar convite
 */
export async function aplicarPermissoesPadraoMember(
  usuarioId: string,
  workspaceId: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('fp_usuarios')
      .update({
        permissoes: PERMISSOES_PADRAO_MEMBER,
        updated_at: new Date().toISOString()
      })
      .eq('id', usuarioId)
      .eq('workspace_id', workspaceId)
      .eq('role', 'member')

    if (error) {
      console.error('Erro ao aplicar permissões padrão:', error)
      return false
    }

    return true

  } catch (error) {
    console.error('Erro ao aplicar permissões padrão:', error)
    return false
  }
}

/**
 * Verificar múltiplas permissões de uma vez (otimização)
 */
export async function verificarMultiplasPermissoes(
  usuarioId: string,
  workspaceId: string,
  permissoes: TipoPermissao[]
): Promise<Record<TipoPermissao, boolean>> {
  try {
    const permissoesUsuario = await buscarPermissoesUsuario(usuarioId, workspaceId)
    
    if (!permissoesUsuario) {
      // Se não conseguiu carregar, assume false para todas
      return permissoes.reduce((acc, permissao) => {
        acc[permissao] = false
        return acc
      }, {} as Record<TipoPermissao, boolean>)
    }

    // Mapear resultado
    return permissoes.reduce((acc, permissao) => {
      acc[permissao] = permissoesUsuario[permissao]
      return acc
    }, {} as Record<TipoPermissao, boolean>)

  } catch (error) {
    console.error('Erro ao verificar múltiplas permissões:', error)
    return permissoes.reduce((acc, permissao) => {
      acc[permissao] = false
      return acc
    }, {} as Record<TipoPermissao, boolean>)
  }
}