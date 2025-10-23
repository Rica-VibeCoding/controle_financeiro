import { supabase } from './cliente'
import type { Contato } from '@/tipos/database'

/**
 * Busca TODOS os clientes do workspace (ativos e inativos)
 * @param workspaceId - ID do workspace
 * @returns Lista de clientes ordenada por nome
 */
export async function obterClientes(workspaceId: string): Promise<Contato[]> {
  const { data, error } = await supabase
    .from('r_contatos')
    .select('id, nome, cpf_cnpj, tipo_pessoa, telefone, email, ativo, workspace_id, created_at, updated_at')
    .eq('workspace_id', workspaceId)
    .eq('tipo_pessoa', 'cliente')
    .order('nome', { ascending: true })

  if (error) {
    console.error('Erro ao buscar clientes:', error)
    throw new Error(`Erro ao buscar clientes: ${error.message}`)
  }

  return data || []
}

/**
 * Busca TODOS os fornecedores do workspace (ativos e inativos)
 * @param workspaceId - ID do workspace
 * @returns Lista de fornecedores ordenada por nome
 */
export async function obterFornecedores(workspaceId: string): Promise<Contato[]> {
  const { data, error } = await supabase
    .from('r_contatos')
    .select('id, nome, cpf_cnpj, tipo_pessoa, telefone, email, ativo, workspace_id, created_at, updated_at')
    .eq('workspace_id', workspaceId)
    .eq('tipo_pessoa', 'fornecedor')
    .order('nome', { ascending: true })

  if (error) {
    console.error('Erro ao buscar fornecedores:', error)
    throw new Error(`Erro ao buscar fornecedores: ${error.message}`)
  }

  return data || []
}

/**
 * Cria novo cliente
 * @param nome - Nome do cliente
 * @param workspaceId - ID do workspace
 * @param telefone - Telefone do cliente (opcional)
 * @param email - Email do cliente (opcional)
 * @returns Cliente criado
 */
