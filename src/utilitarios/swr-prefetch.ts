/**
 * SWR Prefetch System - FASE 3
 *
 * Sistema inteligente de prefetch baseado em hover
 * Baseado no Portal Representação
 *
 * RECURSOS:
 * - Prefetch on hover com debounce
 * - Detecção de conexão lenta
 * - Previne prefetch excessivo
 * - Cache-aware (não refaz se já tem)
 */

import React from 'react'
import { mutate } from 'swr'
import { CacheManager, type TipoCacheConfig } from './cache-manager'

// ===== CONFIGURAÇÕES =====

const PREFETCH_CONFIG = {
  hoverDelay: 100,              // Delay antes de fazer prefetch (ms)
  maxConcurrent: 3,             // Máximo de prefetch simultâneos
  slowConnectionThreshold: 1.5, // Considerar conexão lenta se > 1.5Mbps
  minTimeBetweenPrefetch: 500   // Tempo mínimo entre prefetch do mesmo item (ms)
}

// ===== ESTADO GLOBAL =====

interface PrefetchState {
  pending: Set<string>
  lastPrefetch: Map<string, number>
  concurrentCount: number
}

const state: PrefetchState = {
  pending: new Set(),
  lastPrefetch: new Map(),
  concurrentCount: 0
}

// ===== HELPERS =====

/**
 * Verificar se conexão é lenta (Navigator API)
 */
function isSlowConnection(): boolean {
  if (typeof navigator === 'undefined') return false

  const connection = (navigator as any).connection ||
                     (navigator as any).mozConnection ||
                     (navigator as any).webkitConnection

  if (!connection) return false

  // Se effective type é slow-2g ou 2g, considerar lento
  if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
    return true
  }

  // Se downlink < 1.5Mbps, considerar lento
  if (connection.downlink && connection.downlink < PREFETCH_CONFIG.slowConnectionThreshold) {
    return true
  }

  // Se save-data está ativo, considerar lento
  if (connection.saveData) {
    return true
  }

  return false
}

/**
 * Verificar se deve fazer prefetch
 */
function shouldPrefetch(key: string): boolean {
  // Se já está pending, não fazer
  if (state.pending.has(key)) {
    return false
  }

  // Se já atingiu máximo de concurrent, não fazer
  if (state.concurrentCount >= PREFETCH_CONFIG.maxConcurrent) {
    return false
  }

  // Se fez prefetch recentemente, não fazer
  const lastTime = state.lastPrefetch.get(key)
  if (lastTime && Date.now() - lastTime < PREFETCH_CONFIG.minTimeBetweenPrefetch) {
    return false
  }

  // Se conexão é lenta, não fazer
  if (isSlowConnection()) {
    return false
  }

  return true
}

/**
 * Gerar chave única para prefetch
 */
function generatePrefetchKey(
  tipo: TipoCacheConfig,
  workspaceId: string,
  params?: Record<string, any>
): string {
  const paramsStr = params ? JSON.stringify(params) : ''
  return `${tipo}:${workspaceId}:${paramsStr}`
}

// ===== PREFETCH FUNCTIONS =====

/**
 * Prefetch genérico com debounce
 */
export function prefetchData<T>(
  tipo: TipoCacheConfig,
  workspaceId: string,
  fetcher: () => Promise<T>,
  params?: Record<string, any>,
  delay: number = PREFETCH_CONFIG.hoverDelay
): () => void {
  let timeoutId: NodeJS.Timeout | null = null

  return () => {
    // Limpar timeout anterior
    if (timeoutId) {
      clearTimeout(timeoutId)
    }

    // Criar novo timeout
    timeoutId = setTimeout(async () => {
      const key = generatePrefetchKey(tipo, workspaceId, params)

      // Verificar se deve fazer prefetch
      if (!shouldPrefetch(key)) {
        return
      }

      // Verificar se já tem no cache
      const cached = CacheManager.get(tipo, workspaceId, params)
      if (cached) {
        return // Já tem cache, não precisa fazer prefetch
      }

      try {
        // Marcar como pending
        state.pending.add(key)
        state.concurrentCount++

        // Fazer fetch
        const data = await fetcher()

        // Salvar no cache manager
        CacheManager.set(tipo, workspaceId, data, params)

        // Atualizar SWR cache também
        const swrKey = ['prefetch', tipo, workspaceId, params]
        await mutate(swrKey, data, false)

        // Registrar timestamp
        state.lastPrefetch.set(key, Date.now())

      } catch (error) {
        // Silenciar erros de prefetch (não é crítico)
      } finally {
        // Remover do pending
        state.pending.delete(key)
        state.concurrentCount--
      }
    }, delay)
  }
}

/**
 * Hook para usar prefetch em componentes
 */
export function usePrefetch<T>(
  tipo: TipoCacheConfig,
  workspaceId: string | undefined,
  fetcher: () => Promise<T>,
  params?: Record<string, any>
) {
  if (!workspaceId) {
    return {
      onMouseEnter: () => {},
      onMouseLeave: () => {}
    }
  }

  let cleanup: (() => void) | null = null

  const handleMouseEnter = () => {
    cleanup = prefetchData(tipo, workspaceId, fetcher, params)
    cleanup()
  }

  const handleMouseLeave = () => {
    // Cleanup se necessário
    if (cleanup) {
      cleanup = null
    }
  }

  return {
    onMouseEnter: handleMouseEnter,
    onMouseLeave: handleMouseLeave
  }
}

// ===== PREFETCH HELPERS ESPECÍFICOS =====

/**
 * Prefetch para dashboard
 */
export function prefetchDashboard(
  workspaceId: string,
  fetcher: () => Promise<any>
) {
  return prefetchData('dashboard', workspaceId, fetcher)
}

/**
 * Prefetch para transações
 */
export function prefetchTransacoes(
  workspaceId: string,
  fetcher: () => Promise<any>,
  params?: Record<string, any>
) {
  return prefetchData('transacoes', workspaceId, fetcher, params)
}

/**
 * Prefetch para relatórios
 */
export function prefetchRelatorios(
  workspaceId: string,
  fetcher: () => Promise<any>,
  params?: Record<string, any>
) {
  return prefetchData('roi', workspaceId, fetcher, params)
}

/**
 * Prefetch para categorias
 */
export function prefetchCategorias(
  workspaceId: string,
  fetcher: () => Promise<any>
) {
  return prefetchData('categorias', workspaceId, fetcher)
}

/**
 * Prefetch para contas
 */
export function prefetchContas(
  workspaceId: string,
  fetcher: () => Promise<any>
) {
  return prefetchData('contas', workspaceId, fetcher)
}

// ===== PREFETCH AUTOMÁTICO EM LINKS =====

/**
 * HOC para adicionar prefetch automático em links
 * NOTA: Removido temporariamente por problemas de tipagem
 * Use usePrefetch diretamente nos componentes
 */
// export function withPrefetch<P extends object>(...) { ... }

// ===== MÉTRICAS =====

/**
 * Obter estatísticas de prefetch
 */
export function getPrefetchStats() {
  return {
    pending: state.pending.size,
    concurrent: state.concurrentCount,
    lastPrefetchCount: state.lastPrefetch.size,
    isSlowConnection: isSlowConnection()
  }
}

/**
 * Resetar estatísticas
 */
export function resetPrefetchStats() {
  state.pending.clear()
  state.lastPrefetch.clear()
  state.concurrentCount = 0
}
