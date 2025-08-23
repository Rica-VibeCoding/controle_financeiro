import { supabase } from '../supabase/cliente'
import type { 
  DadosImportacao,
  ConfiguracaoImportacao,
  ResultadoImportacao,
  LogExportacao,
  CategoriaExportacao,
  SubcategoriaExportacao,
  ContaExportacao,
  FormaPagamentoExportacao,
  CentroCustoExportacao,
  TransacaoExportacao,
  MetaMensalExportacao
} from '@/tipos/backup'

export class ImportadorDados {
  private logs: LogExportacao[] = []
  private erros: string[] = []
  private advertencias: string[] = []
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

  private async limparTabelaSeNecessario(nomeTabela: string, modoLimpo: boolean): Promise<void> {
    if (!modoLimpo) return

    this.adicionarLog(`Limpeza ${nomeTabela}`, 'iniciado')
    
    const { error } = await supabase
      .from(nomeTabela)
      .delete()
      .neq('id', 'impossible-id') // Deletar todos os registros

    if (error) {
      this.adicionarLog(`Limpeza ${nomeTabela}`, 'erro', error.message)
      throw new Error(`Erro ao limpar tabela ${nomeTabela}: ${error.message}`)
    }

    this.adicionarLog(`Limpeza ${nomeTabela}`, 'concluido')
  }

  private async importarCategorias(categorias: CategoriaExportacao[], configuracao: ConfiguracaoImportacao): Promise<number> {
    if (!categorias?.length) return 0

    this.adicionarLog('Importar Categorias', 'iniciado')

    try {
      await this.limparTabelaSeNecessario('fp_categorias', configuracao.modoImportacao === 'limpo')

      // Preparar dados para inserção
      const dadosParaInserir = categorias.map(categoria => ({
        id: categoria.id,
        nome: categoria.nome,
        tipo: categoria.tipo,
        icone: categoria.icone,
        cor: categoria.cor,
        ativo: categoria.ativo,
        created_at: categoria.created_at
      }))

      // Inserir dados
      const { error } = await supabase
        .from('fp_categorias')
        .upsert(dadosParaInserir, { 
          onConflict: 'id',
          ignoreDuplicates: configuracao.modoImportacao === 'incremental'
        })

      if (error) {
        this.adicionarLog('Importar Categorias', 'erro', error.message)
        throw new Error(`Erro ao importar categorias: ${error.message}`)
      }

      this.adicionarLog('Importar Categorias', 'concluido', `${categorias.length} registros`)
      return categorias.length

    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Erro desconhecido'
      this.erros.push(`Categorias: ${msg}`)
      throw error
    }
  }

  private async importarSubcategorias(subcategorias: SubcategoriaExportacao[], configuracao: ConfiguracaoImportacao): Promise<number> {
    if (!subcategorias?.length) return 0

    this.adicionarLog('Importar Subcategorias', 'iniciado')

    try {
      await this.limparTabelaSeNecessario('fp_subcategorias', configuracao.modoImportacao === 'limpo')

      const dadosParaInserir = subcategorias.map(subcategoria => ({
        id: subcategoria.id,
        nome: subcategoria.nome,
        categoria_id: subcategoria.categoria_id,
        ativo: subcategoria.ativo,
        created_at: subcategoria.created_at
      }))

      const { error } = await supabase
        .from('fp_subcategorias')
        .upsert(dadosParaInserir, { 
          onConflict: 'id',
          ignoreDuplicates: configuracao.modoImportacao === 'incremental'
        })

      if (error) {
        this.adicionarLog('Importar Subcategorias', 'erro', error.message)
        throw new Error(`Erro ao importar subcategorias: ${error.message}`)
      }

      this.adicionarLog('Importar Subcategorias', 'concluido', `${subcategorias.length} registros`)
      return subcategorias.length

    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Erro desconhecido'
      this.erros.push(`Subcategorias: ${msg}`)
      throw error
    }
  }

