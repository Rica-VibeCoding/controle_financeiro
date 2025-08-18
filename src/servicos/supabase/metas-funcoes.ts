import { supabase } from './cliente'
import type { Meta, NovaMeta } from '@/tipos/database'

// Tipos auxiliares baseados na documentação
type MetaComProgresso = Meta & {
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

// Função auxiliar para formatação (temporária até utilitários serem criados)
function formatarMoeda(valor: number): string {
  return valor.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  })
}

/**
 * Buscar todas as metas ativas
 */
export async function obterMetas(incluirInativas = false): Promise<Meta[]> {
  let query = supabase
    .from('fp_metas')
    .select('*')
    .order('periodo_inicio', { ascending: false })

  if (!incluirInativas) {
    query = query.eq('ativo', true)
  }

  const { data, error } = await query

  if (error) throw new Error(`Erro ao buscar metas: ${error.message}`)
  return data || []
}

/**
 * Buscar metas com progresso calculado
 */
export async function obterMetasComProgresso(): Promise<MetaComProgresso[]> {
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
    const valorUsado = await calcularValorUsadoMeta(meta)
    const percentualUsado = (valorUsado / meta.valor_limite) * 100
    const valorRestante = meta.valor_limite - valorUsado

    let statusCor: MetaComProgresso['status_cor'] = 'verde'
    if (percentualUsado >= 100) statusCor = 'vermelho'
    else if (percentualUsado >= 80) statusCor = 'laranja'
    else if (percentualUsado >= 50) statusCor = 'amarelo'

    metasComProgresso.push({
      ...meta,
      valor_usado: valorUsado,
      percentual_usado: Math.round(percentualUsado),
      valor_restante: valorRestante,
      status_cor: statusCor
    })
  }

  return metasComProgresso
}

/**
 * Calcular valor usado em uma meta
 */
async function calcularValorUsadoMeta(meta: Meta): Promise<number> {
  let query = supabase
    .from('fp_transacoes')
    .select('valor')
    .gte('data', meta.periodo_inicio)
    .lte('data', meta.periodo_fim)
    .eq('status', 'realizado')

  // Se meta é por categoria específica
  if (meta.tipo === 'categoria' && meta.categoria_id) {
    query = query.eq('categoria_id', meta.categoria_id)
  }

  // Apenas despesas contam para as metas
  query = query.eq('tipo', 'despesa')

  const { data, error } = await query

  if (error) throw new Error(`Erro ao calcular meta: ${error.message}`)

  return (data || []).reduce((total, transacao) => total + transacao.valor, 0)
}

/**
 * Criar nova meta
 */
export async function criarMeta(meta: NovaMeta): Promise<Meta> {
  const { data, error } = await supabase
    .from('fp_metas')
    .insert([meta])
    .select()
    .single()

  if (error) throw new Error(`Erro ao criar meta: ${error.message}`)
  return data
}

/**
 * Atualizar meta
 */
export async function atualizarMeta(
  id: string, 
  atualizacoes: Partial<NovaMeta>
): Promise<void> {
  const { error } = await supabase
    .from('fp_metas')
    .update(atualizacoes)
    .eq('id', id)

  if (error) throw new Error(`Erro ao atualizar meta: ${error.message}`)
}

/**
 * Desativar meta
 */
export async function desativarMeta(id: string): Promise<void> {
  const { error } = await supabase
    .from('fp_metas')
    .update({ ativo: false })
    .eq('id', id)

  if (error) throw new Error(`Erro ao desativar meta: ${error.message}`)
}

export type { MetaComProgresso }