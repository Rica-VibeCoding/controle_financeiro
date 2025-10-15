// Tipos para o relatório de ROI por Cliente (Centro de Custo)

export interface ClienteROI {
  id: string
  nome: string
  receita: number
  despesa: number
  lucro: number
  margem: number
}

export interface ItemDetalhado {
  categoria: string
  subcategoria: string
  valor: number
  quantidade: number
  percentual: number
}

export interface DetalhesCliente {
  receitas: ItemDetalhado[]
  despesas: ItemDetalhado[]
  totais: {
    receita: number
    despesa: number
  }
}

export interface CardKPI {
  melhorRoiPercentual: {
    cliente: string
    valor: number
  }
  melhorRoiValor: {
    cliente: string
    valor: number
  }
  margemMensal: {
    percentual: number
    lucroTotal: number
  }
}

export interface FiltrosROI {
  periodo: 'todo' | 'mes_atual' | '3_meses' | '6_meses' | '1_ano' | 'personalizado'
  ordenacao: 'margem_desc' | 'margem_asc' | 'lucro_desc' | 'lucro_asc' | 'receita_desc' | 'nome_asc'
  dataInicio?: string
  dataFim?: string
}

export interface EvolucaoMensal {
  mes: string          // Formato: "Mon/YYYY" (ex: "Jan/2025")
  mes_numero: number   // 1-12
  ano: number          // YYYY
  receita: number
  despesa: number
  lucro: number
  margem: number
}
