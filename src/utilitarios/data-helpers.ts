/**
 * Utilitários de manipulação de datas - Sistema de Controle Financeiro
 * Arquivo centralizado para evitar duplicação de lógica
 */

/**
 * Normaliza data para formato ISO com timestamp completo (YYYY-MM-DDTHH:mm:ss)
 * Converte formato brasileiro (DD/MM/YYYY) e outros formatos para ISO
 *
 * IMPORTANTE: Desde 09/01/2025, o banco usa TIMESTAMP WITH TIME ZONE
 * Portanto, SEMPRE preservamos hora/minuto/segundo quando disponível
 *
 * @param data - Data em string (vários formatos aceitos)
 * @returns Data normalizada no formato ISO com timestamp completo ou null
 *
 * @example
 * normalizarData("08/10/2025 16:20:00") → "2025-10-08T16:20:00"
 * normalizarData("08/10/2025") → "2025-10-08T00:00:00"
 * normalizarData("2025-10-08") → "2025-10-08T00:00:00"
 */
export function normalizarData(data: string | null | undefined): string | null {
  if (!data || typeof data !== 'string' || data.trim() === '') {
    return null
  }

  const dataLimpa = data.trim()

  // Se já está no formato ISO com hora (YYYY-MM-DDTHH:mm:ss ou YYYY-MM-DDTHH:mm), retorna como está
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/.test(dataLimpa)) {
    // Se falta segundos, adiciona :00
    return dataLimpa.length === 16 ? `${dataLimpa}:00` : dataLimpa
  }

  // Se está no formato ISO sem hora (YYYY-MM-DD), adiciona hora 00:00:00
  if (/^\d{4}-\d{2}-\d{2}$/.test(dataLimpa)) {
    return `${dataLimpa}T00:00:00`
  }

  // Se tem hora (DD/MM/YYYY HH:mm:ss ou DD/MM/YYYY HH:mm), PRESERVA a hora no formato ISO
  if (/^\d{1,2}\/\d{1,2}\/\d{4}\s+\d{1,2}:\d{2}(:\d{2})?/.test(dataLimpa)) {
    const [dataParte, horaParte] = dataLimpa.split(' ')
    const [dia, mes, ano] = dataParte.split('/')
    const dataFormatada = `${ano}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`

    // Normalizar hora para HH:mm:ss (adicionar :00 se falta segundos)
    const horaCompleta = horaParte.length === 5 ? `${horaParte}:00` : horaParte

    return `${dataFormatada}T${horaCompleta}`
  }

  // Se está no formato DD/MM/YYYY (sem hora), converte e adiciona 00:00:00
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dataLimpa)) {
    const [dia, mes, ano] = dataLimpa.split('/')
    return `${ano}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}T00:00:00`
  }

  // Se está no formato DD-MM-YYYY (sem hora), converte e adiciona 00:00:00
  if (/^\d{1,2}-\d{1,2}-\d{4}$/.test(dataLimpa)) {
    const [dia, mes, ano] = dataLimpa.split('-')
    return `${ano}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}T00:00:00`
  }

  // Para outros formatos, tenta converter usando Date
  try {
    const dataObj = new Date(dataLimpa)
    if (!isNaN(dataObj.getTime())) {
      return dataObj.toISOString().substring(0, 19) // Remove milissegundos e Z
    }
  } catch (error) {
    console.warn('Data inválida encontrada:', dataLimpa)
  }

  // Se nenhum formato reconhecido, retorna null
  return null
}

/**
 * Valida formato de data ISO (YYYY-MM-DD ou YYYY-MM-DDTHH:mm:ss)
 *
 * @param data - Data em string para validar
 * @returns true se data válida, false caso contrário
 */
export function validarDataISO(data: string): boolean {
  // Aceita YYYY-MM-DD ou YYYY-MM-DDTHH:mm:ss
  const regex = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2})?)?$/
  if (!regex.test(data)) return false

  // Extrair apenas a data (sem hora) para validação
  const dataSemHora = data.split('T')[0]
  const dateObj = new Date(dataSemHora)
  return dateObj instanceof Date && !isNaN(dateObj.getTime())
}

/**
 * Extrai apenas a parte da data (YYYY-MM-DD) de um timestamp completo
 * Útil para comparações e exibição
 *
 * @param dataCompleta - Data com timestamp (YYYY-MM-DDTHH:mm:ss)
 * @returns Apenas a data (YYYY-MM-DD)
 *
 * @example
 * extrairData("2025-10-08T16:20:00") → "2025-10-08"
 */
export function extrairData(dataCompleta: string): string {
  return dataCompleta.split('T')[0]
}

/**
 * Extrai apenas a parte do horário (HH:mm:ss) de um timestamp completo
 *
 * @param dataCompleta - Data com timestamp (YYYY-MM-DDTHH:mm:ss)
 * @returns Apenas o horário (HH:mm:ss)
 *
 * @example
 * extrairHora("2025-10-08T16:20:00") → "16:20:00"
 */
export function extrairHora(dataCompleta: string): string {
  const partes = dataCompleta.split('T')
  return partes.length > 1 ? partes[1] : '00:00:00'
}

/**
 * Calcula dias até vencimento (negativo = atrasado, positivo = a vencer)
 * Útil para determinar urgência de contas a pagar/receber
 *
 * @param dataVencimento - Data de vencimento em formato ISO (YYYY-MM-DD ou YYYY-MM-DDTHH:mm:ss)
 * @returns Número de dias (negativo se atrasado, 0 se vence hoje, positivo se futuro)
 *
 * @example
 * calcularDiasVencimento("2025-01-20") → 3 (se hoje é 2025-01-17)
 * calcularDiasVencimento("2025-01-17") → 0 (vence hoje)
 * calcularDiasVencimento("2025-01-15") → -2 (atrasado 2 dias)
 */
export function calcularDiasVencimento(dataVencimento: string): number {
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)

  const vencimento = new Date(dataVencimento)
  vencimento.setHours(0, 0, 0, 0)

  const diffTime = vencimento.getTime() - hoje.getTime()
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}
