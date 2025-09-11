/**
 * Tipos para sistema de backup e exportação de dados
 * Baseado na estrutura das tabelas fp_ do Supabase
 */

export interface DadosExportacao {
  categorias: CategoriaExportacao[]
  subcategorias: SubcategoriaExportacao[]
  contas: ContaExportacao[]
  formasPagamento: FormaPagamentoExportacao[]
  centrosCusto: CentroCustoExportacao[]
  transacoes: TransacaoExportacao[]
  metasMensais: MetaMensalExportacao[]
}

export interface CategoriaExportacao {
  id: string
  nome: string
  tipo: string
  icone: string | null
  cor: string | null
  ativo: boolean
  created_at: string
  workspace_id: string
}

export interface SubcategoriaExportacao {
  id: string
  nome: string
  categoria_id: string | null
  ativo: boolean
  created_at: string
  workspace_id: string
}

export interface ContaExportacao {
  id: string
  nome: string
  tipo: string
  banco: string | null
  ativo: boolean
  created_at: string
  limite: number | null
  data_fechamento: number | null
  workspace_id: string
}

export interface FormaPagamentoExportacao {
  id: string
  nome: string
  tipo: string
  permite_parcelamento: boolean
  ativo: boolean
  created_at: string
  workspace_id: string
}

export interface CentroCustoExportacao {
  id: string
  nome: string
  descricao: string | null
  cor: string | null
  ativo: boolean
  created_at: string
  valor_orcamento: number
  data_inicio: string | null
  data_fim: string | null
  arquivado: boolean
  data_arquivamento: string | null
  workspace_id: string
}

export interface TransacaoExportacao {
  id: string
  data: string
  descricao: string
  categoria_id: string | null
  subcategoria_id: string | null
  forma_pagamento_id: string | null
  centro_custo_id: string | null
  valor: number
  tipo: string
  conta_id: string
  conta_destino_id: string | null
  parcela_atual: number
  total_parcelas: number
  grupo_parcelamento: number | null
  recorrente: boolean
  frequencia_recorrencia: string | null
  proxima_recorrencia: string | null
  status: string | null
  data_vencimento: string | null
  data_registro: string | null
  anexo_url: string | null
  observacoes: string | null
  created_at: string
  updated_at: string
  identificador_externo: string | null
  workspace_id: string
}

export interface MetaMensalExportacao {
  id: string
  categoria_id: string
  mes_referencia: number
  valor_meta: number
  data_criacao: string
  data_ultima_atualizacao: string
  workspace_id: string
}

export interface EstadoExportacao {
  exportando: boolean
  progresso: number
  etapaAtual: string
  erro: string | null
  arquivoGerado?: string
}

export interface ConfiguracaoExportacao {
  incluirCategorias: boolean
  incluirSubcategorias: boolean
  incluirContas: boolean
  incluirFormasPagamento: boolean
  incluirCentrosCusto: boolean
  incluirTransacoes: boolean
  incluirMetas: boolean
}

export interface LogExportacao {
  etapa: string
  status: 'iniciado' | 'concluido' | 'erro'
  detalhes?: string
  timestamp: string
}

export interface ResumoExportacao {
  totalRegistros: number
  registrosPorTabela: {
    [tabela: string]: number
  }
  tamanhoArquivo: number
  dataExportacao: string
}

// Tipos para importação
export interface DadosImportacao {
  categorias?: CategoriaExportacao[]
  subcategorias?: SubcategoriaExportacao[]
  contas?: ContaExportacao[]
  formasPagamento?: FormaPagamentoExportacao[]
  centrosCusto?: CentroCustoExportacao[]
  transacoes?: TransacaoExportacao[]
  metasMensais?: MetaMensalExportacao[]
}

export interface EstadoImportacao {
  importando: boolean
  progresso: number
  etapaAtual: string
  erro: string | null
  dadosCarregados?: DadosImportacao
  resumoValidacao?: ResumoValidacao
}

export interface ConfiguracaoImportacao {
  modoImportacao: 'incremental' | 'limpo'
  validarIntegridade: boolean
  criarBackupAntes: boolean
  manterDadosExistentes: boolean
}

export interface ResumoValidacao {
  arquivoValido: boolean
  tabelasEncontradas: string[]
  totalRegistros: number
  registrosPorTabela: {
    [tabela: string]: number
  }
  errosValidacao: ErroValidacao[]
  advertencias: string[]
  crossWorkspaceDetected?: boolean
  workspacesOriginais?: string[]
}

export interface ErroValidacao {
  tabela: string
  linha?: number
  campo?: string
  mensagem: string
  tipo: 'erro' | 'advertencia'
}

export interface PreviewImportacao {
  tabela: string
  registros: any[]
  totalRegistros: number
  colunas: string[]
  amostra: any[]
}

export interface ResultadoImportacao {
  sucesso: boolean
  totalImportados: number
  registrosPorTabela: {
    [tabela: string]: number
  }
  erros: string[]
  advertencias: string[]
  tempoExecucao: number
}

// Tipos para Reset Personalizado
export interface ConfiguracaoReset {
  incluirTransacoes: boolean
  incluirCategorias: boolean
  incluirSubcategorias: boolean
  incluirContas: boolean
  incluirFormasPagamento: boolean
  incluirCentrosCusto: boolean
  incluirMetas: boolean
  criarBackupAntes: boolean
}

export interface EstadoReset {
  resetando: boolean
  progresso: number
  etapaAtual: string
  erro: string | null
  previewCarregado?: boolean
  dadosParaReset?: PreviewReset
}

export interface PreviewReset {
  totalRegistros: number
  registrosPorTabela: {
    [tabela: string]: number
  }
  tabelasSelecionadas: string[]
  ultimoBackup?: string
}

export interface ResultadoReset {
  sucesso: boolean
  totalApagados: number
  registrosPorTabela: {
    [tabela: string]: number
  }
  backupCriado: boolean
  nomeBackup?: string
  erros: string[]
  advertencias: string[]
  tempoExecucao: number
}