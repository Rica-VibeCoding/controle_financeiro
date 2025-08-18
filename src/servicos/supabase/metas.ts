import { supabase } from './cliente'
import { Meta, NovaMeta } from '@/tipos/database'

// Tipo para metas com progresso calculado
export type MetaComProgresso = Meta & {
  valor_usado: number
  percentual_usado: number
  valor_restante: number
  status_cor: 'verde' | 'amarelo' | 'laranja' | 'vermelho'
  categoria?: {
    nome: string
    cor: string
    icone: string
  }
}

export class MetasService {
  
  /**
   * Criar nova meta
   */
  static async criar(meta: NovaMeta): Promise<Meta> {
    const { data, error } = await supabase
      .from('fp_metas')
      .insert(meta)
      .select()
      .single()

    if (error) throw new Error(`Erro ao criar meta: ${error.message}`)
    return data
  }

  /**
   * Listar metas ativas
   */
  static async listar(): Promise<Meta[]> {
    const { data, error } = await supabase
      .from('fp_metas')
      .select(`
        *,
        categoria:fp_categorias(nome, cor, icone)
      `)
      .eq('ativo', true)
      .order('created_at', { ascending: false })

    if (error) throw new Error(`Erro ao listar metas: ${error.message}`)
    return data || []
  }

