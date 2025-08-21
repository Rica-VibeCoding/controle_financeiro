import { supabase } from './cliente'
import type { 
  CardMetricaData, 
  ProximaConta, 
  CategoriaData, 
  CartaoData, 
  ContaData, 
  TendenciaData,
  Periodo 
} from '@/tipos/dashboard'

// Função para obter dados dos cards principais
export async function obterDadosCards(periodo: Periodo) {
  try {
    // Receitas do período atual
    const { data: receitasAtual } = await supabase
      .from('fp_transacoes')
      .select('valor')
      .eq('tipo', 'receita')
      .eq('status', 'realizado')
      .gte('data', periodo.inicio)
      .lte('data', periodo.fim)

    // Despesas do período atual
    const { data: despesasAtual } = await supabase
      .from('fp_transacoes')
      .select('valor')
      .eq('tipo', 'despesa')
      .eq('status', 'realizado')
      .gte('data', periodo.inicio)
      .lte('data', periodo.fim)

    // Período anterior (mesmo número de dias)
    const dataInicio = new Date(periodo.inicio)
    const dataFim = new Date(periodo.fim)
    const diasPeriodo = Math.ceil((dataFim.getTime() - dataInicio.getTime()) / (1000 * 60 * 60 * 24))
    
    const periodoAnteriorFim = new Date(dataInicio)
    periodoAnteriorFim.setDate(periodoAnteriorFim.getDate() - 1)
    const periodoAnteriorInicio = new Date(periodoAnteriorFim)
    periodoAnteriorInicio.setDate(periodoAnteriorInicio.getDate() - diasPeriodo + 1)

    // Receitas período anterior
    const { data: receitasAnterior } = await supabase
      .from('fp_transacoes')
      .select('valor')
      .eq('tipo', 'receita')
      .eq('status', 'realizado')
      .gte('data', periodoAnteriorInicio.toISOString().split('T')[0])
      .lte('data', periodoAnteriorFim.toISOString().split('T')[0])

    // Despesas período anterior
    const { data: despesasAnterior } = await supabase
      .from('fp_transacoes')
      .select('valor')
      .eq('tipo', 'despesa')
      .eq('status', 'realizado')
      .gte('data', periodoAnteriorInicio.toISOString().split('T')[0])
      .lte('data', periodoAnteriorFim.toISOString().split('T')[0])

    // Cartões: buscar limites dos cartões
    const { data: cartoesInfo } = await supabase
      .from('fp_contas')
      .select('id, limite')
      .eq('tipo', 'cartao_credito')

    const cartoesIds = cartoesInfo?.map(c => c.id) || []
    
    // Cartões: apenas gastos (despesas) do período - o que realmente foi "usado" no cartão
    const { data: cartoesGastos } = await supabase
      .from('fp_transacoes')
      .select('valor')
      .eq('tipo', 'despesa')
      .eq('status', 'realizado')
      .gte('data', periodo.inicio)
      .lte('data', periodo.fim)
      .in('conta_id', cartoesIds)

    // Calcular totais (convertendo strings para números)
    const totalReceitas = receitasAtual?.reduce((sum, r) => sum + Number(r.valor || 0), 0) || 0
    const totalDespesas = despesasAtual?.reduce((sum, d) => sum + Number(d.valor || 0), 0) || 0
    const totalReceitasAnterior = receitasAnterior?.reduce((sum, r) => sum + Number(r.valor || 0), 0) || 0
    const totalDespesasAnterior = despesasAnterior?.reduce((sum, d) => sum + Number(d.valor || 0), 0) || 0
    const totalCartoesUsado = cartoesGastos?.reduce((sum, c) => sum + Number(c.valor || 0), 0) || 0
    const totalCartoesLimite = cartoesInfo?.reduce((sum, c) => sum + Number(c.limite || 0), 0) || 0

    const saldoAtual = totalReceitas - totalDespesas
    const saldoAnterior = totalReceitasAnterior - totalDespesasAnterior

    // Calcular percentuais
    const calcularPercentual = (atual: number, anterior: number) => {
      if (anterior === 0) return atual > 0 ? 100 : 0
      return Number(((atual - anterior) / anterior * 100).toFixed(2))
    }

    return {
      receitas: {
        atual: totalReceitas,
        anterior: totalReceitasAnterior,
        percentual: calcularPercentual(totalReceitas, totalReceitasAnterior),
        tendencia: [] // TODO: implementar sparkline 7 dias
      },
      despesas: {
        atual: totalDespesas,
        anterior: totalDespesasAnterior,
        percentual: calcularPercentual(totalDespesas, totalDespesasAnterior),
        tendencia: [] // TODO: implementar sparkline 7 dias
      },
      saldo: {
        atual: saldoAtual,
        anterior: saldoAnterior,
        percentual: calcularPercentual(saldoAtual, saldoAnterior),
        tendencia: [] // TODO: implementar sparkline 7 dias
      },
      gastosCartao: {
        atual: totalCartoesUsado,
        limite: totalCartoesLimite,
        percentual: totalCartoesLimite > 0 ? Number((totalCartoesUsado / totalCartoesLimite * 100).toFixed(2)) : 0,
        tendencia: [] // TODO: implementar sparkline 7 dias
      }
    }

  } catch (error) {
    console.error('Erro ao obter dados dos cards:', error)
    throw error
  }
}

