import { createClient } from './auth-client'
import type { ClienteROI, CardKPI, FiltrosROI, DetalhesCliente, EvolucaoMensal } from '@/tipos/roi-cliente'

/**
 * Busca dados de ROI por Cliente (r_contatos)
 */
export async function buscarDadosROIClientes(
  workspaceId: string,
  filtros: FiltrosROI
): Promise<ClienteROI[]> {
  const supabase = createClient()

  // Calcular datas baseadas no filtro
  let dataInicio: string | null = null
  let dataFim: string | null = null

  const hoje = new Date()

  switch (filtros.periodo) {
    case 'mes_atual':
      dataInicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString().split('T')[0]
      dataFim = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).toISOString().split('T')[0]
      break
    case '3_meses':
      dataInicio = new Date(hoje.getFullYear(), hoje.getMonth() - 3, 1).toISOString().split('T')[0]
      dataFim = hoje.toISOString().split('T')[0]
      break
    case '6_meses':
      dataInicio = new Date(hoje.getFullYear(), hoje.getMonth() - 6, 1).toISOString().split('T')[0]
      dataFim = hoje.toISOString().split('T')[0]
      break
    case '1_ano':
      dataInicio = new Date(hoje.getFullYear() - 1, hoje.getMonth(), 1).toISOString().split('T')[0]
      dataFim = hoje.toISOString().split('T')[0]
      break
    case 'personalizado':
      dataInicio = filtros.dataInicio || null
      dataFim = filtros.dataFim || null
      break
    case 'todo':
    default:
      dataInicio = null
      dataFim = null
      break
  }

  const { data, error } = await supabase.rpc('calcular_roi_clientes_v2', {
    p_workspace_id: workspaceId,
    p_data_inicio: dataInicio,
    p_data_fim: dataFim
  })

  if (error) {
    console.error('Erro ao buscar ROI clientes:', error)
    throw new Error(`Erro ao buscar dados: ${error.message}`)
  }

  if (!data) {
    return []
  }

  // Mapear resultado para o tipo ClienteROI
  const clientes: ClienteROI[] = data.map((row: any) => ({
    id: row.cliente_id,
    nome: row.cliente_nome,
    receita: parseFloat(row.receita) || 0,
    despesa: parseFloat(row.despesa) || 0,
    lucro: parseFloat(row.lucro) || 0,
    margem: parseFloat(row.margem) || 0
  }))

  // Aplicar ordenação
  return ordenarClientes(clientes, filtros.ordenacao)
}

/**
 * Busca KPIs para os cards superiores
 */
