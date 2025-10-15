import useSWR from 'swr'
import { obterCategoriasMetas } from '@/servicos/supabase/dashboard-queries'
import { useAuth } from '@/contextos/auth-contexto'
import type { CategoriaData, Periodo } from '@/tipos/dashboard'

export function useCategoriasData(periodo: Periodo) {
  const { workspace } = useAuth()
  
  return useSWR<CategoriaData[]>(
    workspace ? ['dashboard-categorias', workspace.id, periodo.inicio, periodo.fim] : null,
    () => obterCategoriasMetas(periodo, workspace!.id),
    {
      refreshInterval: 0, // ❌ Manual 100% - sem refresh automático
      revalidateOnFocus: false,
      revalidateIfStale: false, // ❌ NUNCA considerar dados velhos
      errorRetryCount: 3,
      errorRetryInterval: 5000
    }
  )
}