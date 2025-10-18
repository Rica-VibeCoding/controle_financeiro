/**
 * Utilitários de Formatação de Cores
 *
 * Centraliza todas as lógicas de cores dinâmicas do sistema
 * para garantir consistência visual e facilitar manutenção.
 *
 * Padrão: Tailwind CSS classes
 */

// ===== TIPOS =====

export interface ResultadoCor {
  cor: string          // Classe Tailwind de cor de texto
  bg?: string          // Classe Tailwind de cor de fundo
  icone?: string       // Emoji ou ícone visual
  border?: string      // Classe Tailwind de cor de borda
}

export type IntensidadeCor = 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900

export type TipoCor = 'text' | 'bg' | 'border'

// ===== CONSTANTES DE CORES =====

/**
 * Paleta de cores padrão do sistema (Tailwind)
 */
export const CORES = {
  verde: {
    text: 'text-green-600',
    bg: 'bg-green-50',
    border: 'border-green-500',
    icone: '🟢'
  },
  amarelo: {
    text: 'text-yellow-600',
    bg: 'bg-yellow-50',
    border: 'border-yellow-500',
    icone: '🟡'
  },
  vermelho: {
    text: 'text-red-600',
    bg: 'bg-red-50',
    border: 'border-red-500',
    icone: '🔴'
  },
  azul: {
    text: 'text-blue-600',
    bg: 'bg-blue-50',
    border: 'border-blue-500',
    icone: '🔵'
  },
  roxo: {
    text: 'text-purple-600',
    bg: 'bg-purple-50',
    border: 'border-purple-500',
    icone: '🟣'
  },
  cinza: {
    text: 'text-gray-600',
    bg: 'bg-gray-50',
    border: 'border-gray-500',
    icone: '⚫'
  },
  laranja: {
    text: 'text-orange-600',
    bg: 'bg-orange-50',
    border: 'border-orange-500',
    icone: '🟠'
  }
} as const

// ===== CORES POR VARIAÇÃO PERCENTUAL =====

/**
 * Retorna cor baseada em variação percentual (±5%, ±10%)
 * Padrão: verde (bom), amarelo (atenção), vermelho (crítico)
 *
 * @param percentual - Valor percentual de variação
 * @param incluirBackground - Se deve incluir cor de fundo
 * @returns Objeto com classes de cor
 *
 * @example
 * obterCorVariacao(3) // { cor: 'text-green-600', bg: 'bg-green-50' }
 * obterCorVariacao(-8) // { cor: 'text-yellow-600', bg: 'bg-yellow-50' }
 * obterCorVariacao(15) // { cor: 'text-red-600', bg: 'bg-red-50' }
 */
export function obterCorVariacao(
  percentual: number,
  incluirBackground: boolean = true
): ResultadoCor {
  const abs = Math.abs(percentual)

  if (abs <= 5) {
    return {
      cor: CORES.verde.text,
      bg: incluirBackground ? CORES.verde.bg : undefined,
      icone: CORES.verde.icone,
      border: CORES.verde.border
    }
  }

  if (abs <= 10) {
    return {
      cor: CORES.amarelo.text,
      bg: incluirBackground ? CORES.amarelo.bg : undefined,
      icone: CORES.amarelo.icone,
      border: CORES.amarelo.border
    }
  }

  return {
    cor: CORES.vermelho.text,
    bg: incluirBackground ? CORES.vermelho.bg : undefined,
    icone: CORES.vermelho.icone,
    border: CORES.vermelho.border
  }
}

/**
 * Retorna cor baseada em variação percentual personalizada
 *
 * @param percentual - Valor percentual de variação
 * @param limites - Limites personalizados { bom, atencao }
 * @param incluirBackground - Se deve incluir cor de fundo
 * @returns Objeto com classes de cor
 *
 * @example
 * obterCorVariacaoCustom(3, { bom: 3, atencao: 8 })
 * // { cor: 'text-green-600', bg: 'bg-green-50' }
 */
