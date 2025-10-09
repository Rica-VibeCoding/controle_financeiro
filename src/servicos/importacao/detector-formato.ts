import { TransacaoImportada, TemplateBanco, ResultadoValidacaoTemplate } from '@/tipos/importacao'
import { mapearLinhasGenerico, validarFormatoCSV, obterInfoFormato } from './mapeador-generico'
import { TEMPLATES_BANCOS } from './templates-banco'

/**
 * FASE 2 - Detector de Formato Simplificado
 * 
 * Substitui a detecção automática complexa por validação simples
 * usando o mapeador genérico único.
 */

export interface FormatoCSV {
  nome: string
  icone: string
  mapeador: (dados: unknown[], contaId: string, tipoConta?: any) => TransacaoImportada[]
  tipoOrigem: 'generico' // FASE 2: Sempre genérico
}

export function detectarFormato(dados: unknown[], template?: TemplateBanco): FormatoCSV {
  if (!dados || dados.length === 0) {
    throw new Error('CSV vazio ou inválido')
  }

  // Se tem template, validar contra ele
  if (template) {
    const validacao = validarContraTemplate(dados, template)
    if (!validacao.valido) {
      const headers = Object.keys(dados[0] as Record<string, unknown>).join(', ')
      throw new Error(
        validacao.erro || `Formato CSV não corresponde ao template ${template.nome}. Colunas encontradas: ${headers}`
      )
    }

    // Template validado com sucesso
    return {
      nome: template.nome,
      icone: template.icone || '📊',
      mapeador: (dados, contaId, tipoConta) => mapearLinhasGenerico(dados, contaId, tipoConta, template),
      tipoOrigem: 'generico'
    }
  }

  // FASE 2: Validação simples usando mapeador genérico (sem template)
  if (!validarFormatoCSV(dados)) {
    const headers = Object.keys(dados[0] as Record<string, unknown>).join(', ')
    throw new Error(
      `Formato CSV não suportado. ` +
      `Certifique-se de que o arquivo contém as colunas: data, valor e descrição. ` +
      `Colunas encontradas: ${headers}`
    )
  }

  // Obter informações sobre o formato para apresentação
  const info = obterInfoFormato(dados)

  // Retornar formato único genérico
  return {
    nome: obterNomeFormato(info.formatoDetectado),
    icone: obterIconeFormato(info.formatoDetectado),
    mapeador: mapearLinhasGenerico,
    tipoOrigem: 'generico'
  }
}

/**
 * Obtém nome amigável baseado no formato detectado
 */
function obterNomeFormato(formatoDetectado: string): string {
  switch (formatoDetectado) {
    case 'nubank_conta':
      return 'Nubank Conta'
    case 'nubank_cartao':
      return 'Nubank Cartão'
    default:
      return 'CSV Genérico'
  }
}

/**
 * Obtém ícone baseado no formato detectado
 */
function obterIconeFormato(formatoDetectado: string): string {
  switch (formatoDetectado) {
    case 'nubank_conta':
      return '💜🏦'
    case 'nubank_cartao':
      return '💜💳'
    default:
      return '📊'
  }
}

/**
 * Valida CSV contra um template específico
 *
 * Verifica se as colunas esperadas existem no CSV
 * e retorna erro claro se não corresponder.
 */
export function validarContraTemplate(
  dados: unknown[],
  template: TemplateBanco
): ResultadoValidacaoTemplate {
  if (!dados || dados.length === 0) {
    return {
      valido: false,
      erro: 'CSV vazio ou sem dados'
    }
  }

  const primeiraLinha = dados[0] as Record<string, unknown>
  const colunasEncontradas = Object.keys(primeiraLinha)

  // Verificar colunas obrigatórias
  const temData = template.colunas.data.some(col =>
    colunasEncontradas.includes(col)
  )

  // Verificar valor: pode ser coluna única OU crédito+débito
  const temValor = template.colunas.valor
    ? template.colunas.valor.some(col => colunasEncontradas.includes(col))
    : false

  const temCreditoDebito = template.colunas.creditoDebito
    ? template.colunas.creditoDebito.credito.some(col => colunasEncontradas.includes(col)) &&
      template.colunas.creditoDebito.debito.some(col => colunasEncontradas.includes(col))
    : false

  const temValorOuCreditoDebito = temValor || temCreditoDebito

  const temDescricao = template.colunas.descricao.some(col =>
    colunasEncontradas.includes(col)
  )

  if (!temData || !temValorOuCreditoDebito || !temDescricao) {
    // Tentar sugerir outro template
    const sugestao = tentarSugerirTemplate(colunasEncontradas)

    return {
      valido: false,
      erro: `❌ Este CSV não corresponde ao formato ${template.nome}\n\n` +
        `Esperado: ${template.exemplo.headers}\n` +
        `Encontrado: ${colunasEncontradas.join(', ')}`,
      sugestao: sugestao?.nome
    }
  }

  // Verificar número mínimo de colunas
  if (colunasEncontradas.length < template.validacao.minColunas) {
    return {
      valido: false,
      erro: `Poucas colunas no CSV. ` +
        `Esperado: ${template.validacao.minColunas}, ` +
        `Encontrado: ${colunasEncontradas.length}`
    }
  }

  return { valido: true }
}

/**
 * Tenta sugerir um template alternativo baseado nas colunas encontradas
 */
function tentarSugerirTemplate(colunasEncontradas: string[]): TemplateBanco | null {
  for (const template of TEMPLATES_BANCOS) {
    if (template.id === 'generico') continue

    const temData = template.colunas.data.some(col =>
      colunasEncontradas.includes(col)
    )

    const temValor = template.colunas.valor
      ? template.colunas.valor.some(col => colunasEncontradas.includes(col))
      : false

    const temCreditoDebito = template.colunas.creditoDebito
      ? template.colunas.creditoDebito.credito.some(col => colunasEncontradas.includes(col)) &&
        template.colunas.creditoDebito.debito.some(col => colunasEncontradas.includes(col))
      : false

    const temValorOuCreditoDebito = temValor || temCreditoDebito

    const temDescricao = template.colunas.descricao.some(col =>
      colunasEncontradas.includes(col)
    )

    if (temData && temValorOuCreditoDebito && temDescricao) {
      return template
    }
  }

  return null
}