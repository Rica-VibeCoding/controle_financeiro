'use client'

import { useState, Fragment } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { LinhaClienteExpandida } from './linha-cliente-expandida'
import type { ClienteROI, FiltrosROI } from '@/tipos/roi-cliente'

interface TabelaROIProps {
  clientes: ClienteROI[]
  isLoading: boolean
  filtros: FiltrosROI
}

export function TabelaROI({ clientes, isLoading, filtros }: TabelaROIProps) {
  const [expandido, setExpandido] = useState<string | null>(null)

  const formatarValor = (valor: number): string => {
    return valor.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })
  }

  const obterCorMargem = (margem: number) => {
    if (margem >= 30) return { cor: 'text-green-600', icone: '🟢' }
    if (margem >= 10) return { cor: 'text-yellow-600', icone: '🟡' }
    return { cor: 'text-red-600', icone: '🔴' }
  }

  const toggleExpandir = (id: string) => {
    setExpandido(expandido === id ? null : id)
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-900 uppercase tracking-wider">
                  Receita
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-900 uppercase tracking-wider">
                  Despesa
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-900 uppercase tracking-wider">
                  Lucro
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-900 uppercase tracking-wider">
                  Margem
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {[1, 2, 3].map((i) => (
                <tr key={i} className="animate-pulse">
                  <td className="px-4 py-4">
                    <div className="h-4 bg-gray-200 rounded w-32" />
                  </td>
                  <td className="px-4 py-4">
                    <div className="h-4 bg-gray-200 rounded w-24 ml-auto" />
                  </td>
                  <td className="px-4 py-4">
                    <div className="h-4 bg-gray-200 rounded w-24 ml-auto" />
                  </td>
                  <td className="px-4 py-4">
                    <div className="h-4 bg-gray-200 rounded w-24 ml-auto" />
                  </td>
                  <td className="px-4 py-4">
                    <div className="h-4 bg-gray-200 rounded w-20 ml-auto" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  if (clientes.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
        <p className="text-gray-500">Nenhum cliente com movimentações encontrado.</p>
        <p className="text-sm text-gray-400 mt-2">
          Adicione transações vinculadas a centros de custo para visualizar o ROI.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                Cliente
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-900 uppercase tracking-wider">
                Receita
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-900 uppercase tracking-wider">
                Despesa
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-900 uppercase tracking-wider">
                Lucro
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-900 uppercase tracking-wider">
                Margem
              </th>
            </tr>
          </thead>
          <tbody className="bg-white">
            {clientes.map((cliente) => {
              const { cor, icone } = obterCorMargem(cliente.margem)
              const isExpandido = expandido === cliente.id

              return (
                <Fragment key={cliente.id}>
                  <tr
                    className="hover:bg-gray-50 cursor-pointer transition-colors border-b border-gray-200"
                    onClick={() => toggleExpandir(cliente.id)}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {isExpandido ? (
                          <ChevronDown className="h-4 w-4 text-gray-400" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-gray-400" />
                        )}
                        <span className="font-medium text-gray-900">{cliente.nome}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right bg-green-50">
                      <span className="text-gray-900">R$ {formatarValor(cliente.receita)}</span>
                    </td>
                    <td className="px-4 py-3 text-right bg-red-50">
                      <span className="text-gray-900">R$ {formatarValor(cliente.despesa)}</span>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-900">
                      R$ {formatarValor(cliente.lucro)}
                    </td>
                    <td className={`px-4 py-3 text-right font-bold ${cor}`}>
                      {cliente.margem.toFixed(1)}% {icone}
                    </td>
                  </tr>
                  {isExpandido && (
                    <tr>
                      <td colSpan={5} className="p-0">
                        <LinhaClienteExpandida
                          clienteId={cliente.id}
                          clienteNome={cliente.nome}
                          filtros={filtros}
                        />
                      </td>
                    </tr>
                  )}
                </Fragment>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
