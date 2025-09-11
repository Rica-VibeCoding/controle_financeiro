'use client'

import { SWRConfig } from 'swr'
import { SWR_CONFIG_OTIMIZADA } from '@/utilitarios/swr-config'

interface SWRProviderProps {
  children: React.ReactNode
}

export function SWRProvider({ children }: SWRProviderProps) {
  return (
    <SWRConfig value={SWR_CONFIG_OTIMIZADA}>
      {children}
    </SWRConfig>
  )
}