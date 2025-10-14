// Tipos do banco de dados - baseado no schema.sql

export interface Database {
  public: {
    Tables: {
      fp_categorias: {
        Row: {
          id: string
          nome: string
          tipo: 'receita' | 'despesa' | 'ambos'
          icone: string
          cor: string
          ativo: boolean
          created_at: string
          workspace_id: string
        }
        Insert: {
          id?: string
          nome: string
          tipo: 'receita' | 'despesa' | 'ambos'
          icone?: string
          cor?: string
          ativo?: boolean
          created_at?: string
          workspace_id: string
        }
        Update: {
          id?: string
          nome?: string
          tipo?: 'receita' | 'despesa' | 'ambos'
          icone?: string
          cor?: string
          ativo?: boolean
          created_at?: string
          workspace_id?: string
        }
      }
      fp_subcategorias: {
        Row: {
          id: string
          nome: string
          categoria_id: string
          ativo: boolean
          created_at: string
          workspace_id: string
        }
        Insert: {
          id?: string
          nome: string
          categoria_id: string
          ativo?: boolean
          created_at?: string
          workspace_id: string
        }
        Update: {
          id?: string
          nome?: string
          categoria_id?: string
          ativo?: boolean
          created_at?: string
          workspace_id?: string
        }
      }
      fp_contas: {
        Row: {
          id: string
          nome: string
          tipo: string
          banco: string | null
          limite: number | null
          data_fechamento: number | null
          ativo: boolean
          created_at: string
          workspace_id: string
        }
        Insert: {
          id?: string
          nome: string
          tipo: string
          banco?: string | null
          limite?: number | null
          data_fechamento?: number | null
          ativo?: boolean
          created_at?: string
          workspace_id: string
        }
        Update: {
          id?: string
          nome?: string
          tipo?: string
          banco?: string | null
          limite?: number | null
          data_fechamento?: number | null
          ativo?: boolean
          created_at?: string
          workspace_id?: string
        }
      }
      fp_formas_pagamento: {
        Row: {
          id: string
          nome: string
          tipo: string
          permite_parcelamento: boolean
          ativo: boolean
          created_at: string
          workspace_id: string
        }
        Insert: {
          id?: string
          nome: string
          tipo: string
          permite_parcelamento?: boolean
          ativo?: boolean
          created_at?: string
          workspace_id: string
        }
        Update: {
          id?: string
          nome?: string
          tipo?: string
          permite_parcelamento?: boolean
          ativo?: boolean
          created_at?: string
          workspace_id?: string
        }
      }
      fp_centros_custo: {
        Row: {
          id: string
          nome: string
          descricao: string | null
          cor: string
          ativo: boolean
          created_at: string
          valor_orcamento: number | null
          data_inicio: string
          data_fim: string
          arquivado: boolean
          data_arquivamento: string | null
          workspace_id: string
        }
        Insert: {
          id?: string
          nome: string
          descricao?: string | null
          cor?: string
          ativo?: boolean
          created_at?: string
          valor_orcamento?: number | null
          data_inicio?: string
          data_fim?: string
          arquivado?: boolean
          data_arquivamento?: string | null
          workspace_id: string
        }
        Update: {
          id?: string
          nome?: string
          descricao?: string | null
          cor?: string
          ativo?: boolean
          created_at?: string
          valor_orcamento?: number | null
          data_inicio?: string
          data_fim?: string
          arquivado?: boolean
          data_arquivamento?: string | null
          workspace_id?: string
        }
      }
      fp_transacoes: {
        Row: {
          id: string
          data: string
          descricao: string
          categoria_id: string | null
          subcategoria_id: string | null
          forma_pagamento_id: string | null
          centro_custo_id: string | null
          valor: number
          tipo: 'receita' | 'despesa' | 'transferencia'
          conta_id: string
          conta_destino_id: string | null
          parcela_atual: number
          total_parcelas: number
          grupo_parcelamento: number | null
          recorrente: boolean
          frequencia_recorrencia: string | null
          proxima_recorrencia: string | null
          status: 'previsto' | 'realizado'
          data_vencimento: string | null
          data_registro: string
          anexo_url: string | null
          observacoes: string | null
          identificador_externo: string | null
          contato_id: string | null
          workspace_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          data: string
          descricao: string
          categoria_id?: string | null
          subcategoria_id?: string | null
          forma_pagamento_id?: string | null
          centro_custo_id?: string | null
          valor: number
          tipo: 'receita' | 'despesa' | 'transferencia'
          conta_id: string
          conta_destino_id?: string | null
          parcela_atual?: number
          total_parcelas?: number
          grupo_parcelamento?: number | null
          recorrente?: boolean
          frequencia_recorrencia?: string | null
          proxima_recorrencia?: string | null
          status?: 'previsto' | 'realizado'
          data_vencimento?: string | null
          data_registro?: string
          anexo_url?: string | null
          observacoes?: string | null
          identificador_externo?: string | null
          contato_id?: string | null
          workspace_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          data?: string
          descricao?: string
          categoria_id?: string | null
          subcategoria_id?: string | null
          forma_pagamento_id?: string | null
          centro_custo_id?: string | null
          valor?: number
          tipo?: 'receita' | 'despesa' | 'transferencia'
          conta_id?: string
          conta_destino_id?: string | null
          parcela_atual?: number
          total_parcelas?: number
          grupo_parcelamento?: number | null
          recorrente?: boolean
          frequencia_recorrencia?: string | null
          proxima_recorrencia?: string | null
          status?: 'previsto' | 'realizado'
          data_vencimento?: string | null
          data_registro?: string
          anexo_url?: string | null
          observacoes?: string | null
          identificador_externo?: string | null
          contato_id?: string | null
          workspace_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      fp_metas: {
        Row: {
          id: string
          nome: string
          descricao: string | null
          categoria_id: string | null
          valor_limite: number
          periodo_inicio: string
          periodo_fim: string
          tipo: 'categoria' | 'total'
          ativo: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          nome: string
          descricao?: string | null
          categoria_id?: string | null
          valor_limite: number
          periodo_inicio: string
          periodo_fim: string
          tipo?: 'categoria' | 'total'
          ativo?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          nome?: string
          descricao?: string | null
          categoria_id?: string | null
          valor_limite?: number
          periodo_inicio?: string
          periodo_fim?: string
          tipo?: 'categoria' | 'total'
          ativo?: boolean
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}

// Tipos auxiliares
export type Categoria = Database['public']['Tables']['fp_categorias']['Row']
export type Subcategoria = Database['public']['Tables']['fp_subcategorias']['Row']
export type Conta = Database['public']['Tables']['fp_contas']['Row']
export type FormaPagamento = Database['public']['Tables']['fp_formas_pagamento']['Row']
export type CentroCusto = Database['public']['Tables']['fp_centros_custo']['Row']
export type Transacao = Database['public']['Tables']['fp_transacoes']['Row']
export type Meta = Database['public']['Tables']['fp_metas']['Row']

// Tipos para inserção
export type NovaTransacao = Database['public']['Tables']['fp_transacoes']['Insert']
export type NovaMeta = Database['public']['Tables']['fp_metas']['Insert']
export type NovaCategoria = Database['public']['Tables']['fp_categorias']['Insert']
export type NovaSubcategoria = Database['public']['Tables']['fp_subcategorias']['Insert']
export type NovaConta = Database['public']['Tables']['fp_contas']['Insert']
export type NovaFormaPagamento = Database['public']['Tables']['fp_formas_pagamento']['Insert']
export type NovoCentroCusto = Database['public']['Tables']['fp_centros_custo']['Insert']

/**
 * Contato do sistema (cliente, fornecedor, etc)
 * Tabela: r_contatos
 */
export interface Contato {
  id: string
  nome: string
  cpf_cnpj: string | null
  tipo_pessoa: 'cliente' | 'fornecedor' | 'parceiro' | 'freelancer' | 'lojista'
  telefone: string | null
  email: string | null
  ativo: boolean
  workspace_id: string
  created_at: string
  updated_at: string
}