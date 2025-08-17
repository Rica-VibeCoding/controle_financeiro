import { supabase } from './cliente'
import type { Subcategoria } from '@/tipos/database'

// Tipos auxiliares baseados na documentação
type NovaSubcategoria = Omit<Subcategoria, 'id' | 'created_at'>

/**
 * Buscar todas as subcategorias ativas
 */
export async function obterSubcategorias(incluirInativas = false): Promise<Subcategoria[]> {
  let query = supabase
    .from('fp_subcategorias')
    .select('*')
    .order('nome')

  if (!incluirInativas) {
    query = query.eq('ativo', true)
  }

  const { data, error } = await query

  if (error) throw new Error(`Erro ao buscar subcategorias: ${error.message}`)
  return data || []
}

/**
 * Buscar subcategorias por categoria
 */
export async function obterSubcategoriasPorCategoria(categoriaId: string): Promise<Subcategoria[]> {
  const { data, error } = await supabase
    .from('fp_subcategorias')
    .select('*')
    .eq('categoria_id', categoriaId)
    .eq('ativo', true)
    .order('nome')

  if (error) throw new Error(`Erro ao buscar subcategorias: ${error.message}`)
  return data || []
}

/**
 * Criar nova subcategoria
 */
export async function criarSubcategoria(subcategoria: NovaSubcategoria): Promise<Subcategoria> {
  const { data, error } = await supabase
    .from('fp_subcategorias')
    .insert([subcategoria])
    .select()
    .single()

  if (error) throw new Error(`Erro ao criar subcategoria: ${error.message}`)
  return data
}

/**
 * Atualizar subcategoria
 */
export async function atualizarSubcategoria(
  id: string, 
  atualizacoes: Partial<NovaSubcategoria>
): Promise<void> {
  const { error } = await supabase
    .from('fp_subcategorias')
    .update(atualizacoes)
    .eq('id', id)

  if (error) throw new Error(`Erro ao atualizar subcategoria: ${error.message}`)
}

/**
 * Buscar subcategoria por ID
 */
export async function obterSubcategoriaPorId(id: string): Promise<Subcategoria | null> {
  const { data, error } = await supabase
    .from('fp_subcategorias')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw new Error(`Erro ao buscar subcategoria: ${error.message}`)
  }
  return data
}

/**
 * Excluir subcategoria (hard delete)
 */
export async function excluirSubcategoria(id: string): Promise<void> {
  const { error } = await supabase
    .from('fp_subcategorias')
    .delete()
    .eq('id', id)

  if (error) throw new Error(`Erro ao excluir subcategoria: ${error.message}`)
}