import { TransacaoImportada, TipoConta } from '@/tipos/importacao'

/**
 * FASE 2 - Mapeador CSV Genérico Único
 * 
 * Substitui todos os mapeadores específicos por um único mapeador inteligente
 * que detecta automaticamente o formato dos dados e normaliza para o padrão interno.
 */

interface CamposCSV {
  data: string
  valor: string
  descricao: string
  identificador?: string
}

// Mapeamento de campos possíveis para normalização
const MAPEAMENTO_CAMPOS = {
  // Campos de data
  data: ['Data', 'date', 'data', 'DATA', 'DATE'],
  // Campos de valor
  valor: ['Valor', 'amount', 'valor', 'VALOR', 'AMOUNT', 'Amount'],
  // Campos de descrição
  descricao: ['Descrição', 'title', 'descricao', 'DESCRIÇÃO', 'TITLE', 'Title', 'Descricao'],
  // Campos de identificador (opcional)
  identificador: ['Identificador', 'id', 'ID', 'Id', 'identifier', 'IDENTIFICADOR']
}

/**
 * Detecta automaticamente os campos do CSV e normaliza os nomes
 */
function detectarCamposCSV(linha: Record<string, unknown>): CamposCSV {
  const campos = Object.keys(linha)
  
  const resultado: Partial<CamposCSV> = {}
  
  // Detectar campo de data
  for (const campo of campos) {
    if (MAPEAMENTO_CAMPOS.data.includes(campo)) {
      resultado.data = campo
      break
    }
  }
  
  // Detectar campo de valor
  for (const campo of campos) {
    if (MAPEAMENTO_CAMPOS.valor.includes(campo)) {
      resultado.valor = campo
      break
    }
  }
  
  // Detectar campo de descrição
  for (const campo of campos) {
    if (MAPEAMENTO_CAMPOS.descricao.includes(campo)) {
      resultado.descricao = campo
      break
    }
  }
  
  // Detectar campo de identificador (opcional)
  for (const campo of campos) {
    if (MAPEAMENTO_CAMPOS.identificador.includes(campo)) {
      resultado.identificador = campo
      break
    }
  }
  
  // Validar campos obrigatórios
  if (!resultado.data || !resultado.valor || !resultado.descricao) {
    const camposEncontrados = Object.keys(linha).join(', ')
    throw new Error(
      `Campos obrigatórios não encontrados no CSV. ` +
      `Esperado: data, valor, descrição. ` +
      `Encontrado: ${camposEncontrados}`
    )
  }
  
  return resultado as CamposCSV
}

/**
 * Normaliza formato de data para YYYY-MM-DD
 */
function normalizarData(dataStr: string): string {
  if (!dataStr || typeof dataStr !== 'string') {
    throw new Error('Data inválida no CSV')
  }
  
  const dataLimpa = dataStr.trim()
  
  // Se já está no formato ISO (YYYY-MM-DD), retorna como está
  if (/^\d{4}-\d{2}-\d{2}$/.test(dataLimpa)) {
    return dataLimpa
  }
  
  // Se está no formato DD/MM/YYYY, converte
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dataLimpa)) {
    const [dia, mes, ano] = dataLimpa.split('/')
    return `${ano}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`
  }
  
  // Se está no formato DD-MM-YYYY, converte
  if (/^\d{1,2}-\d{1,2}-\d{4}$/.test(dataLimpa)) {
    const [dia, mes, ano] = dataLimpa.split('-')
    return `${ano}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`
  }
  
  throw new Error(`Formato de data não suportado: ${dataStr}. Formatos aceitos: YYYY-MM-DD, DD/MM/YYYY, DD-MM-YYYY`)
}

/**
 * Gera identificador único baseado nos dados da transação
 */
function gerarIdentificadorUnico(data: string, descricao: string, valor: number): string {
  const textoHash = `${data}_${descricao.substring(0, 20)}_${valor}`
  const hash = Buffer.from(textoHash).toString('base64').substring(0, 16)
  return `CSV_${hash}`
}

/**
 * Determina tipo da transação baseado no valor e tipo da conta
 * FASE 2: Corrigido para funcionar corretamente com diferentes tipos de conta
 */
