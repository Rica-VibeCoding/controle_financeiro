/**
 * Cache Manager Centralizado - FASE 3
 *
 * Sistema avançado de cache em memória + localStorage
 * Baseado no Portal Representação
 *
 * RECURSOS:
 * - Cache em memória com TTL
 * - Persistência seletiva no localStorage
 * - Limpeza automática (LRU - Least Recently Used)
 * - Invalidação por tipo/usuário
 * - Métricas de performance
 */

// ===== TIPOS =====

export type TipoCacheConfig =
  | 'transacoes'
  | 'dashboard'
  | 'categorias'
  | 'contas'
  | 'cartoes'
  | 'roi'
  | 'fluxo-caixa'
  | 'proximas-contas'
  | 'tendencia'
  | 'workspace'
  | 'auxiliares'

interface CacheConfig {
  ttl: number           // Time to live em ms
  persistent: boolean   // Salvar em localStorage?
  maxSize?: number      // Tamanho máximo do cache (número de itens)
}

interface CacheEntry<T> {
  data: T
  timestamp: number
  workspaceId: string
  accessCount: number
  lastAccess: number
}

interface CacheMetrics {
  hits: number
  misses: number
  evictions: number
  size: number
  lastCleanup: number
}

// ===== CONFIGURAÇÕES POR TIPO =====

const CACHE_CONFIGS: Record<TipoCacheConfig, CacheConfig> = {
  // Dados críticos - cache mais longo
  transacoes: {
    ttl: 5 * 60 * 1000,      // 5 minutos
    persistent: true,
    maxSize: 50
  },

  // Dashboard - cache médio
  dashboard: {
    ttl: 5 * 60 * 1000,      // 5 minutos
    persistent: true,
    maxSize: 20
  },

  // Dados auxiliares - cache longo (mudam pouco)
  categorias: {
    ttl: 15 * 60 * 1000,     // 15 minutos
    persistent: true,
    maxSize: 30
  },

  contas: {
    ttl: 10 * 60 * 1000,     // 10 minutos
    persistent: true,
    maxSize: 20
  },

  cartoes: {
    ttl: 10 * 60 * 1000,     // 10 minutos
    persistent: true,
    maxSize: 20
  },

  // Relatórios - cache curto (mudam frequentemente)
  roi: {
    ttl: 2 * 60 * 1000,      // 2 minutos
    persistent: false,
    maxSize: 10
  },

  'fluxo-caixa': {
    ttl: 5 * 60 * 1000,      // 5 minutos
    persistent: true,
    maxSize: 10
  },

  'proximas-contas': {
    ttl: 5 * 60 * 1000,      // 5 minutos
    persistent: true,
    maxSize: 10
  },

  tendencia: {
    ttl: 5 * 60 * 1000,      // 5 minutos
    persistent: true,
    maxSize: 10
  },

  // Sistema
  workspace: {
    ttl: 30 * 60 * 1000,     // 30 minutos
    persistent: true,
    maxSize: 5
  },

  auxiliares: {
    ttl: 15 * 60 * 1000,     // 15 minutos
    persistent: true,
    maxSize: 50
  }
}

// ===== CACHE MANAGER CLASS =====

class CacheManagerClass {
  private cache: Map<string, CacheEntry<any>>
  private metrics: CacheMetrics
  private cleanupInterval: NodeJS.Timeout | null

  constructor() {
    this.cache = new Map()
    this.metrics = {
      hits: 0,
      misses: 0,
      evictions: 0,
      size: 0,
      lastCleanup: Date.now()
    }
    this.cleanupInterval = null

    // Iniciar limpeza automática apenas no client
    if (typeof window !== 'undefined') {
      this.startAutoCleanup()
      this.loadPersistentCache()
    }
  }

  /**
   * Gerar chave única para cache
   */
  private generateKey(
    tipo: TipoCacheConfig,
    workspaceId: string,
    params?: Record<string, any>
  ): string {
    const paramsStr = params ? JSON.stringify(params) : ''
    return `${tipo}:${workspaceId}:${paramsStr}`
  }

  /**
   * Obter configuração para tipo de cache
   */
  private getConfig(tipo: TipoCacheConfig): CacheConfig {
    return CACHE_CONFIGS[tipo]
  }

  /**
   * Verificar se cache está expirado
   */
  private isExpired(entry: CacheEntry<any>, config: CacheConfig): boolean {
    return Date.now() - entry.timestamp > config.ttl
  }