export async function criarCliente(
  nome: string,
  workspaceId: string,
  telefone?: string,
  email?: string
): Promise<Contato> {
  // Validações básicas
  if (!nome || nome.trim().length === 0) {
    throw new Error('Nome do cliente é obrigatório')
  }

  if (!workspaceId) {
    throw new Error('ID do workspace é obrigatório')
  }

  const { data, error } = await supabase
    .from('r_contatos')
    .insert({
      nome: nome.trim(),
      tipo_pessoa: 'cliente',
      telefone: telefone?.trim() || null,
      email: email?.trim() || null,
      ativo: true,
      workspace_id: workspaceId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select('id, nome, cpf_cnpj, tipo_pessoa, telefone, email, ativo, workspace_id, created_at, updated_at')
    .single()

  if (error) {
    console.error('Erro ao criar cliente:', error)
    throw new Error(`Erro ao criar cliente: ${error.message}`)
  }

  return data
}

/**
 * Cria novo fornecedor
 * @param nome - Nome do fornecedor
 * @param workspaceId - ID do workspace
 * @param telefone - Telefone do fornecedor (opcional)
 * @param email - Email do fornecedor (opcional)
 * @returns Fornecedor criado
 */
export async function criarFornecedor(
  nome: string,
  workspaceId: string,
  telefone?: string,
  email?: string
): Promise<Contato> {
  // Validações básicas
  if (!nome || nome.trim().length === 0) {
    throw new Error('Nome do fornecedor é obrigatório')
  }

  if (!workspaceId) {
    throw new Error('ID do workspace é obrigatório')
  }

  const { data, error } = await supabase
    .from('r_contatos')
    .insert({
      nome: nome.trim(),
      tipo_pessoa: 'fornecedor',
      telefone: telefone?.trim() || null,
      email: email?.trim() || null,
      ativo: true,
      workspace_id: workspaceId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select('id, nome, cpf_cnpj, tipo_pessoa, telefone, email, ativo, workspace_id, created_at, updated_at')
    .single()

  if (error) {
    console.error('Erro ao criar fornecedor:', error)
    throw new Error(`Erro ao criar fornecedor: ${error.message}`)
  }

  return data
}

/**
 * Atualiza contato existente
 * @param id - ID do contato
 * @param nome - Novo nome
 * @param workspaceId - ID do workspace
 * @param telefone - Novo telefone (opcional)
 * @param email - Novo email (opcional)
 * @returns Contato atualizado
 */
export async function atualizarContato(
  id: string,
  nome: string,
  workspaceId: string,
  telefone?: string,
  email?: string
): Promise<Contato> {
  // Validações básicas
  if (!id) {
    throw new Error('ID do contato é obrigatório')
  }

  if (!nome || nome.trim().length === 0) {
    throw new Error('Nome do contato é obrigatório')
  }

  if (!workspaceId) {
    throw new Error('ID do workspace é obrigatório')
  }

  const { data, error } = await supabase
    .from('r_contatos')
    .update({
      nome: nome.trim(),
      telefone: telefone?.trim() || null,
      email: email?.trim() || null,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .eq('workspace_id', workspaceId)
    .select('id, nome, cpf_cnpj, tipo_pessoa, telefone, email, ativo, workspace_id, created_at, updated_at')
    .single()

  if (error) {
    console.error('Erro ao atualizar contato:', error)
    throw new Error(`Erro ao atualizar contato: ${error.message}`)
  }

  if (!data) {
    throw new Error('Contato não encontrado ou você não tem permissão para editá-lo')
  }

  return data
}

/**
 * Busca contato por ID
 * @param id - ID do contato
 * @returns Contato encontrado
 */
export async function obterContatoPorId(id: string): Promise<Contato | null> {
  const { data, error } = await supabase
    .from('r_contatos')
    .select('id, nome, cpf_cnpj, tipo_pessoa, telefone, email, ativo, workspace_id, created_at, updated_at')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Erro ao buscar contato:', error)
    return null
  }

  return data
}

/**
 * Alterna status ativo/inativo de um contato
 * @param id - ID do contato
 * @param ativo - Novo status
 * @param workspaceId - ID do workspace
 */
export async function alternarStatusContato(
  id: string,
  ativo: boolean,
  workspaceId: string
): Promise<void> {
  // Validações básicas
  if (!id) {
    throw new Error('ID do contato é obrigatório')
  }

  if (!workspaceId) {
    throw new Error('ID do workspace é obrigatório')
  }

  const { data, error } = await supabase
    .from('r_contatos')
    .update({
      ativo,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .eq('workspace_id', workspaceId)
    .select('id')
    .single()

  if (error) {
    console.error('Erro ao alternar status do contato:', error)
    throw new Error(`Erro ao alternar status: ${error.message}`)
  }

  if (!data) {
    throw new Error('Contato não encontrado ou você não tem permissão para alterá-lo')
  }
}

/**
 * Exclui contato permanentemente (hard delete - exclusão física)
 * Verifica vínculos com transações antes de deletar
 * @param id - ID do contato
 * @param workspaceId - ID do workspace
 */
export async function excluirContato(
  id: string,
  workspaceId: string
): Promise<void> {
  // Verificar se contato está vinculado como CLIENTE em transações
  const { data: transacoesCliente, error: errorCliente } = await supabase
    .from('fp_transacoes')
    .select('id')
    .eq('cliente_id', id)
    .eq('workspace_id', workspaceId)
    .limit(1)

  if (errorCliente) {
    console.error('Erro ao verificar transações (cliente):', errorCliente)
    throw new Error('Erro ao verificar vínculos do cliente')
  }

  // Verificar se contato está vinculado como FORNECEDOR em transações
  const { data: transacoesFornecedor, error: errorFornecedor } = await supabase
    .from('fp_transacoes')
    .select('id')
    .eq('fornecedor_id', id)
    .eq('workspace_id', workspaceId)
    .limit(1)

  if (errorFornecedor) {
    console.error('Erro ao verificar transações (fornecedor):', errorFornecedor)
    throw new Error('Erro ao verificar vínculos do fornecedor')
  }

  // Se tem transações vinculadas, bloquear exclusão
  if ((transacoesCliente && transacoesCliente.length > 0) ||
      (transacoesFornecedor && transacoesFornecedor.length > 0)) {
    throw new Error('Não é possível excluir contato vinculado a transações. Desative-o ao invés disso.')
  }

  // Se não tem transações vinculadas, fazer hard delete (exclusão física)
  const { error: deleteError } = await supabase
    .from('r_contatos')
    .delete()
    .eq('id', id)
    .eq('workspace_id', workspaceId)

  if (deleteError) {
    console.error('Erro ao excluir contato:', deleteError)
    throw new Error(`Erro ao excluir contato: ${deleteError.message}`)
  }
}