export function obterCorVariacaoCustom(
  percentual: number,
  limites: { bom: number; atencao: number },
  incluirBackground: boolean = true
): ResultadoCor {
  const abs = Math.abs(percentual)

  if (abs <= limites.bom) {
    return {
      cor: CORES.verde.text,
      bg: incluirBackground ? CORES.verde.bg : undefined,
      icone: CORES.verde.icone
    }
  }

  if (abs <= limites.atencao) {
    return {
      cor: CORES.amarelo.text,
      bg: incluirBackground ? CORES.amarelo.bg : undefined,
      icone: CORES.amarelo.icone
    }
  }

  return {
    cor: CORES.vermelho.text,
    bg: incluirBackground ? CORES.vermelho.bg : undefined,
    icone: CORES.vermelho.icone
  }
}

// ===== CORES POR MARGEM DE LUCRO =====

/**
 * Retorna cor baseada em margem de lucro percentual
 * Padrão ROI: >= 30% verde, >= 15% amarelo, < 15% vermelho
 *
 * @param margem - Margem percentual
 * @param incluirBackground - Se deve incluir cor de fundo
 * @returns Objeto com classes de cor
 *
 * @example
 * obterCorMargem(35) // { cor: 'text-green-600', icone: '🟢' }
 * obterCorMargem(20) // { cor: 'text-yellow-600', icone: '🟡' }
 * obterCorMargem(10) // { cor: 'text-red-600', icone: '🔴' }
 */
export function obterCorMargem(
  margem: number,
  incluirBackground: boolean = false
): ResultadoCor {
  if (margem >= 30) {
    return {
      cor: CORES.verde.text,
      bg: incluirBackground ? CORES.verde.bg : undefined,
      icone: CORES.verde.icone
    }
  }

  if (margem >= 15) {
    return {
      cor: CORES.amarelo.text,
      bg: incluirBackground ? CORES.amarelo.bg : undefined,
      icone: CORES.amarelo.icone
    }
  }

  return {
    cor: CORES.vermelho.text,
    bg: incluirBackground ? CORES.vermelho.bg : undefined,
    icone: CORES.vermelho.icone
  }
}

/**
 * Retorna cor baseada em margem de lucro (tabela)
 * Padrão: >= 30% verde, >= 10% amarelo, < 10% vermelho
 *
 * @param margem - Margem percentual
 * @param incluirBackground - Se deve incluir cor de fundo
 * @returns Objeto com classes de cor
 */
export function obterCorMargemTabela(
  margem: number,
  incluirBackground: boolean = false
): ResultadoCor {
  if (margem >= 30) {
    return {
      cor: CORES.verde.text,
      bg: incluirBackground ? CORES.verde.bg : undefined,
      icone: CORES.verde.icone
    }
  }

  if (margem >= 10) {
    return {
      cor: CORES.amarelo.text,
      bg: incluirBackground ? CORES.amarelo.bg : undefined,
      icone: CORES.amarelo.icone
    }
  }

  return {
    cor: CORES.vermelho.text,
    bg: incluirBackground ? CORES.vermelho.bg : undefined,
    icone: CORES.vermelho.icone
  }
}

/**
 * Retorna cor baseada em margem mensal
 * Padrão: >= 20% verde, >= 10% amarelo, < 10% vermelho
 *
 * @param margem - Margem percentual mensal
 * @param incluirBackground - Se deve incluir cor de fundo
 * @returns Objeto com classes de cor
 */
export function obterCorMargemMensal(
  margem: number,
  incluirBackground: boolean = false
): ResultadoCor {
  if (margem >= 20) {
    return {
      cor: CORES.verde.text,
      bg: incluirBackground ? CORES.verde.bg : undefined,
      icone: CORES.verde.icone
    }
  }

  if (margem >= 10) {
    return {
      cor: CORES.amarelo.text,
      bg: incluirBackground ? CORES.amarelo.bg : undefined,
      icone: CORES.amarelo.icone
    }
  }

  return {
    cor: CORES.vermelho.text,
    bg: incluirBackground ? CORES.vermelho.bg : undefined,
    icone: CORES.vermelho.icone
  }
}

// ===== CORES POR VALORES POSITIVOS/NEGATIVOS =====

