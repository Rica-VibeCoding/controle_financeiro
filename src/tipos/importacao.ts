export interface LinhaCSV {
  Data: string
  Valor: string
  Identificador: string
  Descrição: string
}

export interface LinhaCartao {
  date: string
  title: string
  amount: string
}

export interface TransacaoImportada {
  data: string
  valor: number
  identificador_externo: string
  descricao: string
  conta_id: string
  tipo: 'receita' | 'despesa'
}

// Union type para suportar múltiplos formatos
export type LinhaCSVUniversal = LinhaCSV | LinhaCartao

export interface ResultadoImportacao {
  total: number
  importadas: number
  duplicadas: number
  erros: string[]
}

// ============================================
// NOVOS TIPOS - MOTOR DE CLASSIFICAÇÃO
// ============================================

export interface DadosClassificacao {
  categoria_id: string
  subcategoria_id: string
  forma_pagamento_id: string
}

export type TipoLancamento = 'gasto_real' | 'ajuste_contabil' | 'pagamento_credito' | 'taxa_juro'

export interface SinalizacaoLancamento {
  tipo: TipoLancamento
  icone: string
  descricao: string
  tooltip: string
}

export interface TransacaoClassificada extends TransacaoImportada {
  classificacao_automatica?: DadosClassificacao
  status_classificacao: 'reconhecida' | 'pendente' | 'duplicada'
  categoria_id?: string
  subcategoria_id?: string
  forma_pagamento_id?: string
  formato_origem?: string // Para identificar se veio de cartão, nubank, etc.
  sinalizacao?: SinalizacaoLancamento
  selecionada?: boolean // Para controle de seleção individual
}

export interface ResumoClassificacao {
  reconhecidas: number    // Verde - já classificadas automaticamente
  pendentes: number      // Amarelo - precisam classificação manual
  duplicadas: number     // Vermelho - ignoradas (sistema atual)
}

// Para modal de classificação manual
export interface ClassificacaoManual {
  transacao: TransacaoClassificada
  dados: DadosClassificacao
}