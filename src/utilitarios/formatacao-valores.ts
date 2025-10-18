/**
 * Utilitários de Formatação de Valores
 *
 * Centraliza todas as formatações de valores do sistema
 * para garantir consistência e facilitar manutenção.
 *
 * Padrão: pt-BR (Brasil)
 */

// ===== TIPOS =====

export type FormatoData = 'curto' | 'medio' | 'longo' | 'completo'
export type FormatoMoeda = 'padrao' | 'compacto' | 'semSimbolo'

// ===== FORMATAÇÃO DE MOEDA =====

/**
 * Formata valor monetário em Real (R$)
 *
 * @param valor - Valor numérico a ser formatado
 * @param formato - Tipo de formatação ('padrao', 'compacto', 'semSimbolo')
 * @returns Valor formatado como moeda
 *
 * @example
 * formatarMoeda(1234.56) // "R$ 1.234,56"
 * formatarMoeda(1234.56, 'semSimbolo') // "1.234,56"
 * formatarMoeda(1500000, 'compacto') // "R$ 1,5 mi"
 */
export function formatarMoeda(
  valor: number,
  formato: FormatoMoeda = 'padrao'
): string {
  if (formato === 'compacto') {
    return formatarMoedaCompacta(valor)
  }

  const valorFormatado = valor.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })

  if (formato === 'semSimbolo') {
    return valorFormatado
  }

  return `R$ ${valorFormatado}`
}

/**
 * Formata valor monetário de forma compacta (mil, mi, bi)
 *
 * @param valor - Valor numérico a ser formatado
 * @returns Valor formatado de forma compacta
 *
 * @example
 * formatarMoedaCompacta(1500) // "R$ 1,5 mil"
 * formatarMoedaCompacta(2500000) // "R$ 2,5 mi"
 * formatarMoedaCompacta(1200000000) // "R$ 1,2 bi"
 */
export function formatarMoedaCompacta(valor: number): string {
  const absValor = Math.abs(valor)
  const sinal = valor < 0 ? '-' : ''

  if (absValor >= 1_000_000_000) {
    return `${sinal}R$ ${(absValor / 1_000_000_000).toFixed(1).replace('.', ',')} bi`
  }

  if (absValor >= 1_000_000) {
    return `${sinal}R$ ${(absValor / 1_000_000).toFixed(1).replace('.', ',')} mi`
  }

  if (absValor >= 1_000) {
    return `${sinal}R$ ${(absValor / 1_000).toFixed(1).replace('.', ',')} mil`
  }

  return formatarMoeda(valor)
}

// ===== FORMATAÇÃO DE NÚMEROS =====

/**
 * Formata número decimal com separadores pt-BR
 *
 * @param valor - Número a ser formatado
 * @param casasDecimais - Número de casas decimais (padrão: 2)
 * @returns Número formatado
 *
 * @example
 * formatarNumero(1234.567) // "1.234,57"
 * formatarNumero(1234.567, 1) // "1.234,6"
 * formatarNumero(1234.567, 0) // "1.235"
 */
export function formatarNumero(
  valor: number,
  casasDecimais: number = 2
): string {
  return valor.toLocaleString('pt-BR', {
    minimumFractionDigits: casasDecimais,
    maximumFractionDigits: casasDecimais
  })
}

/**
 * Formata número inteiro (sem casas decimais)
 *
 * @param valor - Número a ser formatado
 * @returns Número inteiro formatado
 *
 * @example
 * formatarInteiro(1234.567) // "1.235"
 * formatarInteiro(1000) // "1.000"
 */
export function formatarInteiro(valor: number): string {
  return formatarNumero(valor, 0)
}

/**
 * Formata número de forma compacta (mil, mi, bi)
 *
 * @param valor - Número a ser formatado
 * @returns Número formatado de forma compacta
 *
 * @example
 * formatarNumeroCompacto(1500) // "1,5 mil"
 * formatarNumeroCompacto(2500000) // "2,5 mi"
 */
export function formatarNumeroCompacto(valor: number): string {
  const absValor = Math.abs(valor)
  const sinal = valor < 0 ? '-' : ''

  if (absValor >= 1_000_000_000) {
    return `${sinal}${(absValor / 1_000_000_000).toFixed(1).replace('.', ',')} bi`
  }

  if (absValor >= 1_000_000) {
    return `${sinal}${(absValor / 1_000_000).toFixed(1).replace('.', ',')} mi`
  }

  if (absValor >= 1_000) {
    return `${sinal}${(absValor / 1_000).toFixed(1).replace('.', ',')} mil`
  }

  return formatarNumero(valor, 0)
}

// ===== FORMATAÇÃO DE PERCENTUAIS =====

/**
 * Formata percentual com símbolo %
 *
 * @param valor - Valor percentual (já em escala 0-100)
 * @param casasDecimais - Número de casas decimais (padrão: 1)
 * @param exibirSinal - Se deve exibir + para valores positivos (padrão: false)
 * @returns Percentual formatado
 *
 * @example
 * formatarPercentual(12.5) // "12,5%"
 * formatarPercentual(12.567, 2) // "12,57%"
 * formatarPercentual(15.5, 1, true) // "+15,5%"
 * formatarPercentual(-5.2, 1, true) // "-5,2%"
 */
export function formatarPercentual(
  valor: number,
  casasDecimais: number = 1,
  exibirSinal: boolean = false
): string {
  const sinal = exibirSinal && valor > 0 ? '+' : ''
  const valorFormatado = valor.toFixed(casasDecimais).replace('.', ',')
  return `${sinal}${valorFormatado}%`
}

