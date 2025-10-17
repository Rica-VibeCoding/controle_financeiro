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
 * Buscar cliente por nome (coluna "Centro de Custo" do CSV Conta Simples)
 * NOVA FUNÇÃO - Mapeia Centro de Custo → Cliente
 */
export async function buscarClientePorNome(
  nomeCentroCusto: string,
  workspaceId: string
): Promise<string | null> {
  const supabase = getSupabaseClient()

  // Buscar todos os clientes ativos
  const { data } = await supabase
    .from('r_contatos')
    .select('id, nome')
    .eq('workspace_id', workspaceId)
    .eq('tipo_pessoa', 'cliente')
    .eq('ativo', true)

  if (!data) return null

  // Normalizar nome do centro de custo
  const nomeNormalizado = nomeCentroCusto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')

  // Buscar match por nome (ordenar por tamanho DESC para pegar o mais específico)
  const matches = data
    .filter(cliente => {
      const nomeClienteNormalizado = cliente.nome
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')

      return (
        nomeClienteNormalizado.includes(nomeNormalizado) ||
        nomeNormalizado.includes(nomeClienteNormalizado)
      )
    })
    .sort((a, b) => b.nome.length - a.nome.length) // Mais específico primeiro

  return matches[0]?.id || null
}

/**
 * Classificar transação do Conta Simples automaticamente
 * ATUALIZADO: Agora mapeia "Centro de Custo" do CSV para Cliente
 */
export async function classificarTransacaoContaSimples(
  transacao: {
    descricao: string
    categoriaBanco?: string // Campo "Categoria" do CSV
    historico?: string // Campo "Histórico" do CSV
    centroCustoBanco?: string // Campo "Centro de Custo" do CSV
  },
  workspaceId: string
): Promise<{
  categoria_id: string | null
  centro_custo_id: string | null
  contato_id: string | null // NOVO: Cliente vinculado
  confianca: number // 0-100
}> {
  let categoria_id: string | null = null
  let centro_custo_id: string | null = null
  let contato_id: string | null = null // NOVO
  let confianca = 0

  // 1. Tentar match de categoria pelo campo do banco
  if (transacao.categoriaBanco) {
    categoria_id = await buscarCategoriaPorNome(
      transacao.categoriaBanco,
      workspaceId
    )
    if (categoria_id) confianca += 30
  }

  // 2. NOVO: Tentar match de cliente pelo campo "Centro de Custo" do CSV
  if (transacao.centroCustoBanco) {
    contato_id = await buscarClientePorNome(
      transacao.centroCustoBanco,
      workspaceId
    )
    if (contato_id) confianca += 40
  }

  // 3. Tentar match de centro de custo pela descrição (mantido para retrocompatibilidade)
  const textoCompleto = [
    transacao.descricao,
    transacao.historico
  ].filter(Boolean).join(' ')

  centro_custo_id = await buscarCentroCustoPorDescricao(
    textoCompleto,
    workspaceId
  )
  if (centro_custo_id) confianca += 30

  return {
    categoria_id,
    centro_custo_id,
    contato_id, // NOVO
    confianca: Math.min(confianca, 100)
  }
}
