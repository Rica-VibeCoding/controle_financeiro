import { supabase } from './cliente'
import type { Subcategoria } from '@/tipos/database'

// Tipos auxiliares baseados na documentação
type NovaSubcategoria = Omit<Subcategoria, 'id' | 'created_at' | 'workspace_id'>

/**
 * Buscar todas as subcategorias ativas
 */
export async function obterSubcategorias(incluirInativas = false, workspaceId: string): Promise<Subcategoria[]> {
  let query = supabase
    .from('fp_subcategorias')
    .select('*')
    .order('nome')

  if (!incluirInativas) {
    query = query.eq('ativo', true)
  }
  
  query = query.eq('workspace_id', workspaceId)

  const { data, error } = await query

  if (error) throw new Error(`Erro ao buscar subcategorias: ${error.message}`)
  return data || []
}

/**
 * Buscar subcategorias por categoria
 */
export async function obterSubcategoriasPorCategoria(categoriaId: string, workspaceId: string): Promise<Subcategoria[]> {
  let query = supabase
    .from('fp_subcategorias')
    .select('*')
    .eq('categoria_id', categoriaId)
    .eq('ativo', true)
    .order('nome')
  
  query = query.eq('workspace_id', workspaceId)
  
  const { data, error } = await query

  if (error) throw new Error(`Erro ao buscar subcategorias: ${error.message}`)
  return data || []
}

/**
 * Criar nova subcategoria
 */
export async function criarSubcategoria(subcategoria: NovaSubcategoria, workspaceId: string): Promise<Subcategoria> {
  const { data, error } = await supabase
    .from('fp_subcategorias')
    .insert([{ ...subcategoria, workspace_id: workspaceId }])
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
  atualizacoes: Partial<NovaSubcategoria>,
  workspaceId: string
): Promise<void> {
  const { error } = await supabase
    .from('fp_subcategorias')
    .update(atualizacoes)
    .eq('id', id)
    .eq('workspace_id', workspaceId)

  if (error) throw new Error(`Erro ao atualizar subcategoria: ${error.message}`)
}

/**
 * Buscar subcategoria por ID
 */
export async function obterSubcategoriaPorId(id: string, workspaceId: string): Promise<Subcategoria | null> {
  let query = supabase
    .from('fp_subcategorias')
    .select('*')
    .eq('id', id)
  
  query = query.eq('workspace_id', workspaceId)
  
  const { data, error } = await query.single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw new Error(`Erro ao buscar subcategoria: ${error.message}`)
  }
  return data
}

/**
 * Excluir subcategoria (hard delete)
 */
export async function excluirSubcategoria(id: string, workspaceId: string): Promise<void> {
  const { error } = await supabase
    .from('fp_subcategorias')
    .delete()
    .eq('id', id)
    .eq('workspace_id', workspaceId)

  if (error) throw new Error(`Erro ao excluir subcategoria: ${error.message}`)
}