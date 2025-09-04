import { supabase } from './cliente'
import type { CentroCusto } from '@/tipos/database'
import { mutate } from 'swr'

// Tipos auxiliares baseados na documentação
type NovoCentroCusto = Omit<CentroCusto, 'id' | 'created_at' | 'workspace_id'>

/**
 * Buscar todos os centros de custo ativos
 */
export async function obterCentrosCusto(incluirInativas = false, workspaceId: string): Promise<CentroCusto[]> {
  let query = supabase
    .from('fp_centros_custo')
    .select('*')
    .order('nome')

  if (!incluirInativas) {
    query = query.eq('ativo', true)
  }
  
  query = query.eq('workspace_id', workspaceId)

  const { data, error } = await query

  if (error) throw new Error(`Erro ao buscar centros de custo: ${error.message}`)
  return data || []
}

/**
 * Criar novo centro de custo
 */
export async function criarCentroCusto(centroCusto: NovoCentroCusto, workspaceId: string): Promise<CentroCusto> {
  const { data, error } = await supabase
    .from('fp_centros_custo')
    .insert([{ ...centroCusto, workspace_id: workspaceId }])
    .select()
    .single()

  if (error) throw new Error(`Erro ao criar centro de custo: ${error.message}`)

  // Invalidar cache automaticamente
  mutate((key: any) => 
    Array.isArray(key) && 
    key[0] === 'dados-auxiliares' && 
    key[1] === workspaceId
  )

  return data
}

/**
 * Atualizar centro de custo
 */
export async function atualizarCentroCusto(
  id: string, 
  atualizacoes: Partial<NovoCentroCusto>,
  workspaceId: string
): Promise<void> {
  const { error } = await supabase
    .from('fp_centros_custo')
    .update(atualizacoes)
    .eq('id', id)
    .eq('workspace_id', workspaceId)

  if (error) throw new Error(`Erro ao atualizar centro de custo: ${error.message}`)

  // Invalidar cache automaticamente
  mutate((key: any) => 
    Array.isArray(key) && 
    key[0] === 'dados-auxiliares' && 
    key[1] === workspaceId
  )
}

/**
 * Buscar centro de custo por ID
 */
export async function obterCentroCustoPorId(id: string, workspaceId: string): Promise<CentroCusto | null> {
  let query = supabase
    .from('fp_centros_custo')
    .select('*')
    .eq('id', id)
  
  query = query.eq('workspace_id', workspaceId)
  
  const { data, error } = await query.single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw new Error(`Erro ao buscar centro de custo: ${error.message}`)
  }
  return data
}

/**
 * Excluir centro de custo (hard delete)
 */
export async function excluirCentroCusto(id: string, workspaceId: string): Promise<void> {
  const { error } = await supabase
    .from('fp_centros_custo')
    .delete()
    .eq('id', id)
    .eq('workspace_id', workspaceId)

  if (error) throw new Error(`Erro ao excluir centro de custo: ${error.message}`)

  // Invalidar cache automaticamente
  mutate((key: any) => 
    Array.isArray(key) && 
    key[0] === 'dados-auxiliares' && 
    key[1] === workspaceId
  )
}