function determinarTipoTransacao(valor: number, tipoConta: TipoConta): 'receita' | 'despesa' {
  // Para cartão de crédito: valor positivo = despesa (gasto), valor negativo = receita (pagamento/estorno)
  if (tipoConta === 'cartao_credito') {
    return valor >= 0 ? 'despesa' : 'receita'
  }
  
  // Para cartão de débito: mesmo comportamento que cartão de crédito
  if (tipoConta === 'cartao_debito') {
    return valor >= 0 ? 'despesa' : 'receita'
  }
  
  // Para conta corrente, poupança, dinheiro: valor positivo = receita (entrada), valor negativo = despesa (saída)
  return valor >= 0 ? 'receita' : 'despesa'
}

/**
 * Mapeador CSV genérico que funciona com qualquer formato
 */
export function mapearLinhasGenerico(
  linhas: unknown[],
  contaId: string,
  tipoConta?: TipoConta
): TransacaoImportada[] {
  if (!linhas || linhas.length === 0) {
    return []
  }
  
  // Detectar estrutura dos campos usando a primeira linha
  const primeiraLinha = linhas[0] as Record<string, unknown>
  const campos = detectarCamposCSV(primeiraLinha)
  
  return linhas.map((linhaRaw, index) => {
    try {
      const linha = linhaRaw as Record<string, unknown>
      
      // Extrair valores usando os campos detectados
      const dataStr = String(linha[campos.data] || '')
      const valorStr = String(linha[campos.valor] || '0')
      const descricaoStr = String(linha[campos.descricao] || '')
      const identificadorStr = campos.identificador ? String(linha[campos.identificador] || '') : ''
      
      // Validar e converter valor
      const valor = parseFloat(valorStr.replace(',', '.')) // Suporte para vírgula decimal
      if (isNaN(valor)) {
        throw new Error(`Valor inválido na linha ${index + 1}: ${valorStr}`)
      }
      
      // Normalizar data
      const dataNormalizada = normalizarData(dataStr)
      
      // Gerar identificador se não fornecido
      const identificadorFinal = identificadorStr || 
        gerarIdentificadorUnico(dataNormalizada, descricaoStr, valor)
      
      // Construir transação
      const tipoContaFinal = tipoConta || 'conta_corrente' // Fallback para conta corrente
      const transacao: TransacaoImportada = {
        data: dataNormalizada,
        valor: Math.abs(valor), // Sempre positivo internamente
        identificador_externo: identificadorFinal,
        descricao: descricaoStr.trim(),
        conta_id: contaId,
        tipo: determinarTipoTransacao(valor, tipoContaFinal)
      }
      
      return transacao
    } catch (error) {
      throw new Error(`Erro na linha ${index + 1}: ${error}`)
    }
  })
}

/**
 * Detecta se o CSV tem formato válido para importação
 */
export function validarFormatoCSV(dados: unknown[]): boolean {
  try {
    if (!dados || dados.length === 0) return false
    
    const primeiraLinha = dados[0] as Record<string, unknown>
    detectarCamposCSV(primeiraLinha)
    
    return true
  } catch {
    return false
  }
}

/**
 * Obtém informações sobre o formato detectado
 */
export function obterInfoFormato(dados: unknown[]): {
  campos: string[]
  totalLinhas: number
  formatoDetectado: string
} {
  if (!dados || dados.length === 0) {
    return { campos: [], totalLinhas: 0, formatoDetectado: 'vazio' }
  }
  
  const primeiraLinha = dados[0] as Record<string, unknown>
  const campos = Object.keys(primeiraLinha)
  
  // Detectar tipo provável baseado nos campos
  let formatoDetectado = 'generico'
  if (campos.includes('Data') && campos.includes('Identificador')) {
    formatoDetectado = 'nubank_conta'
  } else if (campos.includes('date') && campos.includes('title') && campos.includes('amount')) {
    formatoDetectado = 'nubank_cartao'
  }
  
  return {
    campos,
    totalLinhas: dados.length,
    formatoDetectado
  }
}