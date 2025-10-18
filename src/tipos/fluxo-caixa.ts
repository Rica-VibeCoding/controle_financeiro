// Tipos para o relatório de Fluxo de Caixa Projetado

export interface DadosFluxoCaixa {
  mes: string              // "Jan/2025"
  mes_numero: number       // 1-12
  ano: number              // 2025
  previsto: number         // Soma transações previstas
  realizado: number        // Soma transações efetivadas
  variacao_valor: number   // realizado - previsto
  variacao_percentual: number  // % de desvio
}

export interface KPIsFluxoCaixa {
  saldo_previsto: number
  saldo_realizado: number
  variacao_percentual: number  // % total
  taxa_acerto: number          // % meses dentro de ±10%
  diferenca_total: number      // R$ total de desvio
}

export interface FiltrosFluxoCaixa {
  periodo: '3_meses' | '6_meses' | '12_meses' | 'personalizado'
  tipo: 'ambos' | 'receitas' | 'despesas'
  dataInicio?: string
  dataFim?: string
}
