// Hook SWR para Projetos Pessoais (wrapper semântico)
// Segue padrão estabelecido no dashboard

import useSWR from 'swr'
import { obterProjetosPessoais } from '@/servicos/supabase/projetos-pessoais'
import { useAuth } from '@/contextos/auth-contexto'
import { ProjetosPessoaisData, FiltroProjetosPessoais } from '@/tipos/projetos-pessoais'
import { usarProjetosModo } from './usar-projetos-modo'
import { obterConfigSWR } from '@/utilitarios/swr-config'

// Hook principal para dados de projetos pessoais
export function useProjetosData(filtros: FiltroProjetosPessoais = {}) {
  const { workspace } = useAuth()
  
  return useSWR<ProjetosPessoaisData>(
    workspace ? ['projetos-pessoais', workspace.id, filtros] : null,
    () => obterProjetosPessoais(filtros, workspace!.id),
    obterConfigSWR('otimizada')
  )
}

// Hook específico para o card do dashboard (sem filtros de período)
export function useProjetosDashboard() {
  const { workspace } = useAuth()
  const { mostrarPendentes } = usarProjetosModo()
  
  const swrResult = useSWR<ProjetosPessoaisData>(
    workspace ? ['projetos-pessoais-dashboard', workspace.id, mostrarPendentes] : null,
    () => obterProjetosPessoais({ 
      apenas_ativos: true,
      incluir_pendentes: mostrarPendentes
    }, workspace!.id),
    obterConfigSWR('otimizada')
  )

  return {
    ...swrResult,
    revalidar: swrResult.mutate
  }
}

// Hook para projetos com filtro de período específico
export function useProjetosPeriodo(
  periodo_inicio: string,
  periodo_fim: string,
  incluir_arquivados = false
) {
  const { workspace } = useAuth()
  
  return useSWR<ProjetosPessoaisData>(
    workspace ? ['projetos-pessoais-periodo', workspace.id, periodo_inicio, periodo_fim, incluir_arquivados] : null,
    () => obterProjetosPessoais({
      periodo_inicio,
      periodo_fim,
      incluir_arquivados
    }, workspace!.id),
    {
      ...obterConfigSWR('otimizada'),
      // Cache mais duradouro para consultas históricas
      revalidateOnMount: false,
      refreshInterval: 1800000 // 30 min para dados históricos
    }
  )
}

// Utilities para trabalhar com os dados
export function useProjetosUtilities() {
  return {
    // Filtrar projetos por status
    filtrarPorStatus: (projetos: ProjetosPessoaisData['projetos'], status: 'verde' | 'vermelho' | 'cinza' | 'verde-escuro') =>
      projetos.filter(p => p.status_cor === status),
    
    // Ordenar projetos por resultado
    ordenarPorResultado: (projetos: ProjetosPessoaisData['projetos'], ordem: 'asc' | 'desc' = 'desc') =>
      [...projetos].sort((a, b) => 
        ordem === 'desc' ? b.resultado - a.resultado : a.resultado - b.resultado
      ),
    
    // Filtrar apenas projetos lucrativos
    apenasLucrativos: (projetos: ProjetosPessoaisData['projetos']) =>
      projetos.filter(p => p.resultado > 0),
    
    // Filtrar apenas projetos com orçamento
    apenasComOrcamento: (projetos: ProjetosPessoaisData['projetos']) =>
      projetos.filter(p => p.modo_calculo === 'orcamento'),
    
    // Calcular ROI médio
    calcularROIMedio: (projetos: ProjetosPessoaisData['projetos']) => {
      const projetosROI = projetos.filter(p => p.modo_calculo === 'roi' && p.total_receitas > 0)
      return projetosROI.length > 0
        ? projetosROI.reduce((sum, p) => sum + p.percentual_principal, 0) / projetosROI.length
        : 0
    }
  }
}