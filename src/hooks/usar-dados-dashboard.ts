/**
 * Hook para gerenciar dados do dashboard
 */

import { useState, useEffect, useCallback } from 'react'
import { DadosDashboard, PeriodoFiltro } from '@/tipos/dashboard'
import { DashboardService } from '@/servicos/supabase/dashboard'

// Função debounce simples
function debounce<T extends (...args: any[]) => any>(func: T, wait: number) {
  let timeout: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

export function usarDadosDashboard(periodo: PeriodoFiltro) {
  const [dados, setDados] = useState<DadosDashboard>({
    receitas: 0,
    despesas: 0,
    saldo: 0,
    gastosCartao: 0,
    periodo
  })
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  /**
   * Carregar dados do dashboard para o período atual
   */
  const carregarDados = useCallback(async (periodoAtivo: PeriodoFiltro) => {
    try {
      setLoading(true)
      setError(null)

      // Buscar dados calculados do dashboard
      const dadosCalculados = await DashboardService.calcularDadosDashboard(periodoAtivo)
      
      setDados(dadosCalculados)

    } catch (err) {
      console.error('Erro ao carregar dados do dashboard:', err)
      setError(err instanceof Error ? err.message : 'Erro ao carregar dados')
      
      // Manter dados seguros em caso de erro
      setDados({
        receitas: 0,
        despesas: 0,
        saldo: 0,
        gastosCartao: 0,
        periodo: periodoAtivo
      })
    } finally {
      setLoading(false)
    }
  }, [])

  // Debounce para evitar múltiplas chamadas rápidas
  const carregarDadosDebounced = useCallback(
    debounce((periodo: PeriodoFiltro) => carregarDados(periodo), 300),
    [carregarDados]
  )

  /**
   * Recarregar dados quando período muda
   */
  useEffect(() => {
    carregarDadosDebounced(periodo)
  }, [periodo, carregarDadosDebounced])

  /**
   * Forçar recarregamento dos dados
   */
  const recarregar = useCallback(() => {
    carregarDados(periodo)
  }, [periodo, carregarDados])

  /**
   * Obter dados formatados para os cards
   */
  const obterCardsData = useCallback(() => {
    return [
      {
        titulo: 'Receitas do Período',
        valor: dados.receitas,
        icone: 'TrendingUp',
        cor: 'receita' as const
      },
      {
        titulo: 'Despesas do Período', 
        valor: dados.despesas,
        icone: 'TrendingDown',
        cor: 'despesa' as const
      },
      {
        titulo: 'Saldo do Período',
        valor: dados.saldo,
        icone: 'Wallet',
        cor: 'saldo' as const
      },
      {
        titulo: 'Gastos no Cartão',
        valor: dados.gastosCartao,
        icone: 'CreditCard', 
        cor: 'cartao' as const
      }
    ]
  }, [dados])

  /**
   * Verificar se há dados no período
   */
  const temDados = useCallback((): boolean => {
    return dados.receitas > 0 || dados.despesas > 0
  }, [dados.receitas, dados.despesas])

  /**
   * Obter resumo textual do período
   */
  const obterResumoTexto = useCallback((): string => {
    const meses = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ]
    
    const mesNome = meses[periodo.mes - 1] // periodo.mes é 1-12, array é 0-11
    return `${mesNome} ${periodo.ano}`
  }, [periodo])

  return {
    // Dados principais
    dados,
    loading,
    error,
    
    // Ações
    recarregar,
    
    // Utilitários
    obterCardsData,
    temDados,
    obterResumoTexto,
    
    // Dados individuais (para fácil acesso)
    receitas: dados.receitas,
    despesas: dados.despesas,
    saldo: dados.saldo,
    gastosCartao: dados.gastosCartao,
    periodo: dados.periodo
  }
}