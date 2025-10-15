import useSWR from 'swr'
import { obterCartoesCredito } from '@/servicos/supabase/dashboard-queries'
import { useAuth } from '@/contextos/auth-contexto'
import type { CartaoData, Periodo } from '@/tipos/dashboard'

interface CartoesResponse {
  cartoes: CartaoData[]
  totalUsado: number
  totalLimite: number
}

export function useCartoesDados(periodo: Periodo) {
  const { workspace } = useAuth()
  
  return useSWR<CartoesResponse>(
    workspace ? ['cartoes-credito', workspace.id, periodo.inicio, periodo.fim] : null,
    () => obterCartoesCredito(periodo, workspace!.id),
    {
      refreshInterval: 0, // ❌ Manual 100% - sem refresh automático
      revalidateOnFocus: false,
      revalidateIfStale: false, // ❌ NUNCA considerar dados velhos
      errorRetryCount: 3,
      errorRetryInterval: 5000
    }
  )
}