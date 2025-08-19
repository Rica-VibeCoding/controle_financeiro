/**
 * Tipos para sistema de metas mensais
 * Baseado na estrutura fp_metas_mensais
 */

export interface MetaMensal {
  id: string
  categoria_id: string
  mes_referencia: number  // AAAAMM (ex: 202508)
  valor_meta: number
  data_criacao: string
  data_ultima_atualizacao: string
}

export interface NovaMetaMensal {
  categoria_id: string
  mes_referencia: number
  valor_meta: number
}

export interface MetaComProgresso {
  id: string
  categoria_id: string
  categoria_nome: string
  categoria_icone: string
  categoria_cor: string
  mes_referencia: number
  valor_meta: number
  valor_gasto: number
  valor_disponivel: number
  percentual_usado: number
  status: 'normal' | 'atencao' | 'excedido'
}

export interface ResumoMetas {
  mes_referencia: number
  total_metas: number
  total_gastos: number
  total_disponivel: number
  percentual_total: number
  categorias: MetaComProgresso[]
}

/**
 * Filtros para busca de metas
 */
export interface FiltrosMetas {
  mes_referencia?: number
  categoria_id?: string
}

/**
 * Parâmetros para cálculo de gastos
 */
export interface ParametrosCalculoGastos {
  categoria_id: string
  mes_referencia: number
}

/**
 * Resultado do cálculo de gastos por categoria
 */
export interface GastoCategoria {
  categoria_id: string
  valor_total: number
  quantidade_transacoes: number
}