  private async importarContas(contas: ContaExportacao[], configuracao: ConfiguracaoImportacao): Promise<number> {
    if (!contas?.length) return 0

    this.adicionarLog('Importar Contas', 'iniciado')

    try {
      await this.limparTabelaSeNecessario('fp_contas', configuracao.modoImportacao === 'limpo')

      const dadosParaInserir = contas.map(conta => ({
        id: conta.id,
        nome: conta.nome,
        tipo: conta.tipo,
        banco: conta.banco,
        ativo: conta.ativo,
        created_at: conta.created_at,
        limite: conta.limite,
        data_fechamento: conta.data_fechamento
      }))

      const { error } = await supabase
        .from('fp_contas')
        .upsert(dadosParaInserir, { 
          onConflict: 'id',
          ignoreDuplicates: configuracao.modoImportacao === 'incremental'
        })

      if (error) {
        this.adicionarLog('Importar Contas', 'erro', error.message)
        throw new Error(`Erro ao importar contas: ${error.message}`)
      }

      this.adicionarLog('Importar Contas', 'concluido', `${contas.length} registros`)
      return contas.length

    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Erro desconhecido'
      this.erros.push(`Contas: ${msg}`)
      throw error
    }
  }

  private async importarFormasPagamento(formas: FormaPagamentoExportacao[], configuracao: ConfiguracaoImportacao): Promise<number> {
    if (!formas?.length) return 0

    this.adicionarLog('Importar Formas de Pagamento', 'iniciado')

    try {
      await this.limparTabelaSeNecessario('fp_formas_pagamento', configuracao.modoImportacao === 'limpo')

      const dadosParaInserir = formas.map(forma => ({
        id: forma.id,
        nome: forma.nome,
        tipo: forma.tipo,
        permite_parcelamento: forma.permite_parcelamento,
        ativo: forma.ativo,
        created_at: forma.created_at
      }))

      const { error } = await supabase
        .from('fp_formas_pagamento')
        .upsert(dadosParaInserir, { 
          onConflict: 'id',
          ignoreDuplicates: configuracao.modoImportacao === 'incremental'
        })

      if (error) {
        this.adicionarLog('Importar Formas de Pagamento', 'erro', error.message)
        throw new Error(`Erro ao importar formas de pagamento: ${error.message}`)
      }

      this.adicionarLog('Importar Formas de Pagamento', 'concluido', `${formas.length} registros`)
      return formas.length

    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Erro desconhecido'
      this.erros.push(`Formas de Pagamento: ${msg}`)
      throw error
    }
  }

  private async importarCentrosCusto(centros: CentroCustoExportacao[], configuracao: ConfiguracaoImportacao): Promise<number> {
    if (!centros?.length) return 0

    this.adicionarLog('Importar Centros de Custo', 'iniciado')

    try {
      await this.limparTabelaSeNecessario('fp_centros_custo', configuracao.modoImportacao === 'limpo')

      const dadosParaInserir = centros.map(centro => ({
        id: centro.id,
        nome: centro.nome,
        descricao: centro.descricao,
        cor: centro.cor,
        ativo: centro.ativo,
        created_at: centro.created_at,
        valor_orcamento: centro.valor_orcamento,
        data_inicio: centro.data_inicio,
        data_fim: centro.data_fim,
        arquivado: centro.arquivado,
        data_arquivamento: centro.data_arquivamento
      }))

      const { error } = await supabase
        .from('fp_centros_custo')
        .upsert(dadosParaInserir, { 
          onConflict: 'id',
          ignoreDuplicates: configuracao.modoImportacao === 'incremental'
        })

      if (error) {
        this.adicionarLog('Importar Centros de Custo', 'erro', error.message)
        throw new Error(`Erro ao importar centros de custo: ${error.message}`)
      }

      this.adicionarLog('Importar Centros de Custo', 'concluido', `${centros.length} registros`)
      return centros.length

    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Erro desconhecido'
      this.erros.push(`Centros de Custo: ${msg}`)
      throw error
    }
  }

