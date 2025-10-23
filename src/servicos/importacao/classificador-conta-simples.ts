/**
 * Classificador Inteligente para Conta Simples
 * Match automático de Categoria e Centro de Custo
 */

import { getSupabaseClient } from '@/servicos/supabase/cliente'
import { logger } from '@/utilitarios/logger'

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

  logger.info('🔍 [BUSCA CLIENTE] Iniciando busca', {
    nomeCentroCusto,
    nomeCentroCustoLength: nomeCentroCusto.length,
    nomeCentroCustoChars: Array.from(nomeCentroCusto).map(c => c.charCodeAt(0)),
    workspaceId
  })

  // Buscar todos os clientes ativos
  const { data, error } = await supabase
    .from('r_contatos')
    .select('id, nome')
    .eq('workspace_id', workspaceId)
    .eq('tipo_pessoa', 'cliente')
    .eq('ativo', true)

  if (error) {
    logger.error('❌ [BUSCA CLIENTE] Erro no Supabase', error)
    return null
  }

  if (!data) {
    logger.warn('⚠️ [BUSCA CLIENTE] Nenhum cliente encontrado no workspace')
    return null
  }

  logger.info(`📋 [BUSCA CLIENTE] ${data.length} clientes no workspace`, {
    clientes: data.map(c => c.nome)
  })

  // Normalizar nome do centro de custo
  const nomeNormalizado = nomeCentroCusto
    .trim() // Remover espaços extras
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')

  logger.info('🔤 [BUSCA CLIENTE] Nome normalizado', {
    original: nomeCentroCusto,
    normalizado: nomeNormalizado
  })

  // Buscar match por nome (ordenar por tamanho DESC para pegar o mais específico)
  const matches = data
    .filter(cliente => {
      const nomeClienteNormalizado = cliente.nome
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')

      const matchIncludes = nomeClienteNormalizado.includes(nomeNormalizado)
      const matchReverso = nomeNormalizado.includes(nomeClienteNormalizado)

      logger.info('🔎 [BUSCA CLIENTE] Testando match', {
        cliente: cliente.nome,
        clienteNormalizado: nomeClienteNormalizado,
        centroCustoNormalizado: nomeNormalizado,
        matchIncludes,
        matchReverso,
        resultado: matchIncludes || matchReverso
      })

      return matchIncludes || matchReverso
    })
    .sort((a, b) => b.nome.length - a.nome.length) // Mais específico primeiro

  if (matches.length > 0) {
    logger.info('✅ [BUSCA CLIENTE] Match encontrado', {
      total: matches.length,
      selecionado: matches[0].nome,
      id: matches[0].id
    })
    return matches[0].id
  } else {
    logger.warn('⚠️ [BUSCA CLIENTE] Nenhum match encontrado', {
      centroCusto: nomeCentroCusto,
      normalizado: nomeNormalizado,
      clientesDisponiveis: data.map(c => c.nome)
    })
    return null
  }
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
  logger.info('🏦 [CLASSIFICADOR CONTA SIMPLES] Iniciando classificação', {
    descricao: transacao.descricao,
    categoriaBanco: transacao.categoriaBanco,
    historico: transacao.historico,
    centroCustoBanco: transacao.centroCustoBanco,
    centroCustoBancoLength: transacao.centroCustoBanco?.length,
    workspaceId
  })

  let categoria_id: string | null = null
  let centro_custo_id: string | null = null
  let contato_id: string | null = null // NOVO
  let confianca = 0

  // 1. Tentar match de categoria pelo campo do banco
  if (transacao.categoriaBanco) {
    logger.info('📂 [CLASSIFICADOR] Buscando categoria', { categoriaBanco: transacao.categoriaBanco })
    categoria_id = await buscarCategoriaPorNome(
      transacao.categoriaBanco,
      workspaceId
    )
    if (categoria_id) {
      logger.info('✅ [CLASSIFICADOR] Categoria encontrada', { categoria_id })
      confianca += 30
    } else {
      logger.warn('⚠️ [CLASSIFICADOR] Categoria não encontrada')
    }
  }

  // 2. NOVO: Tentar match de cliente pelo campo "Centro de Custo" do CSV
  if (transacao.centroCustoBanco) {
    logger.info('👤 [CLASSIFICADOR] Buscando cliente por Centro de Custo', {
      centroCustoBanco: transacao.centroCustoBanco,
      centroCustoBancoTrim: transacao.centroCustoBanco.trim(),
      centroCustoBancoLength: transacao.centroCustoBanco.length
    })
    contato_id = await buscarClientePorNome(
      transacao.centroCustoBanco,
      workspaceId
    )
    if (contato_id) {
      logger.info('✅ [CLASSIFICADOR] Cliente encontrado', { contato_id })
      confianca += 40
    } else {
      logger.warn('⚠️ [CLASSIFICADOR] Cliente não encontrado', {
        centroCustoBanco: transacao.centroCustoBanco
      })
    }
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

  const resultado = {
    categoria_id,
    centro_custo_id,
    contato_id, // NOVO
    confianca: Math.min(confianca, 100)
  }

  logger.info('🎯 [CLASSIFICADOR] Resultado final', resultado)

  return resultado
}
