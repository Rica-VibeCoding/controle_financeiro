import { supabase } from './cliente'
import type { Transacao, NovaTransacao } from '@/tipos/database'

type TransacaoComRelacoes = Transacao & {
  categoria?: { nome: string; cor: string; icone: string }
  subcategoria?: { nome: string }
  conta?: { nome: string; tipo: string }
  conta_destino?: { nome: string; tipo: string }
  forma_pagamento?: { nome: string; tipo: string }
  centro_custo?: { nome: string; cor: string }
}

/**
 * Versão simples para buscar transações sem paginação
 * Para debug e verificação se há dados no banco
 */
export async function obterTransacoesSimples(): Promise<TransacaoComRelacoes[]> {
  const { data, error } = await supabase
    .from('fp_transacoes')
    .select(`
      *,
      categoria:categoria_id(nome, cor, icone),
      subcategoria:subcategoria_id(nome),
      conta:conta_id(nome, tipo),
      conta_destino:conta_destino_id(nome, tipo),
      forma_pagamento:forma_pagamento_id(nome, tipo),
      centro_custo:centro_custo_id(nome, cor)
    `)
    .order('data', { ascending: false })
    .limit(50)

  if (error) {
    console.error('Erro ao buscar transações:', error)
    throw new Error(`Erro ao buscar transações: ${error.message}`)
  }

  console.log('Transações encontradas:', data?.length || 0)
  return data || []
}

/**
 * Criar nova transação - versão simplificada
 */
export async function criarTransacaoSimples(transacao: NovaTransacao): Promise<Transacao> {
  const { data, error } = await supabase
    .from('fp_transacoes')
    .insert([transacao])
    .select()
    .single()

  if (error) {
    console.error('Erro ao criar transação:', error)
    throw new Error(`Erro ao criar transação: ${error.message}`)
  }

  return data
}

/**
 * Verificar se há dados no banco
 */
export async function verificarDadosBanco() {
  try {
    // Verificar transações
    const { count: totalTransacoes } = await supabase
      .from('fp_transacoes')
      .select('*', { count: 'exact', head: true })

    // Verificar categorias
    const { count: totalCategorias } = await supabase
      .from('fp_categorias')
      .select('*', { count: 'exact', head: true })

    // Verificar contas
    const { count: totalContas } = await supabase
      .from('fp_contas')
      .select('*', { count: 'exact', head: true })

    console.log('Status do banco:')
    console.log(`- Transações: ${totalTransacoes || 0}`)
    console.log(`- Categorias: ${totalCategorias || 0}`)
    console.log(`- Contas: ${totalContas || 0}`)

    return {
      transacoes: totalTransacoes || 0,
      categorias: totalCategorias || 0,
      contas: totalContas || 0
    }
  } catch (error) {
    console.error('Erro ao verificar banco:', error)
    return { transacoes: 0, categorias: 0, contas: 0 }
  }
}