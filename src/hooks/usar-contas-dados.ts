import useSWR from 'swr'
import { useMemo } from 'react'
import { obterSaldosContas } from '@/servicos/supabase/dashboard-queries'
import { useAuth } from '@/contextos/auth-contexto'
import type { ContaData } from '@/tipos/dashboard'
import { obterConfigSWR } from '@/utilitarios/swr-config'

interface ContasResponse {
  contas: ContaData[]
  totalSaldo: number
}

// FASE 2: Cache persistente para contas
const CONTAS_CACHE_KEY = 'fp_contas_cache'
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutos

interface ContasCache {
  data: ContasResponse
  timestamp: number
  workspaceId: string
}

function salvarContasCache(data: ContasResponse, workspaceId: string): void {
  if (typeof window === 'undefined') return
  try {
    const cacheData: ContasCache = { data, timestamp: Date.now(), workspaceId }
    localStorage.setItem(CONTAS_CACHE_KEY, JSON.stringify(cacheData))
  } catch {
    // Silenciar
  }
}

function carregarContasCache(workspaceId: string): ContasResponse | undefined {
  if (typeof window === 'undefined') return undefined
  try {
    const cached = localStorage.getItem(CONTAS_CACHE_KEY)
    if (!cached) return undefined
    const cacheData: ContasCache = JSON.parse(cached)
    if (cacheData.workspaceId !== workspaceId) return undefined
    if (Date.now() - cacheData.timestamp > CACHE_DURATION) return undefined
    return cacheData.data
  } catch {
    return undefined
  }
}

export function useContasDados() {
  const { workspace } = useAuth()

  const cacheInicial = useMemo(() => {
    if (!workspace) return undefined
    return carregarContasCache(workspace.id)
  }, [workspace?.id])

  return useSWR<ContasResponse>(
    workspace ? ['contas-bancarias', workspace.id] : null,
    () => obterSaldosContas(workspace!.id),
    {
      ...obterConfigSWR('criticos'),
      fallbackData: cacheInicial,
      onSuccess: (data) => {
        if (workspace && data) {
          salvarContasCache(data, workspace.id)
        }
      }
    }
  )
}