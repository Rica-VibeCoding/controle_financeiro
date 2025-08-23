import { supabase } from '../supabase/cliente'
import JSZip from 'jszip'
import type { 
  DadosExportacao, 
  LogExportacao, 
  ResumoExportacao,
  ConfiguracaoExportacao,
  CategoriaExportacao,
  SubcategoriaExportacao,
  ContaExportacao,
  FormaPagamentoExportacao,
  CentroCustoExportacao,
  TransacaoExportacao,
  MetaMensalExportacao
} from '@/tipos/backup'

export class ExportadorDados {
  private logs: LogExportacao[] = []
  private onProgresso?: (progresso: number, etapa: string) => void

  constructor(onProgresso?: (progresso: number, etapa: string) => void) {
    this.onProgresso = onProgresso
  }

  private adicionarLog(etapa: string, status: 'iniciado' | 'concluido' | 'erro', detalhes?: string) {
    this.logs.push({
      etapa,
      status,
      detalhes,
      timestamp: new Date().toISOString()
    })
  }

  private atualizarProgresso(progresso: number, etapa: string) {
    if (this.onProgresso) {
      this.onProgresso(progresso, etapa)
    }
  }

  private async exportarCategorias(): Promise<CategoriaExportacao[]> {
    this.adicionarLog('Categorias', 'iniciado')
    
    const { data, error } = await supabase
      .from('fp_categorias')
      .select('*')
      .eq('ativo', true)
      .order('nome')

    if (error) {
      this.adicionarLog('Categorias', 'erro', error.message)
      throw new Error(`Erro ao exportar categorias: ${error.message}`)
    }

    this.adicionarLog('Categorias', 'concluido', `${data?.length || 0} registros`)
    return data || []
  }

  private async exportarSubcategorias(): Promise<SubcategoriaExportacao[]> {
    this.adicionarLog('Subcategorias', 'iniciado')
    
    const { data, error } = await supabase
      .from('fp_subcategorias')
      .select('*')
      .eq('ativo', true)
      .order('nome')

    if (error) {
      this.adicionarLog('Subcategorias', 'erro', error.message)
      throw new Error(`Erro ao exportar subcategorias: ${error.message}`)
    }

    this.adicionarLog('Subcategorias', 'concluido', `${data?.length || 0} registros`)
    return data || []
  }

  private async exportarContas(): Promise<ContaExportacao[]> {
    this.adicionarLog('Contas', 'iniciado')
    
    const { data, error } = await supabase
      .from('fp_contas')
      .select('*')
      .eq('ativo', true)
      .order('nome')

    if (error) {
      this.adicionarLog('Contas', 'erro', error.message)
      throw new Error(`Erro ao exportar contas: ${error.message}`)
    }

    this.adicionarLog('Contas', 'concluido', `${data?.length || 0} registros`)
    return data || []
  }

  private async exportarFormasPagamento(): Promise<FormaPagamentoExportacao[]> {
    this.adicionarLog('Formas de Pagamento', 'iniciado')
    
    const { data, error } = await supabase
      .from('fp_formas_pagamento')
      .select('*')
      .eq('ativo', true)
      .order('nome')

    if (error) {
      this.adicionarLog('Formas de Pagamento', 'erro', error.message)
      throw new Error(`Erro ao exportar formas de pagamento: ${error.message}`)
    }

    this.adicionarLog('Formas de Pagamento', 'concluido', `${data?.length || 0} registros`)
    return data || []
  }

  private async exportarCentrosCusto(): Promise<CentroCustoExportacao[]> {
    this.adicionarLog('Centros de Custo', 'iniciado')
    
    const { data, error } = await supabase
      .from('fp_centros_custo')
      .select('*')
      .eq('ativo', true)
      .order('nome')

    if (error) {
      this.adicionarLog('Centros de Custo', 'erro', error.message)
      throw new Error(`Erro ao exportar centros de custo: ${error.message}`)
    }

    this.adicionarLog('Centros de Custo', 'concluido', `${data?.length || 0} registros`)
    return data || []
  }

  private async exportarTransacoes(): Promise<TransacaoExportacao[]> {
    this.adicionarLog('Transações', 'iniciado')
    
    const { data, error } = await supabase
      .from('fp_transacoes')
      .select('*')
      .order('data', { ascending: false })

    if (error) {
      this.adicionarLog('Transações', 'erro', error.message)
      throw new Error(`Erro ao exportar transações: ${error.message}`)
    }

    this.adicionarLog('Transações', 'concluido', `${data?.length || 0} registros`)
    return data || []
  }

  private async exportarMetasMensais(): Promise<MetaMensalExportacao[]> {
    this.adicionarLog('Metas Mensais', 'iniciado')
    
    const { data, error } = await supabase
      .from('fp_metas_mensais')
      .select('*')
      .order('mes_referencia', { ascending: false })

    if (error) {
      this.adicionarLog('Metas Mensais', 'erro', error.message)
      throw new Error(`Erro ao exportar metas mensais: ${error.message}`)
    }

    this.adicionarLog('Metas Mensais', 'concluido', `${data?.length || 0} registros`)
    return data || []
  }

