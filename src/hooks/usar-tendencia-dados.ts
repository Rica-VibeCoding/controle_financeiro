import useSWR from 'swr'
import { useMemo } from 'react'
import { obterTendencia } from '@/servicos/supabase/dashboard-queries'
import { useAuth } from '@/contextos/auth-contexto'
import type { TendenciaData } from '@/tipos/dashboard'
import { obterConfigSWR } from '@/utilitarios/swr-config'

// FASE 2: Cache persistente para tendência
const DASHBOARD_TENDENCIA_CACHE_KEY = 'fp_dashboard_tendencia_cache'
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutos

interface DashboardTendenciaCache {
  data: TendenciaData[]
  timestamp: number
  workspaceId: string
}

function salvarDashboardTendenciaCache(data: TendenciaData[], workspaceId: string): void {
  if (typeof window === 'undefined') return
  try {
    const cacheData: DashboardTendenciaCache = { data, timestamp: Date.now(), workspaceId }
    localStorage.setItem(DASHBOARD_TENDENCIA_CACHE_KEY, JSON.stringify(cacheData))
  } catch {
    // Silenciar
  }
}

function carregarDashboardTendenciaCache(workspaceId: string): TendenciaData[] | undefined {
  if (typeof window === 'undefined') return undefined
  try {
    const cached = localStorage.getItem(DASHBOARD_TENDENCIA_CACHE_KEY)
    if (!cached) return undefined
    const cacheData: DashboardTendenciaCache = JSON.parse(cached)
    if (cacheData.workspaceId !== workspaceId) return undefined
    if (Date.now() - cacheData.timestamp > CACHE_DURATION) return undefined
    return cacheData.data
  } catch {
    return undefined
  }
}

export function useTendenciaData() {
  const { workspace } = useAuth()

  const cacheInicial = useMemo(() => {
    if (!workspace) return undefined
    return carregarDashboardTendenciaCache(workspace.id)
  }, [workspace?.id])

  return useSWR<TendenciaData[]>(
    workspace ? ['dashboard-tendencia', workspace.id] : null,
    () => obterTendencia(workspace!.id),
    {
      ...obterConfigSWR('criticos'),
      fallbackData: cacheInicial,
      onSuccess: (data) => {
        if (workspace && data) {
          salvarDashboardTendenciaCache(data, workspace.id)
        }
      }
    }
  )
}