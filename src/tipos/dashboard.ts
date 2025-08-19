/**
 * Interfaces TypeScript para Dashboard
 */

export interface CardFinanceiro {
  titulo: string
  valor: number
  icone: string
  cor: 'receita' | 'despesa' | 'saldo' | 'cartao'
}