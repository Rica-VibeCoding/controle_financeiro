'use client'

import type { DadosFluxoCaixa } from '@/tipos/fluxo-caixa'

interface TabelaVariacaoProps {
  dados: DadosFluxoCaixa[]
  isLoading: boolean
}

export function TabelaVariacao({ dados, isLoading }: TabelaVariacaoProps) {
  const formatarValor = (valor: number): string => {
    return valor.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })
  }

  const obterCorVariacao = (percentual: number) => {
    if (percentual >= -5 && percentual <= 5) return { cor: 'text-green-600', bg: 'bg-green-50' }
    if (percentual >= -10 && percentual <= 10) return { cor: 'text-yellow-600', bg: 'bg-yellow-50' }
    return { cor: 'text-red-600', bg: 'bg-red-50' }
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                  Mês
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-900 uppercase tracking-wider">
                  Previsto
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-900 uppercase tracking-wider">
                  Realizado
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-900 uppercase tracking-wider">
                  Diferença
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-900 uppercase tracking-wider">
                  Variação
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {[1, 2, 3].map((i) => (
                <tr key={i} className="animate-pulse">
                  <td className="px-4 py-4">
                    <div className="h-4 bg-gray-200 rounded w-24" />
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

  if (dados.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
        <p className="text-gray-500">Nenhum dado disponível para o período selecionado.</p>
        <p className="text-sm text-gray-400 mt-2">
          Adicione transações previstas e efetivadas para visualizar a comparação.
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
                Mês
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-900 uppercase tracking-wider">
                Previsto
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-900 uppercase tracking-wider">
                Realizado
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-900 uppercase tracking-wider">
                Diferença (R$)
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-900 uppercase tracking-wider">
                Variação (%)
              </th>
            </tr>
          </thead>
          <tbody className="bg-white">
            {dados.map((item, index) => {
              const { cor, bg } = obterCorVariacao(item.variacao_percentual)

              return (
                <tr
                  key={`${item.ano}-${item.mes_numero}`}
                  className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-gray-100 transition-colors border-b border-gray-200`}
                >
                  <td className="px-4 py-3">
                    <span className="font-medium text-gray-900">{item.mes}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-blue-600 font-medium">
                      R$ {formatarValor(item.previsto)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-green-600 font-medium">
                      R$ {formatarValor(item.realizado)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className={`font-semibold ${item.variacao_valor >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {item.variacao_valor >= 0 ? '+' : ''}
                      R$ {formatarValor(Math.abs(item.variacao_valor))}
                    </span>
                  </td>
                  <td className={`px-4 py-3 text-right ${bg}`}>
                    <span className={`font-bold ${cor}`}>
                      {item.variacao_percentual >= 0 ? '+' : ''}
                      {item.variacao_percentual.toFixed(1)}%
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
