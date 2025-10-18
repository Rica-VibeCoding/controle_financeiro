/**
 * Hook de Métricas de Performance do Cache - FASE 3
 *
 * Monitora e expõe métricas do Cache Manager
 * Útil para debugging e otimização
 */

import { useState, useEffect } from 'react'
import { CacheManager } from '@/utilitarios/cache-manager'
import { getPrefetchStats } from '@/utilitarios/swr-prefetch'

export interface MetricasCache {
  // Métricas do Cache Manager
  hits: number
  misses: number
  evictions: number
  size: number
  hitRate: number
  lastCleanup: number

  // Métricas do Prefetch
  prefetchPending: number
  prefetchConcurrent: number
  prefetchCached: number
  isSlowConnection: boolean

  // Métricas do localStorage
  localStorageSize: number
  localStorageKeys: number
  localStorageQuotaUsed: number

  // Métricas calculadas
  cacheEfficiency: 'excelente' | 'boa' | 'média' | 'ruim'
  recommendations: string[]
}

/**
 * Calcular tamanho aproximado do localStorage
 */
function calculateLocalStorageSize(): { size: number; keys: number; quotaUsed: number } {
  if (typeof window === 'undefined') {
    return { size: 0, keys: 0, quotaUsed: 0 }
  }

  try {
    let totalSize = 0
    let keyCount = 0

    // Iterar apenas chaves do cache
    Object.keys(localStorage)
      .filter(key => key.startsWith('fp_cache_') || key.startsWith('swr-'))
      .forEach(key => {
        const value = localStorage.getItem(key)
        if (value) {
          totalSize += key.length + value.length
          keyCount++
        }
      })

    // Estimar quota usado (assumindo 5MB de limite)
    const quotaLimit = 5 * 1024 * 1024 // 5MB em bytes
    const quotaUsed = (totalSize / quotaLimit) * 100

    return {
      size: totalSize,
      keys: keyCount,
      quotaUsed: Math.round(quotaUsed * 100) / 100
    }
  } catch {
    return { size: 0, keys: 0, quotaUsed: 0 }
  }
}

/**
 * Calcular eficiência do cache
 */
function calculateEfficiency(hitRate: number): 'excelente' | 'boa' | 'média' | 'ruim' {
  if (hitRate >= 80) return 'excelente'
  if (hitRate >= 60) return 'boa'
  if (hitRate >= 40) return 'média'
  return 'ruim'
}

/**
 * Gerar recomendações baseadas nas métricas
 */
function generateRecommendations(metricas: Partial<MetricasCache>): string[] {
  const recommendations: string[] = []

  // Hit rate baixo
  if (metricas.hitRate !== undefined && metricas.hitRate < 50) {
    recommendations.push('Hit rate baixo - considere aumentar TTL do cache')
  }

  // Muitas evictions
  if (metricas.evictions !== undefined && metricas.evictions > 100) {
    recommendations.push('Muitas evictions - considere aumentar maxSize do cache')
  }

  // localStorage quase cheio
  if (metricas.localStorageQuotaUsed !== undefined && metricas.localStorageQuotaUsed > 80) {
    recommendations.push('localStorage quase cheio - considere limpar cache antigo')
  }

  // Conexão lenta + prefetch ativo
  if (metricas.isSlowConnection && metricas.prefetchPending !== undefined && metricas.prefetchPending > 0) {
    recommendations.push('Conexão lenta detectada - prefetch será desabilitado automaticamente')
  }

  // Tudo OK
  if (recommendations.length === 0) {
    recommendations.push('Cache funcionando otimamente')
  }

  return recommendations
}

/**
 * Hook para monitorar métricas do cache
 */
export function useMetricasCache(autoRefresh: boolean = false, refreshInterval: number = 5000) {
  const [metricas, setMetricas] = useState<MetricasCache | null>(null)

  const atualizarMetricas = () => {
    // Métricas do Cache Manager
    const cacheMetrics = CacheManager.getMetrics()

    // Métricas do Prefetch
    const prefetchStats = getPrefetchStats()

    // Métricas do localStorage
    const storageStats = calculateLocalStorageSize()

    // Calcular eficiência
    const efficiency = calculateEfficiency(cacheMetrics.hitRate)

    // Montar objeto completo
    const metrics: MetricasCache = {
      hits: cacheMetrics.hits,
      misses: cacheMetrics.misses,
      evictions: cacheMetrics.evictions,
      size: cacheMetrics.size,
      hitRate: cacheMetrics.hitRate,
      lastCleanup: cacheMetrics.lastCleanup,
      prefetchPending: prefetchStats.pending,
      prefetchConcurrent: prefetchStats.concurrent,
      prefetchCached: prefetchStats.lastPrefetchCount,
      isSlowConnection: prefetchStats.isSlowConnection,
      localStorageSize: storageStats.size,
      localStorageKeys: storageStats.keys,
      localStorageQuotaUsed: storageStats.quotaUsed,
      cacheEfficiency: efficiency,
      recommendations: []
    }

    // Gerar recomendações
    metrics.recommendations = generateRecommendations(metrics)

    setMetricas(metrics)
  }

  useEffect(() => {
    // Carregar métricas iniciais
    atualizarMetricas()

    // Auto-refresh se habilitado
    if (autoRefresh) {
      const intervalId = setInterval(atualizarMetricas, refreshInterval)
      return () => clearInterval(intervalId)
    }
  }, [autoRefresh, refreshInterval])

  return {
    metricas,
    atualizar: atualizarMetricas,
    resetar: () => {
      CacheManager.resetMetrics()
      atualizarMetricas()
    }
  }
}

/**
 * Hook simplificado para status do cache
 */
export function useCacheStatus() {
  const { metricas } = useMetricasCache(true, 10000) // Auto-refresh a cada 10s

  if (!metricas) {
    return {
      status: 'carregando' as const,
      hitRate: 0,
      efficiency: 'média' as const
    }
  }

  return {
    status: metricas.cacheEfficiency === 'excelente' || metricas.cacheEfficiency === 'boa'
      ? 'saudavel' as const
      : 'atencao' as const,
    hitRate: metricas.hitRate,
    efficiency: metricas.cacheEfficiency
  }
}

/**
 * Formatar tamanho em bytes para string legível
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

/**
 * Formatar timestamp para tempo relativo
 */
export function formatTimeAgo(timestamp: number): string {
  const now = Date.now()
  const diff = now - timestamp

  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)

  if (hours > 0) return `${hours}h atrás`
  if (minutes > 0) return `${minutes}min atrás`
  return `${seconds}s atrás`
}