export async function buscarKPIs(workspaceId: string): Promise<CardKPI> {
  const supabase = createClient()

  const hoje = new Date()
  const mesAtual = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`

  const { data, error } = await supabase.rpc('calcular_kpis_roi_clientes_v2', {
    p_workspace_id: workspaceId,
    p_mes: mesAtual
  })

  if (error) {
    console.error('Erro ao buscar KPIs:', error)
    throw new Error(`Erro ao buscar KPIs: ${error.message}`)
  }

  if (!data) {
    return {
      melhorRoiPercentual: { cliente: 'Sem dados', valor: 0 },
      melhorRoiValor: { cliente: 'Sem dados', valor: 0 },
      margemMensal: { percentual: 0, lucroTotal: 0 }
    }
  }

  return data as CardKPI
}

/**
 * Busca detalhamento de receitas e despesas por categoria de um cliente
 */
export async function buscarDetalhesCliente(
  workspaceId: string,
  clienteId: string,
  filtros: FiltrosROI
): Promise<DetalhesCliente> {
  const supabase = createClient()

  // Calcular datas baseadas no filtro (mesma lógica da função principal)
  let dataInicio: string | null = null
  let dataFim: string | null = null

  const hoje = new Date()

  switch (filtros.periodo) {
    case 'mes_atual':
      dataInicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString().split('T')[0]
      dataFim = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).toISOString().split('T')[0]
      break
    case '3_meses':
      dataInicio = new Date(hoje.getFullYear(), hoje.getMonth() - 3, 1).toISOString().split('T')[0]
      dataFim = hoje.toISOString().split('T')[0]
      break
    case '6_meses':
      dataInicio = new Date(hoje.getFullYear(), hoje.getMonth() - 6, 1).toISOString().split('T')[0]
      dataFim = hoje.toISOString().split('T')[0]
      break
    case '1_ano':
      dataInicio = new Date(hoje.getFullYear() - 1, hoje.getMonth(), 1).toISOString().split('T')[0]
      dataFim = hoje.toISOString().split('T')[0]
      break
    case 'personalizado':
      dataInicio = filtros.dataInicio || null
      dataFim = filtros.dataFim || null
      break
    case 'todo':
    default:
      dataInicio = null
      dataFim = null
      break
  }

  const { data, error } = await supabase.rpc('buscar_detalhes_roi_cliente_v2', {
    p_workspace_id: workspaceId,
    p_cliente_id: clienteId,
    p_data_inicio: dataInicio,
    p_data_fim: dataFim
  })

  if (error) {
    console.error('Erro ao buscar detalhes do cliente:', error)
    throw new Error(`Erro ao buscar detalhes: ${error.message}`)
  }

  if (!data) {
    return {
      receitas: [],
      despesas: [],
      totais: { receita: 0, despesa: 0 }
    }
  }

  return {
    receitas: data.receitas || [],
    despesas: data.despesas || [],
    totais: data.totais || { receita: 0, despesa: 0 }
  }
}

/**
 * Busca evolução mensal de receitas/despesas de um cliente
 */
export async function buscarEvolucaoCliente(
  workspaceId: string,
  clienteId: string,
  filtros: FiltrosROI
): Promise<EvolucaoMensal[]> {
  const supabase = createClient()

  // Calcular datas baseadas no filtro
  let dataInicio: string | null = null
  let dataFim: string | null = null

  const hoje = new Date()

  switch (filtros.periodo) {
    case 'mes_atual':
      dataInicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString().split('T')[0]
      dataFim = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).toISOString().split('T')[0]
      break
    case '3_meses':
      dataInicio = new Date(hoje.getFullYear(), hoje.getMonth() - 3, 1).toISOString().split('T')[0]
      dataFim = hoje.toISOString().split('T')[0]
      break
    case '6_meses':
      dataInicio = new Date(hoje.getFullYear(), hoje.getMonth() - 6, 1).toISOString().split('T')[0]
      dataFim = hoje.toISOString().split('T')[0]
      break
    case '1_ano':
      dataInicio = new Date(hoje.getFullYear() - 1, hoje.getMonth(), 1).toISOString().split('T')[0]
      dataFim = hoje.toISOString().split('T')[0]
      break
    case 'personalizado':
      dataInicio = filtros.dataInicio || null
      dataFim = filtros.dataFim || null
      break
    case 'todo':
    default:
      dataInicio = null
      dataFim = null
      break
  }

  const { data, error } = await supabase.rpc('buscar_evolucao_roi_cliente_v2', {
    p_workspace_id: workspaceId,
    p_cliente_id: clienteId,
    p_data_inicio: dataInicio,
    p_data_fim: dataFim
  })

  if (error) {
    console.error('Erro ao buscar evolução do cliente:', error)
    throw new Error(`Erro ao buscar evolução: ${error.message}`)
  }

  if (!data || data.length === 0) {
    return []
  }

  // Mapear resultado para o tipo EvolucaoMensal
  return data.map((row: any) => ({
    mes: row.mes,
    mes_numero: row.mes_numero,
    ano: row.ano,
    receita: parseFloat(row.receita) || 0,
    despesa: parseFloat(row.despesa) || 0,
    lucro: parseFloat(row.lucro) || 0,
    margem: parseFloat(row.margem) || 0
  }))
}

/**
 * Ordena clientes conforme critério selecionado
 */
function ordenarClientes(clientes: ClienteROI[], ordenacao: FiltrosROI['ordenacao']): ClienteROI[] {
  switch (ordenacao) {
    case 'margem_desc':
      return clientes.sort((a, b) => b.margem - a.margem)
    case 'margem_asc':
      return clientes.sort((a, b) => a.margem - b.margem)
    case 'lucro_desc':
      return clientes.sort((a, b) => b.lucro - a.lucro)
    case 'lucro_asc':
      return clientes.sort((a, b) => a.lucro - b.lucro)
    case 'receita_desc':
      return clientes.sort((a, b) => b.receita - a.receita)
    case 'nome_asc':
      return clientes.sort((a, b) => a.nome.localeCompare(b.nome))
    default:
      return clientes
  }
}
