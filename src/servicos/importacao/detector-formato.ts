import { TransacaoImportada } from '@/tipos/importacao'
import { mapearLinhasGenerico, validarFormatoCSV, obterInfoFormato } from './mapeador-generico'

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

export function detectarFormato(dados: unknown[]): FormatoCSV {
  if (!dados || dados.length === 0) {
    throw new Error('CSV vazio ou inválido')
  }
  
  // FASE 2: Validação simples usando mapeador genérico
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