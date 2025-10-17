import { criarTransacao } from '@/servicos/supabase/transacoes'
import type { NovaTransacao } from '@/tipos/database'
import { TransacaoImportada, TransacaoClassificada, ResultadoImportacao } from '@/tipos/importacao'
import { FormatoCSV } from './detector-formato'

export async function importarTransacoes(
  transacoes: TransacaoImportada[] | TransacaoClassificada[],
  workspaceId: string,
  formatoOrigem?: FormatoCSV
): Promise<ResultadoImportacao> {
  if (!transacoes || transacoes.length === 0) {
    throw new Error('Nenhuma transação fornecida para importação')
  }

  const resultado: ResultadoImportacao = {
    total: transacoes.length,
    importadas: 0,
    duplicadas: 0,
    erros: []
  }
  
  for (let i = 0; i < transacoes.length; i++) {
    const transacao = transacoes[i]
    
    try {
      // Validação básica
      if (!transacao.conta_id) {
        throw new Error('Conta é obrigatória')
      }
      if (!transacao.descricao || transacao.descricao.trim() === '') {
        throw new Error('Descrição é obrigatória')
      }
      if (!transacao.valor || transacao.valor <= 0) {
        throw new Error('Valor deve ser maior que zero')
      }

      // Verificar se é TransacaoClassificada (tem classificação)
      const transacaoClassificada = transacao as TransacaoClassificada
      const temClassificacao = transacaoClassificada.categoria_id || 
                              transacaoClassificada.classificacao_automatica

      // FASE 2: Status vem da FASE 1 (baseado no tipo da conta)
      // Usar status da transação ou fallback para 'realizado'
      const statusAutomatico: 'previsto' | 'realizado' =
        transacao.status || 'realizado'

      const dadosParaSalvar: NovaTransacao = {
        data: transacao.data,
        descricao: transacao.descricao.trim(),
        valor: transacao.valor,
        tipo: transacao.tipo,
        conta_id: transacao.conta_id,
        identificador_externo: transacao.identificador_externo,
        workspace_id: workspaceId,
        status: statusAutomatico,
        // Incluir dados de classificação se disponível
        categoria_id: transacaoClassificada.categoria_id ||
                     transacaoClassificada.classificacao_automatica?.categoria_id || null,
        subcategoria_id: transacaoClassificada.subcategoria_id ||
                        transacaoClassificada.classificacao_automatica?.subcategoria_id || null,
        forma_pagamento_id: transacaoClassificada.forma_pagamento_id ||
                           transacaoClassificada.classificacao_automatica?.forma_pagamento_id || null,
        centro_custo_id: transacaoClassificada.centro_custo_id ||
                        transacaoClassificada.classificacao_automatica?.centro_custo_id || null,
        contato_id: transacaoClassificada.contato_id ||
                   transacaoClassificada.classificacao_automatica?.contato_id || null // NOVO: Cliente vinculado
      }

      await criarTransacao(dadosParaSalvar, workspaceId)
      resultado.importadas++
    } catch (error) {
      const mensagem = error instanceof Error ? error.message : String(error)
      resultado.erros.push(`Linha ${i + 1} (${transacao.descricao?.substring(0, 30) || 'sem descrição'}...): ${mensagem}`)
    }
  }
  
  return resultado
}