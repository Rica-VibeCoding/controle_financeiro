import useSWR from 'swr'
import { useMemo } from 'react'
import { obterCartoesCredito } from '@/servicos/supabase/dashboard-queries'
import { useAuth } from '@/contextos/auth-contexto'
import type { CartaoData, Periodo } from '@/tipos/dashboard'
import { obterConfigSWR } from '@/utilitarios/swr-config'

interface CartoesResponse {
  cartoes: CartaoData[]
  totalUsado: number
  totalLimite: number
}

// FASE 2: Cache persistente para cartões
const CARTOES_CACHE_KEY = 'fp_cartoes_cache'
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutos

interface CartoesCache {
  data: CartoesResponse
  timestamp: number
  workspaceId: string
  periodo: Periodo
}

function salvarCartoesCache(data: CartoesResponse, workspaceId: string, periodo: Periodo): void {
  if (typeof window === 'undefined') return
  try {
    const cacheData: CartoesCache = { data, timestamp: Date.now(), workspaceId, periodo }
    localStorage.setItem(CARTOES_CACHE_KEY, JSON.stringify(cacheData))
  } catch {
    // Silenciar
  }
}

function carregarCartoesCache(workspaceId: string, periodo: Periodo): CartoesResponse | undefined {
  if (typeof window === 'undefined') return undefined
  try {
    const cached = localStorage.getItem(CARTOES_CACHE_KEY)
    if (!cached) return undefined
    const cacheData: CartoesCache = JSON.parse(cached)
    if (cacheData.workspaceId !== workspaceId) return undefined
    if (Date.now() - cacheData.timestamp > CACHE_DURATION) return undefined
    if (JSON.stringify(cacheData.periodo) !== JSON.stringify(periodo)) return undefined
    return cacheData.data
  } catch {
    return undefined
  }
}

export function useCartoesDados(periodo: Periodo) {
  const { workspace } = useAuth()

  const cacheInicial = useMemo(() => {
    if (!workspace) return undefined
    return carregarCartoesCache(workspace.id, periodo)
  }, [workspace?.id, periodo])

  return useSWR<CartoesResponse>(
    workspace ? ['cartoes-credito', workspace.id, periodo.inicio, periodo.fim] : null,
    () => obterCartoesCredito(periodo, workspace!.id),
    {
      ...obterConfigSWR('criticos'),
      fallbackData: cacheInicial,
      onSuccess: (data) => {
        if (workspace && data) {
          salvarCartoesCache(data, workspace.id, periodo)
        }
      }
    }
  )
}