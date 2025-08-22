// Tipos semânticos para Projetos Pessoais
// NOTA: ProjetoPessoal é um wrapper/alias de CentroCusto com cálculos financeiros

import { CentroCusto } from './database'

// Tipo base: CentroCusto + campos calculados
export interface ProjetoPessoal extends CentroCusto {
  // Métricas financeiras calculadas
  total_receitas: number
  total_despesas: number
  resultado: number // receitas - despesas
  
  // Lógica condicional baseada em valor_orcamento
  modo_calculo: 'roi' | 'orcamento'
  percentual_principal: number // ROI% OU Meta%
  label_percentual: string // "ROI: +25%" OU "Meta: 78%"
  
  // Status orçamento (apenas se modo = 'orcamento')
  valor_restante_orcamento: number | null
  
  // Status visual (cores do dashboard)
  status_cor: 'verde' | 'verde-escuro' | 'vermelho' | 'cinza'
  status_descricao: string
  
  // Formatados para UI
  total_receitas_formatado: string
  total_despesas_formatado: string
  resultado_formatado: string
  valor_orcamento_formatado: string | null
}

// Interface para dados do card dashboard
export interface ProjetosPessoaisData {
  projetos: ProjetoPessoal[]
  resumo: {
    total_projetos: number
    projetos_ativos: number
    total_receitas: number
    total_despesas: number
    resultado_geral: number
    roi_medio: number
  }
}

// Tipos auxiliares para cálculos
export interface CalculosFinanceiros {
  receitas: number
  despesas: number
  resultado: number
}

// Filtros específicos para projetos pessoais
export interface FiltroProjetosPessoais {
  periodo_inicio?: string
  periodo_fim?: string
  incluir_arquivados?: boolean
  apenas_ativos?: boolean
}

// Status de um projeto (calculado dinamicamente)
export type StatusProjeto = {
  cor: ProjetoPessoal['status_cor']
  percentual: number
  label: string
  descricao: string
}

// Wrapper types para manter clareza semântica
export type CriarProjetoPessoal = Omit<CentroCusto, 'id' | 'created_at' | 'ativo' | 'arquivado'> & {
  valor_orcamento?: number | null
}

export type AtualizarProjetoPessoal = Partial<CriarProjetoPessoal> & {
  id: string
}