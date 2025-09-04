/**
 * Serviços para funcionalidades de Super Admin
 */

import { createClient } from './server'

export interface SuperAdminInfo {
  id: string
  nome: string
  email: string
  super_admin: boolean
  workspace_id: string
  workspace_nome: string
}

/**
 * Verifica se o usuário atual é super admin
 */
export async function verificarSuperAdmin(): Promise<boolean> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return false
    }

    const { data, error } = await supabase
      .from('fp_usuarios')
      .select('super_admin')
      .eq('id', user.id)
      .eq('ativo', true)
      .single()

    if (error || !data) {
      return false
    }

    return data.super_admin === true
  } catch (error) {
    console.error('Erro ao verificar super admin:', error)
    return false
  }
}

/**
 * Busca informações completas do super admin
 */
export async function buscarInfoSuperAdmin(): Promise<SuperAdminInfo | null> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return null
    }

    const { data, error } = await supabase
      .from('fp_usuarios')
      .select(`
        id,
        nome,
        email,
        super_admin,
        workspace_id,
        fp_workspaces!fp_usuarios_workspace_id_fkey (
          nome
        )
      `)
      .eq('id', user.id)
      .eq('ativo', true)
      .single()

    if (error || !data || !data.super_admin) {
      return null
    }

    return {
      id: data.id,
      nome: data.nome,
      email: data.email,
      super_admin: data.super_admin,
      workspace_id: data.workspace_id,
      workspace_nome: (data.fp_workspaces as any)?.nome || 'Workspace'
    }
  } catch (error) {
    console.error('Erro ao buscar info super admin:', error)
    return null
  }
}

/**
 * Lista todos os workspaces do sistema (apenas para super admin)
 */
export async function listarTodosWorkspaces() {
  const isSuperAdmin = await verificarSuperAdmin()
  
  if (!isSuperAdmin) {
    throw new Error('Acesso negado: apenas super admins podem acessar esta funcionalidade')
  }

  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('fp_workspaces')
      .select(`
        id,
        nome,
        descricao,
        created_at,
        updated_at,
        fp_usuarios!fp_usuarios_workspace_id_fkey (
          id,
          nome,
          email,
          role,
          ativo,
          created_at
        )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    return data
  } catch (error) {
    console.error('Erro ao listar workspaces:', error)
    throw error
  }
}

/**
 * Busca estatísticas gerais do sistema (apenas para super admin)
 */
export async function buscarEstatisticasSistema() {
  const isSuperAdmin = await verificarSuperAdmin()
  
  if (!isSuperAdmin) {
    throw new Error('Acesso negado: apenas super admins podem acessar esta funcionalidade')
  }

  try {
    const supabase = await createClient()

    // Buscar contadores gerais
    const [workspacesResult, usuariosResult, transacoesResult, convitesResult] = await Promise.all([
      supabase.from('fp_workspaces').select('id', { count: 'exact', head: true }),
      supabase.from('fp_usuarios').select('id', { count: 'exact', head: true }).eq('ativo', true),
      supabase.from('fp_transacoes').select('id', { count: 'exact', head: true }),
      supabase.from('fp_convites_links').select('id', { count: 'exact', head: true }).eq('ativo', true)
    ])

    return {
      total_workspaces: workspacesResult.count || 0,
      total_usuarios: usuariosResult.count || 0,
      total_transacoes: transacoesResult.count || 0,
      convites_ativos: convitesResult.count || 0
    }
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error)
    throw error
  }
}