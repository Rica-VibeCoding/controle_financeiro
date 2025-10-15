'use client'

import { Calendar, ArrowUpDown } from 'lucide-react'
import type { FiltrosROI } from '@/tipos/roi-cliente'

interface FiltrosROIProps {
  filtros: FiltrosROI
  onFiltrosChange: (filtros: FiltrosROI) => void
}

export function FiltrosROI({ filtros, onFiltrosChange }: FiltrosROIProps) {
  const periodos = [
    { valor: 'todo', label: 'Todo período' },
    { valor: 'mes_atual', label: 'Mês atual' },
    { valor: '3_meses', label: 'Últimos 3 meses' },
    { valor: '6_meses', label: 'Últimos 6 meses' },
    { valor: '1_ano', label: 'Último ano' }
  ] as const

  const ordenacoes = [
    { valor: 'margem_desc', label: 'Maior Margem %' },
    { valor: 'margem_asc', label: 'Menor Margem %' },
    { valor: 'lucro_desc', label: 'Maior Lucro R$' },
    { valor: 'lucro_asc', label: 'Menor Lucro R$' },
    { valor: 'receita_desc', label: 'Maior Receita' },
    { valor: 'nome_asc', label: 'Nome A-Z' }
  ] as const

  const handlePeriodoChange = (periodo: FiltrosROI['periodo']) => {
    onFiltrosChange({
      ...filtros,
      periodo,
      dataInicio: undefined,
      dataFim: undefined
    })
  }

  const handleOrdenacaoChange = (ordenacao: FiltrosROI['ordenacao']) => {
    onFiltrosChange({
      ...filtros,
      ordenacao
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
            onChange={(e) => handlePeriodoChange(e.target.value as FiltrosROI['periodo'])}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
          >
            {periodos.map((periodo) => (
              <option key={periodo.valor} value={periodo.valor}>
                {periodo.label}
              </option>
            ))}
          </select>
        </div>

        {/* Filtro de Ordenação */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
            <ArrowUpDown className="h-4 w-4" />
            Ordenar por
          </label>
          <select
            value={filtros.ordenacao}
            onChange={(e) => handleOrdenacaoChange(e.target.value as FiltrosROI['ordenacao'])}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
          >
            {ordenacoes.map((ordenacao) => (
              <option key={ordenacao.valor} value={ordenacao.valor}>
                {ordenacao.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  )
}
