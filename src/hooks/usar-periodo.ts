import { useState } from 'react'
import type { Periodo } from '@/tipos/dashboard'

export function usePeriodo() {
  const [data, setData] = useState(new Date()) // Mês atual (Agosto 2025)
  
  const startOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1)
  const endOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0)
  const formatDate = (date: Date) => date.toISOString().split('T')[0]
  const getMonthName = (date: Date) => date.toLocaleDateString('pt-BR', { month: 'long' })
  
  const periodo: Periodo = {
    inicio: formatDate(startOfMonth(data)),
    fim: formatDate(endOfMonth(data)),
    mes: getMonthName(data),
    ano: data.getFullYear().toString()
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