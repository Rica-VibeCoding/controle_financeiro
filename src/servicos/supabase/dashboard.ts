/**
 * Serviços para Dashboard - Dados reais do Supabase
 */

import { supabase } from './cliente'
import { DadosDashboard, PeriodoFiltro } from '@/tipos/dashboard'

export class DashboardService {
  
  /**
   * Obter anos disponíveis nos dados
   * @returns Array de anos com dados ordenados decrescente
   */
  static async obterAnosDisponiveis(): Promise<number[]> {
    try {
      const { data, error } = await supabase
        .from('fp_transacoes')
        .select('data')
        .not('data', 'is', null)

      if (error) {
        console.error('Erro ao buscar anos disponíveis:', error)
        return [new Date().getFullYear()]
      }

      // Extrair anos únicos e ordenar decrescente
      const anos = Array.from(new Set(
        data.map(t => new Date(t.data).getFullYear())
      )).sort((a, b) => b - a)

      return anos.length > 0 ? anos : [new Date().getFullYear()]

    } catch (error) {
      console.error('Erro ao processar anos disponíveis:', error)
      return [new Date().getFullYear()]
    }
  }

  /**
   * Obter meses com dados em um ano específico
   * @param ano - Ano para verificar
   * @returns Array de meses (1-12) que têm dados
   */
  static async obterMesesComDados(ano: number): Promise<number[]> {
    try {
      const { data, error } = await supabase
        .from('fp_transacoes')
        .select('data')
        .gte('data', `${ano}-01-01`)
        .lt('data', `${ano + 1}-01-01`)
        .not('data', 'is', null)

      if (error) {
        console.error('Erro ao buscar meses com dados:', error)
        return []
      }

      // Extrair meses únicos e ordenar
      const meses = Array.from(new Set(
        data.map(t => new Date(t.data).getMonth() + 1) // JS usa 0-11, convertemos para 1-12
      )).sort((a, b) => a - b)

      return meses

    } catch (error) {
      console.error('Erro ao processar meses com dados:', error)
      return []
    }
  }

  /**
   * Calcular dados dos 4 cards do dashboard
   * @param periodo - Mês e ano para filtrar
   * @returns Dados calculados dos cards
   */
  static async calcularDadosDashboard(periodo: PeriodoFiltro): Promise<DadosDashboard> {
    try {
      // Calcular data início e fim do mês
      const dataInicio = `${periodo.ano}-${periodo.mes.toString().padStart(2, '0')}-01`
      const proximoMes = periodo.mes === 12 ? 1 : periodo.mes + 1
      const proximoAno = periodo.mes === 12 ? periodo.ano + 1 : periodo.ano
      const dataFim = `${proximoAno}-${proximoMes.toString().padStart(2, '0')}-01`

      // Query única otimizada para buscar receitas e despesas
      const { data: transacoesData, error } = await supabase
        .from('fp_transacoes')
        .select('tipo, valor')
        .eq('status', 'realizado')
        .gte('data', dataInicio)
        .lt('data', dataFim)
        .in('tipo', ['receita', 'despesa'])

      if (error) {
        throw new Error('Erro ao buscar dados financeiros')
      }

      // Calcular totais em uma única passada
      let receitas = 0
      let despesas = 0
      
      transacoesData?.forEach(transacao => {
        const valor = Number(transacao.valor)
        if (transacao.tipo === 'receita') {
          receitas += valor
        } else if (transacao.tipo === 'despesa') {
          despesas += valor
        }
      })

      const saldo = receitas - despesas

      // Buscar gastos no cartão (otimizado separadamente)
      const gastosCartao = await this.calcularGastosCartao(periodo)

      return {
        receitas,
        despesas,
        saldo,
        gastosCartao,
        periodo
      }

    } catch (error) {
      console.error('Erro ao calcular dados do dashboard:', error)
      
      // Retorno seguro em caso de erro
      return {
        receitas: 0,
        despesas: 0,
        saldo: 0,
        gastosCartao: 0,
        periodo
      }
    }
  }

  /**
   * Calcular gastos específicos no cartão
   * @param periodo - Mês e ano para filtrar
   * @returns Valor total de gastos no cartão
   */
  static async calcularGastosCartao(periodo: PeriodoFiltro): Promise<number> {
    try {
      // Calcular data início e fim do mês
      const dataInicio = `${periodo.ano}-${periodo.mes.toString().padStart(2, '0')}-01`
      const proximoMes = periodo.mes === 12 ? 1 : periodo.mes + 1
      const proximoAno = periodo.mes === 12 ? periodo.ano + 1 : periodo.ano
      const dataFim = `${proximoAno}-${proximoMes.toString().padStart(2, '0')}-01`

      // Buscar gastos com formas de pagamento tipo 'credito'
      const { data, error } = await supabase
        .from('fp_transacoes')
        .select(`
          valor,
          fp_formas_pagamento!inner(nome, tipo)
        `)
        .eq('tipo', 'despesa')
        .eq('status', 'realizado')
        .eq('fp_formas_pagamento.tipo', 'credito')
        .gte('data', dataInicio)
        .lt('data', dataFim)

      if (error) {
        console.error('Erro ao buscar gastos no cartão:', error)
        return 0
      }

      return data?.reduce((sum, t) => sum + Number(t.valor), 0) || 0

    } catch (error) {
      console.error('Erro ao calcular gastos no cartão:', error)
      return 0
    }
  }

  /**
   * Obter período atual (mês e ano atual)
   * @returns Período atual
   */
  static obterPeriodoAtual(): PeriodoFiltro {
    const hoje = new Date()
    return {
      mes: hoje.getMonth() + 1, // JS usa 0-11, precisamos 1-12
      ano: hoje.getFullYear()
    }
  }
}