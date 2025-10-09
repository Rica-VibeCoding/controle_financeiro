/**
 * Utilitários de validação - Sistema de Controle Financeiro
 * Baseado na documentação e schema do projeto
 */

import type { NovaTransacao, NovaCategoria } from '@/tipos/database'
import { normalizarData as normalizarDataHelper, validarDataISO as validarDataISOHelper } from '@/utilitarios/data-helpers'

type NovaConta = {
  nome: string
  tipo: string
  banco?: string | null
  limite?: number | null
  data_fechamento?: number | null
  ativo?: boolean
  workspace_id?: string
}

/**
 * Validar se valor está dentro dos limites do banco (DECIMAL 10,2)
 */
export function validarValor(valor: number): boolean {
  return valor > 0 && valor <= 99999999.99 // R$ 99.999.999,99 (DECIMAL 10,2)
}

/**
 * Validar formato de data ISO (YYYY-MM-DD ou YYYY-MM-DDTHH:mm:ss)
 * IMPORTANTE: Aceita formato com hora para compatibilidade com importação CSV
 */
export function validarDataISO(data: string): boolean {
  return validarDataISOHelper(data)
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
  
  // Campos de texto que podem ser vazios (não UUID)
  const camposTexto = [
    'identificador_externo'
  ]

  const objetoLimpo: any = { ...objeto }

  // Limpar campos UUID vazios
  camposUUID.forEach(campo => {
    if (objetoLimpo[campo] === '' || objetoLimpo[campo] === undefined) {
      objetoLimpo[campo] = null
    }
  })
  
  // Preservar campos de texto, mas limpar se vazios
  camposTexto.forEach(campo => {
    if (objetoLimpo[campo] === '' || objetoLimpo[campo] === undefined) {
      objetoLimpo[campo] = null
    }
  })

  return objetoLimpo as T
}

/**
 * Validar transação completa - conforme documentação
 */
/**
 * Normalizar data para formato ISO com timestamp completo (YYYY-MM-DDTHH:mm:ss)
 * Converte formato brasileiro (DD/MM/YYYY) se necessário
 * IMPORTANTE: PRESERVA hora/minuto/segundo (banco agora é TIMESTAMP WITH TIME ZONE)
 */
export function normalizarData(data: string | null | undefined): string | null | undefined {
  return normalizarDataHelper(data)
}

