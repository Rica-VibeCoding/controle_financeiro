import { supabase } from './cliente'
import type { Conta } from '@/tipos/database'
import { mutate } from 'swr'

// Tipos auxiliares baseados na documentação
type NovaConta = Omit<Conta, 'id' | 'created_at' | 'workspace_id'>

type ContaComSaldo = Conta & {
  saldo: number
  saldo_formatado: string
}

// Função auxiliar para formatação (temporária até utilitários serem criados)
function formatarMoeda(valor: number): string {
  return valor.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  })
}

/**
 * Buscar todas as contas ativas
 */
export async function obterContas(incluirInativas = false, workspaceId: string): Promise<Conta[]> {
  let query = supabase
    .from('fp_contas')
    .select('*')
    .order('nome')

  if (!incluirInativas) {
    query = query.eq('ativo', true)
  }
  
  query = query.eq('workspace_id', workspaceId)

  const { data, error } = await query

  if (error) throw new Error(`Erro ao buscar contas: ${error.message}`)
  return data || []
}

/**
 * Buscar contas com saldo calculado (otimizado - corrige problema N+1)
 */
export async function obterContasComSaldo(workspaceId: string): Promise<ContaComSaldo[]> {
  // Buscar contas ativas
  const contas = await obterContas(false, workspaceId)
  
  // Calcular todos os saldos de uma vez usando função SQL
  const { data: saldos, error } = await supabase
    .rpc('calcular_saldos_contas', { p_workspace_id: workspaceId })
  
  if (error) throw new Error(`Erro ao calcular saldos: ${error.message}`)
  
  // Mapear saldos por conta_id para acesso O(1)
  const saldosMap = new Map<string, number>()
  saldos?.forEach((item: any) => saldosMap.set(item.conta_id, item.saldo || 0))
  
  // Combinar dados das contas com seus saldos
  const contasComSaldo: ContaComSaldo[] = contas.map(conta => {
    const saldo = saldosMap.get(conta.id) || 0
    return {
      ...conta,
      saldo,
      saldo_formatado: formatarMoeda(saldo)
    }
  })

  return contasComSaldo
}


/**
 * Criar nova conta
 */
export async function criarConta(conta: NovaConta, workspaceId: string): Promise<Conta> {
  const { data, error } = await supabase
    .from('fp_contas')
    .insert([{ ...conta, workspace_id: workspaceId }])
    .select()
    .single()

  if (error) throw new Error(`Erro ao criar conta: ${error.message}`)

  // Invalidar cache automaticamente
  mutate((key: any) => 
    Array.isArray(key) && 
    key[0] === 'dados-auxiliares' && 
    key[1] === workspaceId
  )

  // Invalidar saldos das contas
  mutate((key: any) => 
    Array.isArray(key) && 
    key[0] === 'contas-bancarias' && 
    key[1] === workspaceId
  )

  return data
}

/**
 * Obter conta por ID
 */
export async function obterContaPorId(id: string): Promise<Conta> {
  const { data, error } = await supabase
    .from('fp_contas')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      throw new Error('Conta não encontrada')
    }
    throw new Error(`Erro ao buscar conta: ${error.message}`)
  }

  return data
}

/**
 * Atualizar conta
 */
export async function atualizarConta(
  id: string, 
  atualizacoes: Partial<NovaConta>,
  workspaceId: string
): Promise<void> {
  const { error } = await supabase
    .from('fp_contas')
    .update(atualizacoes)
    .eq('id', id)
    .eq('workspace_id', workspaceId)

  if (error) throw new Error(`Erro ao atualizar conta: ${error.message}`)

  // Invalidar cache automaticamente
  mutate((key: any) => 
    Array.isArray(key) && 
    key[0] === 'dados-auxiliares' && 
    key[1] === workspaceId
  )

  // Invalidar saldos das contas
  mutate((key: any) => 
    Array.isArray(key) && 
    key[0] === 'contas-bancarias' && 
    key[1] === workspaceId
  )
}

/**
 * Verificar se conta possui transações vinculadas
 */
async function verificarTransacoesVinculadasConta(contaId: string, workspaceId: string): Promise<boolean> {
  // Verificar transações normais
  const queryTransacoes = supabase
    .from('fp_transacoes')
    .select('id')
    .eq('conta_id', contaId)
    .limit(1)
  
  queryTransacoes.eq('workspace_id', workspaceId)
  
  const { data: transacoes, error: errorTransacoes } = await queryTransacoes

  if (errorTransacoes) throw new Error(`Erro ao verificar transações: ${errorTransacoes.message}`)

  if (transacoes && transacoes.length > 0) return true

  // Verificar transferências como conta destino
  const queryTransferencias = supabase
    .from('fp_transacoes')
    .select('id')
    .eq('conta_destino_id', contaId)
    .limit(1)
  
  queryTransferencias.eq('workspace_id', workspaceId)
  
  const { data: transferencias, error: errorTransferencias } = await queryTransferencias

  if (errorTransferencias) throw new Error(`Erro ao verificar transferências: ${errorTransferencias.message}`)

  return (transferencias && transferencias.length > 0) || false
}

/**
 * Excluir conta (hard delete)
 * Verifica integridade antes da exclusão
 */
export async function excluirConta(id: string, workspaceId: string): Promise<void> {
  // Verificar se tem transações vinculadas
  const temTransacoes = await verificarTransacoesVinculadasConta(id, workspaceId)
  if (temTransacoes) {
    throw new Error('Não é possível excluir conta com transações vinculadas')
  }

  // Executar exclusão
  const { error } = await supabase
    .from('fp_contas')
    .delete()
    .eq('id', id)
    .eq('workspace_id', workspaceId)

  if (error) throw new Error(`Erro ao excluir conta: ${error.message}`)

  // Invalidar cache automaticamente
  mutate((key: any) => 
    Array.isArray(key) && 
    key[0] === 'dados-auxiliares' && 
    key[1] === workspaceId
  )

  // Invalidar saldos das contas
  mutate((key: any) => 
    Array.isArray(key) && 
    key[0] === 'contas-bancarias' && 
    key[1] === workspaceId
  )
}