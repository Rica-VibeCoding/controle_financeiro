// Queries semânticas para Projetos Pessoais
// WRAPPER sobre fp_centros_custo com cálculos financeiros

import { getSupabaseClient } from './cliente'
import { 
  ProjetoPessoal, 
  ProjetosPessoaisData, 
  CalculosFinanceiros,
  FiltroProjetosPessoais,
  StatusProjeto
} from '@/tipos/projetos-pessoais'
import { CentroCusto } from '@/tipos/database'

// Interface para transações tipadas
interface TransacaoFinanceira {
  valor: number
  tipo: 'receita' | 'despesa' | 'transferencia'
}

// Função principal: wrapper semântico sobre centros de custo
export async function obterProjetosPessoais(
  filtros: FiltroProjetosPessoais = {},
  workspaceId: string
): Promise<ProjetosPessoaisData> {
  try {
    // 1. Buscar centros de custo (base de dados)
    const cliente = getSupabaseClient()
    let query = cliente
      .from('fp_centros_custo')
      .select('*')
      .eq('ativo', true)

    if (!filtros.incluir_arquivados) {
      query = query.eq('arquivado', false)
    }
    
    query = query.eq('workspace_id', workspaceId)

    const { data: centrosCusto, error } = await query

    if (error) {
      console.error('Erro ao buscar centros de custo:', error)
      throw error
    }
    
    if (!centrosCusto || centrosCusto.length === 0) {
      return { projetos: [], resumo: gerarResumoVazio() }
    }

    // 2. Converter cada centro em projeto com cálculos
    const projetosBrutos = await Promise.all(
      centrosCusto.map(centro => converterParaProjetoPessoal(centro, filtros, workspaceId))
    )

    // 3. Filtrar apenas projetos com movimentação (receitas OU despesas > 0)
    const projetos = projetosBrutos.filter(projeto => 
      projeto.total_receitas > 0 || projeto.total_despesas > 0
    )

    // 3. Gerar resumo geral
    const resumo = gerarResumo(projetos)

    return { projetos, resumo }

  } catch (error) {
    console.error('Erro ao obter projetos pessoais:', error)
    throw error
  }
}

// Converter CentroCusto -> ProjetoPessoal (core da estratégia wrapper)
async function converterParaProjetoPessoal(
  centro: CentroCusto, 
  filtros: FiltroProjetosPessoais,
  workspaceId: string
): Promise<ProjetoPessoal> {
  
  // 1. Calcular financeiros do projeto
  const calculos = await calcularFinanceirosProjeto(centro.id, filtros, workspaceId)
  
  // 2. Determinar modo de cálculo
  const modoCalculo = (centro.valor_orcamento && centro.valor_orcamento > 0) 
    ? 'orcamento' : 'roi'
  
  // 3. Calcular status baseado no modo
  const status = calcularStatusProjeto(calculos, centro.valor_orcamento, modoCalculo)
  
  // 4. Formatar valores para UI
  const formatados = formatarValoresProjeto(calculos, centro.valor_orcamento)

  // 5. Retornar projeto completo (CentroCusto + cálculos)
  return {
    ...centro, // todos os campos do centro de custo
    total_receitas: calculos.receitas,
    total_despesas: calculos.despesas,
    resultado: calculos.resultado,
    modo_calculo: modoCalculo,
    percentual_principal: status.percentual,
    label_percentual: status.label,
    valor_restante_orcamento: modoCalculo === 'orcamento' 
      ? Math.max(0, centro.valor_orcamento! - calculos.despesas)
      : null,
    status_cor: status.cor,
    status_descricao: status.descricao,
    ...formatados
  }
}

// Calcular receitas/despesas de um projeto específico
async function calcularFinanceirosProjeto(
  centroId: string, 
  filtros: FiltroProjetosPessoais,
  workspaceId: string
): Promise<CalculosFinanceiros> {
  
  const cliente = getSupabaseClient()
  let query = cliente
    .from('fp_transacoes')
    .select('valor, tipo')
    .eq('centro_custo_id', centroId)
    .eq('status', 'realizado')

  // Aplicar filtro de período se fornecido
  if (filtros.periodo_inicio) {
    query = query.gte('data', filtros.periodo_inicio)
  }
  if (filtros.periodo_fim) {
    query = query.lte('data', filtros.periodo_fim)
  }
  
  query = query.eq('workspace_id', workspaceId)

  const { data: transacoes, error } = await query

  if (error) throw error
  if (!transacoes) return { receitas: 0, despesas: 0, resultado: 0 }

  // Somar por tipo com tipagem adequada
  const receitas = transacoes
    .filter((t: TransacaoFinanceira) => t.tipo === 'receita')
    .reduce((sum: number, t: TransacaoFinanceira) => sum + Number(t.valor), 0)

  const despesas = transacoes
    .filter((t: TransacaoFinanceira) => t.tipo === 'despesa')
    .reduce((sum: number, t: TransacaoFinanceira) => sum + Number(t.valor), 0)

  const resultado = receitas - despesas

  return { receitas, despesas, resultado }
}

