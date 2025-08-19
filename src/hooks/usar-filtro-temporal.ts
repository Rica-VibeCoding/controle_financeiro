/**
 * Hook para gerenciar filtro temporal do dashboard
 */

import { useState, useEffect, useCallback } from 'react'
import { FiltroTemporal, PeriodoFiltro } from '@/tipos/dashboard'
import { DashboardService } from '@/servicos/supabase/dashboard'

export function usarFiltroTemporal() {
  const [filtro, setFiltro] = useState<FiltroTemporal>({
    mesAtivo: new Date().getMonth() + 1, // JS usa 0-11, convertemos para 1-12
    anoAtivo: new Date().getFullYear(),
    anosDisponiveis: [],
    mesesComDados: []
  })
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  /**
   * Carregar anos disponíveis nos dados
   */
  const carregarAnosDisponiveis = useCallback(async () => {
    try {
      const anos = await DashboardService.obterAnosDisponiveis()
      
      setFiltro(prev => ({
        ...prev,
        anosDisponiveis: anos,
        // Se ano atual não está nos dados, usar o primeiro ano disponível
        anoAtivo: anos.includes(prev.anoAtivo) ? prev.anoAtivo : anos[0]
      }))

    } catch (err) {
      console.error('Erro ao carregar anos disponíveis:', err)
      setError('Erro ao carregar anos disponíveis')
    }
  }, [])

  /**
   * Carregar meses com dados para o ano ativo
   */
  const carregarMesesComDados = useCallback(async (ano: number) => {
    try {
      const meses = await DashboardService.obterMesesComDados(ano)
      
      setFiltro(prev => ({
        ...prev,
        mesesComDados: meses,
        // Se mês atual não tem dados, usar o primeiro mês disponível
        mesAtivo: meses.includes(prev.mesAtivo) ? prev.mesAtivo : (meses[0] || prev.mesAtivo)
      }))

    } catch (err) {
      console.error('Erro ao carregar meses com dados:', err)
      setError('Erro ao carregar meses com dados')
    }
  }, [])

  /**
   * Alterar ano ativo
   */
  const alterarAno = useCallback(async (novoAno: number) => {
    if (!filtro.anosDisponiveis.includes(novoAno)) return

    setFiltro(prev => ({ ...prev, anoAtivo: novoAno }))
    await carregarMesesComDados(novoAno)
  }, [filtro.anosDisponiveis, carregarMesesComDados])

  /**
   * Alterar mês ativo
   */
  const alterarMes = useCallback((novoMes: number) => {
    // Só permite alterar se o mês tem dados
    if (!filtro.mesesComDados.includes(novoMes)) return

    setFiltro(prev => ({ ...prev, mesAtivo: novoMes }))
  }, [filtro.mesesComDados])

  /**
   * Obter período atual (mês e ano ativo)
   */
  const obterPeriodoAtivo = useCallback((): PeriodoFiltro => ({
    mes: filtro.mesAtivo,
    ano: filtro.anoAtivo
  }), [filtro.mesAtivo, filtro.anoAtivo])

  /**
   * Verificar se um mês tem dados
   */
  const mesTemDados = useCallback((mes: number): boolean => {
    return filtro.mesesComDados.includes(mes)
  }, [filtro.mesesComDados])

  /**
   * Verificar se um mês está ativo
   */
  const mesEstaAtivo = useCallback((mes: number): boolean => {
    return filtro.mesAtivo === mes
  }, [filtro.mesAtivo])

  /**
   * Verificar se um ano está ativo
   */
  const anoEstaAtivo = useCallback((ano: number): boolean => {
    return filtro.anoAtivo === ano
  }, [filtro.anoAtivo])

  /**
   * Inicializar filtro na primeira carga
   */
  useEffect(() => {
    async function inicializar() {
      try {
        setLoading(true)
        setError(null)

        // Carregar anos disponíveis
        await carregarAnosDisponiveis()
        
        // Carregar meses para o ano atual (ou primeiro disponível)
        const anoParaCarregar = filtro.anoAtivo
        await carregarMesesComDados(anoParaCarregar)

      } catch (err) {
        console.error('Erro ao inicializar filtro temporal:', err)
        setError('Erro ao carregar dados do filtro')
      } finally {
        setLoading(false)
      }
    }

    inicializar()
  }, []) // Só roda uma vez na inicialização

  /**
   * Recarregar meses quando ano muda
   */
  useEffect(() => {
    if (filtro.anosDisponiveis.length > 0) {
      carregarMesesComDados(filtro.anoAtivo)
    }
  }, [filtro.anoAtivo, filtro.anosDisponiveis.length, carregarMesesComDados])

  return {
    // Estado do filtro
    filtro,
    loading,
    error,
    
    // Ações
    alterarAno,
    alterarMes,
    
    // Utilitários
    obterPeriodoAtivo,
    mesTemDados,
    mesEstaAtivo,
    anoEstaAtivo,
    
    // Dados
    anosDisponiveis: filtro.anosDisponiveis,
    mesesComDados: filtro.mesesComDados,
    mesAtivo: filtro.mesAtivo,
    anoAtivo: filtro.anoAtivo
  }
}