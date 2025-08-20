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
    const { data, error } = await supabase
      .from('fp_transacoes')
      .select('descricao, valor, data_vencimento')
      .eq('status', 'pendente')
      .gte('data_vencimento', new Date().toISOString().split('T')[0])
      .order('data_vencimento', { ascending: true })
      .limit(10)

    if (error) throw error

    return data?.map(item => {
      const hoje = new Date()
      const vencimento = new Date(item.data_vencimento + 'T00:00:00')
      const diasRestantes = Math.ceil((vencimento.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24))
      
      let urgencia: 'alta' | 'media' | 'baixa'
      if (diasRestantes <= 3) urgencia = 'alta'
      else if (diasRestantes <= 7) urgencia = 'media'
      else urgencia = 'baixa'

      return {
        nome: item.descricao || 'Sem descrição',
        valor: item.valor || 0,
        dias: diasRestantes,
        urgencia
      }
    }) || []

  } catch (error) {
    console.error('Erro ao obter próximas contas:', error)
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

    // Agrupar por mês
    const meses: { [key: string]: number } = {}
    
    data?.forEach(transacao => {
      const data = new Date(transacao.data)
      const chave = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}`
      
      if (!meses[chave]) meses[chave] = 0
      
      if (transacao.tipo === 'receita') {
        meses[chave] += transacao.valor || 0
      } else if (transacao.tipo === 'despesa') {
        meses[chave] -= transacao.valor || 0
      }
    })

    // Converter para array ordenado
    const mesesNomes = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
    
    return Object.entries(meses)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([chave, saldo]) => {
        const [ano, mes] = chave.split('-')
        const mesIndex = parseInt(mes) - 1
        return {
          mes: mesesNomes[mesIndex],
          saldo
        }
      })

  } catch (error) {
    console.error('Erro ao obter tendência:', error)
    return []
  }
}