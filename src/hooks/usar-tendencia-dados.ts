import useSWR from 'swr'
import { obterTendencia } from '@/servicos/supabase/dashboard-queries'
import { useAuth } from '@/contextos/auth-contexto'
import type { TendenciaData } from '@/tipos/dashboard'

export function useTendenciaData() {
  const { workspace } = useAuth()
  
  return useSWR<TendenciaData[]>(
    workspace ? ['dashboard-tendencia', workspace.id] : null,
    () => obterTendencia(workspace!.id),
    {
      refreshInterval: 300000, // 5 minutos (dados históricos)
      revalidateOnFocus: false,
      dedupingInterval: 60000, // 1 minuto
      errorRetryCount: 3,
      errorRetryInterval: 5000
    }
  )
}