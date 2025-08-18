import { supabase } from './cliente'
import type { Categoria } from '@/tipos/database'

// Tipos auxiliares baseados na documentação
type NovaCategoria = Omit<Categoria, 'id' | 'created_at'>

type CategoriaComSubcategorias = Categoria & {
  subcategorias: Array<{
    id: string
    nome: string
    categoria_id: string
    ativo: boolean
    created_at: string
  }>
}

/**
 * Buscar todas as categorias ativas
 */
export async function obterCategorias(incluirInativas = false): Promise<Categoria[]> {
  let query = supabase
    .from('fp_categorias')
    .select('*')
    .order('nome')

  if (!incluirInativas) {
    query = query.eq('ativo', true)
  }

  const { data, error } = await query

  if (error) throw new Error(`Erro ao buscar categorias: ${error.message}`)
  return data || []
}

/**
 * Buscar categorias com subcategorias
 */
export async function obterCategoriasComSubcategorias(): Promise<CategoriaComSubcategorias[]> {
  const { data, error } = await supabase
    .from('fp_categorias')
    .select(`
      *,
      subcategorias:fp_subcategorias(*)
    `)
    .eq('ativo', true)
    .order('nome')

  if (error) throw new Error(`Erro ao buscar categorias: ${error.message}`)
  return data || []
}

/**
 * Criar nova categoria
 */
export async function criarCategoria(categoria: NovaCategoria): Promise<Categoria> {
  const { data, error } = await supabase
    .from('fp_categorias')
    .insert([categoria])
    .select()
    .single()

  if (error) throw new Error(`Erro ao criar categoria: ${error.message}`)
  return data
}

/**
 * Atualizar categoria
 */
export async function atualizarCategoria(
  id: string, 
  atualizacoes: Partial<NovaCategoria>
): Promise<void> {
  const { error } = await supabase
    .from('fp_categorias')
    .update(atualizacoes)
    .eq('id', id)

  if (error) throw new Error(`Erro ao atualizar categoria: ${error.message}`)
}

/**
 * Desativar categoria (soft delete)
 */
export async function desativarCategoria(id: string): Promise<void> {
  const { error } = await supabase
    .from('fp_categorias')
    .update({ ativo: false })
    .eq('id', id)

  if (error) throw new Error(`Erro ao desativar categoria: ${error.message}`)
}

/**
 * Verificar se categoria possui transações vinculadas
 */
async function verificarTransacoesVinculadas(categoriaId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('fp_transacoes')
    .select('id')
    .eq('categoria_id', categoriaId)
    .limit(1)

  if (error) throw new Error(`Erro ao verificar transações: ${error.message}`)
  return (data && data.length > 0) || false
}

/**
 * Verificar se categoria possui subcategorias vinculadas
 */
async function verificarSubcategoriasVinculadas(categoriaId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('fp_subcategorias')
    .select('id')
    .eq('categoria_id', categoriaId)
    .limit(1)

  if (error) throw new Error(`Erro ao verificar subcategorias: ${error.message}`)
  return (data && data.length > 0) || false
}

/**
 * Excluir categoria (hard delete)
 * Verifica integridade antes da exclusão
 */
export async function excluirCategoria(id: string): Promise<void> {
  // Verificar se tem transações vinculadas
  const temTransacoes = await verificarTransacoesVinculadas(id)
  if (temTransacoes) {
    throw new Error('Não é possível excluir categoria com transações vinculadas')
  }

  // Verificar se tem subcategorias vinculadas
  const temSubcategorias = await verificarSubcategoriasVinculadas(id)
  if (temSubcategorias) {
    throw new Error('Não é possível excluir categoria com subcategorias vinculadas')
  }

  // Executar exclusão
  const { error } = await supabase
    .from('fp_categorias')
    .delete()
    .eq('id', id)

  if (error) throw new Error(`Erro ao excluir categoria: ${error.message}`)
}