// Função para obter próximas contas
export async function obterProximasContas(): Promise<ProximaConta[]> {
  try {
    console.log('🔍 Iniciando busca por próximas contas...')
    
    // Primeiro, verificar se existem transações pendentes
    const { data: todasPendentes, error: errorTodasPendentes } = await supabase
      .from('fp_transacoes')
      .select('id, status, data_vencimento, descricao, valor')
      .eq('status', 'previsto')
    
    console.log('📊 Total de transações pendentes:', todasPendentes?.length || 0)
    console.log('📋 Amostra de transações pendentes:', todasPendentes?.slice(0, 3))
    
    if (errorTodasPendentes) {
      console.error('❌ Erro ao buscar todas pendentes:', errorTodasPendentes)
    }

    // Query principal com categorias
    const { data, error } = await supabase
      .from('fp_transacoes')
      .select(`
        id,
        descricao,
        valor,
        data_vencimento,
        status,
        categoria_id,
        fp_categorias (
          nome,
          cor,
          icone
        )
      `)
      .eq('status', 'previsto')
      .not('data_vencimento', 'is', null)
      .order('data_vencimento', { ascending: true })
      .limit(10)

    console.log('🎯 Resultado da query principal:', {
      count: data?.length || 0,
      error: error,
      sample: data?.slice(0, 2)
    })

    if (error) {
      console.error('❌ Erro na query principal:', error)
      throw error
    }

    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)
    console.log('📅 Data de hoje para cálculo:', hoje.toISOString().split('T')[0])

    const resultado = data?.map(item => {
      console.log('🔧 Processando item:', {
        id: item.id,
        descricao: item.descricao,
        data_vencimento: item.data_vencimento,
        categoria: item.fp_categorias
      })

      const vencimento = new Date(item.data_vencimento + 'T00:00:00')
      const diasRestantes = Math.ceil((vencimento.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24))
      const vencida = diasRestantes < 0

      return {
        id: item.id?.toString() || '',
        descricao: item.descricao || 'Sem descrição',
        valor: Number(item.valor || 0),
        dias: Math.abs(diasRestantes),
        vencida,
        categoria: {
          nome: (item.fp_categorias as any)?.nome || 'Outros',
          cor: (item.fp_categorias as any)?.cor || '#6B7280',
          icone: (item.fp_categorias as any)?.icone || 'dollar-sign'
        }
      }
    }) || []

    console.log('✅ Resultado final processado:', resultado)
    return resultado

  } catch (error) {
    console.error('💥 Erro ao obter próximas contas:', error)
    return []
  }
}