export function validarTransacao(transacao: any): string[] {
  const erros: string[] = []

  // Campos obrigatórios - conforme schema
  if (transacao.descricao && !validarDescricao(transacao.descricao)) {
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
    
    // Para transações recorrentes, data_vencimento será igual à proxima_recorrencia
    if (transacao.proxima_recorrencia && !transacao.data_vencimento) {
      // Auto-preencher data_vencimento com proxima_recorrencia se não informada
      transacao.data_vencimento = transacao.proxima_recorrencia
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
    data: normalizarData(transacaoLimpa.data) || new Date().toISOString().split('T')[0],
    descricao: transacaoLimpa.descricao || '',
    valor: transacaoLimpa.valor || 0,
    tipo: transacaoLimpa.tipo || 'despesa',
    conta_id: transacaoLimpa.conta_id || '',
    workspace_id: transacaoLimpa.workspace_id || '',
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
    data_vencimento: normalizarData(transacaoLimpa.data_vencimento),
    anexo_url: transacaoLimpa.anexo_url,
    observacoes: transacaoLimpa.observacoes,
    frequencia_recorrencia: transacaoLimpa.frequencia_recorrencia,
    proxima_recorrencia: transacaoLimpa.proxima_recorrencia,
    identificador_externo: transacaoLimpa.identificador_externo,
    contato_id: transacaoLimpa.contato_id
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

  // Corrigir próxima recorrência baseada na data de vencimento
  if (!transacaoCorrigida.proxima_recorrencia && transacaoCorrigida.data_vencimento) {
    const proximaData = calcularProximaDataRecorrencia(
      transacaoCorrigida.data_vencimento,
      transacaoCorrigida.frequencia_recorrencia
    )
    transacaoCorrigida.proxima_recorrencia = proximaData
    console.warn(`Corrigida próxima recorrência da transação: ${transacao.descricao}`)
  }

  // Se não tem data_vencimento mas tem data (transações antigas), usar data como fallback
  if (!transacaoCorrigida.data_vencimento && transacaoCorrigida.data) {
    transacaoCorrigida.data_vencimento = transacaoCorrigida.data
    console.warn(`Corrigida data de vencimento da transação: ${transacao.descricao}`)
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

/**
 * Validar categoria
 */
export function validarCategoria(categoria: Partial<NovaCategoria>): string[] {
  const erros: string[] = []

  // Nome obrigatório
  if (!categoria.nome || categoria.nome.trim().length === 0) {
    erros.push('Nome da categoria é obrigatório')
  } else if (categoria.nome.trim().length < 2) {
    erros.push('Nome da categoria deve ter pelo menos 2 caracteres')
  } else if (categoria.nome.trim().length > 100) {
    erros.push('Nome da categoria deve ter no máximo 100 caracteres')
  }

  // Tipo obrigatório
  if (!categoria.tipo) {
    erros.push('Tipo da categoria é obrigatório')
  } else if (!['receita', 'despesa', 'ambos'].includes(categoria.tipo)) {
    erros.push('Tipo da categoria deve ser receita, despesa ou ambos')
  }

  // Validar cor se fornecida
  if (categoria.cor) {
    const corRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/
    if (!corRegex.test(categoria.cor)) {
      erros.push('Cor deve estar no formato hexadecimal (ex: #FF0000)')
    }
  }

  // Validar ícone se fornecido
  if (categoria.icone && categoria.icone.trim().length === 0) {
    erros.push('Ícone não pode ser vazio')
  }

  // Workspace ID obrigatório
  if (!categoria.workspace_id) {
    erros.push('ID do workspace é obrigatório')
  }

  return erros
}

/**
 * Validar conta
 */
export function validarConta(conta: Partial<NovaConta>): string[] {
  const erros: string[] = []

  // Nome obrigatório
  if (!conta.nome || conta.nome.trim().length === 0) {
    erros.push('Nome da conta é obrigatório')
  } else if (conta.nome.trim().length < 2) {
    erros.push('Nome da conta deve ter pelo menos 2 caracteres')
  } else if (conta.nome.trim().length > 100) {
    erros.push('Nome da conta deve ter no máximo 100 caracteres')
  }

  // Tipo obrigatório
  if (!conta.tipo) {
    erros.push('Tipo da conta é obrigatório')
  } else {
    const tiposValidos = ['conta_corrente', 'conta_poupanca', 'cartao_credito', 'cartao_debito', 'dinheiro', 'investimento']
    if (!tiposValidos.includes(conta.tipo)) {
      erros.push('Tipo de conta inválido')
    }
  }

  // Validações específicas para cartão de crédito
  if (conta.tipo === 'cartao_credito') {
    // Validar limite se fornecido
    if (conta.limite !== null && conta.limite !== undefined) {
      if (conta.limite < 0) {
        erros.push('Limite do cartão não pode ser negativo')
      } else if (conta.limite > 999999999.99) {
        erros.push('Limite do cartão muito alto')
      }
    }

    // Validar data de fechamento se fornecida
    if (conta.data_fechamento !== null && conta.data_fechamento !== undefined) {
      if (conta.data_fechamento < 1 || conta.data_fechamento > 31) {
        erros.push('Data de fechamento deve estar entre 1 e 31')
      }
    }
  }

  // Validar banco se fornecido
  if (conta.banco && conta.banco.trim().length > 100) {
    erros.push('Nome do banco deve ter no máximo 100 caracteres')
  }

  // Workspace ID obrigatório
  if (!conta.workspace_id) {
    erros.push('ID do workspace é obrigatório')
  }

  return erros
}

/**
 * Validar subcategoria
 */
export function validarSubcategoria(subcategoria: any): string[] {
  const erros: string[] = []

  // Nome obrigatório
  if (!subcategoria.nome || subcategoria.nome.trim().length === 0) {
    erros.push('Nome da subcategoria é obrigatório')
  } else if (subcategoria.nome.trim().length < 2) {
    erros.push('Nome da subcategoria deve ter pelo menos 2 caracteres')
  } else if (subcategoria.nome.trim().length > 100) {
    erros.push('Nome da subcategoria deve ter no máximo 100 caracteres')
  }

  // Categoria pai obrigatória
  if (!subcategoria.categoria_id || subcategoria.categoria_id.trim().length === 0) {
    erros.push('Categoria pai é obrigatória')
  }

  // Workspace ID obrigatório
  if (!subcategoria.workspace_id) {
    erros.push('ID do workspace é obrigatório')
  }

  return erros
}

/**
 * Validar forma de pagamento
 */
export function validarFormaPagamento(formaPagamento: any): string[] {
  const erros: string[] = []

  // Nome obrigatório
  if (!formaPagamento.nome || formaPagamento.nome.trim().length === 0) {
    erros.push('Nome da forma de pagamento é obrigatório')
  } else if (formaPagamento.nome.trim().length < 2) {
    erros.push('Nome da forma de pagamento deve ter pelo menos 2 caracteres')
  } else if (formaPagamento.nome.trim().length > 100) {
    erros.push('Nome da forma de pagamento deve ter no máximo 100 caracteres')
  }

  // Tipo obrigatório
  if (!formaPagamento.tipo) {
    erros.push('Tipo da forma de pagamento é obrigatório')
  } else {
    const tiposValidos = ['debito', 'credito', 'dinheiro', 'pix', 'transferencia', 'outros']
    if (!tiposValidos.includes(formaPagamento.tipo)) {
      erros.push('Tipo de forma de pagamento inválido')
    }
  }

  // Workspace ID obrigatório
  if (!formaPagamento.workspace_id) {
    erros.push('ID do workspace é obrigatório')
  }

  return erros
}

/**
 * Validar centro de custo
 */
export function validarCentroCusto(centroCusto: any): string[] {
  const erros: string[] = []

  // Nome obrigatório
  if (!centroCusto.nome || centroCusto.nome.trim().length === 0) {
    erros.push('Nome do centro de custo é obrigatório')
  } else if (centroCusto.nome.trim().length < 2) {
    erros.push('Nome do centro de custo deve ter pelo menos 2 caracteres')
  } else if (centroCusto.nome.trim().length > 100) {
    erros.push('Nome do centro de custo deve ter no máximo 100 caracteres')
  }

  // Descrição opcional, mas se fornecida, validar tamanho
  if (centroCusto.descricao && centroCusto.descricao.trim().length > 500) {
    erros.push('Descrição deve ter no máximo 500 caracteres')
  }

  // Workspace ID obrigatório
  if (!centroCusto.workspace_id) {
    erros.push('ID do workspace é obrigatório')
  }

  return erros
}