  /**
   * Buscar meta por ID
   */
  static async buscarPorId(id: string): Promise<Meta | null> {
    const { data, error } = await supabase
      .from('fp_metas')
      .select(`
        *,
        categoria:fp_categorias(nome, cor, icone)
      `)
      .eq('id', id)
      .single()

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Erro ao buscar meta: ${error.message}`)
    }
    return data
  }

  /**
   * Atualizar meta
   */
  static async atualizar(id: string, dados: Partial<NovaMeta>): Promise<Meta> {
    const { data, error } = await supabase
      .from('fp_metas')
      .update(dados)
      .eq('id', id)
      .select()
      .single()

    if (error) throw new Error(`Erro ao atualizar meta: ${error.message}`)
    return data
  }

  /**
   * Excluir meta (desativar)
   */
  static async excluir(id: string): Promise<void> {
    const { error } = await supabase
      .from('fp_metas')
      .update({ ativo: false })
      .eq('id', id)

    if (error) throw new Error(`Erro ao excluir meta: ${error.message}`)
  }

  /**
   * Calcular progresso de uma meta
   * Conforme especificação: soma transações do período vs limite
   */
  static async calcularProgresso(meta: Meta): Promise<{
    valorGasto: number
    valorLimite: number
    percentual: number
    status: 'normal' | 'atencao' | 'alerta' | 'excedido'
  }> {
    let query = supabase
      .from('fp_transacoes')
      .select('valor')
      .eq('tipo', 'despesa')
      .eq('status', 'realizado')
      .gte('data', meta.periodo_inicio)
      .lte('data', meta.periodo_fim)

    // Filtrar por categoria se não for meta total
    if (meta.tipo === 'categoria' && meta.categoria_id) {
      query = query.eq('categoria_id', meta.categoria_id)
    }

    const { data, error } = await query

    if (error) {
      throw new Error(`Erro ao calcular progresso: ${error.message}`)
    }

    const valorGasto = data?.reduce((total, transacao) => total + transacao.valor, 0) || 0
    const percentual = meta.valor_limite > 0 ? (valorGasto / meta.valor_limite) * 100 : 0

    // Definir status conforme PRD
    let status: 'normal' | 'atencao' | 'alerta' | 'excedido' = 'normal'
    if (percentual >= 100) {
      status = 'excedido'
    } else if (percentual >= 80) {
      status = 'alerta'
    } else if (percentual >= 50) {
      status = 'atencao'
    }

    return {
      valorGasto,
      valorLimite: meta.valor_limite,
      percentual,
      status
    }
  }

  /**
   * Buscar metas por período
   */
  static async buscarPorPeriodo(dataInicio: string, dataFim: string): Promise<Meta[]> {
    const { data, error } = await supabase
      .from('fp_metas')
      .select(`
        *,
        categoria:fp_categorias(nome, cor, icone)
      `)
      .eq('ativo', true)
      .lte('periodo_inicio', dataFim)
      .gte('periodo_fim', dataInicio)
      .order('created_at', { ascending: false })

    if (error) throw new Error(`Erro ao buscar metas por período: ${error.message}`)
    return data || []
  }

  /**
   * Buscar metas ativas do mês atual
   */
  static async buscarMetasDoMes(): Promise<Meta[]> {
    const hoje = new Date()
    const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString().split('T')[0]
    const fimMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).toISOString().split('T')[0]

    return this.buscarPorPeriodo(inicioMes, fimMes)
  }

  /**
   * Validar dados da meta
   */
  static validarMeta(meta: Partial<NovaMeta>): string[] {
    const erros: string[] = []

    if (!meta.nome?.trim()) {
      erros.push('Nome é obrigatório')
    }

    if (!meta.valor_limite || meta.valor_limite <= 0) {
      erros.push('Valor limite deve ser maior que zero')
    }

    if (meta.valor_limite && meta.valor_limite > 99999999.99) {
      erros.push('Valor limite máximo: R$ 99.999.999,99')
    }

    if (!meta.periodo_inicio) {
      erros.push('Data de início é obrigatória')
    }

    if (!meta.periodo_fim) {
      erros.push('Data de fim é obrigatória')
    }

    if (meta.periodo_inicio && meta.periodo_fim && meta.periodo_inicio > meta.periodo_fim) {
      erros.push('Data de início deve ser anterior à data de fim')
    }

    if (meta.tipo === 'categoria' && !meta.categoria_id) {
      erros.push('Categoria é obrigatória para metas por categoria')
    }

    if (meta.tipo === 'total' && meta.categoria_id) {
      erros.push('Metas totais não devem ter categoria específica')
    }

    return erros
  }

  /**
   * Buscar metas com progresso calculado (migrado de metas-funcoes.ts)
   */
  static async obterMetasComProgresso(): Promise<MetaComProgresso[]> {
    const { data: metas, error } = await supabase
      .from('fp_metas')
      .select(`
        *,
        categoria:fp_categorias(nome, cor, icone)
      `)
      .eq('ativo', true)
      .order('periodo_inicio', { ascending: false })

    if (error) throw new Error(`Erro ao buscar metas: ${error.message}`)

    const metasComProgresso: MetaComProgresso[] = []

    for (const meta of metas || []) {
      const progresso = await this.calcularProgresso(meta)
      
      let statusCor: MetaComProgresso['status_cor'] = 'verde'
      if (progresso.percentual >= 100) statusCor = 'vermelho'
      else if (progresso.percentual >= 80) statusCor = 'laranja'
      else if (progresso.percentual >= 50) statusCor = 'amarelo'

      metasComProgresso.push({
        ...meta,
        valor_usado: progresso.valorGasto,
        percentual_usado: Math.round(progresso.percentual),
        valor_restante: progresso.valorLimite - progresso.valorGasto,
        status_cor: statusCor
      })
    }

    return metasComProgresso
  }

  /**
   * Obter cor do status conforme PRD
   */
  static obterCorStatus(status: 'normal' | 'atencao' | 'alerta' | 'excedido'): string {
    const cores = {
      'normal': 'text-green-600',
      'atencao': 'text-yellow-600', // 50% - aviso amarelo
      'alerta': 'text-orange-600',  // 80% - aviso laranja  
      'excedido': 'text-red-600'    // 100% - aviso vermelho
    }
    return cores[status]
  }

  /**
   * Obter descrição do status
   */
  static obterDescricaoStatus(status: 'normal' | 'atencao' | 'alerta' | 'excedido'): string {
    const descricoes = {
      'normal': 'Meta em dia',
      'atencao': 'Atenção: 50% do limite atingido',
      'alerta': 'Alerta: 80% do limite atingido',
      'excedido': 'Limite excedido!'
    }
    return descricoes[status]
  }
}