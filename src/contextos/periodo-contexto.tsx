'use client'

import { createContext, useContext, useState, ReactNode } from 'react'
import type { Periodo } from '@/tipos/dashboard'

/**
 * Interface do contexto de período
 */
interface PeriodoContextType {
  periodo: Periodo
  mudarMes: (direcao: 'anterior' | 'proximo') => void
  voltarParaHoje: () => void
}

const PeriodoContexto = createContext<PeriodoContextType | undefined>(undefined)

interface PeriodoProviderProps {
  children: ReactNode
}

/**
 * Provider para estado centralizado de período
 * Usado para sincronizar seletor e dados filtráveis
 */
export function PeriodoProvider({ children }: PeriodoProviderProps) {
  const [data, setData] = useState(new Date()) // Mês atual

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

  const voltarParaHoje = () => {
    setData(new Date())
  }

  const value: PeriodoContextType = {
    periodo,
    mudarMes,
    voltarParaHoje
  }

  return (
    <PeriodoContexto.Provider value={value}>
      {children}
    </PeriodoContexto.Provider>
  )
}

/**
 * Hook para usar período em qualquer componente
 * @returns Contexto de período compartilhado
 */
export function usePeriodoContexto() {
  const context = useContext(PeriodoContexto)
  if (context === undefined) {
    throw new Error('usePeriodoContexto deve ser usado dentro de PeriodoProvider')
  }
  return context
}