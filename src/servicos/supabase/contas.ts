import { supabase } from './cliente'
import type { Conta } from '@/tipos/database'

// Tipos auxiliares baseados na documentação
type NovaConta = Omit<Conta, 'id' | 'created_at'>

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
export async function obterContas(incluirInativas = false): Promise<Conta[]> {
  let query = supabase
    .from('fp_contas')
    .select('*')
    .order('nome')

  if (!incluirInativas) {
    query = query.eq('ativo', true)
  }

  const { data, error } = await query

  if (error) throw new Error(`Erro ao buscar contas: ${error.message}`)
  return data || []
}

/**
 * Buscar contas com saldo calculado
 */
export async function obterContasComSaldo(): Promise<ContaComSaldo[]> {
  const contas = await obterContas()
  const contasComSaldo: ContaComSaldo[] = []

  for (const conta of contas) {
    const saldo = await calcularSaldoConta(conta.id)
    contasComSaldo.push({
      ...conta,
      saldo,
      saldo_formatado: formatarMoeda(saldo)
    })
  }

  return contasComSaldo
}

/**
 * Calcular saldo de uma conta específica
 */
async function calcularSaldoConta(contaId: string): Promise<number> {
  // Receitas e despesas normais
  const { data: transacoes, error } = await supabase
    .from('fp_transacoes')
    .select('valor, tipo')
    .eq('conta_id', contaId)
    .eq('status', 'realizado')

  if (error) throw new Error(`Erro ao calcular saldo: ${error.message}`)

  let saldo = 0
  
  for (const transacao of transacoes || []) {
    if (transacao.tipo === 'receita') {
      saldo += transacao.valor
    } else if (transacao.tipo === 'despesa') {
      saldo -= transacao.valor
    }
    // Transferências já são tratadas separadamente
  }

  // Transferências recebidas (como conta destino)
  const { data: transferenciasRecebidas, error: errorRecebidas } = await supabase
    .from('fp_transacoes')
    .select('valor')
    .eq('conta_destino_id', contaId)
    .eq('tipo', 'transferencia')
    .eq('status', 'realizado')

  if (errorRecebidas) throw new Error(`Erro ao calcular transferências: ${errorRecebidas.message}`)

  for (const transferencia of transferenciasRecebidas || []) {
    saldo += transferencia.valor
  }

  // Transferências enviadas (como conta origem)
  const { data: transferenciasEnviadas, error: errorEnviadas } = await supabase
    .from('fp_transacoes')
    .select('valor')
    .eq('conta_id', contaId)
    .eq('tipo', 'transferencia')
    .eq('status', 'realizado')

  if (errorEnviadas) throw new Error(`Erro ao calcular transferências: ${errorEnviadas.message}`)

  for (const transferencia of transferenciasEnviadas || []) {
    saldo -= transferencia.valor
  }

  return saldo
}

/**
 * Criar nova conta
 */
export async function criarConta(conta: NovaConta): Promise<Conta> {
  const { data, error } = await supabase
    .from('fp_contas')
    .insert([conta])
    .select()
    .single()

  if (error) throw new Error(`Erro ao criar conta: ${error.message}`)
  return data
}

/**
 * Atualizar conta
 */
export async function atualizarConta(
  id: string, 
  atualizacoes: Partial<NovaConta>
): Promise<void> {
  const { error } = await supabase
    .from('fp_contas')
    .update(atualizacoes)
    .eq('id', id)

  if (error) throw new Error(`Erro ao atualizar conta: ${error.message}`)
}

/**
 * Verificar se conta possui transações vinculadas
 */
async function verificarTransacoesVinculadasConta(contaId: string): Promise<boolean> {
  // Verificar transações normais
  const { data: transacoes, error: errorTransacoes } = await supabase
    .from('fp_transacoes')
    .select('id')
    .eq('conta_id', contaId)
    .limit(1)

  if (errorTransacoes) throw new Error(`Erro ao verificar transações: ${errorTransacoes.message}`)

  if (transacoes && transacoes.length > 0) return true

  // Verificar transferências como conta destino
  const { data: transferencias, error: errorTransferencias } = await supabase
    .from('fp_transacoes')
    .select('id')
    .eq('conta_destino_id', contaId)
    .limit(1)

  if (errorTransferencias) throw new Error(`Erro ao verificar transferências: ${errorTransferencias.message}`)

  return (transferencias && transferencias.length > 0) || false
}

/**
 * Excluir conta (hard delete)
 * Verifica integridade antes da exclusão
 */
export async function excluirConta(id: string): Promise<void> {
  // Verificar se tem transações vinculadas
  const temTransacoes = await verificarTransacoesVinculadasConta(id)
  if (temTransacoes) {
    throw new Error('Não é possível excluir conta com transações vinculadas')
  }

  // Executar exclusão
  const { error } = await supabase
    .from('fp_contas')
    .delete()
    .eq('id', id)

  if (error) throw new Error(`Erro ao excluir conta: ${error.message}`)
}