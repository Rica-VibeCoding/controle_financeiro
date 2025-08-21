import useSWR from 'swr'
import { obterDadosCards } from '@/servicos/supabase/dashboard-queries'
import type { Periodo } from '@/tipos/dashboard'

export function useCardsData(periodo: Periodo) {
  return useSWR(
    ['dashboard-cards', periodo.inicio, periodo.fim], // Chave estável baseada no período
    () => obterDadosCards(periodo),
    {
      refreshInterval: 60000, // 1 minuto 
      revalidateOnFocus: false,
      dedupingInterval: 10000,
      errorRetryCount: 3,
      errorRetryInterval: 5000
    }
  )
}