import { supabase } from './cliente'
import type { 
  ProximaConta, 
  CategoriaData, 
  CartaoData, 
  ContaData, 
  TendenciaData,
  Periodo 
} from '@/tipos/dashboard'

// Função para obter dados dos cards principais
export async function obterDadosCards(periodo: Periodo, workspaceId: string) {
  try {
    // Receitas do período atual
    const queryReceitasAtual = supabase
      .from('fp_transacoes')
      .select('valor')
      .eq('tipo', 'receita')
      .eq('status', 'realizado')
      .gte('data', periodo.inicio)
      .lte('data', periodo.fim)
    
    queryReceitasAtual.eq('workspace_id', workspaceId)
    
    const { data: receitasAtual } = await queryReceitasAtual

    // Despesas do período atual
    const queryDespesasAtual = supabase
      .from('fp_transacoes')
      .select('valor')
      .eq('tipo', 'despesa')
      .eq('status', 'realizado')
      .gte('data', periodo.inicio)
      .lte('data', periodo.fim)
    
    queryDespesasAtual.eq('workspace_id', workspaceId)
    
    const { data: despesasAtual } = await queryDespesasAtual

    // Período anterior (mesmo número de dias)
    const dataInicio = new Date(periodo.inicio)
    const dataFim = new Date(periodo.fim)
    const diasPeriodo = Math.ceil((dataFim.getTime() - dataInicio.getTime()) / (1000 * 60 * 60 * 24))
    
    const periodoAnteriorFim = new Date(dataInicio)
    periodoAnteriorFim.setDate(periodoAnteriorFim.getDate() - 1)
    const periodoAnteriorInicio = new Date(periodoAnteriorFim)
    periodoAnteriorInicio.setDate(periodoAnteriorInicio.getDate() - diasPeriodo + 1)

    // Receitas período anterior
    const queryReceitasAnterior = supabase
      .from('fp_transacoes')
      .select('valor')
      .eq('tipo', 'receita')
      .eq('status', 'realizado')
      .gte('data', periodoAnteriorInicio.toISOString().split('T')[0])
      .lte('data', periodoAnteriorFim.toISOString().split('T')[0])
    
    queryReceitasAnterior.eq('workspace_id', workspaceId)
    
    const { data: receitasAnterior } = await queryReceitasAnterior

    // Despesas período anterior
    const queryDespesasAnterior = supabase
      .from('fp_transacoes')
      .select('valor')
      .eq('tipo', 'despesa')
      .eq('status', 'realizado')
      .gte('data', periodoAnteriorInicio.toISOString().split('T')[0])
      .lte('data', periodoAnteriorFim.toISOString().split('T')[0])
    
    queryDespesasAnterior.eq('workspace_id', workspaceId)
    
    const { data: despesasAnterior } = await queryDespesasAnterior

    // Cartões: buscar informações dos cartões com limite
    const queryCartoesInfo = supabase
      .from('fp_contas')
      .select('id, nome, limite')
      .eq('tipo', 'cartao_credito')
    
    queryCartoesInfo.eq('workspace_id', workspaceId)
    
    const { data: cartoesInfo } = await queryCartoesInfo

    const cartoesIds = cartoesInfo?.map(c => c.id) || []
    
    // Cartões: apenas gastos (despesas) do período - o que realmente foi "usado" no cartão
    const queryCartoesGastos = supabase
      .from('fp_transacoes')
      .select('valor')
      .eq('tipo', 'despesa')
      .eq('status', 'realizado')
      .gte('data', periodo.inicio)
      .lte('data', periodo.fim)
      .in('conta_id', cartoesIds)
    
    queryCartoesGastos.eq('workspace_id', workspaceId)
    
    const { data: cartoesGastos } = await queryCartoesGastos

    // Calcular totais (convertendo strings para números)
    const totalReceitas = receitasAtual?.reduce((sum, r) => sum + Number(r.valor || 0), 0) || 0
    const totalDespesas = despesasAtual?.reduce((sum, d) => sum + Number(d.valor || 0), 0) || 0
    const totalReceitasAnterior = receitasAnterior?.reduce((sum, r) => sum + Number(r.valor || 0), 0) || 0
    const totalDespesasAnterior = despesasAnterior?.reduce((sum, d) => sum + Number(d.valor || 0), 0) || 0
    const totalCartoesUsado = cartoesGastos?.reduce((sum, c) => sum + Number(c.valor || 0), 0) || 0
    const totalCartoesLimite = cartoesInfo?.reduce((sum, c) => {
      const limite = Number(c.limite || 0)
      return sum + limite
    }, 0) || 0

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
export async function obterProximasContas(workspaceId: string): Promise<ProximaConta[]> {
  try {
    // Verificar se existem transações previstas
    const queryTodasPrevistas = supabase
      .from('fp_transacoes')
      .select('id, status, data_vencimento, descricao, valor')
      .eq('status', 'previsto')
    
    queryTodasPrevistas.eq('workspace_id', workspaceId)
    

    const hojeString = new Date().toISOString().split('T')[0]

    // Query para transações com data_vencimento
    const queryTransacoesVencimento = supabase
      .from('fp_transacoes')
      .select(`
        id,
        descricao,
        valor,
        data_vencimento,
        proxima_recorrencia,
        recorrente,
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
      .gte('data_vencimento', hojeString)
      .order('data_vencimento', { ascending: true })
    
    queryTransacoesVencimento.eq('workspace_id', workspaceId)
    
    const { data: transacoesVencimento, error: errorVencimento } = await queryTransacoesVencimento

    // Query para recorrências vencidas (que devem aparecer)
    const queryRecorrenciasVencidas = supabase
      .from('fp_transacoes')
      .select(`
        id,
        descricao,
        valor,
        data_vencimento,
        proxima_recorrencia,
        recorrente,
        status,
        categoria_id,
        fp_categorias (
          nome,
          cor,
          icone
        )
      `)
      .eq('recorrente', true)
      .not('proxima_recorrencia', 'is', null)
      .lte('proxima_recorrencia', hojeString)
    
    queryRecorrenciasVencidas.eq('workspace_id', workspaceId)
    
    const { data: recorrenciasVencidas, error: errorRecorrencias } = await queryRecorrenciasVencidas

    // Query para parcelas com vencimento (novas)
    const queryParcelasVencimento = supabase
      .from('fp_transacoes')
      .select(`
        id,
        descricao,
        valor,
        data_vencimento,
        parcela_atual,
        total_parcelas,
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
      .not('grupo_parcelamento', 'is', null)
      .gte('data_vencimento', hojeString)
      .order('data_vencimento', { ascending: true })
    
    queryParcelasVencimento.eq('workspace_id', workspaceId)
    
    const { data: parcelasVencimento, error: errorParcelas } = await queryParcelasVencimento

    if (errorVencimento || errorRecorrencias || errorParcelas) {
      console.error('❌ Erro nas queries:', { errorVencimento, errorRecorrencias, errorParcelas })
      throw errorVencimento || errorRecorrencias || errorParcelas
    }

    // Combinar e ordenar por data (vencimento ou próxima_recorrencia)
    const todasTransacoes = [
      ...(transacoesVencimento || []).map(t => ({ 
        ...t, 
        data_ordenacao: t.data_vencimento,
        tipo_lista: 'vencimento' as const
      })),
      ...(recorrenciasVencidas || []).map(t => ({ 
        ...t, 
        data_ordenacao: t.proxima_recorrencia,
        tipo_lista: 'recorrencia' as const
      })),
      ...(parcelasVencimento || []).map(t => ({ 
        ...t, 
        data_ordenacao: t.data_vencimento,
        tipo_lista: 'parcela' as const
      }))
    ]

    // Ordenar por data e limitar a 10
    const data = todasTransacoes
      .sort((a, b) => new Date(a.data_ordenacao || '').getTime() - new Date(b.data_ordenacao || '').getTime())
      .slice(0, 10)



    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)

    const resultado = data?.map(item => {
      // Usar data_ordenacao que pode ser data_vencimento ou proxima_recorrencia
      const dataReferencia = new Date((item as any).data_ordenacao + 'T00:00:00')
      const diasRestantes = Math.ceil((dataReferencia.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24))
      const vencida = diasRestantes < 0

      // Indicar tipo de transação
      const isRecorrencia = (item as any).tipo_lista === 'recorrencia'
      const isParcela = (item as any).tipo_lista === 'parcela'

      return {
        id: item.id?.toString() || '',
        descricao: 
          isRecorrencia ? `🔄 ${item.descricao}` : 
          isParcela ? `📦 ${item.descricao}` :
          (item.descricao || 'Sem descrição'),
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

    return resultado

  } catch (error) {
    console.error('💥 Erro ao obter próximas contas:', error)
    return []
  }
}

// Função para obter dados de tendência (últimos 6 meses)
export async function obterTendencia(workspaceId: string): Promise<TendenciaData[]> {
  try {
    // Buscar transações dos últimos 6 meses
    const dataInicio = new Date()
    dataInicio.setMonth(dataInicio.getMonth() - 6)
    
    const queryTendencia = supabase
      .from('fp_transacoes')
      .select('data, tipo, valor')
      .eq('status', 'realizado')
      .gte('data', dataInicio.toISOString().split('T')[0])
      .order('data', { ascending: true })
    
    queryTendencia.eq('workspace_id', workspaceId)
    
    const { data, error } = await queryTendencia

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
export async function obterCategoriasMetas(periodo: Periodo, workspaceId: string): Promise<CategoriaData[]> {
  try {
    // 1. Buscar todas as categorias cadastradas
    const queryCategorias = supabase
      .from('fp_categorias')
      .select('id, nome, cor')
      .eq('ativo', true)
      .order('nome', { ascending: true })
    
    queryCategorias.eq('workspace_id', workspaceId)
    
    const { data: categorias, error: categoriasError } = await queryCategorias

    if (categoriasError) {
      console.error('Erro ao buscar categorias:', categoriasError)
      throw categoriasError
    }


    // 2. Buscar gastos por categoria no período (todos os status)
    const queryGastos = supabase
      .from('fp_transacoes')
      .select('categoria_id, valor, status, data')
      .eq('tipo', 'despesa')
      .gte('data', periodo.inicio)
      .lte('data', periodo.fim)
    
    queryGastos.eq('workspace_id', workspaceId)
    
    const { data: gastos, error: gastosError } = await queryGastos

    if (gastosError) {
      console.error('Erro ao buscar gastos:', gastosError)
      throw gastosError
    }


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
      const [, mesStr] = periodo.inicio.split('-')
      const ano = new Date(periodo.inicio).getFullYear()
      const mes = parseInt(mesStr)
      const mesReferencia = ano * 100 + mes // 202508 para agosto 2025
      
      const queryMetasMensais = supabase
        .from('fp_metas_mensais')
        .select('categoria_id, valor_meta')
        .eq('mes_referencia', mesReferencia)
      
      queryMetasMensais.eq('workspace_id', workspaceId)
      
      const { data: metasMensais, error: metasMensaisError } = await queryMetasMensais

      if (!metasMensaisError && metasMensais && metasMensais.length > 0) {
        metas = metasMensais.map(m => ({ categoria_id: m.categoria_id, valor_limite: m.valor_meta }))
      }
    } catch {
      // Silently handle errors
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

// Função para obter saldos das contas bancárias (excluindo cartões)
export async function obterSaldosContas(workspaceId: string): Promise<{ contas: ContaData[]; totalSaldo: number }> {
  try {
    
    // Buscar todas as contas exceto cartões de crédito (campos corretos da tabela)
    const queryContas = supabase
      .from('fp_contas')
      .select('id, nome, tipo, banco')
      .neq('tipo', 'cartao_credito')
      .eq('ativo', true)
      .order('nome', { ascending: true })
    
    queryContas.eq('workspace_id', workspaceId)
    
    const { data: contas, error: contasError } = await queryContas

    if (contasError) {
      console.error('❌ Erro ao buscar contas:', contasError)
      throw contasError
    }


    // Para cada conta, calcular saldo e buscar últimas 5 movimentações
    const contasComMovimentacoes = await Promise.all(
      (contas || []).map(async (conta) => {
        // Buscar receitas e despesas normais da conta
        const queryTransacoesNormais = supabase
          .from('fp_transacoes')
          .select('valor, tipo')
          .eq('conta_id', conta.id)
          .eq('status', 'realizado')
          .in('tipo', ['receita', 'despesa'])
        
        queryTransacoesNormais.eq('workspace_id', workspaceId)
        
        const { data: transacoesNormais } = await queryTransacoesNormais

        // Buscar transferências recebidas (conta como destino)
        const queryTransferenciasRecebidas = supabase
          .from('fp_transacoes')
          .select('valor')
          .eq('conta_destino_id', conta.id)
          .eq('tipo', 'transferencia')
          .eq('status', 'realizado')
        
        queryTransferenciasRecebidas.eq('workspace_id', workspaceId)
        
        const { data: transferenciasRecebidas } = await queryTransferenciasRecebidas

        // Buscar transferências enviadas (conta como origem)
        const queryTransferenciasEnviadas = supabase
          .from('fp_transacoes')
          .select('valor')
          .eq('conta_id', conta.id)
          .eq('tipo', 'transferencia')
          .eq('status', 'realizado')
        
        queryTransferenciasEnviadas.eq('workspace_id', workspaceId)
        
        const { data: transferenciasEnviadas } = await queryTransferenciasEnviadas

        // Calcular saldo completo: receitas - despesas + transferências_recebidas - transferências_enviadas
        let saldo = 0
        
        // Receitas e despesas normais
        transacoesNormais?.forEach(transacao => {
          if (transacao.tipo === 'receita') {
            saldo += Number(transacao.valor || 0)
          } else if (transacao.tipo === 'despesa') {
            saldo -= Number(transacao.valor || 0)
          }
        })
        
        // Transferências recebidas (+)
        transferenciasRecebidas?.forEach(transferencia => {
          saldo += Number(transferencia.valor || 0)
        })
        
        // Transferências enviadas (-)
        transferenciasEnviadas?.forEach(transferencia => {
          saldo -= Number(transferencia.valor || 0)
        })

        // Buscar últimas 5 movimentações para o hover (incluindo transferências)
        const queryMovimentacoes = supabase
          .from('fp_transacoes')
          .select('descricao, valor, data, tipo, conta_destino_id')
          .or(`conta_id.eq.${conta.id},conta_destino_id.eq.${conta.id}`)
          .eq('status', 'realizado')
          .order('data', { ascending: false })
          .limit(5)
        
        queryMovimentacoes.eq('workspace_id', workspaceId)
        
        const { data: movimentacoes } = await queryMovimentacoes

        // Definir ícone baseado no tipo da conta (lógica simples e robusta)
        const obterIcone = (tipo: string) => {
          // Por tipo de conta (usando apenas ícones que existem no componente)
          if (tipo === 'dinheiro') return 'wallet'
          if (tipo === 'poupanca') return 'piggy-bank'
          if (tipo === 'conta_corrente') return 'credit-card'
          if (tipo === 'investimento') return 'line-chart'
          
          // Ícone padrão para qualquer banco/conta
          return 'wallet'
        }

        return {
          id: conta.id.toString(),
          nome: `${conta.nome || 'Conta sem nome'}${conta.banco ? ` | ${conta.banco}` : ''}`,
          saldo: saldo,
          tipo: conta.tipo || 'outros',
          icone: obterIcone(conta.tipo),
          ultimasMovimentacoes: movimentacoes?.map(mov => {
            // Para transferências, determinar se é entrada ou saída baseado na conta
            if (mov.tipo === 'transferencia') {
              const ehEntrada = mov.conta_destino_id === conta.id
              return {
                descricao: mov.descricao || (ehEntrada ? 'Transferência recebida' : 'Transferência enviada'),
                valor: Number(mov.valor || 0),
                data: mov.data,
                tipo: ehEntrada ? 'receita' as const : 'despesa' as const
              }
            }
            // Para receitas e despesas normais
            return {
              descricao: mov.descricao || 'Movimentação',
              valor: Number(mov.valor || 0),
              data: mov.data,
              tipo: mov.tipo as 'receita' | 'despesa'
            }
          }) || []
        }
      })
    )

    // Calcular total de saldos
    const totalSaldo = contasComMovimentacoes.reduce((total, conta) => total + conta.saldo, 0)


    return {
      contas: contasComMovimentacoes,
      totalSaldo
    }

  } catch (error) {
    console.error('💥 Erro ao obter saldos das contas:', error)
    return { contas: [], totalSaldo: 0 }
  }
}

// Função para obter cartões de crédito individuais
export async function obterCartoesCredito(periodo: Periodo, workspaceId: string): Promise<{ cartoes: CartaoData[]; totalUsado: number; totalLimite: number }> {
  try {
    
    // Buscar todos os cartões de crédito
    const queryCartoes = supabase
      .from('fp_contas')
      .select('id, nome, banco, limite, data_fechamento')
      .eq('tipo', 'cartao_credito')
      .eq('ativo', true)
      .order('nome', { ascending: true })
    
    queryCartoes.eq('workspace_id', workspaceId)
    
    const { data: cartoes, error: cartoesError } = await queryCartoes

    if (cartoesError) {
      console.error('❌ Erro ao buscar cartões:', cartoesError)
      throw cartoesError
    }

    // Para cada cartão, calcular valor usado e buscar últimas transações
    const cartoesComTransacoes = await Promise.all(
      (cartoes || []).map(async (cartao) => {
        // Buscar despesas do cartão (valor usado) no período específico - INCLUI previstas e realizadas
        const queryDespesas = supabase
          .from('fp_transacoes')
          .select('valor')
          .eq('conta_id', cartao.id)
          .eq('tipo', 'despesa')
          .in('status', ['realizado', 'previsto'])
          .gte('data', periodo.inicio)
          .lte('data', periodo.fim)
        
        queryDespesas.eq('workspace_id', workspaceId)
        
        const { data: despesas } = await queryDespesas

        // Calcular valor usado
        const valorUsado = despesas?.reduce((acc, despesa) => {
          return acc + Number(despesa.valor || 0)
        }, 0) || 0

        // Buscar últimas 5 transações para o hover (no período específico) - INCLUI previstas e realizadas
        const queryTransacoes = supabase
          .from('fp_transacoes')
          .select('descricao, valor, data, tipo')
          .eq('conta_id', cartao.id)
          .in('status', ['realizado', 'previsto'])
          .gte('data', periodo.inicio)
          .lte('data', periodo.fim)
          .order('data', { ascending: false })
          .limit(5)
        
        queryTransacoes.eq('workspace_id', workspaceId)
        
        const { data: transacoes } = await queryTransacoes

        const limite = Number(cartao.limite || 0)
        const percentual = limite > 0 ? Math.round((valorUsado / limite) * 100) : 0

        // Calcular próximo vencimento baseado no dia de fechamento
        const calcularProximoVencimento = (dataFechamento: number) => {
          const hoje = new Date()
          const proximoVencimento = new Date(hoje.getFullYear(), hoje.getMonth(), dataFechamento + 21) // 21 dias após fechamento
          
          // Se já passou, vai para o próximo mês
          if (proximoVencimento < hoje) {
            proximoVencimento.setMonth(proximoVencimento.getMonth() + 1)
          }
          
          return proximoVencimento.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
        }

        return {
          id: cartao.id.toString(),
          nome: cartao.nome || 'Cartão sem nome',
          banco: cartao.banco || 'Banco',
          usado: valorUsado,
          limite: limite,
          dataFechamento: cartao.data_fechamento || 1,
          vencimento: calcularProximoVencimento(cartao.data_fechamento || 1),
          percentual: percentual,
          ultimasTransacoes: transacoes?.map(trans => ({
            descricao: trans.descricao || 'Transação',
            valor: Number(trans.valor || 0),
            data: trans.data,
            tipo: trans.tipo as 'receita' | 'despesa'
          })) || []
        }
      })
    )

    // Calcular totais
    const totalUsado = cartoesComTransacoes.reduce((total, cartao) => total + cartao.usado, 0)
    const totalLimite = cartoesComTransacoes.reduce((total, cartao) => total + cartao.limite, 0)

    return {
      cartoes: cartoesComTransacoes,
      totalUsado,
      totalLimite
    }

  } catch (error) {
    console.error('💥 Erro ao obter cartões de crédito:', error)
    return { cartoes: [], totalUsado: 0, totalLimite: 0 }
  }
}