  /**
   * Salvar cache no localStorage (se configurado)
   */
  private persistToStorage(key: string, entry: CacheEntry<any>, tipo: TipoCacheConfig): void {
    if (typeof window === 'undefined') return

    const config = this.getConfig(tipo)
    if (!config.persistent) return

    try {
      const storageKey = `fp_cache_${key}`
      localStorage.setItem(storageKey, JSON.stringify(entry))
    } catch (error) {
      // Silenciar erros de quota
    }
  }

  /**
   * Carregar cache do localStorage
   */
  private loadFromStorage(key: string, tipo: TipoCacheConfig): CacheEntry<any> | undefined {
    if (typeof window === 'undefined') return undefined

    const config = this.getConfig(tipo)
    if (!config.persistent) return undefined

    try {
      const storageKey = `fp_cache_${key}`
      const cached = localStorage.getItem(storageKey)
      if (!cached) return undefined

      const entry: CacheEntry<any> = JSON.parse(cached)

      // Verificar se expirado
      if (this.isExpired(entry, config)) {
        localStorage.removeItem(storageKey)
        return undefined
      }

      return entry
    } catch {
      return undefined
    }
  }

  /**
   * Carregar todo cache persistente ao iniciar
   */
  private loadPersistentCache(): void {
    if (typeof window === 'undefined') return

    try {
      // Buscar todas chaves do cache
      const keys = Object.keys(localStorage).filter(k => k.startsWith('fp_cache_'))

      keys.forEach(storageKey => {
        try {
          const cached = localStorage.getItem(storageKey)
          if (!cached) return

          const entry: CacheEntry<any> = JSON.parse(cached)
          const cacheKey = storageKey.replace('fp_cache_', '')

          // Adicionar ao cache em memória
          this.cache.set(cacheKey, entry)
        } catch {
          // Remover cache corrompido
          localStorage.removeItem(storageKey)
        }
      })

      this.metrics.size = this.cache.size
    } catch {
      // Silenciar erros
    }
  }

  /**
   * Aplicar política LRU (Least Recently Used)
   */
  private applyLRU(tipo: TipoCacheConfig): void {
    const config = this.getConfig(tipo)
    if (!config.maxSize) return

    // Obter todas entradas deste tipo
    const entries = Array.from(this.cache.entries())
      .filter(([key]) => key.startsWith(`${tipo}:`))
      .sort((a, b) => a[1].lastAccess - b[1].lastAccess) // Ordenar por último acesso

    // Se exceder limite, remover mais antigas
    if (entries.length > config.maxSize) {
      const toRemove = entries.slice(0, entries.length - config.maxSize)
      toRemove.forEach(([key]) => {
        this.cache.delete(key)
        this.metrics.evictions++

        // Remover do localStorage também
        if (typeof window !== 'undefined') {
          localStorage.removeItem(`fp_cache_${key}`)
        }
      })
    }
  }

  /**
   * GET: Obter dado do cache
   */
  get<T>(
    tipo: TipoCacheConfig,
    workspaceId: string,
    params?: Record<string, any>
  ): T | null {
    const key = this.generateKey(tipo, workspaceId, params)
    const config = this.getConfig(tipo)

    // Tentar cache em memória primeiro
    let entry = this.cache.get(key)

    // Se não encontrou, tentar localStorage
    if (!entry) {
      entry = this.loadFromStorage(key, tipo)
      if (entry) {
        this.cache.set(key, entry)
      }
    }

    // Se não encontrou, registrar miss
    if (!entry) {
      this.metrics.misses++
      return null
    }

    // Verificar se expirou
    if (this.isExpired(entry, config)) {
      this.cache.delete(key)
      if (typeof window !== 'undefined') {
        localStorage.removeItem(`fp_cache_${key}`)
      }
      this.metrics.misses++
      return null
    }

    // Atualizar métricas de acesso
    entry.accessCount++
    entry.lastAccess = Date.now()
    this.metrics.hits++

    return entry.data
  }

  /**
   * SET: Salvar dado no cache
   */
  set<T>(
    tipo: TipoCacheConfig,
    workspaceId: string,
    data: T,
    params?: Record<string, any>
  ): void {
    const key = this.generateKey(tipo, workspaceId, params)

    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      workspaceId,
      accessCount: 0,
      lastAccess: Date.now()
    }

