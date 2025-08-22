// Hook SWR para Projetos Pessoais (wrapper semântico)
// Segue padrão estabelecido no dashboard

import useSWR from 'swr'
import { obterProjetosPessoais } from '@/servicos/supabase/projetos-pessoais'
import { ProjetosPessoaisData, FiltroProjetosPessoais } from '@/tipos/projetos-pessoais'

// Hook principal para dados de projetos pessoais
export function useProjetosData(filtros: FiltroProjetosPessoais = {}) {
  return useSWR<ProjetosPessoaisData>(
    ['projetos-pessoais', filtros],
    () => obterProjetosPessoais(filtros),
    {
      refreshInterval: 60000, // 1 minuto (padrão dashboard)
      revalidateOnFocus: false,
      dedupingInterval: 10000,
      errorRetryCount: 3,
      errorRetryInterval: 5000,
      // Cache mais agressivo para dados financeiros históricos
      revalidateOnMount: true
    }
  )
}

// Hook específico para o card do dashboard (sem filtros de período)
export function useProjetosDashboard() {
  return useSWR<ProjetosPessoaisData>(
    'projetos-pessoais-dashboard',
    () => obterProjetosPessoais({ apenas_ativos: true }),
    {
      refreshInterval: 60000,
      revalidateOnFocus: false,
      dedupingInterval: 15000,
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
  return useSWR<ProjetosPessoaisData>(
    ['projetos-pessoais-periodo', periodo_inicio, periodo_fim, incluir_arquivados],
    () => obterProjetosPessoais({
      periodo_inicio,
      periodo_fim,
      incluir_arquivados
    }),
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