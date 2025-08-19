import { supabase } from './cliente'
import { 
  MetaMensal, 
  NovaMetaMensal, 
  MetaComProgresso, 
  ResumoMetas,
  FiltrosMetas,
  GastoCategoria 
} from '@/tipos/metas-mensais'
import { 
  gerarMesReferencia,
  calcularPercentualMeta,
  determinarStatusMeta,
  mesReferenciaParaDataInicio,
  mesReferenciaParaDataFim,
  obterMesAnterior
} from '@/utilitarios/metas-helpers'

export class MetasMensaisService {
  
  /**
   * Criar ou atualizar meta para categoria e mês
   */
  static async criarOuAtualizarMeta(meta: NovaMetaMensal): Promise<MetaMensal> {
    // Verificar se já existe meta para esta categoria/mês
    const { data: existente } = await supabase
      .from('fp_metas_mensais')
      .select('*')
      .eq('categoria_id', meta.categoria_id)
      .eq('mes_referencia', meta.mes_referencia)
      .single()

    if (existente) {
      // Atualizar meta existente
      const { data, error } = await supabase
        .from('fp_metas_mensais')
        .update({ 
          valor_meta: meta.valor_meta,
          data_ultima_atualizacao: new Date().toISOString()
        })
        .eq('id', existente.id)
        .select()
        .single()

      if (error) throw new Error(`Erro ao atualizar meta: ${error.message}`)
      return data
    } else {
      // Criar nova meta
      const { data, error } = await supabase
        .from('fp_metas_mensais')
        .insert([meta])
        .select()
        .single()

      if (error) throw new Error(`Erro ao criar meta: ${error.message}`)
      return data
    }
  }

  /**
   * Buscar metas por mês
   */
  static async buscarMetasPorMes(mesReferencia: number): Promise<MetaMensal[]> {
    const { data, error } = await supabase
      .from('fp_metas_mensais')
      .select('*')
      .eq('mes_referencia', mesReferencia)
      .order('valor_meta', { ascending: false })

    if (error) throw new Error(`Erro ao buscar metas: ${error.message}`)
    return data || []
  }

