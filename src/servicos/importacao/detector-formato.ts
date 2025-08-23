import { TransacaoImportada } from '@/tipos/importacao'
import { formatosSuportados } from './mapeadores'

export interface FormatoCSV {
  nome: string
  icone: string
  detector: (headers: string[]) => number
  mapeador: (dados: unknown[], contaId: string) => TransacaoImportada[]
}

export function detectarFormato(dados: unknown[]): FormatoCSV {
  if (!dados || dados.length === 0) {
    throw new Error('CSV vazio ou inválido')
  }
  
  const headers = Object.keys(dados[0] as Record<string, unknown>).map(h => h.trim())
  
  let melhorFormato = formatosSuportados[0]
  let melhorScore = 0
  
  for (const formato of formatosSuportados) {
    const score = formato.detector(headers)
    if (score > melhorScore) {
      melhorScore = score
      melhorFormato = formato
    }
  }
  
  if (melhorScore < 50) {
    throw new Error(`Formato CSV não reconhecido. Headers encontrados: ${headers.join(', ')}`)
  }
  
  return melhorFormato
}