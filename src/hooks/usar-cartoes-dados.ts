import useSWR from 'swr'
import { obterCartoesCredito } from '@/servicos/supabase/dashboard-queries'
import type { CartaoData } from '@/tipos/dashboard'

interface CartoesResponse {
  cartoes: CartaoData[]
  totalUsado: number
  totalLimite: number
}

export function useCartoesDados() {
  return useSWR<CartoesResponse>(
    'cartoes-credito-individuais',
    obterCartoesCredito,
    {
      refreshInterval: 60000, // 1 minuto - dados financeiros em tempo real
      revalidateOnFocus: false,
      dedupingInterval: 10000,
      errorRetryCount: 3,
      errorRetryInterval: 5000
    }
  )
}