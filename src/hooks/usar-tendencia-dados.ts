import useSWR from 'swr'
import { obterTendencia } from '@/servicos/supabase/dashboard-queries'
import type { TendenciaData } from '@/tipos/dashboard'

export function useTendenciaData() {
  return useSWR<TendenciaData[]>(
    'dashboard-tendencia-6-meses',
    obterTendencia,
    {
      refreshInterval: 300000, // 5 minutos (dados históricos)
      revalidateOnFocus: false,
      dedupingInterval: 60000, // 1 minuto
      errorRetryCount: 3,
      errorRetryInterval: 5000
    }
  )
}