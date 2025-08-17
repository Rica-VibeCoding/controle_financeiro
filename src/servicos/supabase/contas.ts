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
    .eq('status', 'pago')

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
    .eq('status', 'pago')

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
    .eq('status', 'pago')

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