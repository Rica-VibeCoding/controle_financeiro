import useSWR from 'swr'
import { obterCategoriasMetas } from '@/servicos/supabase/dashboard-queries'
import type { CategoriaData, Periodo } from '@/tipos/dashboard'

export function useCategoriasData(periodo: Periodo) {
  return useSWR<CategoriaData[]>(
    ['dashboard-categorias', periodo.inicio, periodo.fim],
    () => obterCategoriasMetas(periodo),
    {
      refreshInterval: 60000, // 1 minuto
      revalidateOnFocus: false,
      dedupingInterval: 10000,
      errorRetryCount: 3,
      errorRetryInterval: 5000
    }
  )
}