    this.cache.set(key, entry)
    this.metrics.size = this.cache.size

    // Persistir se configurado
    this.persistToStorage(key, entry, tipo)

    // Aplicar LRU
    this.applyLRU(tipo)
  }

  /**
   * INVALIDATE: Invalidar cache específico
   */
  invalidate(
    tipo: TipoCacheConfig,
    workspaceId: string,
    params?: Record<string, any>
  ): void {
    const key = this.generateKey(tipo, workspaceId, params)
    this.cache.delete(key)

    if (typeof window !== 'undefined') {
      localStorage.removeItem(`fp_cache_${key}`)
    }

    this.metrics.size = this.cache.size
  }

  /**
   * INVALIDATE ALL: Invalidar todo cache de um tipo
   */
  invalidateAll(tipo: TipoCacheConfig, workspaceId?: string): void {
    const prefix = workspaceId
      ? `${tipo}:${workspaceId}:`
      : `${tipo}:`

    // Remover do cache em memória
    Array.from(this.cache.keys())
      .filter(key => key.startsWith(prefix))
      .forEach(key => {
        this.cache.delete(key)
        if (typeof window !== 'undefined') {
          localStorage.removeItem(`fp_cache_${key}`)
        }
      })

    this.metrics.size = this.cache.size
  }

  /**
   * CLEAR: Limpar todo cache (útil ao fazer logout)
   */
  clear(workspaceId?: string): void {
    if (workspaceId) {
      // Limpar apenas cache do workspace
      Array.from(this.cache.keys())
        .filter(key => key.includes(`:${workspaceId}:`))
        .forEach(key => {
          this.cache.delete(key)
          if (typeof window !== 'undefined') {
            localStorage.removeItem(`fp_cache_${key}`)
          }
        })
    } else {
      // Limpar tudo
      this.cache.clear()
      if (typeof window !== 'undefined') {
        Object.keys(localStorage)
          .filter(key => key.startsWith('fp_cache_'))
          .forEach(key => localStorage.removeItem(key))
      }
    }

    this.metrics.size = this.cache.size
  }

  /**
   * Limpeza automática de cache expirado
   */
  private cleanup(): void {
    const now = Date.now()

    Array.from(this.cache.entries()).forEach(([key, entry]) => {
      const tipo = key.split(':')[0] as TipoCacheConfig
      const config = this.getConfig(tipo)

      if (this.isExpired(entry, config)) {
        this.cache.delete(key)
        if (typeof window !== 'undefined') {
          localStorage.removeItem(`fp_cache_${key}`)
        }
        this.metrics.evictions++
      }
    })

    this.metrics.size = this.cache.size
    this.metrics.lastCleanup = now
  }

  /**
   * Iniciar limpeza automática (a cada 5 minutos)
   */
  private startAutoCleanup(): void {
    if (this.cleanupInterval) return

    this.cleanupInterval = setInterval(() => {
      this.cleanup()
    }, 5 * 60 * 1000) // 5 minutos
  }

  /**
   * Parar limpeza automática
   */
  stopAutoCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
    }
  }

  /**
   * Obter métricas de performance
   */
  getMetrics(): CacheMetrics & { hitRate: number } {
    const total = this.metrics.hits + this.metrics.misses
    const hitRate = total > 0 ? (this.metrics.hits / total) * 100 : 0

    return {
      ...this.metrics,
      hitRate: Math.round(hitRate * 100) / 100
    }
  }

  /**
   * Resetar métricas
   */
  resetMetrics(): void {
    this.metrics = {
      hits: 0,
      misses: 0,
      evictions: 0,
      size: this.cache.size,
      lastCleanup: Date.now()
    }
  }
}

// ===== SINGLETON EXPORT =====

export const CacheManager = new CacheManagerClass()

// ===== HELPER FUNCTIONS =====

/**
 * Hook helper para usar cache manager
 */
export function useCacheManager() {
  return CacheManager
}

/**
 * Limpar cache ao fazer logout
 */
export function clearCacheOnLogout(workspaceId?: string): void {
  CacheManager.clear(workspaceId)
}

/**
 * Invalidar cache após mutations
 */
export function invalidateCacheAfterMutation(
  tipos: TipoCacheConfig[],
  workspaceId: string
): void {
  tipos.forEach(tipo => {
    CacheManager.invalidateAll(tipo, workspaceId)
  })
}
