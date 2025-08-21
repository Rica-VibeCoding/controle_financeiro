import useSWR from 'swr'
import { obterSaldosContas } from '@/servicos/supabase/dashboard-queries'
import type { ContaData } from '@/tipos/dashboard'

interface ContasResponse {
  contas: ContaData[]
  totalSaldo: number
}

export function useContasDados() {
  return useSWR<ContasResponse>(
    'contas-bancarias-v2-fixed', // Nova chave para forçar refresh
    obterSaldosContas,
    {
      refreshInterval: 60000, // 1 minuto - dados financeiros em tempo real
      revalidateOnFocus: false,
      dedupingInterval: 10000,
      errorRetryCount: 3,
      errorRetryInterval: 5000
    }
  )
}