  private async importarTransacoes(transacoes: TransacaoExportacao[], configuracao: ConfiguracaoImportacao): Promise<number> {
    if (!transacoes?.length) return 0

    this.adicionarLog('Importar Transações', 'iniciado')

    try {
      await this.limparTabelaSeNecessario('fp_transacoes', configuracao.modoImportacao === 'limpo')

      // Processar em lotes para evitar timeouts
      const tamanhoLote = 50
      let totalImportado = 0

      for (let i = 0; i < transacoes.length; i += tamanhoLote) {
        const lote = transacoes.slice(i, i + tamanhoLote)
        
        const dadosParaInserir = lote.map(transacao => ({
          id: transacao.id,
          data: transacao.data,
          descricao: transacao.descricao,
          categoria_id: transacao.categoria_id,
          subcategoria_id: transacao.subcategoria_id,
          forma_pagamento_id: transacao.forma_pagamento_id,
          centro_custo_id: transacao.centro_custo_id,
          valor: transacao.valor,
          tipo: transacao.tipo,
          conta_id: transacao.conta_id,
          conta_destino_id: transacao.conta_destino_id,
          parcela_atual: transacao.parcela_atual,
          total_parcelas: transacao.total_parcelas,
          grupo_parcelamento: transacao.grupo_parcelamento,
          recorrente: transacao.recorrente,
          frequencia_recorrencia: transacao.frequencia_recorrencia,
          proxima_recorrencia: transacao.proxima_recorrencia,
          status: transacao.status,
          data_vencimento: transacao.data_vencimento,
          data_registro: transacao.data_registro,
          anexo_url: transacao.anexo_url,
          observacoes: transacao.observacoes,
          created_at: transacao.created_at,
          updated_at: transacao.updated_at,
          identificador_externo: transacao.identificador_externo
        }))

        const { error } = await supabase
          .from('fp_transacoes')
          .upsert(dadosParaInserir, { 
            onConflict: 'id',
            ignoreDuplicates: configuracao.modoImportacao === 'incremental'
          })

        if (error) {
          this.adicionarLog('Importar Transações', 'erro', error.message)
          throw new Error(`Erro ao importar transações lote ${i + 1}: ${error.message}`)
        }

        totalImportado += lote.length
        
        // Atualizar progresso a cada lote
        const progressoLote = (totalImportado / transacoes.length) * 100
        this.atualizarProgresso(progressoLote, `Importando transações: ${totalImportado}/${transacoes.length}`)
      }

      this.adicionarLog('Importar Transações', 'concluido', `${transacoes.length} registros`)
      return transacoes.length

    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Erro desconhecido'
      this.erros.push(`Transações: ${msg}`)
      throw error
    }
  }

  private async importarMetasMensais(metas: MetaMensalExportacao[], configuracao: ConfiguracaoImportacao): Promise<number> {
    if (!metas?.length) return 0

    this.adicionarLog('Importar Metas Mensais', 'iniciado')

    try {
      await this.limparTabelaSeNecessario('fp_metas_mensais', configuracao.modoImportacao === 'limpo')

      const dadosParaInserir = metas.map(meta => ({
        id: meta.id,
        categoria_id: meta.categoria_id,
        mes_referencia: meta.mes_referencia,
        valor_meta: meta.valor_meta,
        data_criacao: meta.data_criacao,
        data_ultima_atualizacao: meta.data_ultima_atualizacao
      }))

      const { error } = await supabase
        .from('fp_metas_mensais')
        .upsert(dadosParaInserir, { 
          onConflict: 'id',
          ignoreDuplicates: configuracao.modoImportacao === 'incremental'
        })

      if (error) {
        this.adicionarLog('Importar Metas Mensais', 'erro', error.message)
        throw new Error(`Erro ao importar metas mensais: ${error.message}`)
      }

      this.adicionarLog('Importar Metas Mensais', 'concluido', `${metas.length} registros`)
      return metas.length

    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Erro desconhecido'
      this.erros.push(`Metas Mensais: ${msg}`)
      throw error
    }
  }

