/**
 * Classificador Inteligente para Conta Simples
 * Match automático de Categoria e Centro de Custo
 */

import { getSupabaseClient } from '@/servicos/supabase/cliente'

/**
 * Buscar categoria por nome aproximado
 */
export async function buscarCategoriaPorNome(
  nomeBanco: string,
  workspaceId: string
): Promise<string | null> {
  const supabase = getSupabaseClient()

  // Normalizar nome (remover acentos, lowercase)
  const nomeNormalizado = nomeBanco
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')

  // Buscar categoria similar
  const { data } = await supabase
    .from('fp_categorias')
    .select('id, nome')
    .eq('workspace_id', workspaceId)
    .eq('ativo', true)

  if (!data) return null

  // Match exato ou parcial
  const match = data.find(cat => {
    const catNormalizada = cat.nome
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')

    return (
      catNormalizada === nomeNormalizado ||
      catNormalizada.includes(nomeNormalizado) ||
      nomeNormalizado.includes(catNormalizada)
    )
  })

  return match?.id || null
}

/**
 * Buscar centro de custo por nome na descrição
 */
export async function buscarCentroCustoPorDescricao(
  descricao: string,
  workspaceId: string
): Promise<string | null> {
  const supabase = getSupabaseClient()

  // Buscar todos os centros de custo ativos
  const { data } = await supabase
    .from('fp_centros_custo')
    .select('id, nome')
    .eq('workspace_id', workspaceId)
    .eq('ativo', true)
    .eq('arquivado', false)

  if (!data) return null

  // Normalizar descrição
  const descNormalizada = descricao
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')

  // Buscar match por nome (ordenar por tamanho DESC para pegar o mais específico)
  const matches = data
    .filter(cc => {
      const nomeNormalizado = cc.nome
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')

      return descNormalizada.includes(nomeNormalizado)
    })
    .sort((a, b) => b.nome.length - a.nome.length) // Mais específico primeiro

  return matches[0]?.id || null
}

/**
 * Classificar transação do Conta Simples automaticamente
 */
export async function classificarTransacaoContaSimples(
  transacao: {
    descricao: string
    categoriaBanco?: string // Campo "Categoria" do CSV
    historico?: string // Campo "Histórico" do CSV
  },
  workspaceId: string
): Promise<{
  categoria_id: string | null
  centro_custo_id: string | null
  confianca: number // 0-100
}> {
  let categoria_id: string | null = null
  let centro_custo_id: string | null = null
  let confianca = 0

  // 1. Tentar match de categoria pelo campo do banco
  if (transacao.categoriaBanco) {
    categoria_id = await buscarCategoriaPorNome(
      transacao.categoriaBanco,
      workspaceId
    )
    if (categoria_id) confianca += 50
  }

  // 2. Tentar match de centro de custo pela descrição
  const textoCompleto = [
    transacao.descricao,
    transacao.historico
  ].filter(Boolean).join(' ')

  centro_custo_id = await buscarCentroCustoPorDescricao(
    textoCompleto,
    workspaceId
  )
  if (centro_custo_id) confianca += 50

  return {
    categoria_id,
    centro_custo_id,
    confianca: Math.min(confianca, 100)
  }
}
