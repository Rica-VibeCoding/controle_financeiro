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
      refreshInterval: 0, // ❌ Manual 100% - sem refresh automático
      revalidateOnFocus: false,
      revalidateIfStale: false, // ❌ NUNCA considerar dados velhos
      errorRetryCount: 3,
      errorRetryInterval: 5000
    }
  )
}