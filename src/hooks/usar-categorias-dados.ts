import useSWR from 'swr'
import { useMemo } from 'react'
import { obterCategoriasMetas } from '@/servicos/supabase/dashboard-queries'
import { useAuth } from '@/contextos/auth-contexto'
import type { CategoriaData, Periodo } from '@/tipos/dashboard'
import { obterConfigSWR } from '@/utilitarios/swr-config'

// FASE 2: Cache persistente para categorias
const CATEGORIAS_CACHE_KEY = 'fp_categorias_cache'
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutos

interface CategoriasCache {
  data: CategoriaData[]
  timestamp: number
  workspaceId: string
  periodo: Periodo
}

function salvarCategoriasCache(data: CategoriaData[], workspaceId: string, periodo: Periodo): void {
  if (typeof window === 'undefined') return
  try {
    const cacheData: CategoriasCache = { data, timestamp: Date.now(), workspaceId, periodo }
    localStorage.setItem(CATEGORIAS_CACHE_KEY, JSON.stringify(cacheData))
  } catch {
    // Silenciar
  }
}

function carregarCategoriasCache(workspaceId: string, periodo: Periodo): CategoriaData[] | undefined {
  if (typeof window === 'undefined') return undefined
  try {
    const cached = localStorage.getItem(CATEGORIAS_CACHE_KEY)
    if (!cached) return undefined
    const cacheData: CategoriasCache = JSON.parse(cached)
    if (cacheData.workspaceId !== workspaceId) return undefined
    if (Date.now() - cacheData.timestamp > CACHE_DURATION) return undefined
    if (JSON.stringify(cacheData.periodo) !== JSON.stringify(periodo)) return undefined
    return cacheData.data
  } catch {
    return undefined
  }
}

export function useCategoriasData(periodo: Periodo) {
  const { workspace } = useAuth()

  const cacheInicial = useMemo(() => {
    if (!workspace) return undefined
    return carregarCategoriasCache(workspace.id, periodo)
  }, [workspace?.id, periodo])

  return useSWR<CategoriaData[]>(
    workspace ? ['dashboard-categorias', workspace.id, periodo.inicio, periodo.fim] : null,
    () => obterCategoriasMetas(periodo, workspace!.id),
    {
      ...obterConfigSWR('criticos'),
      fallbackData: cacheInicial,
      onSuccess: (data) => {
        if (workspace && data) {
          salvarCategoriasCache(data, workspace.id, periodo)
        }
      }
    }
  )
}