  /**
   * Buscar meta específica por categoria e mês
   */
  static async buscarMetaPorCategoriaeMes(
    categoriaId: string, 
    mesReferencia: number
  ): Promise<MetaMensal | null> {
    const { data, error } = await supabase
      .from('fp_metas_mensais')
      .select('*')
      .eq('categoria_id', categoriaId)
      .eq('mes_referencia', mesReferencia)
      .single()

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Erro ao buscar meta: ${error.message}`)
    }
    return data
  }

  /**
   * Calcular gastos por categoria em um mês
   */
  static async calcularGastosPorCategoria(
    categoriaId: string,
    mesReferencia: number
  ): Promise<GastoCategoria> {
    const dataInicio = mesReferenciaParaDataInicio(mesReferencia).toISOString().split('T')[0]
    const dataFim = mesReferenciaParaDataFim(mesReferencia).toISOString().split('T')[0]

    const { data, error } = await supabase
      .from('fp_transacoes')
      .select('valor')
      .eq('categoria_id', categoriaId)
      .eq('tipo', 'despesa')
      .eq('status', 'realizado')
      .gte('data', dataInicio)
      .lte('data', dataFim)

    if (error) {
      throw new Error(`Erro ao calcular gastos: ${error.message}`)
    }

    const valorTotal = data?.reduce((total, transacao) => total + Number(transacao.valor), 0) || 0
    const quantidadeTransacoes = data?.length || 0

    return {
      categoria_id: categoriaId,
      valor_total: valorTotal,
      quantidade_transacoes: quantidadeTransacoes
    }
  }

  /**
   * Obter todas as categorias ativas
   */
  static async obterCategoriasAtivas() {
    const { data, error } = await supabase
      .from('fp_categorias')
      .select('id, nome, icone, cor')
      .eq('ativo', true)
      .order('nome')

    if (error) throw new Error(`Erro ao buscar categorias: ${error.message}`)
    return data || []
  }

  /**
   * Gerar metas com progresso para um mês
   */
  static async gerarMetasComProgresso(mesReferencia: number): Promise<MetaComProgresso[]> {
    // Buscar todas as categorias ativas
    const categorias = await this.obterCategoriasAtivas()
    
    // Buscar metas existentes para o mês
    const metas = await this.buscarMetasPorMes(mesReferencia)
    const metasMap = new Map(metas.map(m => [m.categoria_id, m]))

    const metasComProgresso: MetaComProgresso[] = []

    // Para cada categoria, calcular progresso
    for (const categoria of categorias) {
      const metaExistente = metasMap.get(categoria.id)
      const valorMeta = metaExistente?.valor_meta || 0

      // Calcular gastos da categoria no mês
      const gastos = await this.calcularGastosPorCategoria(categoria.id, mesReferencia)
      
      // Calcular progresso
      const percentualUsado = calcularPercentualMeta(gastos.valor_total, valorMeta)
      const status = determinarStatusMeta(percentualUsado)
      const valorDisponivel = valorMeta - gastos.valor_total

      metasComProgresso.push({
        id: metaExistente?.id || `temp-${categoria.id}`,
        categoria_id: categoria.id,
        categoria_nome: categoria.nome,
        categoria_icone: categoria.icone || '📂',
        categoria_cor: categoria.cor || '#6B7280',
        mes_referencia: mesReferencia,
        valor_meta: valorMeta,
        valor_gasto: gastos.valor_total,
        valor_disponivel: valorDisponivel,
        percentual_usado: percentualUsado,
        status
      })
    }

    return metasComProgresso.sort((a, b) => a.categoria_nome.localeCompare(b.categoria_nome))
  }

  /**
   * Gerar resumo completo das metas do mês
   */
  static async gerarResumoMetas(mesReferencia: number): Promise<ResumoMetas> {
    const categorias = await this.gerarMetasComProgresso(mesReferencia)

    const totalMetas = categorias.reduce((sum, cat) => sum + cat.valor_meta, 0)
    const totalGastos = categorias.reduce((sum, cat) => sum + cat.valor_gasto, 0)
    const totalDisponivel = totalMetas - totalGastos
    const percentualTotal = calcularPercentualMeta(totalGastos, totalMetas)

    return {
      mes_referencia: mesReferencia,
      total_metas: totalMetas,
      total_gastos: totalGastos,
      total_disponivel: totalDisponivel,
      percentual_total: percentualTotal,
      categorias
    }
  }

  /**
   * Renovar metas do mês anterior (executar todo dia 1º)
   */
  static async renovarMetasDoMesAnterior(mesReferencia?: number): Promise<void> {
    const mesAtual = mesReferencia || gerarMesReferencia()
    const mesAnterior = obterMesAnterior(mesAtual)

    try {
      // Buscar metas do mês anterior
      const metasAnteriores = await this.buscarMetasPorMes(mesAnterior)
      
      // Buscar todas as categorias ativas (incluindo novas)
      const categorias = await this.obterCategoriasAtivas()

      // Para cada categoria ativa, criar meta no mês atual
      for (const categoria of categorias) {
        const metaAnterior = metasAnteriores.find(m => m.categoria_id === categoria.id)
        const valorMeta = metaAnterior?.valor_meta || 0

        // Verificar se já existe meta para este mês (evitar duplicação)
        const metaExistente = await this.buscarMetaPorCategoriaeMes(categoria.id, mesAtual)
        
        if (!metaExistente) {
          const novaMeta: NovaMetaMensal = {
            categoria_id: categoria.id,
            mes_referencia: mesAtual,
            valor_meta: valorMeta
          }

          await this.criarOuAtualizarMeta(novaMeta)
        }
      }

      console.log(`✅ Metas renovadas de ${mesAnterior} para ${mesAtual}`)
    } catch (error) {
      console.error('❌ Erro na renovação de metas:', error)
      throw error
    }
  }

  /**
   * Inicializar metas para novos usuários (todas com valor 0)
   */
  static async inicializarMetasParaNovoUsuario(mesReferencia?: number): Promise<void> {
    const mes = mesReferencia || gerarMesReferencia()
    
    try {
      const categorias = await this.obterCategoriasAtivas()
      
      for (const categoria of categorias) {
        const metaExistente = await this.buscarMetaPorCategoriaeMes(categoria.id, mes)
        
        if (!metaExistente) {
          const novaMeta: NovaMetaMensal = {
            categoria_id: categoria.id,
            mes_referencia: mes,
            valor_meta: 0
          }

          await this.criarOuAtualizarMeta(novaMeta)
        }
      }

      console.log(`✅ Metas inicializadas para o mês ${mes}`)
    } catch (error) {
      console.error('❌ Erro na inicialização de metas:', error)
      throw error
    }
  }

  /**
   * Deletar meta específica (zerar valor)
   */
  static async zerarMeta(categoriaId: string, mesReferencia: number): Promise<void> {
    const novaMeta: NovaMetaMensal = {
      categoria_id: categoriaId,
      mes_referencia: mesReferencia,
      valor_meta: 0
    }

    await this.criarOuAtualizarMeta(novaMeta)
  }

  /**
   * Validar dados de meta
   */
  static validarMeta(meta: Partial<NovaMetaMensal>): string[] {
    const erros: string[] = []

    if (!meta.categoria_id) {
      erros.push('Categoria é obrigatória')
    }

    if (!meta.mes_referencia) {
      erros.push('Mês de referência é obrigatório')
    }

    if (meta.valor_meta !== undefined && meta.valor_meta < 0) {
      erros.push('Valor da meta não pode ser negativo')
    }

    if (meta.valor_meta !== undefined && meta.valor_meta > 99999999.99) {
      erros.push('Valor da meta não pode exceder R$ 99.999.999,99')
    }

    return erros
  }
}