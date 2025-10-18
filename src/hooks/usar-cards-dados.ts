import useSWR from 'swr'
import { useMemo } from 'react'
import { obterDadosCards } from '@/servicos/supabase/dashboard-queries'
import { useAuth } from '@/contextos/auth-contexto'
import type { Periodo } from '@/tipos/dashboard'
import { obterConfigSWR } from '@/utilitarios/swr-config'

// FASE 2: Cache persistente para dashboard
const DASHBOARD_CARDS_CACHE_KEY = 'fp_dashboard_cards_cache'
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutos

interface DashboardCardsCache {
  data: any
  timestamp: number
  workspaceId: string
  periodo: Periodo
}

function salvarDashboardCardsCache(data: any, workspaceId: string, periodo: Periodo): void {
  if (typeof window === 'undefined') return
  try {
    const cacheData: DashboardCardsCache = { data, timestamp: Date.now(), workspaceId, periodo }
    localStorage.setItem(DASHBOARD_CARDS_CACHE_KEY, JSON.stringify(cacheData))
  } catch {
    // Silenciar
  }
}

function carregarDashboardCardsCache(workspaceId: string, periodo: Periodo): any | undefined {
  if (typeof window === 'undefined') return undefined
  try {
    const cached = localStorage.getItem(DASHBOARD_CARDS_CACHE_KEY)
    if (!cached) return undefined
    const cacheData: DashboardCardsCache = JSON.parse(cached)
    if (cacheData.workspaceId !== workspaceId) return undefined
    if (Date.now() - cacheData.timestamp > CACHE_DURATION) return undefined
    if (JSON.stringify(cacheData.periodo) !== JSON.stringify(periodo)) return undefined
    return cacheData.data
  } catch {
    return undefined
  }
}

export function useCardsData(periodo: Periodo) {
  const { workspace } = useAuth()

  const cacheInicial = useMemo(() => {
    if (!workspace) return undefined
    return carregarDashboardCardsCache(workspace.id, periodo)
  }, [workspace?.id, periodo])

  return useSWR(
    workspace ? ['dashboard-cards', workspace.id, periodo.inicio, periodo.fim] : null,
    () => obterDadosCards(periodo, workspace!.id),
    {
      ...obterConfigSWR('criticos'),
      fallbackData: cacheInicial,
      onSuccess: (data) => {
        if (workspace && data) {
          salvarDashboardCardsCache(data, workspace.id, periodo)
        }
      }
    }
  )
}