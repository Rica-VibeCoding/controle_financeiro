import { supabase } from './cliente'
import type { FormaPagamento } from '@/tipos/database'

// Tipos auxiliares baseados na documentação
type NovaFormaPagamento = Omit<FormaPagamento, 'id' | 'created_at'>

/**
 * Buscar todas as formas de pagamento ativas
 */
export async function obterFormasPagamento(incluirInativas = false): Promise<FormaPagamento[]> {
  let query = supabase
    .from('fp_formas_pagamento')
    .select('*')
    .order('nome')

  if (!incluirInativas) {
    query = query.eq('ativo', true)
  }

  const { data, error } = await query

  if (error) throw new Error(`Erro ao buscar formas de pagamento: ${error.message}`)
  return data || []
}

/**
 * Buscar formas de pagamento que permitem parcelamento
 */
export async function obterFormasPagamentoParcelamento(): Promise<FormaPagamento[]> {
  const { data, error } = await supabase
    .from('fp_formas_pagamento')
    .select('*')
    .eq('ativo', true)
    .eq('permite_parcelamento', true)
    .order('nome')

  if (error) throw new Error(`Erro ao buscar formas de pagamento: ${error.message}`)
  return data || []
}

/**
 * Criar nova forma de pagamento
 */
export async function criarFormaPagamento(formaPagamento: NovaFormaPagamento): Promise<FormaPagamento> {
  const { data, error } = await supabase
    .from('fp_formas_pagamento')
    .insert([formaPagamento])
    .select()
    .single()

  if (error) throw new Error(`Erro ao criar forma de pagamento: ${error.message}`)
  return data
}

/**
 * Atualizar forma de pagamento
 */
export async function atualizarFormaPagamento(
  id: string, 
  atualizacoes: Partial<NovaFormaPagamento>
): Promise<void> {
  const { error } = await supabase
    .from('fp_formas_pagamento')
    .update(atualizacoes)
    .eq('id', id)

  if (error) throw new Error(`Erro ao atualizar forma de pagamento: ${error.message}`)
}

/**
 * Desativar forma de pagamento (soft delete)
 */
export async function desativarFormaPagamento(id: string): Promise<void> {
  const { error } = await supabase
    .from('fp_formas_pagamento')
    .update({ ativo: false })
    .eq('id', id)

  if (error) throw new Error(`Erro ao desativar forma de pagamento: ${error.message}`)
}