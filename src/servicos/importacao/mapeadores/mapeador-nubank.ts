import { LinhaCSV, TransacaoImportada } from '@/tipos/importacao'

export function mapearLinhasNubank(
  linhas: unknown[], 
  contaId: string
): TransacaoImportada[] {
  return linhas.map((linhaRaw, index) => {
    try {
      const linha = linhaRaw as LinhaCSV
      const valor = parseFloat(linha.Valor)
      if (isNaN(valor)) {
        throw new Error(`Valor inválido na linha ${index + 1}: ${linha.Valor}`)
      }
      
      return {
        data: converterDataNubank(linha.Data),
        valor: Math.abs(valor),
        identificador_externo: linha.Identificador || '',
        descricao: linha.Descrição || '',
        conta_id: contaId,
        tipo: valor >= 0 ? 'receita' : 'despesa'
      }
    } catch (error) {
      throw new Error(`Erro na linha ${index + 1}: ${error}`)
    }
  })
}

function converterDataNubank(data: string): string {
  if (!data || typeof data !== 'string') {
    throw new Error('Data inválida no CSV')
  }
  
  // DD/MM/AAAA → AAAA-MM-DD
  const partes = data.split('/')
  if (partes.length !== 3) {
    throw new Error(`Formato de data inválido: ${data}. Esperado DD/MM/AAAA`)
  }
  
  const [dia, mes, ano] = partes
  return `${ano}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`
}