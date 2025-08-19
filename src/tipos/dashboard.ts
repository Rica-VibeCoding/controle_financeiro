/**
 * Interfaces TypeScript para Dashboard
 */

export interface DadosDashboard {
  receitas: number
  despesas: number
  saldo: number
  gastosCartao: number
  periodo: {
    mes: number
    ano: number
  }
}

export interface FiltroTemporal {
  mesAtivo: number
  anoAtivo: number
  anosDisponiveis: number[]
  mesesComDados: number[]
}

export interface CardFinanceiro {
  titulo: string
  valor: number
  icone: string
  cor: 'receita' | 'despesa' | 'saldo' | 'cartao'
  variacao?: number
}

export interface PeriodoFiltro {
  mes: number
  ano: number
}

export interface DadosAnalise {
  anosDisponiveis: number[]
  mesesComDados: Record<number, number[]> // ano -> meses[]
  totalTransacoes: number
  formasPagamento: {
    nome: string
    tipo: string
    uso_total: number
  }[]
}