/**
 * Formata percentual de forma compacta (sem casas decimais se for inteiro)
 *
 * @param valor - Valor percentual
 * @returns Percentual formatado de forma inteligente
 *
 * @example
 * formatarPercentualCompacto(12.0) // "12%"
 * formatarPercentualCompacto(12.5) // "12,5%"
 * formatarPercentualCompacto(12.567) // "12,6%"
 */
export function formatarPercentualCompacto(valor: number): string {
  // Se for número inteiro, não exibir casas decimais
  if (Number.isInteger(valor)) {
    return `${valor}%`
  }

  return formatarPercentual(valor, 1)
}

// ===== FORMATAÇÃO DE DATAS =====

/**
 * Formata data em diferentes formatos pt-BR
 *
 * @param data - String ISO ou objeto Date
 * @param formato - Tipo de formato desejado
 * @returns Data formatada
 *
 * @example
 * formatarData('2025-01-17', 'curto') // "17/01"
 * formatarData('2025-01-17', 'medio') // "17/01/2025"
 * formatarData('2025-01-17', 'longo') // "17 de janeiro de 2025"
 * formatarData('2025-01-17', 'completo') // "sexta-feira, 17 de janeiro de 2025"
 */
export function formatarData(
  data: string | Date,
  formato: FormatoData = 'medio'
): string {
  const dataObj = typeof data === 'string' ? new Date(data) : data

  // Adicionar 1 dia para compensar timezone (bug comum com datas ISO)
  const dataAjustada = new Date(dataObj)
  if (typeof data === 'string' && data.includes('T00:00:00')) {
    dataAjustada.setDate(dataAjustada.getDate() + 1)
  }

  switch (formato) {
    case 'curto':
      return dataAjustada.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit'
      })

    case 'medio':
      return dataAjustada.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      })

    case 'longo':
      return dataAjustada.toLocaleDateString('pt-BR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      })

    case 'completo':
      return dataAjustada.toLocaleDateString('pt-BR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      })

    default:
      return dataAjustada.toLocaleDateString('pt-BR')
  }
}

/**
 * Formata data/hora completa
 *
 * @param data - String ISO ou objeto Date
 * @returns Data e hora formatadas
 *
 * @example
 * formatarDataHora('2025-01-17T15:30:00') // "17/01/2025 15:30"
 */
export function formatarDataHora(data: string | Date): string {
  const dataObj = typeof data === 'string' ? new Date(data) : data

  const dataFormatada = dataObj.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })

  const horaFormatada = dataObj.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit'
  })

  return `${dataFormatada} ${horaFormatada}`
}

/**
 * Formata data relativa (hoje, ontem, amanhã, etc)
 *
 * @param data - String ISO ou objeto Date
 * @returns Data relativa ou formatada
 *
 * @example
 * formatarDataRelativa('2025-01-17') // "Hoje"
 * formatarDataRelativa('2025-01-16') // "Ontem"
 * formatarDataRelativa('2025-01-18') // "Amanhã"
 * formatarDataRelativa('2025-01-10') // "17/01/2025"
 */
export function formatarDataRelativa(data: string | Date): string {
  const dataObj = typeof data === 'string' ? new Date(data) : data
  const hoje = new Date()

  // Zerar horas para comparação apenas de datas
  const dataComparacao = new Date(dataObj.getFullYear(), dataObj.getMonth(), dataObj.getDate())
  const hojeComparacao = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate())

  const diffDias = Math.floor((dataComparacao.getTime() - hojeComparacao.getTime()) / (1000 * 60 * 60 * 24))

  if (diffDias === 0) return 'Hoje'
  if (diffDias === -1) return 'Ontem'
  if (diffDias === 1) return 'Amanhã'
  if (diffDias > 1 && diffDias <= 7) return `Em ${diffDias} dias`
  if (diffDias < -1 && diffDias >= -7) return `Há ${Math.abs(diffDias)} dias`

  return formatarData(dataObj, 'medio')
}

// ===== FORMATAÇÃO PARA INPUTS =====

/**
 * Formata data para input type="date" (formato YYYY-MM-DD)
 *
 * @param data - String ISO ou objeto Date
 * @returns Data no formato YYYY-MM-DD
 *
 * @example
 * formatarDataParaInput(new Date('2025-01-17')) // "2025-01-17"
 * formatarDataParaInput('2025-01-17T00:00:00') // "2025-01-17"
 */
export function formatarDataParaInput(data: string | Date | null | undefined): string {
  if (!data) return ''

  const dataObj = typeof data === 'string' ? new Date(data) : data

  // Extrair componentes da data
  const ano = dataObj.getFullYear()
  const mes = String(dataObj.getMonth() + 1).padStart(2, '0')
  const dia = String(dataObj.getDate()).padStart(2, '0')

  return `${ano}-${mes}-${dia}`
}

// ===== HELPERS ADICIONAIS =====

/**
 * Verifica se valor é válido para formatação
 *
 * @param valor - Valor a ser verificado
 * @returns true se válido, false caso contrário
 */
export function valorEhValido(valor: any): boolean {
  return valor !== null && valor !== undefined && !isNaN(Number(valor))
}

/**
 * Formata valor com fallback para valores inválidos
 *
 * @param valor - Valor a ser formatado
 * @param formatador - Função de formatação
 * @param fallback - Valor padrão se inválido (padrão: "-")
 * @returns Valor formatado ou fallback
 *
 * @example
 * formatarComFallback(1234.56, formatarMoeda) // "R$ 1.234,56"
 * formatarComFallback(null, formatarMoeda) // "-"
 * formatarComFallback(undefined, formatarMoeda, "N/A") // "N/A"
 */
export function formatarComFallback<T>(
  valor: T,
  formatador: (v: T) => string,
  fallback: string = '-'
): string {
  if (!valorEhValido(valor)) {
    return fallback
  }

  try {
    return formatador(valor)
  } catch {
    return fallback
  }
}
