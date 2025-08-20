import useSWR from 'swr'
import { obterDadosCards } from '@/servicos/supabase/dashboard-queries'
import type { Periodo } from '@/tipos/dashboard'

export function useCardsData(periodo: Periodo) {
  return useSWR(
    ['dashboard-cards', periodo.inicio, periodo.fim],
    () => obterDadosCards(periodo),
    {
      refreshInterval: 60000, // 1 minuto
      revalidateOnFocus: false, // não refetch ao focar
      dedupingInterval: 10000, // evita requests duplicados
      errorRetryCount: 3,
      errorRetryInterval: 5000
    }
  )
}