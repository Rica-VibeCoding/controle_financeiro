'use client'

import { Calendar, Filter } from 'lucide-react'
import type { FiltrosFluxoCaixa } from '@/tipos/fluxo-caixa'

interface FiltrosFluxoCaixaProps {
  filtros: FiltrosFluxoCaixa
  onFiltrosChange: (filtros: FiltrosFluxoCaixa) => void
}

export function FiltrosFluxoCaixa({ filtros, onFiltrosChange }: FiltrosFluxoCaixaProps) {
  const periodos = [
    { valor: '3_meses', label: 'Últimos 3 meses' },
    { valor: '6_meses', label: 'Últimos 6 meses' },
    { valor: '12_meses', label: 'Últimos 12 meses' }
  ] as const

  const tipos = [
    { valor: 'ambos', label: 'Receitas e Despesas' },
    { valor: 'receitas', label: 'Apenas Receitas' },
    { valor: 'despesas', label: 'Apenas Despesas' }
  ] as const

  const handlePeriodoChange = (periodo: FiltrosFluxoCaixa['periodo']) => {
    onFiltrosChange({
      ...filtros,
      periodo,
      dataInicio: undefined,
      dataFim: undefined
    })
  }

  const handleTipoChange = (tipo: FiltrosFluxoCaixa['tipo']) => {
    onFiltrosChange({
      ...filtros,
      tipo
    })
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Filtro de Período */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
            <Calendar className="h-4 w-4" />
            Período
          </label>
          <select
            value={filtros.periodo}
            onChange={(e) => handlePeriodoChange(e.target.value as FiltrosFluxoCaixa['periodo'])}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
          >
            {periodos.map((periodo) => (
              <option key={periodo.valor} value={periodo.valor}>
                {periodo.label}
              </option>
            ))}
          </select>
        </div>

        {/* Filtro de Tipo */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
            <Filter className="h-4 w-4" />
            Tipo de Transação
          </label>
          <select
            value={filtros.tipo}
            onChange={(e) => handleTipoChange(e.target.value as FiltrosFluxoCaixa['tipo'])}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
          >
            {tipos.map((tipo) => (
              <option key={tipo.valor} value={tipo.valor}>
                {tipo.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  )
}
