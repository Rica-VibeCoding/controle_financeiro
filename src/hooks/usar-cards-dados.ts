import useSWR from 'swr'
import { obterDadosCards } from '@/servicos/supabase/dashboard-queries'
import { useAuth } from '@/contextos/auth-contexto'
import type { Periodo } from '@/tipos/dashboard'

export function useCardsData(periodo: Periodo) {
  const { workspace } = useAuth()
  
  return useSWR(
    workspace ? ['dashboard-cards', workspace.id, periodo.inicio, periodo.fim] : null,
    () => obterDadosCards(periodo, workspace!.id),
    {
      refreshInterval: 60000, // 1 minuto 
      revalidateOnFocus: false,
      dedupingInterval: 10000,
      errorRetryCount: 3,
      errorRetryInterval: 5000
    }
  )
}