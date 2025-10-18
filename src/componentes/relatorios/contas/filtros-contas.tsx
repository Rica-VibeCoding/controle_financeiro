'use client'

import { Search, Calendar, X } from 'lucide-react'
import type { FiltrosContas } from '@/tipos/contas'
import { useDadosAuxiliares } from '@/contextos/dados-auxiliares-contexto'

interface FiltrosContasProps {
  filtros: FiltrosContas
  onFiltrosChange: (filtros: FiltrosContas) => void
}

export function FiltrosContasComponent({ filtros, onFiltrosChange }: FiltrosContasProps) {
  const { dados } = useDadosAuxiliares()

  const periodos = [
    { valor: '30_dias', label: 'Próximos 30 dias' },
    { valor: '60_dias', label: 'Próximos 60 dias' },
    { valor: '90_dias', label: 'Próximos 90 dias' },
    { valor: 'personalizado', label: 'Personalizado' }
  ] as const

  const temFiltrosAtivos = filtros.categoria || filtros.busca

  const handleLimparFiltros = () => {
    onFiltrosChange({
      periodo: filtros.periodo,
      categoria: undefined,
      busca: undefined
    })
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Filtro: Período */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
            <Calendar className="h-4 w-4" />
            Período
          </label>
          <select
            value={filtros.periodo}
            onChange={(e) => onFiltrosChange({
              ...filtros,
              periodo: e.target.value as FiltrosContas['periodo']
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
          >
            {periodos.map((periodo) => (
              <option key={periodo.valor} value={periodo.valor}>
                {periodo.label}
              </option>
            ))}
          </select>
        </div>

        {/* Filtro: Categoria */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Categoria
          </label>
          <select
            value={filtros.categoria || ''}
            onChange={(e) => onFiltrosChange({
              ...filtros,
              categoria: e.target.value || undefined
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
          >
            <option value="">Todas as categorias</option>
            {dados.categorias.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.nome}
              </option>
            ))}
          </select>
        </div>

        {/* Filtro: Busca */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
            <Search className="h-4 w-4" />
            Buscar
          </label>
          <div className="relative">
            <input
              type="text"
              placeholder="Descrição ou contato..."
              value={filtros.busca || ''}
              onChange={(e) => onFiltrosChange({
                ...filtros,
                busca: e.target.value || undefined
              })}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-400"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          </div>
        </div>
      </div>

      {/* Período Personalizado (se selecionado) */}
      {filtros.periodo === 'personalizado' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-200">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Data Início
            </label>
            <input
              type="date"
              value={filtros.dataInicio || ''}
              onChange={(e) => onFiltrosChange({
                ...filtros,
                dataInicio: e.target.value || undefined
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Data Fim
            </label>
            <input
              type="date"
              value={filtros.dataFim || ''}
              onChange={(e) => onFiltrosChange({
                ...filtros,
                dataFim: e.target.value || undefined
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
            />
          </div>
        </div>
      )}

      {/* Botão Limpar Filtros */}
      {temFiltrosAtivos && (
        <div className="mt-4 flex justify-end">
          <button
            onClick={handleLimparFiltros}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <X className="h-4 w-4" />
            Limpar Filtros
          </button>
        </div>
      )}
    </div>
  )
}
