import useSWR, { mutate } from 'swr'
import { useMemo, useCallback } from 'react'
import type { ContaPagarReceber, ResumoContas, FiltrosContas, AbaContas } from '@/tipos/contas'
import { useAuth } from '@/contextos/auth-contexto'
import { obterConfigSWR } from '@/utilitarios/swr-config'

// Cache persistente (5 minutos)
const CACHE_CONTAS_KEY = 'fp_contas_cache'
const CACHE_RESUMO_KEY = 'fp_resumo_contas_cache'
const CACHE_DURATION = 5 * 60 * 1000

interface CacheContas {
  data: ContaPagarReceber[]
  timestamp: number
  workspaceId: string
  aba: AbaContas
  filtros: FiltrosContas
}

interface CacheResumo {
  data: ResumoContas
  timestamp: number
  workspaceId: string
}

// Salvar cache
function salvarCache(key: string, data: any, workspaceId: string, extras?: any): void {
  if (typeof window === 'undefined') return
  try {
    const cacheData = {
      data,
      timestamp: Date.now(),
      workspaceId,
      ...extras
    }
    localStorage.setItem(key, JSON.stringify(cacheData))
  } catch {
    // Silenciar
  }
}

// Carregar cache
function carregarCache(key: string, workspaceId: string, extras?: any): any | undefined {
  if (typeof window === 'undefined') return undefined
  try {
    const cached = localStorage.getItem(key)
    if (!cached) return undefined

    const cacheData = JSON.parse(cached)
    if (cacheData.workspaceId !== workspaceId) return undefined
    if (Date.now() - cacheData.timestamp > CACHE_DURATION) return undefined

    // Verificar extras (aba, filtros)
    if (extras) {
      for (const [k, v] of Object.entries(extras)) {
        if (JSON.stringify(cacheData[k]) !== JSON.stringify(v)) return undefined
      }
    }

    return cacheData.data
  } catch {
    return undefined
  }
}

/**
 * Hook para buscar contas a pagar/receber
 */
export function usarContasPagarReceber(aba: AbaContas, filtros: FiltrosContas) {
  const { workspace } = useAuth()

  // Cache inicial
  const cacheInicial = useMemo(() => {
    if (!workspace) return undefined
    return carregarCache(CACHE_CONTAS_KEY, workspace.id, { aba, filtros })
  }, [workspace?.id, aba, filtros])

  // Fetcher para contas
  const fetcherContas = async () => {
    const params = new URLSearchParams({
      tipo: aba,
      periodo: filtros.periodo
    })

    if (filtros.categoria) params.append('categoria', filtros.categoria)
    if (filtros.busca) params.append('busca', filtros.busca)
    if (filtros.dataInicio) params.append('dataInicio', filtros.dataInicio)
    if (filtros.dataFim) params.append('dataFim', filtros.dataFim)

    const response = await fetch(`/api/contas?${params.toString()}`)
    if (!response.ok) {
      throw new Error('Erro ao buscar contas')
    }
    return response.json()
  }

  const { data, error, isLoading } = useSWR<ContaPagarReceber[]>(
    workspace ? ['contas', workspace.id, aba, filtros] : null,
    fetcherContas,
    {
      ...obterConfigSWR('otimizada'),
      fallbackData: cacheInicial,
      onSuccess: (data) => {
        if (workspace && data) {
          salvarCache(CACHE_CONTAS_KEY, data, workspace.id, { aba, filtros })
        }
      }
    }
  )

  return {
    contas: data || [],
    isLoading,
    error
  }
}

/**
 * Hook para buscar resumo (cards KPI)
 */
export function usarResumoContas() {
  const { workspace } = useAuth()

  // Cache inicial
  const cacheInicial = useMemo(() => {
    if (!workspace) return undefined
    return carregarCache(CACHE_RESUMO_KEY, workspace.id)
  }, [workspace?.id])

  // Fetcher para resumo
  const fetcherResumo = async () => {
    const response = await fetch('/api/contas?tipo=resumo')
    if (!response.ok) {
      throw new Error('Erro ao buscar resumo')
    }
    return response.json()
  }

  const { data, error, isLoading } = useSWR<ResumoContas>(
    workspace ? ['contas-resumo', workspace.id] : null,
    fetcherResumo,
    {
      ...obterConfigSWR('otimizada'),
      fallbackData: cacheInicial,
      onSuccess: (data) => {
        if (workspace && data) {
          salvarCache(CACHE_RESUMO_KEY, data, workspace.id)
        }
      }
    }
  )

  return {
    resumo: data,
    isLoading,
    error
  }
}

/**
 * Hook para marcar como realizado (pago/recebido)
 */
export function usarMarcarComoRealizado() {
  const { workspace } = useAuth()

  const marcarComoRealizado = useCallback(async (transacaoId: string) => {
    if (!workspace) {
      throw new Error('Workspace não encontrado')
    }

    const response = await fetch('/api/contas', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transacaoId })
    })

    if (!response.ok) {
      throw new Error('Erro ao marcar como realizado')
    }

    // Invalidar todos os caches de contas
    mutate((key) => Array.isArray(key) && key[0] === 'contas')
    mutate((key) => Array.isArray(key) && key[0] === 'contas-resumo')

    // Limpar cache localStorage
    localStorage.removeItem(CACHE_CONTAS_KEY)
    localStorage.removeItem(CACHE_RESUMO_KEY)

    return response.json()
  }, [workspace])

  return { marcarComoRealizado }
}
