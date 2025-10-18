/**
 * Utilitários para cálculo de períodos de tempo
 * Centraliza lógica reutilizada em múltiplos relatórios
 */

export type TipoPeriodo = '3_meses' | '6_meses' | '12_meses' | 'mes_atual' | 'ano_atual' | 'personalizado'

export interface PeriodoCalculado {
  dataInicio: string | null
  dataFim: string | null
}

/**
 * Calcular datas de início e fim baseado em tipo de período
 */
export function calcularPeriodo(
  tipo: TipoPeriodo,
  dataInicioCustom?: string,
  dataFimCustom?: string
): PeriodoCalculado {
  const hoje = new Date()
  let dataInicio: string | null = null
  let dataFim: string | null = null

  switch (tipo) {
    case '3_meses':
      dataInicio = new Date(hoje.getFullYear(), hoje.getMonth() - 3, 1).toISOString().split('T')[0]
      dataFim = hoje.toISOString().split('T')[0]
      break

    case '6_meses':
      dataInicio = new Date(hoje.getFullYear(), hoje.getMonth() - 6, 1).toISOString().split('T')[0]
      dataFim = hoje.toISOString().split('T')[0]
      break

    case '12_meses':
      dataInicio = new Date(hoje.getFullYear(), hoje.getMonth() - 12, 1).toISOString().split('T')[0]
      dataFim = hoje.toISOString().split('T')[0]
      break

    case 'mes_atual':
      dataInicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString().split('T')[0]
      dataFim = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).toISOString().split('T')[0]
      break

    case 'ano_atual':
      dataInicio = new Date(hoje.getFullYear(), 0, 1).toISOString().split('T')[0]
      dataFim = new Date(hoje.getFullYear(), 11, 31).toISOString().split('T')[0]
      break

    case 'personalizado':
      dataInicio = dataInicioCustom || null
      dataFim = dataFimCustom || null
      break

    default:
      // Fallback: último mês
      dataInicio = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1).toISOString().split('T')[0]
      dataFim = hoje.toISOString().split('T')[0]
  }

  return { dataInicio, dataFim }
}

/**
 * Converter string de período para rótulo legível
 */
export function obterRotuloPeriodo(tipo: TipoPeriodo): string {
  const rotulos: Record<TipoPeriodo, string> = {
    '3_meses': 'Últimos 3 meses',
    '6_meses': 'Últimos 6 meses',
    '12_meses': 'Últimos 12 meses',
    'mes_atual': 'Mês atual',
    'ano_atual': 'Ano atual',
    'personalizado': 'Período personalizado'
  }

  return rotulos[tipo] || 'Período não definido'
}

/**
 * Validar se período personalizado é válido
 */
export function validarPeriodoPersonalizado(dataInicio?: string, dataFim?: string): boolean {
  if (!dataInicio || !dataFim) return false

  const inicio = new Date(dataInicio)
  const fim = new Date(dataFim)

  // Data de início deve ser menor que fim
  if (inicio >= fim) return false

  // Não permitir períodos maiores que 5 anos
  const diferencaAnos = (fim.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24 * 365)
  if (diferencaAnos > 5) return false

  return true
}
