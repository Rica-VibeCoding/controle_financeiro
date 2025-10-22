import { supabase } from './cliente'
import { DivisaoCliente } from '@/tipos/transacao-divisao'

/**
 * Busca divisões de clientes de uma transação
 */
export async function buscarDivisoesClientes(
  transacaoId: string,
  workspaceId: string
): Promise<DivisaoCliente[]> {
  const { data, error } = await supabase
    .from('fp_transacoes_clientes')
    .select('id, cliente_id, valor_alocado')
    .eq('transacao_id', transacaoId)
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: true })

  if (error) throw new Error(`Erro ao buscar divisões de clientes: ${error.message}`)
  return data || []
}

/**
 * Salva divisões de clientes para uma transação
 * Remove divisões antigas e cria as novas
 */
export async function salvarDivisoesClientes(
  transacaoId: string,
  divisoes: DivisaoCliente[],
  workspaceId: string
): Promise<void> {
  // 1. Remover divisões antigas (se houver)
  const { error: deleteError } = await supabase
    .from('fp_transacoes_clientes')
    .delete()
    .eq('transacao_id', transacaoId)
    .eq('workspace_id', workspaceId)

  if (deleteError) throw new Error(`Erro ao remover divisões antigas: ${deleteError.message}`)

  // 2. Se não há divisões, retornar (transação simples)
  if (!divisoes || divisoes.length === 0) return

  // 3. Inserir novas divisões
  const divisoesParaInserir = divisoes.map(div => ({
    transacao_id: transacaoId,
    cliente_id: div.cliente_id,
    valor_alocado: div.valor_alocado,
    workspace_id: workspaceId
  }))

  const { error: insertError } = await supabase
    .from('fp_transacoes_clientes')
    .insert(divisoesParaInserir)

  if (insertError) throw new Error(`Erro ao salvar divisões de clientes: ${insertError.message}`)
}

/**
 * Remove todas as divisões de uma transação
 */
export async function removerDivisoesClientes(
  transacaoId: string,
  workspaceId: string
): Promise<void> {
  const { error } = await supabase
    .from('fp_transacoes_clientes')
    .delete()
    .eq('transacao_id', transacaoId)
    .eq('workspace_id', workspaceId)

  if (error) throw new Error(`Erro ao remover divisões de clientes: ${error.message}`)
}
