import useSWR from 'swr'
import { buscarDadosROIClientes, buscarKPIs } from '@/servicos/supabase/roi-cliente-queries'
import type { ClienteROI, CardKPI, FiltrosROI } from '@/tipos/roi-cliente'
import { useAuth } from '@/contextos/auth-contexto'
import { obterConfigSWR } from '@/utilitarios/swr-config'

export function useROIClientes(filtros: FiltrosROI) {
  const { workspace } = useAuth()

  const { data: clientes, error: errorClientes, isLoading: loadingClientes } = useSWR<ClienteROI[]>(
    workspace ? ['roi-clientes', workspace.id, filtros] : null,
    () => buscarDadosROIClientes(workspace!.id, filtros),
    obterConfigSWR('otimizada')
  )

  const { data: kpis, error: errorKPIs, isLoading: loadingKPIs } = useSWR<CardKPI>(
    workspace ? ['roi-kpis', workspace.id] : null,
    () => buscarKPIs(workspace!.id),
    obterConfigSWR('otimizada')
  )

  return {
    clientes: clientes || [],
    kpis,
    isLoading: loadingClientes || loadingKPIs,
    error: errorClientes || errorKPIs
  }
}
