import JSZip from 'jszip'
import type { 
  ResumoValidacao, 
  ErroValidacao, 
  DadosImportacao,
  CategoriaExportacao,
  SubcategoriaExportacao,
  ContaExportacao,
  FormaPagamentoExportacao,
  CentroCustoExportacao,
  TransacaoExportacao,
  MetaMensalExportacao
} from '@/tipos/backup'

export class ValidadorBackup {
  private erros: ErroValidacao[] = []
  private advertencias: string[] = []

  private adicionarErro(tabela: string, mensagem: string, linha?: number, campo?: string) {
    this.erros.push({
      tabela,
      linha,
      campo,
      mensagem,
      tipo: 'erro'
    })
  }

  private adicionarAdvertencia(mensagem: string) {
    this.advertencias.push(mensagem)
  }

  private parseCSV(csvContent: string): any[] {
    const lines = csvContent.trim().split('\n')
    if (lines.length < 2) return []

    const headers = lines[0].split(',').map(h => h.trim())
    const data = []

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => {
        let value = v.trim()
        // Remover aspas duplas se presentes
        if (value.startsWith('"') && value.endsWith('"')) {
          value = value.slice(1, -1).replace(/""/g, '"')
        }
        return value === '' ? null : value
      })

      if (values.length === headers.length) {
        const row: any = {}
        headers.forEach((header, index) => {
          row[header] = values[index]
        })
        data.push(row)
      }
    }

    return data
  }

  private validarEstruturaCategorias(dados: any[], tabela: string): CategoriaExportacao[] {
    const camposObrigatorios = ['id', 'nome', 'tipo', 'ativo', 'created_at', 'workspace_id']
    const tiposValidos = ['receita', 'despesa', 'ambos']
    
    return dados.map((row, index) => {
      // Validar campos obrigatórios
      camposObrigatorios.forEach(campo => {
        if (!row[campo]) {
          this.adicionarErro(tabela, `Campo obrigatório '${campo}' ausente`, index + 1, campo)
        }
      })

      // Validar tipo
      if (row.tipo && !tiposValidos.includes(row.tipo)) {
        this.adicionarErro(tabela, `Tipo '${row.tipo}' inválido`, index + 1, 'tipo')
      }

      // Converter boolean
      const ativo = row.ativo === 'true' || row.ativo === true || row.ativo === '1'

      return {
        id: row.id || '',
        nome: row.nome || '',
        tipo: row.tipo || 'despesa',
        icone: row.icone || null,
        cor: row.cor || null,
        ativo,
        created_at: row.created_at || new Date().toISOString(),
        workspace_id: row.workspace_id || ''
      }
    })
  }

  private validarEstruturaSubcategorias(dados: any[], tabela: string): SubcategoriaExportacao[] {
    const camposObrigatorios = ['id', 'nome', 'ativo', 'created_at', 'workspace_id']
    
    return dados.map((row, index) => {
      camposObrigatorios.forEach(campo => {
        if (!row[campo]) {
          this.adicionarErro(tabela, `Campo obrigatório '${campo}' ausente`, index + 1, campo)
        }
      })

      const ativo = row.ativo === 'true' || row.ativo === true || row.ativo === '1'

      return {
        id: row.id || '',
        nome: row.nome || '',
        categoria_id: row.categoria_id || null,
        ativo,
        created_at: row.created_at || new Date().toISOString(),
        workspace_id: row.workspace_id || ''
      }
    })
  }

  private validarEstruturaContas(dados: any[], tabela: string): ContaExportacao[] {
    const camposObrigatorios = ['id', 'nome', 'tipo', 'ativo', 'created_at', 'workspace_id']
    
    return dados.map((row, index) => {
      camposObrigatorios.forEach(campo => {
        if (!row[campo]) {
          this.adicionarErro(tabela, `Campo obrigatório '${campo}' ausente`, index + 1, campo)
        }
      })

      const ativo = row.ativo === 'true' || row.ativo === true || row.ativo === '1'
      const limite = row.limite ? parseFloat(row.limite) : null
      const dataFechamento = row.data_fechamento ? parseInt(row.data_fechamento) : null

      return {
        id: row.id || '',
        nome: row.nome || '',
        tipo: row.tipo || '',
        banco: row.banco || null,
        ativo,
        created_at: row.created_at || new Date().toISOString(),
        limite,
        data_fechamento: dataFechamento,
        workspace_id: row.workspace_id || ''
      }
    })
  }

  private validarEstruturaFormasPagamento(dados: any[], tabela: string): FormaPagamentoExportacao[] {
    const camposObrigatorios = ['id', 'nome', 'tipo', 'ativo', 'created_at', 'workspace_id']
    
    return dados.map((row, index) => {
      camposObrigatorios.forEach(campo => {
        if (!row[campo]) {
          this.adicionarErro(tabela, `Campo obrigatório '${campo}' ausente`, index + 1, campo)
        }
      })

      const ativo = row.ativo === 'true' || row.ativo === true || row.ativo === '1'
      const permiteParcelamento = row.permite_parcelamento === 'true' || row.permite_parcelamento === true || row.permite_parcelamento === '1'

      return {
        id: row.id || '',
        nome: row.nome || '',
        tipo: row.tipo || '',
        permite_parcelamento: permiteParcelamento,
        ativo,
        created_at: row.created_at || new Date().toISOString(),
        workspace_id: row.workspace_id || ''
      }
    })
  }

  private validarEstruturaCentrosCusto(dados: any[], tabela: string): CentroCustoExportacao[] {
    const camposObrigatorios = ['id', 'nome', 'ativo', 'created_at', 'workspace_id']
    
    return dados.map((row, index) => {
      camposObrigatorios.forEach(campo => {
        if (!row[campo]) {
          this.adicionarErro(tabela, `Campo obrigatório '${campo}' ausente`, index + 1, campo)
        }
      })

      const ativo = row.ativo === 'true' || row.ativo === true || row.ativo === '1'
      const arquivado = row.arquivado === 'true' || row.arquivado === true || row.arquivado === '1'
      const valorOrcamento = row.valor_orcamento ? parseFloat(row.valor_orcamento) : 0

      return {
        id: row.id || '',
        nome: row.nome || '',
        descricao: row.descricao || null,
        cor: row.cor || null,
        ativo,
        created_at: row.created_at || new Date().toISOString(),
        valor_orcamento: valorOrcamento,
        data_inicio: row.data_inicio || null,
        data_fim: row.data_fim || null,
        arquivado,
        data_arquivamento: row.data_arquivamento || null,
        workspace_id: row.workspace_id || ''
      }
    })
  }

  private validarEstruturaTransacoes(dados: any[], tabela: string): TransacaoExportacao[] {
    const camposObrigatorios = ['id', 'data', 'descricao', 'valor', 'tipo', 'conta_id', 'created_at', 'workspace_id']
    const tiposValidos = ['receita', 'despesa', 'transferencia']
    
    return dados.map((row, index) => {
      camposObrigatorios.forEach(campo => {
        if (!row[campo]) {
          this.adicionarErro(tabela, `Campo obrigatório '${campo}' ausente`, index + 1, campo)
        }
      })

      if (row.tipo && !tiposValidos.includes(row.tipo)) {
        this.adicionarErro(tabela, `Tipo '${row.tipo}' inválido`, index + 1, 'tipo')
      }

      const valor = row.valor ? parseFloat(row.valor) : 0
      const parcelaAtual = row.parcela_atual ? parseInt(row.parcela_atual) : 1
      const totalParcelas = row.total_parcelas ? parseInt(row.total_parcelas) : 1
      const grupoParcelamento = row.grupo_parcelamento ? parseInt(row.grupo_parcelamento) : null
      const recorrente = row.recorrente === 'true' || row.recorrente === true || row.recorrente === '1'

      return {
        id: row.id || '',
        data: row.data || '',
        descricao: row.descricao || '',
        categoria_id: row.categoria_id || null,
        subcategoria_id: row.subcategoria_id || null,
        forma_pagamento_id: row.forma_pagamento_id || null,
        centro_custo_id: row.centro_custo_id || null,
        valor,
        tipo: row.tipo || 'despesa',
        conta_id: row.conta_id || '',
        conta_destino_id: row.conta_destino_id || null,
        parcela_atual: parcelaAtual,
        total_parcelas: totalParcelas,
        grupo_parcelamento: grupoParcelamento,
        recorrente,
        frequencia_recorrencia: row.frequencia_recorrencia || null,
        proxima_recorrencia: row.proxima_recorrencia || null,
        status: row.status || null,
        data_vencimento: row.data_vencimento || null,
        data_registro: row.data_registro || null,
        anexo_url: row.anexo_url || null,
        observacoes: row.observacoes || null,
        created_at: row.created_at || new Date().toISOString(),
        updated_at: row.updated_at || new Date().toISOString(),
        identificador_externo: row.identificador_externo || null,
        workspace_id: row.workspace_id || ''
      }
    })
  }

  private validarEstruturaMetasMensais(dados: any[], tabela: string): MetaMensalExportacao[] {
    const camposObrigatorios = ['id', 'categoria_id', 'mes_referencia', 'valor_meta', 'data_criacao', 'workspace_id']
    
    return dados.map((row, index) => {
      camposObrigatorios.forEach(campo => {
        if (!row[campo]) {
          this.adicionarErro(tabela, `Campo obrigatório '${campo}' ausente`, index + 1, campo)
        }
      })

      const mesReferencia = row.mes_referencia ? parseInt(row.mes_referencia) : 0
      const valorMeta = row.valor_meta ? parseFloat(row.valor_meta) : 0

      return {
        id: row.id || '',
        categoria_id: row.categoria_id || '',
        mes_referencia: mesReferencia,
        valor_meta: valorMeta,
        data_criacao: row.data_criacao || new Date().toISOString(),
        data_ultima_atualizacao: row.data_ultima_atualizacao || new Date().toISOString(),
        workspace_id: row.workspace_id || ''
      }
    })
  }

  async validarArquivoBackup(arquivo: File): Promise<ResumoValidacao> {
    this.erros = []
    this.advertencias = []

    try {
      // Validar se é um arquivo ZIP
      if (!arquivo.name.endsWith('.zip')) {
        this.adicionarErro('arquivo', 'Arquivo deve ser um ZIP')
        return this.gerarResumo()
      }

      // Carregar ZIP
      const zip = new JSZip()
      const zipContent = await zip.loadAsync(arquivo)

      const tabelasEncontradas: string[] = []
      let totalRegistros = 0
      const registrosPorTabela: { [tabela: string]: number } = {}

      // Validar cada arquivo CSV no ZIP
      for (const [fileName, file] of Object.entries(zipContent.files)) {
        if (!fileName.endsWith('.csv') || file.dir) continue

        const tabelaNome = fileName.replace('.csv', '')
        tabelasEncontradas.push(tabelaNome)

        const csvContent = await file.async('text')
        const dados = this.parseCSV(csvContent)
        
        registrosPorTabela[tabelaNome] = dados.length
        totalRegistros += dados.length

        // Validar estrutura específica de cada tabela
        this.validarEstruturaPorTabela(dados, tabelaNome)
      }

      if (tabelasEncontradas.length === 0) {
        this.adicionarErro('arquivo', 'Nenhum arquivo CSV encontrado no ZIP')
      }

      return {
        arquivoValido: this.erros.length === 0,
        tabelasEncontradas,
        totalRegistros,
        registrosPorTabela,
        errosValidacao: this.erros,
        advertencias: this.advertencias
      }

    } catch (error) {
      this.adicionarErro('arquivo', `Erro ao processar arquivo: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
      return this.gerarResumo()
    }
  }

  async carregarDadosDoArquivo(arquivo: File): Promise<DadosImportacao> {
    const dados: DadosImportacao = {}

    try {
      const zip = new JSZip()
      const zipContent = await zip.loadAsync(arquivo)

      for (const [fileName, file] of Object.entries(zipContent.files)) {
        if (!fileName.endsWith('.csv') || file.dir) continue

        const tabelaNome = fileName.replace('.csv', '')
        const csvContent = await file.async('text')
        const registros = this.parseCSV(csvContent)

        // Mapear dados para estruturas tipadas
        switch (tabelaNome) {
          case 'fp_categorias':
            dados.categorias = this.validarEstruturaCategorias(registros, tabelaNome)
            break
          case 'fp_subcategorias':
            dados.subcategorias = this.validarEstruturaSubcategorias(registros, tabelaNome)
            break
          case 'fp_contas':
            dados.contas = this.validarEstruturaContas(registros, tabelaNome)
            break
          case 'fp_formas_pagamento':
            dados.formasPagamento = this.validarEstruturaFormasPagamento(registros, tabelaNome)
            break
          case 'fp_centros_custo':
            dados.centrosCusto = this.validarEstruturaCentrosCusto(registros, tabelaNome)
            break
          case 'fp_transacoes':
            dados.transacoes = this.validarEstruturaTransacoes(registros, tabelaNome)
            break
          case 'fp_metas_mensais':
            dados.metasMensais = this.validarEstruturaMetasMensais(registros, tabelaNome)
            break
        }
      }

      return dados

    } catch (error) {
      throw new Error(`Erro ao carregar dados: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
    }
  }

  private validarEstruturaPorTabela(dados: any[], tabelaNome: string) {
    switch (tabelaNome) {
      case 'fp_categorias':
        this.validarEstruturaCategorias(dados, tabelaNome)
        break
      case 'fp_subcategorias':
        this.validarEstruturaSubcategorias(dados, tabelaNome)
        break
      case 'fp_contas':
        this.validarEstruturaContas(dados, tabelaNome)
        break
      case 'fp_formas_pagamento':
        this.validarEstruturaFormasPagamento(dados, tabelaNome)
        break
      case 'fp_centros_custo':
        this.validarEstruturaCentrosCusto(dados, tabelaNome)
        break
      case 'fp_transacoes':
        this.validarEstruturaTransacoes(dados, tabelaNome)
        break
      case 'fp_metas_mensais':
        this.validarEstruturaMetasMensais(dados, tabelaNome)
        break
      default:
        this.adicionarAdvertencia(`Tabela '${tabelaNome}' não reconhecida`)
    }
  }

  private gerarResumo(): ResumoValidacao {
    return {
      arquivoValido: this.erros.length === 0,
      tabelasEncontradas: [],
      totalRegistros: 0,
      registrosPorTabela: {},
      errosValidacao: this.erros,
      advertencias: this.advertencias
    }
  }
}