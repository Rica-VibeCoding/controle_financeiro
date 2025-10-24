import { createClient } from './server'
import { logger } from '@/utilitarios/logger'
import { calcularDiasVencimento } from '@/utilitarios/data-helpers'
import type { ContaPagarReceber, ResumoContas, FiltrosContas } from '@/tipos/contas'

/**
 * Calcula data limite baseada no filtro de período
 */
function calcularDataLimite(periodo: FiltrosContas['periodo'], dataFim?: string): string {
  const hoje = new Date()

  switch (periodo) {
    case '30_dias':
      hoje.setDate(hoje.getDate() + 30)
      return hoje.toISOString().split('T')[0]
    case '60_dias':
      hoje.setDate(hoje.getDate() + 60)
      return hoje.toISOString().split('T')[0]
    case '90_dias':
      hoje.setDate(hoje.getDate() + 90)
      return hoje.toISOString().split('T')[0]
    case 'personalizado':
      return dataFim || new Date(hoje.setDate(hoje.getDate() + 30)).toISOString().split('T')[0]
  }
}

/**
 * Busca contas a pagar (despesas previstas)
 */
export async function buscarContasAPagar(
  workspaceId: string,
  filtros: FiltrosContas
): Promise<ContaPagarReceber[]> {
  const supabase = await createClient()
  const dataHoje = new Date().toISOString().split('T')[0]
  const dataLimite = calcularDataLimite(filtros.periodo, filtros.dataFim)

  // DEBUG: Log temporário
  logger.log('[DEBUG] buscarContasAPagar - Params:', {
    workspaceId,
    dataHoje,
    dataLimite,
    periodo: filtros.periodo
  })

  let query = supabase
    .from('fp_transacoes')
    .select(`
      id,
      descricao,
      valor,
      data_vencimento,
      tipo,
      status,
      observacoes,
      recorrente,
      categoria_id,
      conta_id,
      fornecedor_id,
      fp_categorias!inner(nome),
      fp_subcategorias(nome),
      fp_contas!fp_transacoes_conta_id_fkey!inner(nome),
      fornecedor:r_contatos!fp_transacoes_fornecedor_id_fkey(nome)
    `)
    .eq('workspace_id', workspaceId)
    .eq('tipo', 'despesa')
    .eq('status', 'previsto')
    .gte('data_vencimento', dataHoje)
    .lte('data_vencimento', dataLimite)
    .order('data_vencimento', { ascending: true })

  // Filtro por categoria
  if (filtros.categoria) {
    query = query.eq('categoria_id', filtros.categoria)
  }

  // Filtro por busca
  if (filtros.busca) {
    query = query.or(`descricao.ilike.%${filtros.busca}%,r_contatos.nome.ilike.%${filtros.busca}%`)
  }

  const { data, error } = await query

  // DEBUG: Log temporário
  logger.log('[DEBUG] buscarContasAPagar - Resultado:', {
    totalRegistros: data?.length || 0,
    hasError: !!error
  })

  if (error) {
    logger.error('Erro ao buscar contas a pagar:', error)
    throw new Error(`Erro ao buscar dados: ${error.message}`)
  }

  // Mapear para tipo ContaPagarReceber
  return (data || []).map((row: any) => ({
    id: row.id,
    descricao: row.descricao,
    valor: Number(row.valor),
    data_vencimento: row.data_vencimento,
    dias_vencimento: calcularDiasVencimento(row.data_vencimento),
    tipo: row.tipo as 'receita' | 'despesa',
    status: row.status as 'previsto' | 'realizado',
    categoria: row.fp_categorias?.nome || 'Sem categoria',
    subcategoria: row.fp_subcategorias?.nome,
    conta: row.fp_contas?.nome || 'Sem conta',
    contato: row.fornecedor?.nome,
    observacoes: row.observacoes || undefined,
    recorrente: row.recorrente || false,
    categoria_id: row.categoria_id,
    conta_id: row.conta_id,
    contato_id: row.fornecedor_id || undefined
  }))
}

