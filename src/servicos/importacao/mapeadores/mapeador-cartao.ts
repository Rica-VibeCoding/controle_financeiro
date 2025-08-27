import { TransacaoImportada, LinhaCartao } from '@/tipos/importacao'

export function mapearLinhasCartao(
  linhas: unknown[], 
  contaId: string
): TransacaoImportada[] {
  return linhas.map((linhaRaw, index) => {
    try {
      const linha = linhaRaw as LinhaCartao
      const valor = parseFloat(linha.amount)
      if (isNaN(valor)) {
        throw new Error(`Valor inválido na linha ${index + 1}: ${linha.amount}`)
      }
      
      // Data já está no formato ISO (YYYY-MM-DD)
      const dataISO = linha.date
      
      // Gerar ID único baseado nos dados (já que não tem UUID nativo)
      const hashId = gerarHashTransacao(linha.date, linha.title, valor)
      
      return {
        data: dataISO,
        valor: Math.abs(valor),
        identificador_externo: hashId,
        descricao: linha.title || '',
        conta_id: contaId,
        tipo: valor >= 0 ? 'despesa' : 'receita' // Restaurar lógica original
      }
    } catch (error) {
      throw new Error(`Erro na linha ${index + 1}: ${error}`)
    }
  })
}

function gerarHashTransacao(data: string, titulo: string, valor: number): string {
  const textoHash = `${data}_${titulo.substring(0, 20)}_${valor}`
  return `CARTAO_${Buffer.from(textoHash).toString('base64').substring(0, 16)}`
}