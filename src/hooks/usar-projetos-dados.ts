// Hook SWR para Projetos Pessoais (wrapper semântico)
// Segue padrão estabelecido no dashboard

import useSWR from 'swr'
import { obterProjetosPessoais } from '@/servicos/supabase/projetos-pessoais'
import { useAuth } from '@/contextos/auth-contexto'
import { ProjetosPessoaisData, FiltroProjetosPessoais } from '@/tipos/projetos-pessoais'

// Hook principal para dados de projetos pessoais
export function useProjetosData(filtros: FiltroProjetosPessoais = {}) {
  const { workspace } = useAuth()
  
  return useSWR<ProjetosPessoaisData>(
    workspace ? ['projetos-pessoais', workspace.id, filtros] : null,
    () => obterProjetosPessoais(filtros, workspace!.id),
    {
      refreshInterval: 600000, // 10 minutos (projetos mudam pouco)
      revalidateOnFocus: false,
      dedupingInterval: 120000, // 2 minutos
      errorRetryCount: 3,
      errorRetryInterval: 5000,
      // Cache mais agressivo para dados financeiros históricos
      revalidateOnMount: true
    }
  )
}

// Hook específico para o card do dashboard (sem filtros de período)
export function useProjetosDashboard() {
  const { workspace } = useAuth()
  
  return useSWR<ProjetosPessoaisData>(
    workspace ? ['projetos-pessoais-dashboard', workspace.id] : null,
    () => obterProjetosPessoais({ apenas_ativos: true }, workspace!.id),
    {
      refreshInterval: 600000, // 10 minutos (dashboard secundário)
      revalidateOnFocus: false,
      dedupingInterval: 120000, // 2 minutos
      // Prioridade alta para dados do dashboard
      suspense: false
    }
  )
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
      refreshInterval: 120000, // 2 minutos para dados históricos
      revalidateOnFocus: false,
      dedupingInterval: 30000,
      // Cache mais duradouro para consultas históricas
      revalidateOnMount: false
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