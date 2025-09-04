import useSWR from 'swr'
import { obterProximasContas } from '@/servicos/supabase/dashboard-queries'
import { useAuth } from '@/contextos/auth-contexto'
import type { ProximaConta } from '@/tipos/dashboard'

export function useProximasContas() {
  const { workspace } = useAuth()
  
  return useSWR<ProximaConta[]>(
    workspace ? ['proximas-contas', workspace.id] : null,
    () => obterProximasContas(workspace!.id),
    {
      refreshInterval: 60000, // 1 minuto
      revalidateOnFocus: true, // importante para contas vencendo
      dedupingInterval: 10000,
      errorRetryCount: 3,
      errorRetryInterval: 5000
    }
  )
}