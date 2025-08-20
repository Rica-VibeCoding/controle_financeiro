import { useState } from 'react'
import { format, startOfMonth, endOfMonth } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { Periodo } from '@/tipos/dashboard'

export function usePeriodo() {
  const [data, setData] = useState(new Date()) // Mês atual (Agosto 2025)
  
  const periodo: Periodo = {
    inicio: format(startOfMonth(data), 'yyyy-MM-dd'),
    fim: format(endOfMonth(data), 'yyyy-MM-dd'),
    mes: format(data, 'MMMM', { locale: ptBR }),
    ano: format(data, 'yyyy')
  }
  
  const mudarMes = (direcao: 'anterior' | 'proximo') => {
    setData(prev => {
      const novaData = new Date(prev)
      if (direcao === 'anterior') {
        novaData.setMonth(prev.getMonth() - 1)
      } else {
        novaData.setMonth(prev.getMonth() + 1)
      }
      return novaData
    })
  }
  
  return { periodo, mudarMes }
}