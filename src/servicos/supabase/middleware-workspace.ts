import { SupabaseClient } from '@supabase/supabase-js'

/**
 * Middleware para validação de workspace em todas as operações
 * Garante que o usuário só acesse dados do seu workspace atual
 */

interface WorkspaceValidation {
  isValid: boolean
  error?: string
  workspace?: {
    id: string
    nome: string
    owner_id: string
  }
}

/**
 * Valida se o usuário tem acesso ao workspace especificado
 */
export async function validarAcessoWorkspace(
  supabase: SupabaseClient,
  workspaceId: string,
  userId?: string
): Promise<WorkspaceValidation> {
  try {
    // Obter ID do usuário se não fornecido
    if (!userId) {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData?.user) {
        return { isValid: false, error: 'Usuário não autenticado' }
      }
      userId = userData.user.id
    }

    // Verificar se usuário é membro do workspace
    const { data: usuario, error: userError } = await supabase
      .from('fp_usuarios')
      .select('workspace_id, role')
      .eq('id', userId)
      .eq('workspace_id', workspaceId)
      .eq('ativo', true)
      .single()

    if (userError || !usuario) {
      return { isValid: false, error: 'Acesso negado ao workspace' }
    }

    // Buscar dados do workspace
    const { data: workspace, error: wsError } = await supabase
      .from('fp_workspaces')
      .select('id, nome, owner_id')
      .eq('id', workspaceId)
      .eq('ativo', true)
      .single()

    if (wsError || !workspace) {
      return { isValid: false, error: 'Workspace não encontrado' }
    }

    return { 
      isValid: true, 
      workspace 
    }
  } catch (error) {
    console.error('Erro ao validar acesso ao workspace:', error)
    return { isValid: false, error: 'Erro na validação de acesso' }
  }
}

/**
 * Valida se o usuário é owner do workspace
 */
export async function validarOwnerWorkspace(
  supabase: SupabaseClient,
  workspaceId: string,
  userId?: string
): Promise<boolean> {
  try {
    // Obter ID do usuário se não fornecido
    if (!userId) {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData?.user) return false
      userId = userData.user.id
    }

    // Verificar se é owner
    const { data: workspace } = await supabase
      .from('fp_workspaces')
      .select('owner_id')
      .eq('id', workspaceId)
      .eq('owner_id', userId)
      .eq('ativo', true)
      .single()

    return !!workspace
  } catch {
    return false
  }
}

/**
 * Adiciona workspace_id automaticamente em queries
 */
export function adicionarFiltroWorkspace<T extends Record<string, any>>(
  query: T,
  workspaceId: string
): T & { workspace_id: string } {
  return {
    ...query,
    workspace_id: workspaceId
  }
}

/**
 * Valida dados antes de inserir/atualizar
 */
export function validarDadosWorkspace(
  dados: any,
  workspaceId: string
): { valido: boolean; erro?: string } {
  // Verificar se workspace_id está presente e correto
  if (dados.workspace_id && dados.workspace_id !== workspaceId) {
    return { 
      valido: false, 
      erro: 'Workspace ID inválido' 
    }
  }

  // Adicionar workspace_id se não presente
  if (!dados.workspace_id) {
    dados.workspace_id = workspaceId
  }

  return { valido: true }
}

/**
 * Hook para interceptar todas as operações do Supabase
 */
export function criarInterceptorWorkspace(
  supabase: SupabaseClient,
  workspaceId: string
) {
  return {
    /**
     * Intercepta SELECT queries
     */
    async select<T>(
      tabela: string,
      query: any = {}
    ): Promise<{ data: T[] | null; error: any }> {
      const queryComWorkspace = adicionarFiltroWorkspace(query, workspaceId)
      return supabase
        .from(tabela)
        .select('*')
        .match(queryComWorkspace)
    },

    /**
     * Intercepta INSERT queries
     */
    async insert<T>(
      tabela: string,
      dados: T | T[]
    ): Promise<{ data: T[] | null; error: any }> {
      const dadosArray = Array.isArray(dados) ? dados : [dados]
      const dadosValidados = dadosArray.map(item => 
        adicionarFiltroWorkspace(item as any, workspaceId)
      )
      
      return supabase
        .from(tabela)
        .insert(dadosValidados)
        .select()
    },

    /**
     * Intercepta UPDATE queries
     */
    async update<T>(
      tabela: string,
      dados: Partial<T>,
      filtro: any = {}
    ): Promise<{ data: T[] | null; error: any }> {
      const filtroComWorkspace = adicionarFiltroWorkspace(filtro, workspaceId)
      
      return supabase
        .from(tabela)
        .update(dados)
        .match(filtroComWorkspace)
        .select()
    },

    /**
     * Intercepta DELETE queries
     */
    async delete(
      tabela: string,
      filtro: any = {}
    ): Promise<{ data: any; error: any }> {
      const filtroComWorkspace = adicionarFiltroWorkspace(filtro, workspaceId)
      
      return supabase
        .from(tabela)
        .delete()
        .match(filtroComWorkspace)
    }
  }
}