// Interface para dados do dashboard baseada no dashboard.html
export interface DashboardData {
  periodo: {
    mes: string
    ano: number
    inicio: string // '2025-08-01'
    fim: string    // '2025-08-31'
  }
  cards: {
    receitas: {
      atual: number
      anterior: number
      percentual: number
      tendencia: number[] // últimos 7 dias
    }
    despesas: {
      atual: number
      anterior: number
      percentual: number
      tendencia: number[] // últimos 7 dias
    }
    saldo: {
      atual: number
      anterior: number
      percentual: number
      tendencia: number[] // últimos 7 dias
    }
    gastosCartao: {
      atual: number      // total usado
      limite: number     // total limites
      percentual: number // (usado/limite)*100
      tendencia: number[] // últimos 7 dias
    }
  }
  proximasContas: Array<{
    nome: string
    valor: number
    dias: number
    urgencia: 'alta' | 'media' | 'baixa'
  }>
  categorias: Array<{
    nome: string
    gasto: number
    meta: number
    cor: string
    percentual: number // (gasto/meta)*100
  }>
  cartoes: Array<{
    nome: string
    usado: number
    limite: number
    vencimento: string // 'DD/MM'
    percentual: number // (usado/limite)*100
  }>
  contas: Array<{
    nome: string
    saldo: number
    tipo: string
  }>
  tendencia: Array<{
    mes: string // 'Mar', 'Abr'
    saldo: number
  }>
}

// Interface para período
export interface Periodo {
  inicio: string
  fim: string
  mes: string
  ano: string
}

// Interface para cards de métricas
export interface CardMetricaData {
  atual: number
  anterior: number
  percentual: number
  tendencia: number[]
}

// Interface para próximas contas
export interface ProximaConta {
  id: string
  descricao: string
  valor: number
  dias: number
  categoria: {
    nome: string
    cor: string
    icone: string
  }
  vencida: boolean
}

// Interface para categorias
export interface CategoriaData {
  nome: string
  gasto: number
  meta: number | null  // null quando categoria não tem meta
  cor: string
  percentual: number   // 0 quando meta é null
}

// Interface para cartões
export interface CartaoData {
  nome: string
  usado: number
  limite: number
  vencimento: string
  percentual: number
}

// Interface para contas
export interface ContaData {
  nome: string
  saldo: number
  tipo: string
}

// Interface para tendência
export interface TendenciaData {
  mes: string
  receitas: number
  despesas: number
  saldo: number
}