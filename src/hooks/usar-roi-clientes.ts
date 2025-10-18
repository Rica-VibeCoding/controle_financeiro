import useSWR from 'swr'
import { useMemo } from 'react'
import type { ClienteROI, CardKPI, FiltrosROI } from '@/tipos/roi-cliente'
import { useAuth } from '@/contextos/auth-contexto'
import { obterConfigSWR } from '@/utilitarios/swr-config'

// FASE 2: Cache persistente para ROI
const ROI_CLIENTES_CACHE_KEY = 'fp_roi_clientes_cache'
const ROI_KPIS_CACHE_KEY = 'fp_roi_kpis_cache'
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutos

interface ROIClientesCache {
  data: ClienteROI[]
  timestamp: number
  workspaceId: string
  filtros: FiltrosROI
}

interface ROIKPIsCache {
  data: CardKPI
  timestamp: number
  workspaceId: string
}

function salvarROIClientesCache(data: ClienteROI[], workspaceId: string, filtros: FiltrosROI): void {
  if (typeof window === 'undefined') return
  try {
    const cacheData: ROIClientesCache = { data, timestamp: Date.now(), workspaceId, filtros }
    localStorage.setItem(ROI_CLIENTES_CACHE_KEY, JSON.stringify(cacheData))
  } catch {
    // Silenciar
  }
}

function carregarROIClientesCache(workspaceId: string, filtros: FiltrosROI): ClienteROI[] | undefined {
  if (typeof window === 'undefined') return undefined
  try {
    const cached = localStorage.getItem(ROI_CLIENTES_CACHE_KEY)
    if (!cached) return undefined
    const cacheData: ROIClientesCache = JSON.parse(cached)
    if (cacheData.workspaceId !== workspaceId) return undefined
    if (Date.now() - cacheData.timestamp > CACHE_DURATION) return undefined
    if (JSON.stringify(cacheData.filtros) !== JSON.stringify(filtros)) return undefined
    return cacheData.data
  } catch {
    return undefined
  }
}

function salvarROIKPIsCache(data: CardKPI, workspaceId: string): void {
  if (typeof window === 'undefined') return
  try {
    const cacheData: ROIKPIsCache = { data, timestamp: Date.now(), workspaceId }
    localStorage.setItem(ROI_KPIS_CACHE_KEY, JSON.stringify(cacheData))
  } catch {
    // Silenciar
  }
}

function carregarROIKPIsCache(workspaceId: string): CardKPI | undefined {
  if (typeof window === 'undefined') return undefined
  try {
    const cached = localStorage.getItem(ROI_KPIS_CACHE_KEY)
    if (!cached) return undefined
    const cacheData: ROIKPIsCache = JSON.parse(cached)
    if (cacheData.workspaceId !== workspaceId) return undefined
    if (Date.now() - cacheData.timestamp > CACHE_DURATION) return undefined
    return cacheData.data
  } catch {
    return undefined
  }
}

/**
 * Hook para buscar dados de ROI de clientes
 * Usa API Route para evitar conflito Server/Client Components
 */
export function useROIClientes(filtros: FiltrosROI) {
  const { workspace } = useAuth()

  const cacheInicialClientes = useMemo(() => {
    if (!workspace) return undefined
    return carregarROIClientesCache(workspace.id, filtros)
  }, [workspace?.id, filtros])

  const cacheInicialKPIs = useMemo(() => {
    if (!workspace) return undefined
    return carregarROIKPIsCache(workspace.id)
  }, [workspace?.id])

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
    {
      ...obterConfigSWR('otimizada'),
      fallbackData: cacheInicialClientes,
      onSuccess: (data) => {
        if (workspace && data) {
          salvarROIClientesCache(data, workspace.id, filtros)
        }
      }
    }
  )

  const { data: kpis, error: errorKPIs, isLoading: loadingKPIs } = useSWR<CardKPI>(
    workspace ? ['roi-kpis', workspace.id] : null,
    fetcherKPIs,
    {
      ...obterConfigSWR('otimizada'),
      fallbackData: cacheInicialKPIs,
      onSuccess: (data) => {
        if (workspace && data) {
          salvarROIKPIsCache(data, workspace.id)
        }
      }
    }
  )

  return {
    clientes: clientes || [],
    kpis,
    isLoading: loadingClientes || loadingKPIs,
    error: errorClientes || errorKPIs
  }
}
