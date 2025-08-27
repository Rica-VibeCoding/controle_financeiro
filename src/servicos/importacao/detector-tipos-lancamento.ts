import { SinalizacaoLancamento, TransacaoImportada } from '@/tipos/importacao'

/**
 * Detecta o tipo de lançamento baseado na descrição e valor
 * para sinalizar ao usuário o que cada transação representa
 */
export function detectarTipoLancamento(
  transacao: TransacaoImportada
): SinalizacaoLancamento {
  const descricao = transacao.descricao.toLowerCase()
  const valor = transacao.valor
  const tipoOriginal = transacao.tipo
  
  // 💰 PAGAMENTOS E CRÉDITOS (valores que diminuem a fatura)
  if (tipoOriginal === 'receita' || valor < 0) {
    if (descricao.includes('pagamento')) {
      return {
        tipo: 'pagamento_credito',
        icone: '💰',
        descricao: 'Pagamento/Crédito',
        tooltip: 'Pagamento da fatura ou crédito recebido. Geralmente já existe na conta corrente.'
      }
    }
    
    if (descricao.includes('crédito') || descricao.includes('estorno')) {
      return {
        tipo: 'pagamento_credito',
        icone: '💰',
        descricao: 'Crédito/Estorno',
        tooltip: 'Valor creditado na fatura por estorno ou ajuste.'
      }
    }
    
    if (descricao.includes('encerramento')) {
      return {
        tipo: 'pagamento_credito',
        icone: '💰',
        descricao: 'Liquidação',
        tooltip: 'Liquidação de dívida ou encerramento de pendência.'
      }
    }
  }
  
  // ⚖️ AJUSTES CONTÁBEIS (lançamentos internos do banco)
  if (descricao.includes('saldo em atraso') || 
      descricao.includes('crédito de atraso') ||
      descricao.includes('ajuste')) {
    return {
      tipo: 'ajuste_contabil',
      icone: '⚖️',
      descricao: 'Ajuste Contábil',
      tooltip: 'Lançamento interno do banco para controle de atrasos. Não é gasto novo, é reconhecimento contábil.'
    }
  }
  
  // 📊 TAXAS E JUROS (custos financeiros)
  if (descricao.includes('juro') || 
      descricao.includes('iof') || 
      descricao.includes('multa') || 
      descricao.includes('tarifa') ||
      descricao.includes('taxa')) {
    return {
      tipo: 'taxa_juro',
      icone: '📊',
      descricao: 'Taxa/Juro',
      tooltip: 'Custos financeiros do cartão: juros, IOF, multas. São gastos reais a serem controlados.'
    }
  }
  
  // 💳 GASTOS REAIS (compras e serviços)
  return {
    tipo: 'gasto_real',
    icone: '💳',
    descricao: 'Gasto Real',
    tooltip: 'Compra ou serviço utilizado. Deve ser importado para controle financeiro.'
  }
}