/**
 * Busca contas a receber (receitas previstas)
 */
export async function buscarContasAReceber(
  workspaceId: string,
  filtros: FiltrosContas
): Promise<ContaPagarReceber[]> {
  const supabase = await createClient()
  const dataHoje = new Date().toISOString().split('T')[0]
  const dataLimite = calcularDataLimite(filtros.periodo, filtros.dataFim)

  let query = supabase
    .from('fp_transacoes')
    .select(`
      id,
      descricao,
      valor,
      data_vencimento,
      tipo,
      status,
      observacoes,
      recorrente,
      categoria_id,
      conta_id,
      cliente_id,
      fp_categorias!inner(nome),
      fp_subcategorias(nome),
      fp_contas!fp_transacoes_conta_id_fkey!inner(nome),
      cliente:r_contatos!fk_fp_transacoes_cliente(nome)
    `)
    .eq('workspace_id', workspaceId)
    .eq('tipo', 'receita')
    .eq('status', 'previsto')
    .gte('data_vencimento', dataHoje)
    .lte('data_vencimento', dataLimite)
    .order('data_vencimento', { ascending: true })

  // Filtro por categoria
  if (filtros.categoria) {
    query = query.eq('categoria_id', filtros.categoria)
  }

  // Filtro por busca
  if (filtros.busca) {
    query = query.or(`descricao.ilike.%${filtros.busca}%,r_contatos.nome.ilike.%${filtros.busca}%`)
  }

  const { data, error } = await query

  if (error) {
    logger.error('Erro ao buscar contas a receber:', error)
    throw new Error(`Erro ao buscar dados: ${error.message}`)
  }

  // Mapear para tipo ContaPagarReceber
  return (data || []).map((row: any) => ({
    id: row.id,
    descricao: row.descricao,
    valor: Number(row.valor),
    data_vencimento: row.data_vencimento,
    dias_vencimento: calcularDiasVencimento(row.data_vencimento),
    tipo: row.tipo as 'receita' | 'despesa',
    status: row.status as 'previsto' | 'realizado',
    categoria: row.fp_categorias?.nome || 'Sem categoria',
    subcategoria: row.fp_subcategorias?.nome,
    conta: row.fp_contas?.nome || 'Sem conta',
    contato: row.cliente?.nome,
    observacoes: row.observacoes || undefined,
    recorrente: row.recorrente || false,
    categoria_id: row.categoria_id,
    conta_id: row.conta_id,
    contato_id: row.cliente_id || undefined
  }))
}

/**
 * Busca contas vencidas (pagar + receber)
 */
export async function buscarContasVencidas(
  workspaceId: string,
  filtros: FiltrosContas
): Promise<ContaPagarReceber[]> {
  const supabase = await createClient()
  const dataHoje = new Date().toISOString().split('T')[0]

  let query = supabase
    .from('fp_transacoes')
    .select(`
      id,
      descricao,
      valor,
      data_vencimento,
      tipo,
      status,
      observacoes,
      recorrente,
      categoria_id,
      conta_id,
      cliente_id,
      fornecedor_id,
      fp_categorias!inner(nome),
      fp_subcategorias(nome),
      fp_contas!fp_transacoes_conta_id_fkey!inner(nome),
      cliente:r_contatos!fk_fp_transacoes_cliente(nome),
      fornecedor:r_contatos!fp_transacoes_fornecedor_id_fkey(nome)
    `)
    .eq('workspace_id', workspaceId)
    .eq('status', 'previsto')
    .lt('data_vencimento', dataHoje)
    .order('data_vencimento', { ascending: false })

  // Filtro por categoria
  if (filtros.categoria) {
    query = query.eq('categoria_id', filtros.categoria)
  }

  // Filtro por busca
  if (filtros.busca) {
    query = query.or(`descricao.ilike.%${filtros.busca}%,r_contatos.nome.ilike.%${filtros.busca}%`)
  }

  const { data, error } = await query

  if (error) {
    logger.error('Erro ao buscar contas vencidas:', error)
    throw new Error(`Erro ao buscar dados: ${error.message}`)
  }

  // Mapear para tipo ContaPagarReceber
  return (data || []).map((row: any) => ({
    id: row.id,
    descricao: row.descricao,
    valor: Number(row.valor),
    data_vencimento: row.data_vencimento,
    dias_vencimento: calcularDiasVencimento(row.data_vencimento),
    tipo: row.tipo as 'receita' | 'despesa',
    status: row.status as 'previsto' | 'realizado',
    categoria: row.fp_categorias?.nome || 'Sem categoria',
    subcategoria: row.fp_subcategorias?.nome,
    conta: row.fp_contas?.nome || 'Sem conta',
    contato: row.tipo === 'receita' ? row.cliente?.nome : row.fornecedor?.nome,
    observacoes: row.observacoes || undefined,
    recorrente: row.recorrente || false,
    categoria_id: row.categoria_id,
    conta_id: row.conta_id,
    contato_id: row.tipo === 'receita' ? row.cliente_id : row.fornecedor_id
  }))
}

