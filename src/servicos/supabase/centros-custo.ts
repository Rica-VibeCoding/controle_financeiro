import { supabase } from './cliente'
import type { CentroCusto } from '@/tipos/database'

// Tipos auxiliares baseados na documentação
type NovoCentroCusto = Omit<CentroCusto, 'id' | 'created_at'>

/**
 * Buscar todos os centros de custo ativos
 */
export async function obterCentrosCusto(incluirInativas = false): Promise<CentroCusto[]> {
  let query = supabase
    .from('fp_centros_custo')
    .select('*')
    .order('nome')

  if (!incluirInativas) {
    query = query.eq('ativo', true)
  }

  const { data, error } = await query

  if (error) throw new Error(`Erro ao buscar centros de custo: ${error.message}`)
  return data || []
}

/**
 * Criar novo centro de custo
 */
export async function criarCentroCusto(centroCusto: NovoCentroCusto): Promise<CentroCusto> {
  const { data, error } = await supabase
    .from('fp_centros_custo')
    .insert([centroCusto])
    .select()
    .single()

  if (error) throw new Error(`Erro ao criar centro de custo: ${error.message}`)
  return data
}

/**
 * Atualizar centro de custo
 */
export async function atualizarCentroCusto(
  id: string, 
  atualizacoes: Partial<NovoCentroCusto>
): Promise<void> {
  const { error } = await supabase
    .from('fp_centros_custo')
    .update(atualizacoes)
    .eq('id', id)

  if (error) throw new Error(`Erro ao atualizar centro de custo: ${error.message}`)
}

/**
 * Buscar centro de custo por ID
 */
export async function obterCentroCustoPorId(id: string): Promise<CentroCusto | null> {
  const { data, error } = await supabase
    .from('fp_centros_custo')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw new Error(`Erro ao buscar centro de custo: ${error.message}`)
  }
  return data
}

/**
 * Excluir centro de custo (hard delete)
 */
export async function excluirCentroCusto(id: string): Promise<void> {
  const { error } = await supabase
    .from('fp_centros_custo')
    .delete()
    .eq('id', id)

  if (error) throw new Error(`Erro ao excluir centro de custo: ${error.message}`)
}