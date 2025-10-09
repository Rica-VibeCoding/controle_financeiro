import { TransacaoImportada, TipoConta, TemplateBanco } from '@/tipos/importacao'
import { normalizarData } from '@/utilitarios/data-helpers'

/**
 * FASE 2 - Mapeador CSV Genérico Único
 * 
 * Substitui todos os mapeadores específicos por um único mapeador inteligente
 * que detecta automaticamente o formato dos dados e normaliza para o padrão interno.
 */

interface CamposCSV {
  data: string
  valor?: string
  descricao: string
  identificador?: string
  // Para formatos com crédito/débito separados (ex: Conta Simples)
  credito?: string
  debito?: string
  observacoes?: string
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
 * Com suporte a template: prioriza campos do template
 */
function detectarCamposCSV(
  linha: Record<string, unknown>,
  template?: TemplateBanco
): CamposCSV {
  const campos = Object.keys(linha)
  const resultado: Partial<CamposCSV> = {}

  // Se tem template, usar campos do template primeiro
  const camposData = template?.colunas.data || MAPEAMENTO_CAMPOS.data
  const camposValor = template?.colunas.valor || MAPEAMENTO_CAMPOS.valor
  const camposDescricao = template?.colunas.descricao || MAPEAMENTO_CAMPOS.descricao
  const camposIdentificador = template?.colunas.identificador || MAPEAMENTO_CAMPOS.identificador

  // Detectar campo de data
  for (const campo of campos) {
    if (camposData.includes(campo)) {
      resultado.data = campo
      break
    }
  }

  // Detectar campo de valor
  for (const campo of campos) {
    if (camposValor.includes(campo)) {
      resultado.valor = campo
      break
    }
  }

  // Detectar campo de descrição
  for (const campo of campos) {
    if (camposDescricao.includes(campo)) {
      resultado.descricao = campo
      break
    }
  }

  // Detectar campo de identificador (opcional)
  for (const campo of campos) {
    if (camposIdentificador.includes(campo)) {
      resultado.identificador = campo
      break
    }
  }

  // Detectar campos de crédito/débito se template tiver
  if (template?.colunas.creditoDebito) {
    for (const campo of campos) {
      if (template.colunas.creditoDebito.credito.includes(campo)) {
        resultado.credito = campo
        break
      }
    }
    for (const campo of campos) {
      if (template.colunas.creditoDebito.debito.includes(campo)) {
        resultado.debito = campo
        break
      }
    }
  }

  // Detectar campo de observações (opcional)
  if (template?.colunas.observacoes) {
    for (const campo of campos) {
      if (template.colunas.observacoes.includes(campo)) {
        resultado.observacoes = campo
        break
      }
    }
  }

  // Validar campos obrigatórios
  // Se tem crédito/débito, não precisa de valor único
  const temValor = resultado.valor || (resultado.credito && resultado.debito)
  if (!resultado.data || !temValor || !resultado.descricao) {
    const camposEncontrados = Object.keys(linha).join(', ')
    throw new Error(
      `Campos obrigatórios não encontrados no CSV. ` +
      `Esperado: data, (valor OU crédito+débito), descrição. ` +
      `Encontrado: ${camposEncontrados}`
    )
  }

  return resultado as CamposCSV
}

/**
 * Normaliza formato de data para YYYY-MM-DDTHH:mm:ss
 * IMPORTANTE: Preserva hora/minuto/segundo quando disponível (essencial para detectar duplicatas)
 * Usa função centralizada de data-helpers.ts
 */
function normalizarDataCSV(dataStr: string): string {
  if (!dataStr || typeof dataStr !== 'string') {
    throw new Error('Data inválida no CSV')
  }

  const resultado = normalizarData(dataStr)

  if (!resultado) {
    throw new Error(`Formato de data não suportado: ${dataStr}. Formatos aceitos: YYYY-MM-DD, DD/MM/YYYY, DD-MM-YYYY, DD/MM/YYYY HH:mm:ss`)
  }

  return resultado
}

/**
 * Gera identificador único baseado nos dados da transação
 * MELHORIAS:
 * - Usa descrição COMPLETA (não mais substring de 20 chars)
 * - Data com hora/minuto/segundo quando disponível (ex: 2025-10-06T16:20:00)
 * - Hash SHA-256 robusto (praticamente sem colisões)
 */
function gerarIdentificadorUnico(data: string, descricao: string, valor: number): string {
  // Usar descrição completa + data completa (com hora se disponível) + valor
  const textoHash = `${data}_${descricao}_${valor.toFixed(2)}`

  // SHA-256 para evitar colisões (mais robusto que base64)
  const crypto = require('crypto')
  const hash = crypto
    .createHash('sha256')
    .update(textoHash, 'utf8')
    .digest('hex')
    .substring(0, 24) // 24 caracteres hexadecimais = 96 bits de entropia

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
 * Aceita template opcional para configuração específica
 */
export function mapearLinhasGenerico(
  linhas: unknown[],
  contaId: string,
  tipoConta?: TipoConta,
  template?: TemplateBanco
): TransacaoImportada[] {
  if (!linhas || linhas.length === 0) {
    return []
  }

  // Detectar estrutura dos campos usando a primeira linha
  const primeiraLinha = linhas[0] as Record<string, unknown>
  const campos = detectarCamposCSV(primeiraLinha, template)

  // Separador decimal do template (padrão: ponto)
  const separadorDecimal = template?.validacao.decimal || '.'

  return linhas.map((linhaRaw, index) => {
    try {
      const linha = linhaRaw as Record<string, unknown>

      // Extrair valores usando os campos detectados
      const dataStr = String(linha[campos.data] || '')
      const descricaoStr = String(linha[campos.descricao] || '')
      const identificadorStr = campos.identificador ? String(linha[campos.identificador] || '') : ''

      // Determinar valor: pode vir de coluna única ou crédito/débito separados
      let valor: number
      let tipoExplicito: 'receita' | 'despesa' | undefined

      if (campos.credito && campos.debito) {
        // Formato Conta Simples: colunas separadas
        const creditoStr = String(linha[campos.credito] || '0')
        const debitoStr = String(linha[campos.debito] || '0')

        // Normalizar valores (suporte a vírgula)
        const creditoNorm = separadorDecimal === ','
          ? creditoStr.replace('.', '').replace(',', '.')
          : creditoStr.replace(',', '')
        const debitoNorm = separadorDecimal === ','
          ? debitoStr.replace('.', '').replace(',', '.')
          : debitoStr.replace(',', '')

        const credito = parseFloat(creditoNorm) || 0
        const debito = parseFloat(debitoNorm) || 0

        // Se tem crédito, é receita (valor positivo)
        // Se tem débito, é despesa (valor negativo)
        if (credito > 0 && debito === 0) {
          valor = credito
          tipoExplicito = 'receita'
        } else if (debito > 0 && credito === 0) {
          valor = debito
          tipoExplicito = 'despesa'
        } else {
          // Ambos preenchidos ou ambos vazios - erro
          throw new Error(`Linha ${index + 1}: apenas um dos campos (crédito ou débito) deve estar preenchido`)
        }
      } else {
        // Formato padrão: coluna única de valor
        const valorStr = String(linha[campos.valor!] || '0')

        // Validar e converter valor (suporte a vírgula e ponto)
        let valorNormalizado = valorStr
        if (separadorDecimal === ',') {
          // Converter vírgula para ponto
          valorNormalizado = valorStr.replace('.', '').replace(',', '.')
        } else {
          // Remover vírgulas que podem ser separadores de milhar
          valorNormalizado = valorStr.replace(',', '.')
        }

        valor = parseFloat(valorNormalizado)
        if (isNaN(valor)) {
          throw new Error(`Valor inválido na linha ${index + 1}: ${valorStr}`)
        }
      }

      // Normalizar data
      const dataNormalizada = normalizarDataCSV(dataStr)

      // SEMPRE gerar UUID próprio (data+hora+descrição+valor)
      // IMPORTANTE: NÃO usar identificadorStr (CPF/CNPJ do CSV) porque:
      // - Mesma empresa pode receber múltiplos pagamentos
      // - Causaria duplicatas falsas (ex: 3 pagamentos para UBER = 3 duplicatas)
      // - UUID gerado garante unicidade por transação
      const identificadorFinal = gerarIdentificadorUnico(dataNormalizada, descricaoStr, valor)

      // Construir transação
      const tipoContaFinal = tipoConta || 'conta_corrente' // Fallback para conta corrente

      // Se tipo foi explicitamente determinado (crédito/débito), usar ele
      // Senão, determinar baseado no valor e tipo da conta
      const tipoFinal = tipoExplicito || determinarTipoTransacao(valor, tipoContaFinal)

      const transacao: TransacaoImportada = {
        data: dataNormalizada,
        valor: Math.abs(valor), // Sempre positivo internamente
        identificador_externo: identificadorFinal,
        descricao: descricaoStr.trim(),
        conta_id: contaId,
        tipo: tipoFinal
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