// Função para obter dados de tendência (últimos 6 meses)
export async function obterTendencia(): Promise<TendenciaData[]> {
  try {
    // Buscar transações dos últimos 6 meses
    const dataInicio = new Date()
    dataInicio.setMonth(dataInicio.getMonth() - 6)
    
    const { data, error } = await supabase
      .from('fp_transacoes')
      .select('data, tipo, valor')
      .eq('status', 'realizado')
      .gte('data', dataInicio.toISOString().split('T')[0])
      .order('data', { ascending: true })

    if (error) throw error

    // Agrupar por mês separando receitas e despesas
    const meses: { [key: string]: { receitas: number; despesas: number } } = {}
    
    data?.forEach(transacao => {
      const data = new Date(transacao.data)
      const chave = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}`
      
      if (!meses[chave]) meses[chave] = { receitas: 0, despesas: 0 }
      
      if (transacao.tipo === 'receita') {
        meses[chave].receitas += transacao.valor || 0
      } else if (transacao.tipo === 'despesa') {
        meses[chave].despesas += transacao.valor || 0
      }
    })

    // Converter para array ordenado
    const mesesNomes = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
    
    return Object.entries(meses)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([chave, dados]) => {
        const [ano, mes] = chave.split('-')
        const mesIndex = parseInt(mes) - 1
        return {
          mes: mesesNomes[mesIndex],
          receitas: dados.receitas,
          despesas: dados.despesas,
          saldo: dados.receitas - dados.despesas
        }
      })

  } catch (error) {
    console.error('Erro ao obter tendência:', error)
    return []
  }
}

// Função para obter categorias vs metas mensais
export async function obterCategoriasMetas(periodo: Periodo): Promise<CategoriaData[]> {
  try {
    // 1. Buscar todas as categorias cadastradas
    const { data: categorias, error: categoriasError } = await supabase
      .from('fp_categorias')
      .select('id, nome, cor')
      .eq('ativo', true)
      .order('nome', { ascending: true })

    if (categoriasError) {
      console.error('Erro ao buscar categorias:', categoriasError)
      throw categoriasError
    }

    console.log('📋 Categorias encontradas:', categorias?.length)

    // 2. Buscar gastos por categoria no período (todos os status)
    const { data: gastos, error: gastosError } = await supabase
      .from('fp_transacoes')
      .select('categoria_id, valor, status, data')
      .eq('tipo', 'despesa')
      .gte('data', periodo.inicio)
      .lte('data', periodo.fim)

    if (gastosError) {
      console.error('Erro ao buscar gastos:', gastosError)
      throw gastosError
    }

    console.log('💰 Gastos encontrados:', gastos?.length)

    // 3. Processar dados: agrupar gastos por categoria
    const gastosPorCategoria: { [key: string]: number } = {}
    gastos?.forEach(gasto => {
      const categoriaId = gasto.categoria_id?.toString() || ''
      gastosPorCategoria[categoriaId] = (gastosPorCategoria[categoriaId] || 0) + Number(gasto.valor || 0)
    })


    // 4. Buscar metas mensais
    let metas: any[] = []
    
    try {
      // Parse da data para obter mês/ano
      const [anoStr, mesStr] = periodo.inicio.split('-')
      const ano = parseInt(anoStr)
      const mes = parseInt(mesStr)
      const mesReferencia = ano * 100 + mes // 202508 para agosto 2025
      
      const { data: metasMensais, error: metasMensaisError } = await supabase
        .from('fp_metas_mensais')
        .select('categoria_id, valor_meta')
        .eq('mes_referencia', mesReferencia)

      if (!metasMensaisError && metasMensais && metasMensais.length > 0) {
        metas = metasMensais.map(m => ({ categoria_id: m.categoria_id, valor_limite: m.valor_meta }))
        console.log('🎯 Metas (fp_metas_mensais) encontradas:', metas.length)
      } else {
        console.log('⚠️ fp_metas_mensais vazia ou com erro:', metasMensaisError)
      }
    } catch (error) {
      console.log('❌ Erro ao buscar metas mensais:', error)
    }

    // 5. Processar dados: mapear metas por categoria
    const metasPorCategoria: { [key: string]: number } = {}
    metas?.forEach(meta => {
      const categoriaId = meta.categoria_id?.toString() || ''
      metasPorCategoria[categoriaId] = Number(meta.valor_limite || 0)
    })
    
    // 6. Criar array final combinando todas as informações
    const resultado: CategoriaData[] = categorias?.map(categoria => {
      const categoriaId = categoria.id.toString()
      const gasto = gastosPorCategoria[categoriaId] || 0
      const meta = metasPorCategoria[categoriaId] || null
      
      // Calcular percentual
      let percentual = 0
      if (meta && meta > 0) {
        percentual = Math.round((gasto / meta) * 100)
      }

      return {
        nome: categoria.nome || 'Sem nome',
        gasto,
        meta,
        cor: categoria.cor || '#6B7280', // cinza padrão
        percentual
      }
    }) || []

    // 6. Ordenar por relevância: primeiro com gastos (maior primeiro), depois por valor gasto
    return resultado.sort((a, b) => {
      // Priorizar categorias com gastos
      if (a.gasto > 0 && b.gasto === 0) return -1
      if (a.gasto === 0 && b.gasto > 0) return 1
      
      // Dentro do mesmo grupo, ordenar por valor gasto (maior primeiro)
      return b.gasto - a.gasto
    })

  } catch (error) {
    console.error('Erro ao obter categorias vs metas:', error)
    return []
  }
}