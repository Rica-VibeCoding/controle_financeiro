import { supabase } from '@/servicos/supabase/cliente'

export interface DadosClassificacao {
  categoria_id: string
  subcategoria_id: string
  forma_pagamento_id: string
}

/**
 * Busca classificação no histórico por descrição exata + conta
 * Otimizada para performance e precisão contextual
 */
export async function buscarClassificacaoHistorica(
  descricao: string,
  conta_id: string
): Promise<DadosClassificacao | null> {
  try {
    const { data, error } = await supabase
      .from('fp_transacoes')
      .select('categoria_id, subcategoria_id, forma_pagamento_id')
      .eq('descricao', descricao)
      .eq('conta_id', conta_id)
      .not('categoria_id', 'is', null)
      .not('forma_pagamento_id', 'is', null)
      // subcategoria_id pode ser null - não filtrar
      .order('created_at', { ascending: false })
      .limit(1)
      // Remover .single() para evitar erro 406 quando não há dados
      
    // Verificar se há dados retornados
    if (error || !data || data.length === 0) {
      console.log('🔍 Classificação histórica não encontrada para:', descricao.substring(0, 30))
      return null
    }

    const primeiroRegistro = data[0]

    return {
      categoria_id: primeiroRegistro.categoria_id,
      subcategoria_id: primeiroRegistro.subcategoria_id,
      forma_pagamento_id: primeiroRegistro.forma_pagamento_id
    }
  } catch (error) {
    console.error('❌ Erro ao buscar classificação histórica:', {
      error,
      descricao: descricao.substring(0, 30),
      conta_id
    })
    return null // Fallback silencioso - não bloqueia importação
  }
}

/**
 * Versão batch para múltiplas transações (performance)
 * Evita loop sequencial que pode travar interface
 */
export async function buscarClassificacoesEmLote(
  transacoes: Array<{ descricao: string; conta_id: string }>
): Promise<Map<string, DadosClassificacao>> {
  // TODO: Implementar query otimizada com IN() para processar múltiplas de uma vez
  // Por enquanto, mantém individual mas com Promise.all para paralelismo

  const resultados = new Map<string, DadosClassificacao>()

  const promessas = transacoes.map(async (transacao) => {
    const chave = `${transacao.descricao}|${transacao.conta_id}`
    const classificacao = await buscarClassificacaoHistorica(
      transacao.descricao,
      transacao.conta_id
    )
    if (classificacao) {
      resultados.set(chave, classificacao)
    }
  })

  await Promise.all(promessas)
  return resultados
}