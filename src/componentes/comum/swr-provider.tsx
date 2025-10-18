'use client'

import { SWRConfig } from 'swr'
import { useEffect } from 'react'
import { SWR_CONFIG_OTIMIZADA } from '@/utilitarios/swr-config'

interface SWRProviderProps {
  children: React.ReactNode
}

/**
 * SWR Provider com cache persistente no localStorage
 *
 * BENEFÍCIOS:
 * - Cache sobrevive a F5 e stand-by
 * - Dados restaurados automaticamente
 * - Performance melhorada (dados instantâneos)
 *
 * BASEADO NO: Portal Representação (sistema que funciona sem perder dados)
 */
export function SWRProvider({ children }: SWRProviderProps) {
  // Salvar cache no localStorage antes de sair da página
  useEffect(() => {
    // Guard: só executar no client
    if (typeof window === 'undefined') return

    const handleBeforeUnload = () => {
      try {
        const cache = (globalThis as any).__SWR_CACHE__
        if (cache && cache.size > 0) {
          const cacheArray = Array.from(cache.entries())
          localStorage.setItem('swr-cache-financeiro', JSON.stringify(cacheArray))
        }
      } catch (error) {
        // Silenciar erros (quota excedida, etc)
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [])

  return (
    <SWRConfig value={SWR_CONFIG_OTIMIZADA}>
      {children}
    </SWRConfig>
  )
}