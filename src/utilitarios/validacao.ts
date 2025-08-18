/**
 * Utilitários de validação - Sistema de Controle Financeiro
 * Baseado na documentação e schema do projeto
 */

import type { NovaTransacao } from '@/tipos/database'

/**
 * Validar se valor está dentro dos limites do banco (DECIMAL 10,2)
 */
export function validarValor(valor: number): boolean {
  return valor > 0 && valor <= 99999999.99 // R$ 99.999.999,99 (DECIMAL 10,2)
}

/**
 * Validar formato de data ISO (YYYY-MM-DD)
 */
export function validarDataISO(data: string): boolean {
  const regex = /^\d{4}-\d{2}-\d{2}$/
  if (!regex.test(data)) return false
  
  const date = new Date(data)
  return date instanceof Date && !isNaN(date.getTime())
}

/**
 * Validar se descrição atende critérios mínimos
 */
export function validarDescricao(descricao: string): boolean {
  return descricao.trim().length >= 3
}

/**
 * Validar período de meta
 */
export function validarPeriodoMeta(inicio: string, fim: string): boolean {
  if (!validarDataISO(inicio) || !validarDataISO(fim)) return false
  return new Date(inicio) < new Date(fim)
}

/**
 * Limpar campos UUID vazios - PRINCIPAL CORREÇÃO PARA O ERRO
 * Converte strings vazias em null para campos opcionais UUID
 */
export function limparCamposUUID<T extends Record<string, any>>(objeto: T): T {
  const camposUUID = [
    'categoria_id',
    'subcategoria_id', 
    'forma_pagamento_id',
    'centro_custo_id',
    'conta_destino_id'
  ]

  const objetoLimpo: any = { ...objeto }

  camposUUID.forEach(campo => {
    if (objetoLimpo[campo] === '' || objetoLimpo[campo] === undefined) {
      objetoLimpo[campo] = null
    }
  })

  return objetoLimpo as T
}

/**
 * Validar transação completa - conforme documentação
 */
export function validarTransacao(transacao: any): string[] {
  const erros: string[] = []

  // Campos obrigatórios - conforme schema
  if (!validarDescricao(transacao.descricao)) {
    erros.push('Descrição deve ter pelo menos 3 caracteres')
  }

  if (!validarValor(transacao.valor)) {
    erros.push('Valor deve ser positivo e até R$ 99.999.999,99')
  }

  if (!validarDataISO(transacao.data)) {
    erros.push('Data deve estar no formato válido')
  }

  if (!transacao.conta_id) {
    erros.push('Conta é obrigatória')
  }

  // Regras específicas para transferências
  if (transacao.tipo === 'transferencia') {
    if (!transacao.conta_destino_id) {
      erros.push('Conta destino é obrigatória para transferências')
    }
    
    if (transacao.conta_id === transacao.conta_destino_id) {
      erros.push('Conta origem e destino devem ser diferentes')
    }
  }

  // Regras específicas para transações recorrentes
  if (transacao.recorrente === true) {
    if (!transacao.frequencia_recorrencia) {
      erros.push('Frequência é obrigatória para transações recorrentes')
    }
    
    if (!transacao.proxima_recorrencia) {
      erros.push('Próxima recorrência é obrigatória para transações recorrentes')
    }
    
    if (transacao.frequencia_recorrencia && !['diario', 'semanal', 'mensal', 'anual'].includes(transacao.frequencia_recorrencia)) {
      erros.push('Frequência deve ser: diario, semanal, mensal ou anual')
    }
  }

  return erros
}

/**
 * Preparar transação para inserção no banco
 * Remove campos vazios e aplica validações
 */
export function prepararTransacaoParaInsercao(transacao: Partial<NovaTransacao>): NovaTransacao {
  // Limpar campos UUID vazios
  const transacaoLimpa = limparCamposUUID(transacao)

  // Garantir campos obrigatórios com valores padrão conforme schema
  const transacaoCompleta: NovaTransacao = {
    data: transacaoLimpa.data || new Date().toISOString().split('T')[0],
    descricao: transacaoLimpa.descricao || '',
    valor: transacaoLimpa.valor || 0,
    tipo: transacaoLimpa.tipo || 'despesa',
    conta_id: transacaoLimpa.conta_id || '',
    status: transacaoLimpa.status || 'previsto',
    parcela_atual: transacaoLimpa.parcela_atual || 1,
    total_parcelas: transacaoLimpa.total_parcelas || 1,
    recorrente: transacaoLimpa.recorrente || false,
    // Campos opcionais - já limpos pela função limparCamposUUID
    categoria_id: transacaoLimpa.categoria_id,
    subcategoria_id: transacaoLimpa.subcategoria_id,
    forma_pagamento_id: transacaoLimpa.forma_pagamento_id,
    centro_custo_id: transacaoLimpa.centro_custo_id,
    conta_destino_id: transacaoLimpa.conta_destino_id,
    data_vencimento: transacaoLimpa.data_vencimento,
    anexo_url: transacaoLimpa.anexo_url,
    observacoes: transacaoLimpa.observacoes,
    frequencia_recorrencia: transacaoLimpa.frequencia_recorrencia,
    proxima_recorrencia: transacaoLimpa.proxima_recorrencia
  }

  return transacaoCompleta
}

/**
 * Corrigir transação recorrente com dados inconsistentes
 * Garante que transações recorrentes tenham frequência e próxima data
 */
export function corrigirTransacaoRecorrente(transacao: any): any {
  // Se não é recorrente, não precisa corrigir
  if (!transacao.recorrente) {
    return transacao
  }

  const transacaoCorrigida = { ...transacao }

  // Corrigir frequência ausente
  if (!transacaoCorrigida.frequencia_recorrencia) {
    transacaoCorrigida.frequencia_recorrencia = 'mensal' // Padrão
    console.warn(`Corrigida frequência da transação recorrente: ${transacao.descricao}`)
  }

  // Corrigir próxima recorrência ausente
  if (!transacaoCorrigida.proxima_recorrencia && transacaoCorrigida.data) {
    const proximaData = calcularProximaDataRecorrencia(
      transacaoCorrigida.data,
      transacaoCorrigida.frequencia_recorrencia
    )
    transacaoCorrigida.proxima_recorrencia = proximaData
    console.warn(`Corrigida próxima recorrência da transação: ${transacao.descricao}`)
  }

  return transacaoCorrigida
}

/**
 * Calcular próxima data de recorrência
 */
function calcularProximaDataRecorrencia(
  dataAtual: string,
  frequencia: 'diario' | 'semanal' | 'mensal' | 'anual'
): string {
  const data = new Date(dataAtual)

  switch (frequencia) {
    case 'diario':
      data.setDate(data.getDate() + 1)
      break
    case 'semanal':
      data.setDate(data.getDate() + 7)
      break
    case 'mensal':
      data.setMonth(data.getMonth() + 1)
      break
    case 'anual':
      data.setFullYear(data.getFullYear() + 1)
      break
  }

  return data.toISOString().split('T')[0]
}