/**
 * Retorna cor baseada em valor positivo/negativo/zero
 * Verde para positivo, vermelho para negativo, cinza para zero
 *
 * @param valor - Valor numérico
 * @param incluirBackground - Se deve incluir cor de fundo
 * @returns Objeto com classes de cor
 *
 * @example
 * obterCorValor(1000) // { cor: 'text-green-600' }
 * obterCorValor(-500) // { cor: 'text-red-600' }
 * obterCorValor(0) // { cor: 'text-gray-900' }
 */
export function obterCorValor(
  valor: number,
  incluirBackground: boolean = false
): ResultadoCor {
  if (valor > 0) {
    return {
      cor: CORES.verde.text,
      bg: incluirBackground ? CORES.verde.bg : undefined,
      icone: CORES.verde.icone
    }
  }

  if (valor < 0) {
    return {
      cor: CORES.vermelho.text,
      bg: incluirBackground ? CORES.vermelho.bg : undefined,
      icone: CORES.vermelho.icone
    }
  }

  return {
    cor: 'text-gray-900',
    bg: incluirBackground ? 'bg-gray-50' : undefined,
    icone: '⚫'
  }
}

/**
 * Retorna cor baseada em lucro (positivo/negativo/zero)
 * Alias para obterCorValor com semântica de lucro
 *
 * @param lucro - Valor de lucro
 * @param incluirBackground - Se deve incluir cor de fundo
 * @returns Objeto com classes de cor
 */
export function obterCorLucro(
  lucro: number,
  incluirBackground: boolean = false
): ResultadoCor {
  return obterCorValor(lucro, incluirBackground)
}

// ===== CORES POR STATUS =====

/**
 * Retorna cor baseada em status de transação
 *
 * @param status - Status da transação
 * @param incluirBackground - Se deve incluir cor de fundo
 * @returns Objeto com classes de cor
 *
 * @example
 * obterCorStatus('efetivada') // { cor: 'text-green-600', bg: 'bg-green-50' }
 * obterCorStatus('prevista') // { cor: 'text-blue-600', bg: 'bg-blue-50' }
 * obterCorStatus('cancelada') // { cor: 'text-red-600', bg: 'bg-red-50' }
 */
export function obterCorStatus(
  status: 'efetivada' | 'prevista' | 'cancelada' | 'pendente',
  incluirBackground: boolean = true
): ResultadoCor {
  const mapa = {
    efetivada: CORES.verde,
    prevista: CORES.azul,
    cancelada: CORES.vermelho,
    pendente: CORES.amarelo
  }

  const cor = mapa[status] || CORES.cinza

  return {
    cor: cor.text,
    bg: incluirBackground ? cor.bg : undefined,
    icone: cor.icone,
    border: cor.border
  }
}

/**
 * Retorna cor baseada em tipo de transação
 *
 * @param tipo - Tipo da transação
 * @param incluirBackground - Se deve incluir cor de fundo
 * @returns Objeto com classes de cor
 *
 * @example
 * obterCorTipo('receita') // { cor: 'text-green-600', bg: 'bg-green-50' }
 * obterCorTipo('despesa') // { cor: 'text-red-600', bg: 'bg-red-50' }
 */
export function obterCorTipo(
  tipo: 'receita' | 'despesa',
  incluirBackground: boolean = true
): ResultadoCor {
  if (tipo === 'receita') {
    return {
      cor: CORES.verde.text,
      bg: incluirBackground ? CORES.verde.bg : undefined,
      icone: '⬆️',
      border: CORES.verde.border
    }
  }

  return {
    cor: CORES.vermelho.text,
    bg: incluirBackground ? CORES.vermelho.bg : undefined,
    icone: '⬇️',
    border: CORES.vermelho.border
  }
}

// ===== CORES POR PRIORIDADE =====

