/**
 * Funções auxiliares para sistema de metas mensais
 */

/**
 * Gerar referência do mês no formato AAAAMM
 * @param data - Data opcional (padrão: hoje)
 * @returns Número no formato AAAAMM (ex: 202508)
 */
export function gerarMesReferencia(data?: Date): number {
  const d = data || new Date()
  const ano = d.getFullYear()
  const mes = (d.getMonth() + 1).toString().padStart(2, '0')
  return parseInt(`${ano}${mes}`)
}

/**
 * Converter mes_referencia para data início do mês
 * @param mesReferencia - Número no formato AAAAMM
 * @returns Data do primeiro dia do mês
 */
export function mesReferenciaParaDataInicio(mesReferencia: number): Date {
  const str = mesReferencia.toString()
  const ano = parseInt(str.substring(0, 4))
  const mes = parseInt(str.substring(4, 6)) - 1 // JavaScript usa 0-11
  return new Date(ano, mes, 1)
}

/**
 * Converter mes_referencia para data fim do mês
 * @param mesReferencia - Número no formato AAAAMM
 * @returns Data do último dia do mês
 */
export function mesReferenciaParaDataFim(mesReferencia: number): Date {
  const str = mesReferencia.toString()
  const ano = parseInt(str.substring(0, 4))
  const mes = parseInt(str.substring(4, 6)) - 1 // JavaScript usa 0-11
  return new Date(ano, mes + 1, 0) // Dia 0 do próximo mês = último dia do mês atual
}

/**
 * Formatar mes_referencia para exibição
 * @param mesReferencia - Número no formato AAAAMM
 * @returns String formatada (ex: "Agosto 2025")
 */
export function formatarMesReferencia(mesReferencia: number): string {
  const data = mesReferenciaParaDataInicio(mesReferencia)
  return data.toLocaleDateString('pt-BR', { 
    month: 'long', 
    year: 'numeric' 
  }).replace(/^\w/, c => c.toUpperCase())
}

/**
 * Formatar valor monetário
 * @param valor - Valor numérico
 * @returns String formatada em Real brasileiro
 */
export function formatarValorReal(valor: number): string {
  return valor.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  })
}

/**
 * Calcular percentual de uso da meta
 * @param valorGasto - Valor já gasto
 * @param valorMeta - Valor limite da meta
 * @returns Percentual (0-100+)
 */
export function calcularPercentualMeta(valorGasto: number, valorMeta: number): number {
  if (valorMeta === 0) return valorGasto > 0 ? 999 : 0 // 999% para metas zeradas com gasto
  return Math.round((valorGasto / valorMeta) * 100)
}

/**
 * Determinar status da meta baseado no percentual
 * @param percentual - Percentual de uso (0-100+)
 * @returns Status da meta
 */
export function determinarStatusMeta(percentual: number): 'normal' | 'atencao' | 'excedido' {
  if (percentual >= 100) return 'excedido'
  if (percentual >= 80) return 'atencao'
  return 'normal'
}

/**
 * Obter mes_referencia anterior
 * @param mesReferencia - Mês atual no formato AAAAMM
 * @returns Mês anterior no formato AAAAMM
 */
export function obterMesAnterior(mesReferencia: number): number {
  const str = mesReferencia.toString()
  const ano = parseInt(str.substring(0, 4))
  const mes = parseInt(str.substring(4, 6))
  
  if (mes === 1) {
    // Janeiro -> Dezembro do ano anterior
    return parseInt(`${ano - 1}12`)
  } else {
    // Mês anterior do mesmo ano
    const mesAnterior = (mes - 1).toString().padStart(2, '0')
    return parseInt(`${ano}${mesAnterior}`)
  }
}

/**
 * Validar formato do mes_referencia
 * @param mesReferencia - Número a validar
 * @returns true se válido
 */
export function validarMesReferencia(mesReferencia: number): boolean {
  const str = mesReferencia.toString()
  if (str.length !== 6) return false
  
  const ano = parseInt(str.substring(0, 4))
  const mes = parseInt(str.substring(4, 6))
  
  return ano >= 2020 && ano <= 2100 && mes >= 1 && mes <= 12
}