import { criarTransacao } from '@/servicos/supabase/transacoes'
import { TransacaoImportada, ResultadoImportacao } from '@/tipos/importacao'

export async function importarTransacoes(
  transacoes: TransacaoImportada[]
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

      const dadosParaSalvar = {
        data: transacao.data,
        descricao: transacao.descricao.trim(),
        valor: transacao.valor,
        tipo: transacao.tipo,
        conta_id: transacao.conta_id,
        identificador_externo: transacao.identificador_externo,
        status: 'realizado'
      }
      
      console.log('🔍 DEBUG - Dados enviados para criarTransacao:', dadosParaSalvar)
      
      await criarTransacao(dadosParaSalvar)
      resultado.importadas++
    } catch (error) {
      const mensagem = error instanceof Error ? error.message : String(error)
      resultado.erros.push(`Linha ${i + 1} (${transacao.descricao?.substring(0, 30) || 'sem descrição'}...): ${mensagem}`)
    }
  }
  
  return resultado
}