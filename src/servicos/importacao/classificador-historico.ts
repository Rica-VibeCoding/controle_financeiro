import { supabase } from '@/servicos/supabase/cliente'
import { DadosClassificacao } from '@/tipos/importacao'

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
      .select('categoria_id, subcategoria_id, forma_pagamento_id, centro_custo_id')
      .eq('descricao', descricao)
      .eq('conta_id', conta_id)
      .not('categoria_id', 'is', null)
      .not('forma_pagamento_id', 'is', null)
      // subcategoria_id e centro_custo_id podem ser null - não filtrar
      .order('created_at', { ascending: false })
      .limit(1)
      // Remover .single() para evitar erro 406 quando não há dados

    // Verificar se há dados retornados
    if (error || !data || data.length === 0) {
      return null
    }

    const primeiroRegistro = data[0]

    return {
      categoria_id: primeiroRegistro.categoria_id,
      subcategoria_id: primeiroRegistro.subcategoria_id,
      forma_pagamento_id: primeiroRegistro.forma_pagamento_id,
      centro_custo_id: primeiroRegistro.centro_custo_id ?? null
    }
  } catch (error) {
    // Fallback silencioso - não bloqueia importação
    return null
  }
}

/**
 * Versão batch para múltiplas transações (performance otimizada)
 * Usa query única com IN() para processar todas de uma vez
 */
export async function buscarClassificacoesEmLote(
  transacoes: Array<{ descricao: string; conta_id: string }>
): Promise<Map<string, DadosClassificacao>> {
  if (transacoes.length === 0) {
    return new Map()
  }

  const resultados = new Map<string, DadosClassificacao>()

  // Extrair descrições únicas
  const descricoesUnicas = [...new Set(transacoes.map(t => t.descricao))]

  try {
    // Query otimizada: busca TODAS as descrições de uma vez
    const { data, error } = await supabase
      .from('fp_transacoes')
      .select('descricao, conta_id, categoria_id, subcategoria_id, forma_pagamento_id, centro_custo_id')
      .in('descricao', descricoesUnicas)
      .not('categoria_id', 'is', null)
      .not('forma_pagamento_id', 'is', null)
      .order('created_at', { ascending: false })

    if (error || !data || data.length === 0) {
      return resultados
    }

    // Agrupar por descrição + conta_id (pegar apenas a mais recente de cada grupo)
    const agrupado = new Map<string, DadosClassificacao>()

    data.forEach(registro => {
      const chave = `${registro.descricao}|${registro.conta_id}`

      // Só adiciona se ainda não existe (primeira = mais recente por causa do ORDER BY)
      if (!agrupado.has(chave)) {
        agrupado.set(chave, {
          categoria_id: registro.categoria_id,
          subcategoria_id: registro.subcategoria_id,
          forma_pagamento_id: registro.forma_pagamento_id,
          centro_custo_id: registro.centro_custo_id ?? null
        })
      }
    })

    // Mapear apenas as transações que existem no histórico
    transacoes.forEach(transacao => {
      const chave = `${transacao.descricao}|${transacao.conta_id}`
      const classificacao = agrupado.get(chave)

      if (classificacao) {
        resultados.set(chave, classificacao)
      }
    })

    return resultados
  } catch (error) {
    // Fallback silencioso - não bloqueia importação
    console.warn('Erro ao buscar classificações em lote:', error)
    return resultados
  }
}