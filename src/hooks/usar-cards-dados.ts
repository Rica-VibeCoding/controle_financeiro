import useSWR from 'swr'
import { obterDadosCards } from '@/servicos/supabase/dashboard-queries'
import { useAuth } from '@/contextos/auth-contexto'
import type { Periodo } from '@/tipos/dashboard'
import { obterConfigSWR } from '@/utilitarios/swr-config'

export function useCardsData(periodo: Periodo) {
  const { workspace } = useAuth()
  
  return useSWR(
    workspace ? ['dashboard-cards', workspace.id, periodo.inicio, periodo.fim] : null,
    () => obterDadosCards(periodo, workspace!.id),
    obterConfigSWR('criticos') // Cards do dashboard são dados críticos
  )
}