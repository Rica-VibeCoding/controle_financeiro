import { 
  TipoConta, 
  StatusTransacao, 
  ConfiguracaoStatusConta,
  ContaComStatusPadrao 
} from '@/tipos/importacao'

/**
 * FASE 1 - Detector de Status Baseado no Tipo da Conta
 * 
 * Lógica simples e escalável:
 * - Cartão de Crédito = "previsto" (fatura ainda não paga)
 * - Outros tipos = "realizado" (dinheiro já saiu/entrou)
 */

// Configurações de status por tipo de conta
export const CONFIGURACOES_STATUS_CONTA: ConfiguracaoStatusConta[] = [
  {
    tipoConta: 'cartao_credito',
    statusPadrao: 'previsto',
    descricao: 'Cartão de Crédito - Fatura a pagar'
  },
  {
    tipoConta: 'cartao_debito', 
    statusPadrao: 'realizado',
    descricao: 'Cartão de Débito - Débito imediato'
  },
  {
    tipoConta: 'conta_corrente',
    statusPadrao: 'realizado', 
    descricao: 'Conta Corrente - Movimentação realizada'
  },
  {
    tipoConta: 'conta_poupanca',
    statusPadrao: 'realizado',
    descricao: 'Conta Poupança - Movimentação realizada'
  },
  {
    tipoConta: 'dinheiro',
    statusPadrao: 'realizado',
    descricao: 'Dinheiro - Gasto realizado'
  },
  {
    tipoConta: 'investimento',
    statusPadrao: 'realizado',
    descricao: 'Investimento - Movimentação realizada'
  }
]

/**
 * Detecta o status padrão baseado no tipo da conta
 */
export function detectarStatusPadrao(tipoConta: TipoConta): StatusTransacao {
  const config = CONFIGURACOES_STATUS_CONTA.find(c => c.tipoConta === tipoConta)
  return config?.statusPadrao || 'realizado' // Fallback seguro
}

/**
 * Obtém a descrição do status para uma conta
 */
export function obterDescricaoStatus(tipoConta: TipoConta): string {
  const config = CONFIGURACOES_STATUS_CONTA.find(c => c.tipoConta === tipoConta)
  return config?.descricao || 'Transação realizada'
}

/**
 * Enriquece dados da conta com informações de status padrão
 */
export function enriquecerContaComStatus(conta: {
  id: string
  nome: string
  tipo: string
  banco?: string | null
}): ContaComStatusPadrao {
  const tipoConta = conta.tipo as TipoConta
  const statusPadrao = detectarStatusPadrao(tipoConta)
  const descricaoStatus = obterDescricaoStatus(tipoConta)
  
  return {
    id: conta.id,
    nome: conta.nome,
    tipo: tipoConta,
    statusPadrao,
    descricaoStatus
  }
}

/**
 * Gera ícone visual para o status
 */
export function obterIconeStatus(status: StatusTransacao): string {
  switch (status) {
    case 'previsto':
      return '⏳' // Ampulheta - ainda vai acontecer
    case 'realizado':
      return '✅' // Check - já aconteceu
    default:
      return '❓' // Fallback
  }
}

/**
 * Gera cor CSS para o status
 */
export function obterCorStatus(status: StatusTransacao): string {
  switch (status) {
    case 'previsto':
      return 'text-orange-600' // Laranja - pendente
    case 'realizado':
      return 'text-green-600' // Verde - concluído
    default:
      return 'text-gray-600' // Fallback
  }
}