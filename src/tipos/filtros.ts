export interface FiltrosTransacao {
  data_inicio?: string;
  data_fim?: string;
  categoria_id?: string;
  subcategoria_id?: string;
  conta_id?: string;
  centro_custo_id?: string;
  valor_min?: number;
  valor_max?: number;
  recorrente?: boolean;
  busca?: string; // Busca na descrição
}

export interface ParametrosPaginacao {
  pagina: number;
  limite: number;
  ordenacao?: 'data' | 'valor' | 'descricao';
  direcao?: 'asc' | 'desc';
}

export interface RespostaPaginada<T> {
  dados: T[];
  total: number;
  pagina: number;
  limite: number;
  total_paginas: number;
}

export interface FiltrosCategorias {
  tipo?: 'receita' | 'despesa' | 'ambos';
  ativo?: boolean;
  busca?: string;
}

export interface FiltrosContas {
  tipo?: 'conta_corrente' | 'poupanca' | 'cartao_credito' | 'dinheiro';
  banco?: string;
  ativo?: boolean;
  busca?: string;
}