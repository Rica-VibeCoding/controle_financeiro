import { supabase } from './cliente'

export interface DadoCategoria {
  categoria_id: string
  categoria_nome: string
  categoria_icone: string
  categoria_cor: string
  meta: number
  gasto: number
  percentual: number
  status: 'normal' | 'atencao' | 'excedido'
}

export interface DadoCartao {
  conta_id: string
  conta_nome: string
  limite: number
  utilizacao: number
  percentual: number
  status: 'normal' | 'atencao' | 'excedido'
}

/**
 * Service para dados dos gráficos do dashboard
 * Gerencia consultas de metas vs gastos e utilização de cartões
 */
export class DashboardGraficosService {
  /**
   * Obter dados de categorias com meta vs gasto para o período
   * @param mes - Mês (1-12)
   * @param ano - Ano (ex: 2025)
   * @returns Promise<DadoCategoria[]> - Lista de categorias com metas e gastos
   */
  static async obterDadosGraficoCategorias(mes: number, ano: number): Promise<DadoCategoria[]> {
    try {
      // Verificar se o cliente Supabase está configurado
      if (!supabase) {
        console.warn('Cliente Supabase não configurado')
        return []
      }
      const mesReferencia = ano * 100 + mes // ex: 202508

      const { data, error } = await supabase
        .from('fp_categorias')
        .select(`
          id,
          nome,
          icone,
          cor,
          fp_metas_mensais!inner(valor_meta)
        `)
        .eq('fp_metas_mensais.mes_referencia', mesReferencia)
        .gt('fp_metas_mensais.valor_meta', 0)

      if (error) throw error

      // Para cada categoria com meta, calcular gastos
      const categoriasComDados: DadoCategoria[] = []

      for (const categoria of data || []) {
        const valorMeta = categoria.fp_metas_mensais[0]?.valor_meta || 0

        // Buscar gastos da categoria no período
        const { data: gastosData, error: gastosError } = await supabase
          .from('fp_transacoes')
          .select('valor')
          .eq('categoria_id', categoria.id)
          .eq('tipo', 'despesa')
          .eq('status', 'realizado')
          .gte('data', `${ano}-${mes.toString().padStart(2, '0')}-01`)
          .lt('data', mes === 12 ? `${ano + 1}-01-01` : `${ano}-${(mes + 1).toString().padStart(2, '0')}-01`)

        if (gastosError) throw gastosError

        const gasto = gastosData?.reduce((sum, t) => sum + Number(t.valor), 0) || 0
        const percentual = valorMeta > 0 ? (gasto / valorMeta) * 100 : 0

        let status: 'normal' | 'atencao' | 'excedido' = 'normal'
        if (percentual >= 100) status = 'excedido'
        else if (percentual >= 80) status = 'atencao'

        categoriasComDados.push({
          categoria_id: categoria.id,
          categoria_nome: categoria.nome,
          categoria_icone: categoria.icone,
          categoria_cor: categoria.cor,
          meta: valorMeta,
          gasto,
          percentual,
          status
        })
      }

      return categoriasComDados.sort((a, b) => b.meta - a.meta) // Ordenar por meta desc

    } catch (error) {
      console.error('Erro ao obter dados do gráfico de categorias:', error)
      return []
    }
  }

  /**
   * Obter dados de cartões com utilização para o período
   * Como não há campo limite_credito, vamos mostrar apenas utilização por conta
   * @param mes - Mês (1-12)
   * @param ano - Ano (ex: 2025)
   * @returns Promise<DadoCartao[]> - Lista de cartões com gastos do período
   */
  static async obterDadosGraficoCartoes(mes: number, ano: number): Promise<DadoCartao[]> {
    try {
      // Verificar se o cliente Supabase está configurado
      if (!supabase) {
        console.warn('Cliente Supabase não configurado')
        return []
      }
      // Buscar contas de cartão de crédito
      const { data: contas, error: contasError } = await supabase
        .from('fp_contas')
        .select('id, nome')
        .eq('tipo', 'cartao_credito')
        .eq('ativo', true)

      if (contasError) throw contasError

      const cartoesComDados: DadoCartao[] = []

      for (const conta of contas || []) {
        // Buscar utilização do cartão no período
        const { data: transacoes, error: transacoesError } = await supabase
          .from('fp_transacoes')
          .select('valor')
          .eq('conta_id', conta.id)
          .eq('tipo', 'despesa')
          .eq('status', 'realizado')
          .gte('data', `${ano}-${mes.toString().padStart(2, '0')}-01`)
          .lt('data', mes === 12 ? `${ano + 1}-01-01` : `${ano}-${(mes + 1).toString().padStart(2, '0')}-01`)

        if (transacoesError) throw transacoesError

        const utilizacao = transacoes?.reduce((sum, t) => sum + Number(t.valor), 0) || 0
        
        // Sem limite real, vamos usar um valor fictício baseado na utilização para mostrar proporção
        const limite = utilizacao > 0 ? utilizacao * 1.5 : 1000 // 150% da utilização ou R$ 1000 padrão
        const percentual = limite > 0 ? (utilizacao / limite) * 100 : 0

        let status: 'normal' | 'atencao' | 'excedido' = 'normal'
        if (percentual >= 90) status = 'excedido'
        else if (percentual >= 70) status = 'atencao'

        // Só incluir cartões com utilização
        if (utilizacao > 0) {
          cartoesComDados.push({
            conta_id: conta.id,
            conta_nome: conta.nome,
            limite,
            utilizacao,
            percentual,
            status
          })
        }
      }

      return cartoesComDados.sort((a, b) => b.utilizacao - a.utilizacao) // Ordenar por utilização desc

    } catch (error) {
      console.error('Erro ao obter dados do gráfico de cartões:', error)
      return []
    }
  }

  /**
   * Verificar se existem dados para gráficos no período
   */
  static async verificarDadosDisponiveis(mes: number, ano: number): Promise<{
    temMetas: boolean
    temCartoes: boolean
  }> {
    try {
      const mesReferencia = ano * 100 + mes

      // Verificar metas
      const { data: metas } = await supabase
        .from('fp_metas_mensais')
        .select('id')
        .eq('mes_referencia', mesReferencia)
        .gt('valor_meta', 0)
        .limit(1)

      // Verificar cartões ativos
      const { data: cartoes } = await supabase
        .from('fp_contas')
        .select('id')
        .eq('tipo', 'cartao_credito')
        .eq('ativo', true)
        .limit(1)

      return {
        temMetas: (metas?.length || 0) > 0,
        temCartoes: (cartoes?.length || 0) > 0
      }

    } catch (error) {
      console.error('Erro ao verificar dados disponíveis:', error)
      return { temMetas: false, temCartoes: false }
    }
  }
}