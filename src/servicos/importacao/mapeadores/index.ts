import { mapearLinhasNubank } from './mapeador-nubank'
import { mapearLinhasCartao } from './mapeador-cartao'
import { FormatoCSV } from '../detector-formato'

export const formatosSuportados: FormatoCSV[] = [
  {
    nome: 'Nubank',
    icone: '💜',
    detector: (headers: string[]) => {
      const temIdentificador = headers.includes('Identificador')
      const temDescricao = headers.includes('Descrição')
      const temData = headers.includes('Data')
      const temValor = headers.includes('Valor')
      
      if (temIdentificador && temDescricao && temData && temValor) return 95
      if (temIdentificador && temDescricao) return 85
      if (temIdentificador || temDescricao) return 60
      return 0
    },
    mapeador: mapearLinhasNubank
  },
  {
    nome: 'Cartão de crédito',
    icone: '💳',
    detector: (headers: string[]) => {
      const temDate = headers.includes('date')
      const temTitle = headers.includes('title')  
      const temAmount = headers.includes('amount')
      
      if (temDate && temTitle && temAmount) return 90
      if (temDate && temTitle) return 70
      if (temDate || temTitle) return 40
      return 0
    },
    mapeador: mapearLinhasCartao
  }
]