  async importarDados(dados: DadosImportacao, configuracao: ConfiguracaoImportacao): Promise<ResultadoImportacao> {
    const inicioTempo = Date.now()
    this.logs = []
    this.erros = []
    this.advertencias = []

    let progresso = 0
    const etapas = [
      { dados: dados.categorias, nome: 'Categorias' },
      { dados: dados.subcategorias, nome: 'Subcategorias' },
      { dados: dados.contas, nome: 'Contas' },
      { dados: dados.formasPagamento, nome: 'Formas de Pagamento' },
      { dados: dados.centrosCusto, nome: 'Centros de Custo' },
      { dados: dados.transacoes, nome: 'Transações' },
      { dados: dados.metasMensais, nome: 'Metas Mensais' }
    ].filter(etapa => etapa.dados && etapa.dados.length > 0)

    const incrementoProgresso = 100 / etapas.length

    try {
      this.atualizarProgresso(0, 'Iniciando importação...')

      const registrosPorTabela: { [tabela: string]: number } = {}
      let totalImportados = 0

      // Importar na ordem correta (dependências)
      if (dados.categorias) {
        this.atualizarProgresso(progresso, 'Importando categorias...')
        const importados = await this.importarCategorias(dados.categorias, configuracao)
        registrosPorTabela['fp_categorias'] = importados
        totalImportados += importados
        progresso += incrementoProgresso
      }

      if (dados.subcategorias) {
        this.atualizarProgresso(progresso, 'Importando subcategorias...')
        const importados = await this.importarSubcategorias(dados.subcategorias, configuracao)
        registrosPorTabela['fp_subcategorias'] = importados
        totalImportados += importados
        progresso += incrementoProgresso
      }

      if (dados.contas) {
        this.atualizarProgresso(progresso, 'Importando contas...')
        const importados = await this.importarContas(dados.contas, configuracao)
        registrosPorTabela['fp_contas'] = importados
        totalImportados += importados
        progresso += incrementoProgresso
      }

      if (dados.formasPagamento) {
        this.atualizarProgresso(progresso, 'Importando formas de pagamento...')
        const importados = await this.importarFormasPagamento(dados.formasPagamento, configuracao)
        registrosPorTabela['fp_formas_pagamento'] = importados
        totalImportados += importados
        progresso += incrementoProgresso
      }

      if (dados.centrosCusto) {
        this.atualizarProgresso(progresso, 'Importando centros de custo...')
        const importados = await this.importarCentrosCusto(dados.centrosCusto, configuracao)
        registrosPorTabela['fp_centros_custo'] = importados
        totalImportados += importados
        progresso += incrementoProgresso
      }

      if (dados.transacoes) {
        this.atualizarProgresso(progresso, 'Importando transações...')
        const importados = await this.importarTransacoes(dados.transacoes, configuracao)
        registrosPorTabela['fp_transacoes'] = importados
        totalImportados += importados
        progresso += incrementoProgresso
      }

      if (dados.metasMensais) {
        this.atualizarProgresso(progresso, 'Importando metas mensais...')
        const importados = await this.importarMetasMensais(dados.metasMensais, configuracao)
        registrosPorTabela['fp_metas_mensais'] = importados
        totalImportados += importados
      }

      this.atualizarProgresso(100, 'Importação concluída!')

      return {
        sucesso: true,
        totalImportados,
        registrosPorTabela,
        erros: this.erros,
        advertencias: this.advertencias,
        tempoExecucao: Date.now() - inicioTempo
      }

    } catch (error) {
      const mensagem = error instanceof Error ? error.message : 'Erro desconhecido'
      this.erros.push(mensagem)

      return {
        sucesso: false,
        totalImportados: 0,
        registrosPorTabela: {},
        erros: this.erros,
        advertencias: this.advertencias,
        tempoExecucao: Date.now() - inicioTempo
      }
    }
  }

  obterLogs(): LogExportacao[] {
    return [...this.logs]
  }
}