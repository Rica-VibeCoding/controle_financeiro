import { supabase } from './cliente'
import type { FormaPagamento } from '@/tipos/database'
import { mutate } from 'swr'

// Tipos auxiliares baseados na documentação
type NovaFormaPagamento = Omit<FormaPagamento, 'id' | 'created_at' | 'workspace_id'>

/**
 * Buscar todas as formas de pagamento ativas
 */
export async function obterFormasPagamento(incluirInativas = false, workspaceId: string): Promise<FormaPagamento[]> {
  let query = supabase
    .from('fp_formas_pagamento')
    .select('*')
    .order('nome')

  if (!incluirInativas) {
    query = query.eq('ativo', true)
  }
  
  query = query.eq('workspace_id', workspaceId)

  const { data, error } = await query

  if (error) throw new Error(`Erro ao buscar formas de pagamento: ${error.message}`)
  return data || []
}

/**
 * Buscar formas de pagamento que permitem parcelamento
 */
export async function obterFormasPagamentoParcelamento(workspaceId: string): Promise<FormaPagamento[]> {
  let query = supabase
    .from('fp_formas_pagamento')
    .select('*')
    .eq('ativo', true)
    .eq('permite_parcelamento', true)
    .order('nome')
  
  query = query.eq('workspace_id', workspaceId)
  
  const { data, error } = await query

  if (error) throw new Error(`Erro ao buscar formas de pagamento: ${error.message}`)
  return data || []
}

/**
 * Criar nova forma de pagamento
 */
export async function criarFormaPagamento(formaPagamento: NovaFormaPagamento, workspaceId: string): Promise<FormaPagamento> {
  const { data, error } = await supabase
    .from('fp_formas_pagamento')
    .insert([{ ...formaPagamento, workspace_id: workspaceId }])
    .select()
    .single()

  if (error) throw new Error(`Erro ao criar forma de pagamento: ${error.message}`)

  // Invalidar cache automaticamente
  mutate((key: any) => 
    Array.isArray(key) && 
    key[0] === 'dados-auxiliares' && 
    key[1] === workspaceId
  )

  return data
}

/**
 * Atualizar forma de pagamento
 */
export async function atualizarFormaPagamento(
  id: string, 
  atualizacoes: Partial<NovaFormaPagamento>,
  workspaceId: string
): Promise<void> {
  const { error } = await supabase
    .from('fp_formas_pagamento')
    .update(atualizacoes)
    .eq('id', id)
    .eq('workspace_id', workspaceId)

  if (error) throw new Error(`Erro ao atualizar forma de pagamento: ${error.message}`)

  // Invalidar cache automaticamente
  mutate((key: any) => 
    Array.isArray(key) && 
    key[0] === 'dados-auxiliares' && 
    key[1] === workspaceId
  )
}

/**
 * Buscar forma de pagamento por ID
 */
export async function obterFormaPagamentoPorId(id: string, workspaceId: string): Promise<FormaPagamento | null> {
  let query = supabase
    .from('fp_formas_pagamento')
    .select('*')
    .eq('id', id)
  
  query = query.eq('workspace_id', workspaceId)
  
  const { data, error } = await query.single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw new Error(`Erro ao buscar forma de pagamento: ${error.message}`)
  }
  return data
}

/**
 * Excluir forma de pagamento (hard delete)
 */
export async function excluirFormaPagamento(id: string, workspaceId: string): Promise<void> {
  const { error } = await supabase
    .from('fp_formas_pagamento')
    .delete()
    .eq('id', id)
    .eq('workspace_id', workspaceId)

  if (error) throw new Error(`Erro ao excluir forma de pagamento: ${error.message}`)

  // Invalidar cache automaticamente
  mutate((key: any) => 
    Array.isArray(key) && 
    key[0] === 'dados-auxiliares' && 
    key[1] === workspaceId
  )
}