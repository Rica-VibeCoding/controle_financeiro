import useSWR from 'swr'
import { obterProximasContas } from '@/servicos/supabase/dashboard-queries'
import type { ProximaConta } from '@/tipos/dashboard'

export function useProximasContas() {
  return useSWR<ProximaConta[]>(
    'proximas-contas',
    obterProximasContas,
    {
      refreshInterval: 60000, // 1 minuto
      revalidateOnFocus: true, // importante para contas vencendo
      dedupingInterval: 10000,
      errorRetryCount: 3,
      errorRetryInterval: 5000
    }
  )
}