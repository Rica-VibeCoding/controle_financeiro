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