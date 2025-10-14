import useSWR from 'swr'
import type { ClienteROI, CardKPI, FiltrosROI } from '@/tipos/roi-cliente'
import { useAuth } from '@/contextos/auth-contexto'
import { obterConfigSWR } from '@/utilitarios/swr-config'

/**
 * Hook para buscar dados de ROI de clientes
 * Usa API Route para evitar conflito Server/Client Components
 */
export function useROIClientes(filtros: FiltrosROI) {
  const { workspace } = useAuth()

  // Fetcher para clientes
  const fetcherClientes = async () => {
    const params = new URLSearchParams({
      tipo: 'clientes',
      periodo: filtros.periodo,
      ordenacao: filtros.ordenacao
    })

    if (filtros.dataInicio) params.append('dataInicio', filtros.dataInicio)
    if (filtros.dataFim) params.append('dataFim', filtros.dataFim)

    const response = await fetch(`/api/roi-clientes?${params.toString()}`)
    if (!response.ok) {
      throw new Error('Erro ao buscar dados de ROI')
    }
    return response.json()
  }

  // Fetcher para KPIs
  const fetcherKPIs = async () => {
    const response = await fetch('/api/roi-clientes?tipo=kpis')
    if (!response.ok) {
      throw new Error('Erro ao buscar KPIs')
    }
    return response.json()
  }

  const { data: clientes, error: errorClientes, isLoading: loadingClientes } = useSWR<ClienteROI[]>(
    workspace ? ['roi-clientes', workspace.id, filtros] : null,
    fetcherClientes,
    obterConfigSWR('otimizada')
  )

  const { data: kpis, error: errorKPIs, isLoading: loadingKPIs } = useSWR<CardKPI>(
    workspace ? ['roi-kpis', workspace.id] : null,
    fetcherKPIs,
    obterConfigSWR('otimizada')
  )

  return {
    clientes: clientes || [],
    kpis,
    isLoading: loadingClientes || loadingKPIs,
    error: errorClientes || errorKPIs
  }
}