  private converterParaCSV(dados: any[], nomeTabela: string): string {
    if (!dados || dados.length === 0) {
      return `# ${nomeTabela} - Nenhum registro encontrado\n`
    }

    const headers = Object.keys(dados[0])
    const csvHeaders = headers.join(',')
    
    const csvRows = dados.map(row => {
      return headers.map(header => {
        const value = row[header]
        if (value === null || value === undefined) return ''
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`
        }
        return String(value)
      }).join(',')
    })

    return [csvHeaders, ...csvRows].join('\n')
  }

  async exportarTodosDados(configuracao: ConfiguracaoExportacao): Promise<{
    arquivo: Blob
    resumo: ResumoExportacao
  }> {
    this.logs = []
    let progresso = 0
    const incrementoProgresso = 100 / 7 // 7 tabelas

    try {
      this.atualizarProgresso(0, 'Iniciando exportação...')
      
      const dados: DadosExportacao = {
        categorias: [],
        subcategorias: [],
        contas: [],
        formasPagamento: [],
        centrosCusto: [],
        transacoes: [],
        metasMensais: []
      }

      // Exportar categorias
      if (configuracao.incluirCategorias) {
        this.atualizarProgresso(progresso, 'Exportando categorias...')
        dados.categorias = await this.exportarCategorias()
      }
      progresso += incrementoProgresso

      // Exportar subcategorias
      if (configuracao.incluirSubcategorias) {
        this.atualizarProgresso(progresso, 'Exportando subcategorias...')
        dados.subcategorias = await this.exportarSubcategorias()
      }
      progresso += incrementoProgresso

      // Exportar contas
      if (configuracao.incluirContas) {
        this.atualizarProgresso(progresso, 'Exportando contas...')
        dados.contas = await this.exportarContas()
      }
      progresso += incrementoProgresso

      // Exportar formas de pagamento
      if (configuracao.incluirFormasPagamento) {
        this.atualizarProgresso(progresso, 'Exportando formas de pagamento...')
        dados.formasPagamento = await this.exportarFormasPagamento()
      }
      progresso += incrementoProgresso

      // Exportar centros de custo
      if (configuracao.incluirCentrosCusto) {
        this.atualizarProgresso(progresso, 'Exportando centros de custo...')
        dados.centrosCusto = await this.exportarCentrosCusto()
      }
      progresso += incrementoProgresso

      // Exportar transações
      if (configuracao.incluirTransacoes) {
        this.atualizarProgresso(progresso, 'Exportando transações...')
        dados.transacoes = await this.exportarTransacoes()
      }
      progresso += incrementoProgresso

      // Exportar metas mensais
      if (configuracao.incluirMetas) {
        this.atualizarProgresso(progresso, 'Exportando metas mensais...')
        dados.metasMensais = await this.exportarMetasMensais()
      }

      // Gerar arquivo ZIP
      this.atualizarProgresso(95, 'Gerando arquivo ZIP...')
      const zip = new JSZip()

      // Adicionar CSVs ao ZIP
      if (configuracao.incluirCategorias) {
        zip.file('fp_categorias.csv', this.converterParaCSV(dados.categorias, 'Categorias'))
      }
      if (configuracao.incluirSubcategorias) {
        zip.file('fp_subcategorias.csv', this.converterParaCSV(dados.subcategorias, 'Subcategorias'))
      }
      if (configuracao.incluirContas) {
        zip.file('fp_contas.csv', this.converterParaCSV(dados.contas, 'Contas'))
      }
      if (configuracao.incluirFormasPagamento) {
        zip.file('fp_formas_pagamento.csv', this.converterParaCSV(dados.formasPagamento, 'Formas de Pagamento'))
      }
      if (configuracao.incluirCentrosCusto) {
        zip.file('fp_centros_custo.csv', this.converterParaCSV(dados.centrosCusto, 'Centros de Custo'))
      }
      if (configuracao.incluirTransacoes) {
        zip.file('fp_transacoes.csv', this.converterParaCSV(dados.transacoes, 'Transações'))
      }
      if (configuracao.incluirMetas) {
        zip.file('fp_metas_mensais.csv', this.converterParaCSV(dados.metasMensais, 'Metas Mensais'))
      }

      // Adicionar arquivo de resumo
      const totalRegistros = dados.categorias.length + 
                           dados.subcategorias.length + 
                           dados.contas.length + 
                           dados.formasPagamento.length + 
                           dados.centrosCusto.length + 
                           dados.transacoes.length + 
                           dados.metasMensais.length

      const resumo: ResumoExportacao = {
        totalRegistros,
        registrosPorTabela: {
          'fp_categorias': dados.categorias.length,
          'fp_subcategorias': dados.subcategorias.length,
          'fp_contas': dados.contas.length,
          'fp_formas_pagamento': dados.formasPagamento.length,
          'fp_centros_custo': dados.centrosCusto.length,
          'fp_transacoes': dados.transacoes.length,
          'fp_metas_mensais': dados.metasMensais.length
        },
        tamanhoArquivo: 0, // Será calculado após a geração do ZIP
        dataExportacao: new Date().toISOString()
      }

      const resumoTexto = `# BACKUP - SISTEMA DE CONTROLE FINANCEIRO
Data da Exportação: ${new Date().toLocaleString('pt-BR')}
Total de Registros: ${totalRegistros}

## Registros por Tabela:
${Object.entries(resumo.registrosPorTabela).map(([tabela, qtd]) => `- ${tabela}: ${qtd}`).join('\n')}

## Logs de Exportação:
${this.logs.map(log => `[${log.timestamp}] ${log.etapa}: ${log.status} ${log.detalhes || ''}`).join('\n')}
`

      zip.file('RESUMO_BACKUP.txt', resumoTexto)

      const arquivo = await zip.generateAsync({ type: 'blob' })
      resumo.tamanhoArquivo = arquivo.size

      this.atualizarProgresso(100, 'Exportação concluída!')

      return { arquivo, resumo }

    } catch (error) {
      this.adicionarLog('Exportação', 'erro', error instanceof Error ? error.message : 'Erro desconhecido')
      throw error
    }
  }

  obterLogs(): LogExportacao[] {
    return [...this.logs]
  }
}