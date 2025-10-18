import useSWR from 'swr'
import { useMemo } from 'react'
import { obterProximasContas } from '@/servicos/supabase/dashboard-queries'
import { useAuth } from '@/contextos/auth-contexto'
import type { ProximaConta } from '@/tipos/dashboard'
import { obterConfigSWR } from '@/utilitarios/swr-config'

// FASE 2: Cache persistente para próximas contas
const PROXIMAS_CONTAS_CACHE_KEY = 'fp_proximas_contas_cache'
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutos

interface ProximasContasCache {
  data: ProximaConta[]
  timestamp: number
  workspaceId: string
}

function salvarProximasContasCache(data: ProximaConta[], workspaceId: string): void {
  if (typeof window === 'undefined') return
  try {
    const cacheData: ProximasContasCache = { data, timestamp: Date.now(), workspaceId }
    localStorage.setItem(PROXIMAS_CONTAS_CACHE_KEY, JSON.stringify(cacheData))
  } catch {
    // Silenciar
  }
}

function carregarProximasContasCache(workspaceId: string): ProximaConta[] | undefined {
  if (typeof window === 'undefined') return undefined
  try {
    const cached = localStorage.getItem(PROXIMAS_CONTAS_CACHE_KEY)
    if (!cached) return undefined
    const cacheData: ProximasContasCache = JSON.parse(cached)
    if (cacheData.workspaceId !== workspaceId) return undefined
    if (Date.now() - cacheData.timestamp > CACHE_DURATION) return undefined
    return cacheData.data
  } catch {
    return undefined
  }
}

export function useProximasContas() {
  const { workspace } = useAuth()

  const cacheInicial = useMemo(() => {
    if (!workspace) return undefined
    return carregarProximasContasCache(workspace.id)
  }, [workspace?.id])

  return useSWR<ProximaConta[]>(
    workspace ? ['proximas-contas', workspace.id] : null,
    () => obterProximasContas(workspace!.id),
    {
      ...obterConfigSWR('criticos'),
      fallbackData: cacheInicial,
      onSuccess: (data) => {
        if (workspace && data) {
          salvarProximasContasCache(data, workspace.id)
        }
      }
    }
  )
}