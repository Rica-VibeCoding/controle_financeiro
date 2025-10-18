import { createClient } from './auth-client'
import type { DadosFluxoCaixa, KPIsFluxoCaixa, FiltrosFluxoCaixa } from '@/tipos/fluxo-caixa'
import { calcularPeriodo } from '@/utilitarios/periodo-helpers'
import { logger } from '@/utilitarios/logger'

/**
 * Busca dados de Fluxo de Caixa Projetado vs Realizado
 */
export async function buscarDadosFluxoCaixa(
  workspaceId: string,
  filtros: FiltrosFluxoCaixa
): Promise<DadosFluxoCaixa[]> {
  const supabase = createClient()

  // Calcular datas usando utilitário centralizado
  const { dataInicio, dataFim } = calcularPeriodo(
    filtros.periodo,
    filtros.dataInicio,
    filtros.dataFim
  )

  const { data, error } = await supabase.rpc('calcular_fluxo_caixa', {
    p_workspace_id: workspaceId,
    p_data_inicio: dataInicio,
    p_data_fim: dataFim,
    p_tipo: filtros.tipo
  })

  if (error) {
    logger.error('Erro ao buscar fluxo de caixa', { error: error.message, workspaceId })
    throw new Error(`Erro ao buscar dados: ${error.message}`)
  }

  if (!data || data.length === 0) {
    return []
  }

  // Mapear resultado
  return data.map((row: any) => ({
    mes: row.mes,
    mes_numero: row.mes_numero,
    ano: row.ano,
    previsto: parseFloat(row.previsto) || 0,
    realizado: parseFloat(row.realizado) || 0,
    variacao_valor: parseFloat(row.variacao_valor) || 0,
    variacao_percentual: parseFloat(row.variacao_percentual) || 0
  }))
}

/**
 * Busca KPIs para os cards superiores
 */
export async function buscarKPIsFluxoCaixa(
  workspaceId: string,
  filtros: FiltrosFluxoCaixa
): Promise<KPIsFluxoCaixa> {
  const supabase = createClient()

  // Calcular datas usando utilitário centralizado
  const { dataInicio, dataFim } = calcularPeriodo(
    filtros.periodo,
    filtros.dataInicio,
    filtros.dataFim
  )

  const { data, error } = await supabase.rpc('calcular_kpis_fluxo_caixa', {
    p_workspace_id: workspaceId,
    p_data_inicio: dataInicio,
    p_data_fim: dataFim
  })

  if (error) {
    logger.error('Erro ao buscar KPIs de fluxo de caixa', { error: error.message, workspaceId })
    throw new Error(`Erro ao buscar KPIs: ${error.message}`)
  }

  if (!data) {
    return {
      saldo_previsto: 0,
      saldo_realizado: 0,
      variacao_percentual: 0,
      taxa_acerto: 0,
      diferenca_total: 0
    }
  }

  return {
    saldo_previsto: parseFloat(data.saldo_previsto) || 0,
    saldo_realizado: parseFloat(data.saldo_realizado) || 0,
    variacao_percentual: parseFloat(data.variacao_percentual) || 0,
    taxa_acerto: parseFloat(data.taxa_acerto) || 0,
    diferenca_total: parseFloat(data.diferenca_total) || 0
  }
}
