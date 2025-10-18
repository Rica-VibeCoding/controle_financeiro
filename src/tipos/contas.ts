// src/tipos/contas.ts

/**
 * Conta a Pagar ou Receber (transação prevista/pendente)
 */
export interface ContaPagarReceber {
  id: string
  descricao: string
  valor: number
  data_vencimento: string        // ISO date string
  dias_vencimento: number         // Negativo = atrasado, Positivo = a vencer
  tipo: 'receita' | 'despesa'
  status: 'previsto' | 'realizado'

  // Relacionamentos
  categoria: string               // Nome da categoria
  subcategoria?: string           // Nome da subcategoria
  conta: string                   // Nome da conta bancária
  contato?: string                // Nome do contato (fornecedor/cliente)

  // Campos extras
  observacoes?: string
  recorrente: boolean

  // IDs originais (para edição)
  categoria_id: string
  conta_id: string
  contato_id?: string
}

/**
 * Cards de resumo (KPIs)
 */
export interface ResumoContas {
  aPagar30Dias: {
    total: number
    quantidade: number
  }
  aReceber30Dias: {
    total: number
    quantidade: number
  }
  vencidoPagar: {
    total: number
    quantidade: number
  }
  atrasadoReceber: {
    total: number
    quantidade: number
  }
}

/**
 * Filtros disponíveis
 */
export interface FiltrosContas {
  periodo: '30_dias' | '60_dias' | '90_dias' | 'personalizado'
  categoria?: string              // ID da categoria
  busca?: string                  // Busca por descrição/contato
  dataInicio?: string             // Para período personalizado
  dataFim?: string                // Para período personalizado
}

/**
 * Tipo de aba ativa
 */
export type AbaContas = 'a_pagar' | 'a_receber' | 'vencidas'

/**
 * Resposta da API
 */
export interface RespostaAPIContas {
  contas: ContaPagarReceber[]
  resumo: ResumoContas
}
