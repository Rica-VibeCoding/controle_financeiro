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
      refreshInterval: 0, // ❌ Manual 100% - sem refresh automático
      revalidateOnFocus: false, // ❌ Não atualiza ao trocar aba
      revalidateIfStale: false, // ❌ NUNCA considerar dados velhos
      errorRetryCount: 3,
      errorRetryInterval: 5000
    }
  )
}