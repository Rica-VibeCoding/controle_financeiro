import useSWR from 'swr'
import type { DadosFluxoCaixa, KPIsFluxoCaixa, FiltrosFluxoCaixa } from '@/tipos/fluxo-caixa'
import { useAuth } from '@/contextos/auth-contexto'
import { obterConfigSWR } from '@/utilitarios/swr-config'
import { CacheManager } from '@/utilitarios/cache-manager'

/**
 * Hook para buscar dados de Fluxo de Caixa Projetado
 * Utiliza Cache Manager FASE 3 para performance otimizada
 */
export function useFluxoCaixa(filtros: FiltrosFluxoCaixa) {
  const { workspace } = useAuth()

  // Fetcher para dados mensais
  const fetcherDados = async () => {
    // Tentar cache primeiro
    if (workspace) {
      const cached = CacheManager.get<DadosFluxoCaixa[]>(
        'fluxo-caixa',
        workspace.id,
        { tipoRequisicao: 'dados', ...filtros }
      )
      if (cached) return cached
    }

    // Se não há cache, buscar da API
    const params = new URLSearchParams({
      tipo_requisicao: 'dados',
      periodo: filtros.periodo,
      tipo: filtros.tipo
    })

    if (filtros.dataInicio) params.append('dataInicio', filtros.dataInicio)
    if (filtros.dataFim) params.append('dataFim', filtros.dataFim)

    const response = await fetch(`/api/fluxo-caixa?${params.toString()}`)
    if (!response.ok) {
      throw new Error('Erro ao buscar dados de fluxo de caixa')
    }

    const data = await response.json()

    // Salvar no cache
    if (workspace) {
      CacheManager.set('fluxo-caixa', workspace.id, data, { tipoRequisicao: 'dados', ...filtros })
    }

    return data
  }

  // Fetcher para KPIs
  const fetcherKPIs = async () => {
    // Tentar cache primeiro
    if (workspace) {
      const cached = CacheManager.get<KPIsFluxoCaixa>(
        'fluxo-caixa',
        workspace.id,
        { tipoRequisicao: 'kpis', ...filtros }
      )
      if (cached) return cached
    }

    // Se não há cache, buscar da API
    const params = new URLSearchParams({
      tipo_requisicao: 'kpis',
      periodo: filtros.periodo,
      tipo: filtros.tipo
    })

    if (filtros.dataInicio) params.append('dataInicio', filtros.dataInicio)
    if (filtros.dataFim) params.append('dataFim', filtros.dataFim)

    const response = await fetch(`/api/fluxo-caixa?${params.toString()}`)
    if (!response.ok) {
      throw new Error('Erro ao buscar KPIs')
    }

    const data = await response.json()

    // Salvar no cache
    if (workspace) {
      CacheManager.set('fluxo-caixa', workspace.id, data, { tipoRequisicao: 'kpis', ...filtros })
    }

    return data
  }

  const { data: dados, error: errorDados, isLoading: loadingDados } = useSWR<DadosFluxoCaixa[]>(
    workspace ? ['fluxo-caixa-dados', workspace.id, filtros] : null,
    fetcherDados,
    obterConfigSWR('otimizada')
  )

  const { data: kpis, error: errorKPIs, isLoading: loadingKPIs } = useSWR<KPIsFluxoCaixa>(
    workspace ? ['fluxo-caixa-kpis', workspace.id, filtros] : null,
    fetcherKPIs,
    obterConfigSWR('otimizada')
  )

  return {
    dados: dados || [],
    kpis,
    isLoading: loadingDados || loadingKPIs,
    error: errorDados || errorKPIs
  }
}
