import useSWR from 'swr'
import { obterSaldosContas } from '@/servicos/supabase/dashboard-queries'
import { useAuth } from '@/contextos/auth-contexto'
import type { ContaData } from '@/tipos/dashboard'

interface ContasResponse {
  contas: ContaData[]
  totalSaldo: number
}

export function useContasDados() {
  const { workspace } = useAuth()
  
  return useSWR<ContasResponse>(
    workspace ? ['contas-bancarias', workspace.id] : null,
    () => obterSaldosContas(workspace!.id),
    {
      refreshInterval: 300000, // 5 minutos (dados financeiros)
      revalidateOnFocus: false,
      dedupingInterval: 60000, // 1 minuto
      errorRetryCount: 3,
      errorRetryInterval: 5000
    }
  )
}