/**
 * Calcula resumo (KPIs) para os cards
 */
export async function calcularResumo(
  workspaceId: string
): Promise<ResumoContas> {
  const supabase = await createClient()
  const dataHoje = new Date().toISOString().split('T')[0]
  const hoje = new Date()
  const data30Dias = new Date(hoje.setDate(hoje.getDate() + 30)).toISOString().split('T')[0]

  // A Pagar (próximos 30 dias)
  const { data: aPagar } = await supabase
    .from('fp_transacoes')
    .select('valor')
    .eq('workspace_id', workspaceId)
    .eq('tipo', 'despesa')
    .eq('status', 'previsto')
    .gte('data_vencimento', dataHoje)
    .lte('data_vencimento', data30Dias)

  // A Receber (próximos 30 dias)
  const { data: aReceber } = await supabase
    .from('fp_transacoes')
    .select('valor')
    .eq('workspace_id', workspaceId)
    .eq('tipo', 'receita')
    .eq('status', 'previsto')
    .gte('data_vencimento', dataHoje)
    .lte('data_vencimento', data30Dias)

  // Vencido Pagar
  const { data: vencidoPagar } = await supabase
    .from('fp_transacoes')
    .select('valor')
    .eq('workspace_id', workspaceId)
    .eq('tipo', 'despesa')
    .eq('status', 'previsto')
    .lt('data_vencimento', dataHoje)

  // Atrasado Receber
  const { data: atrasadoReceber } = await supabase
    .from('fp_transacoes')
    .select('valor')
    .eq('workspace_id', workspaceId)
    .eq('tipo', 'receita')
    .eq('status', 'previsto')
    .lt('data_vencimento', dataHoje)

  return {
    aPagar30Dias: {
      total: (aPagar || []).reduce((sum: number, t: { valor: number | string }) => sum + Number(t.valor), 0),
      quantidade: (aPagar || []).length
    },
    aReceber30Dias: {
      total: (aReceber || []).reduce((sum: number, t: { valor: number | string }) => sum + Number(t.valor), 0),
      quantidade: (aReceber || []).length
    },
    vencidoPagar: {
      total: (vencidoPagar || []).reduce((sum: number, t: { valor: number | string }) => sum + Number(t.valor), 0),
      quantidade: (vencidoPagar || []).length
    },
    atrasadoReceber: {
      total: (atrasadoReceber || []).reduce((sum: number, t: { valor: number | string }) => sum + Number(t.valor), 0),
      quantidade: (atrasadoReceber || []).length
    }
  }
}

/**
 * Marca transação como realizada (paga/recebida)
 */
export async function marcarComoRealizado(
  transacaoId: string
): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('fp_transacoes')
    .update({
      status: 'realizado',
      data: new Date().toISOString() // Atualiza data para hoje
    })
    .eq('id', transacaoId)

  if (error) {
    logger.error('Erro ao marcar como realizado:', error)
    throw new Error(`Erro ao atualizar transação: ${error.message}`)
  }
}
