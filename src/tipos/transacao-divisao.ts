import { NovaTransacao } from './database'

/**
 * Representa a divisão de valor de uma transação para um cliente
 */
export interface DivisaoCliente {
  id?: string // ID temporário no frontend (uuid v4) ou ID do banco
  cliente_id: string
  valor_alocado: number
}

/**
 * Estado da divisão de clientes no formulário
 */
export interface EstadoDivisaoClientes {
  habilitado: boolean // Se a divisão está ativa
  divisoes: DivisaoCliente[] // Lista de divisões
  somaAtual: number // Soma dos valores alocados
  valorTotal: number // Valor total da transação
  valido: boolean // Se soma = total
}

/**
 * Dados completos da transação com divisões para salvar
 */
export interface TransacaoComDivisao {
  transacao: NovaTransacao
  divisoes?: DivisaoCliente[] // Opcional: só existe se dividir
}
