import { supabase } from './cliente'
import type { Categoria } from '@/tipos/database'
import { mutate } from 'swr'

// Tipos auxiliares baseados na documentação
type NovaCategoria = Omit<Categoria, 'id' | 'created_at' | 'workspace_id'>

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
export async function obterCategorias(incluirInativas = false, workspaceId: string): Promise<Categoria[]> {
  let query = supabase
    .from('fp_categorias')
    .select('*')
    .order('nome')

  if (!incluirInativas) {
    query = query.eq('ativo', true)
  }
  
  query = query.eq('workspace_id', workspaceId)

  const { data, error } = await query

  if (error) throw new Error(`Erro ao buscar categorias: ${error.message}`)
  return data || []
}

/**
 * Buscar categorias com subcategorias
 */
export async function obterCategoriasComSubcategorias(workspaceId: string): Promise<CategoriaComSubcategorias[]> {
  let query = supabase
    .from('fp_categorias')
    .select(`
      *,
      subcategorias:fp_subcategorias(*)
    `)
    .eq('ativo', true)
    .order('nome')
  
  query = query.eq('workspace_id', workspaceId)
  
  const { data, error } = await query

  if (error) throw new Error(`Erro ao buscar categorias: ${error.message}`)
  return data || []
}

/**
 * Verificar se categoria com nome já existe no workspace
 */
export async function verificarCategoriaExiste(nome: string, workspaceId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('fp_categorias')
    .select('id')
    .eq('nome', nome.trim())
    .eq('workspace_id', workspaceId)
    .limit(1)

  if (error) throw new Error(`Erro ao verificar categoria: ${error.message}`)
  return (data && data.length > 0) || false
}

/**
 * Criar nova categoria
 */
export async function criarCategoria(categoria: NovaCategoria, workspaceId: string): Promise<Categoria> {
  // Verificar se já existe categoria com mesmo nome
  const nomeExiste = await verificarCategoriaExiste(categoria.nome, workspaceId)
  if (nomeExiste) {
    throw new Error(`Já existe uma categoria com o nome "${categoria.nome}" neste workspace`)
  }

  const { data, error } = await supabase
    .from('fp_categorias')
    .insert([{ ...categoria, workspace_id: workspaceId }])
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      throw new Error(`Já existe uma categoria com o nome "${categoria.nome}"`)
    }
    throw new Error(`Erro ao criar categoria: ${error.message}`)
  }

  // Invalidar cache automaticamente
  mutate((key: any) => 
    Array.isArray(key) && 
    key[0] === 'dados-auxiliares' && 
    key[1] === workspaceId
  )

  return data
}

/**
 * Obter categoria por ID
 */
export async function obterCategoriaPorId(id: string): Promise<Categoria> {
  const { data, error } = await supabase
    .from('fp_categorias')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      throw new Error('Categoria não encontrada')
    }
    throw new Error(`Erro ao buscar categoria: ${error.message}`)
  }

  return data
}

/**
 * Atualizar categoria
 */
export async function atualizarCategoria(
  id: string, 
  atualizacoes: Partial<NovaCategoria>,
  workspaceId: string
): Promise<void> {
  const { error } = await supabase
    .from('fp_categorias')
    .update(atualizacoes)
    .eq('id', id)
    .eq('workspace_id', workspaceId)

  if (error) throw new Error(`Erro ao atualizar categoria: ${error.message}`)

  // Invalidar cache automaticamente
  mutate((key: any) => 
    Array.isArray(key) && 
    key[0] === 'dados-auxiliares' && 
    key[1] === workspaceId
  )
}

/**
 * Desativar categoria (soft delete)
 */
export async function desativarCategoria(id: string, workspaceId: string): Promise<void> {
  const { error } = await supabase
    .from('fp_categorias')
    .update({ ativo: false })
    .eq('id', id)
    .eq('workspace_id', workspaceId)

  if (error) throw new Error(`Erro ao desativar categoria: ${error.message}`)

  // Invalidar cache automaticamente
  mutate((key: any) => 
    Array.isArray(key) && 
    key[0] === 'dados-auxiliares' && 
    key[1] === workspaceId
  )
}

/**
 * Verificar se categoria possui transações vinculadas
 */
async function verificarTransacoesVinculadas(categoriaId: string, workspaceId: string): Promise<boolean> {
  let query = supabase
    .from('fp_transacoes')
    .select('id')
    .eq('categoria_id', categoriaId)
    .limit(1)
  
  query = query.eq('workspace_id', workspaceId)
  
  const { data, error } = await query

  if (error) throw new Error(`Erro ao verificar transações: ${error.message}`)
  return (data && data.length > 0) || false
}

/**
 * Verificar se categoria possui subcategorias vinculadas
 */
async function verificarSubcategoriasVinculadas(categoriaId: string, workspaceId: string): Promise<boolean> {
  let query = supabase
    .from('fp_subcategorias')
    .select('id')
    .eq('categoria_id', categoriaId)
    .limit(1)
  
  query = query.eq('workspace_id', workspaceId)
  
  const { data, error } = await query

  if (error) throw new Error(`Erro ao verificar subcategorias: ${error.message}`)
  return (data && data.length > 0) || false
}

/**
 * Excluir categoria (hard delete)
 * Verifica integridade antes da exclusão
 */
export async function excluirCategoria(id: string, workspaceId: string): Promise<void> {
  // Verificar se tem transações vinculadas
  const temTransacoes = await verificarTransacoesVinculadas(id, workspaceId)
  if (temTransacoes) {
    throw new Error('Não é possível excluir categoria com transações vinculadas')
  }

  // Verificar se tem subcategorias vinculadas
  const temSubcategorias = await verificarSubcategoriasVinculadas(id, workspaceId)
  if (temSubcategorias) {
    throw new Error('Não é possível excluir categoria com subcategorias vinculadas')
  }

  // Executar exclusão
  const { error } = await supabase
    .from('fp_categorias')
    .delete()
    .eq('id', id)
    .eq('workspace_id', workspaceId)

  if (error) throw new Error(`Erro ao excluir categoria: ${error.message}`)

  // Invalidar cache automaticamente
  mutate((key: any) => 
    Array.isArray(key) && 
    key[0] === 'dados-auxiliares' && 
    key[1] === workspaceId
  )
}