/**
 * Retorna cor baseada em nível de prioridade
 *
 * @param prioridade - Nível de prioridade (1-5 ou baixa/media/alta)
 * @param incluirBackground - Se deve incluir cor de fundo
 * @returns Objeto com classes de cor
 *
 * @example
 * obterCorPrioridade('alta') // { cor: 'text-red-600', bg: 'bg-red-50' }
 * obterCorPrioridade('media') // { cor: 'text-yellow-600', bg: 'bg-yellow-50' }
 * obterCorPrioridade('baixa') // { cor: 'text-green-600', bg: 'bg-green-50' }
 */
export function obterCorPrioridade(
  prioridade: 'baixa' | 'media' | 'alta' | 1 | 2 | 3 | 4 | 5,
  incluirBackground: boolean = true
): ResultadoCor {
  const mapa = {
    alta: CORES.vermelho,
    media: CORES.amarelo,
    baixa: CORES.verde,
    5: CORES.vermelho,
    4: CORES.laranja,
    3: CORES.amarelo,
    2: CORES.azul,
    1: CORES.verde
  }

  const cor = mapa[prioridade] || CORES.cinza

  return {
    cor: cor.text,
    bg: incluirBackground ? cor.bg : undefined,
    icone: cor.icone
  }
}

// ===== CORES POR SAÚDE FINANCEIRA =====

/**
 * Retorna cor baseada em saúde financeira (0-100%)
 *
 * @param percentual - Percentual de saúde (0-100)
 * @param incluirBackground - Se deve incluir cor de fundo
 * @returns Objeto com classes de cor
 *
 * @example
 * obterCorSaude(90) // { cor: 'text-green-600', bg: 'bg-green-50' }
 * obterCorSaude(60) // { cor: 'text-yellow-600', bg: 'bg-yellow-50' }
 * obterCorSaude(30) // { cor: 'text-red-600', bg: 'bg-red-50' }
 */
export function obterCorSaude(
  percentual: number,
  incluirBackground: boolean = true
): ResultadoCor {
  if (percentual >= 70) {
    return {
      cor: CORES.verde.text,
      bg: incluirBackground ? CORES.verde.bg : undefined,
      icone: '💚'
    }
  }

  if (percentual >= 40) {
    return {
      cor: CORES.amarelo.text,
      bg: incluirBackground ? CORES.amarelo.bg : undefined,
      icone: '💛'
    }
  }

  return {
    cor: CORES.vermelho.text,
    bg: incluirBackground ? CORES.vermelho.bg : undefined,
    icone: '❤️'
  }
}

// ===== HELPERS GENÉRICOS =====

/**
 * Gera classe Tailwind de cor com intensidade customizada
 *
 * @param base - Cor base (green, red, blue, etc)
 * @param tipo - Tipo de classe (text, bg, border)
 * @param intensidade - Intensidade da cor (50-900)
 * @returns Classe Tailwind
 *
 * @example
 * gerarClasseCor('green', 'text', 600) // "text-green-600"
 * gerarClasseCor('red', 'bg', 50) // "bg-red-50"
 */
export function gerarClasseCor(
  base: 'green' | 'red' | 'blue' | 'yellow' | 'purple' | 'gray' | 'orange',
  tipo: TipoCor = 'text',
  intensidade: IntensidadeCor = 600
): string {
  return `${tipo}-${base}-${intensidade}`
}

/**
 * Combina múltiplas classes de cor em uma string
 *
 * @param classes - Array de classes de cor
 * @returns String com classes combinadas
 *
 * @example
 * combinarCores(['text-green-600', 'bg-green-50', 'border-green-500'])
 * // "text-green-600 bg-green-50 border-green-500"
 */
export function combinarCores(...classes: (string | undefined)[]): string {
  return classes.filter(Boolean).join(' ')
}

/**
 * Obtém apenas a classe de texto de um ResultadoCor
 *
 * @param resultado - Objeto ResultadoCor
 * @returns Classe de texto
 */
export function extrairClasseTexto(resultado: ResultadoCor): string {
  return resultado.cor
}

/**
 * Obtém todas as classes de um ResultadoCor como string
 *
 * @param resultado - Objeto ResultadoCor
 * @returns String com todas as classes
 */
export function extrairTodasClasses(resultado: ResultadoCor): string {
  return combinarCores(resultado.cor, resultado.bg, resultado.border)
}