// Calcular status visual do projeto
function calcularStatusProjeto(
  calculos: CalculosFinanceiros,
  valorOrcamento: number | null,
  modo: 'roi' | 'orcamento'
): StatusProjeto {

  if (modo === 'orcamento' && valorOrcamento && valorOrcamento > 0) {
    // Modo orçamento: % do orçamento usado
    const percentualUsado = (calculos.despesas / valorOrcamento) * 100
    
    if (percentualUsado >= 100) {
      return {
        cor: 'vermelho',
        percentual: percentualUsado,
        label: `Meta: ${Math.round(percentualUsado)}%`,
        descricao: 'Orçamento ultrapassado'
      }
    } else if (percentualUsado >= 81) {
      return {
        cor: 'verde-escuro',
        percentual: percentualUsado,
        label: `Meta: ${Math.round(percentualUsado)}%`,
        descricao: 'Próximo do limite'
      }
    } else {
      return {
        cor: 'verde',
        percentual: percentualUsado,
        label: `Meta: ${Math.round(percentualUsado)}%`,
        descricao: 'Dentro do orçamento'
      }
    }
  } else {
    // Modo ROI: % de retorno sobre investimento
    if (calculos.receitas === 0) {
      return {
        cor: 'cinza',
        percentual: 0,
        label: 'Sem ROI',
        descricao: 'Apenas despesas'
      }
    }

    // ROI correto: ((Receitas - Despesas) / Despesas) * 100
    // Se não há despesas mas há receitas = 100% de retorno
    const roi = calculos.despesas > 0 
      ? ((calculos.receitas - calculos.despesas) / calculos.despesas) * 100
      : (calculos.receitas > 0 ? 100 : 0)

    if (roi >= 0) {
      return {
        cor: 'verde',
        percentual: roi,
        label: `ROI: +${Math.round(Math.abs(roi))}%`,
        descricao: 'Projeto lucrativo'
      }
    } else {
      return {
        cor: 'vermelho',
        percentual: Math.abs(roi),
        label: `ROI: -${Math.round(Math.abs(roi))}%`,
        descricao: 'Projeto em prejuízo'
      }
    }
  }
}

// Formatar valores para exibição
function formatarValoresProjeto(
  calculos: CalculosFinanceiros,
  valorOrcamento: number | null
) {
  const formatter = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  })

  return {
    total_receitas_formatado: formatter.format(calculos.receitas),
    total_despesas_formatado: formatter.format(calculos.despesas),
    resultado_formatado: formatter.format(calculos.resultado),
    valor_orcamento_formatado: valorOrcamento ? formatter.format(valorOrcamento) : null
  }
}

// Gerar resumo geral dos projetos
function gerarResumo(projetos: ProjetoPessoal[]) {
  const totalReceitas = projetos.reduce((sum, p) => sum + p.total_receitas, 0)
  const totalDespesas = projetos.reduce((sum, p) => sum + p.total_despesas, 0)
  const resultadoGeral = totalReceitas - totalDespesas
  
  // ROI médio considerando apenas projetos com ROI válido
  const projetosComROI = projetos.filter(p => p.modo_calculo === 'roi' && p.total_receitas > 0)
  const roiMedio = projetosComROI.length > 0
    ? projetosComROI.reduce((sum, p) => sum + p.percentual_principal, 0) / projetosComROI.length
    : 0

  return {
    total_projetos: projetos.length,
    projetos_ativos: projetos.filter(p => !p.arquivado).length,
    total_receitas: totalReceitas,
    total_despesas: totalDespesas,
    resultado_geral: resultadoGeral,
    roi_medio: roiMedio
  }
}

function gerarResumoVazio() {
  return {
    total_projetos: 0,
    projetos_ativos: 0,
    total_receitas: 0,
    total_despesas: 0,
    resultado_geral: 0,
    roi_medio: 0
  }
}