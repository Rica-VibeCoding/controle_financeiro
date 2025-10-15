'use client'

import { useState, useEffect } from 'react'
import { Loader2, TrendingUp, ChevronDown, ChevronUp } from 'lucide-react'
import { buscarDetalhesCliente, buscarEvolucaoCliente } from '@/servicos/supabase/roi-cliente-queries'
import type { DetalhesCliente, FiltrosROI, EvolucaoMensal } from '@/tipos/roi-cliente'
import { useAuth } from '@/contextos/auth-contexto'
import { GraficoEvolucao } from './grafico-evolucao'

interface LinhaClienteExpandidaProps {
  clienteId: string
  clienteNome: string
  filtros: FiltrosROI
}

export function LinhaClienteExpandida({ clienteId, clienteNome, filtros }: LinhaClienteExpandidaProps) {
  const { workspace } = useAuth()
  const [detalhes, setDetalhes] = useState<DetalhesCliente | null>(null)
  const [evolucao, setEvolucao] = useState<EvolucaoMensal[]>([])
  const [mostrarGrafico, setMostrarGrafico] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingEvolucao, setIsLoadingEvolucao] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function carregarDetalhes() {
      if (!workspace) return

      try {
        setIsLoading(true)
        setError(null)
        const dados = await buscarDetalhesCliente(workspace.id, clienteId, filtros)
        setDetalhes(dados)
      } catch (err) {
        console.error('Erro ao carregar detalhes:', err)
        setError(err instanceof Error ? err.message : 'Erro desconhecido')
      } finally {
        setIsLoading(false)
      }
    }

    carregarDetalhes()
  }, [clienteId, workspace, filtros])

  const carregarEvolucao = async () => {
    if (!workspace || evolucao.length > 0) {
      setMostrarGrafico(!mostrarGrafico)
      return
    }

    try {
      setIsLoadingEvolucao(true)
      const dados = await buscarEvolucaoCliente(workspace.id, clienteId, filtros)
      setEvolucao(dados)
      setMostrarGrafico(true)
    } catch (err) {
      console.error('Erro ao carregar evolução:', err)
    } finally {
      setIsLoadingEvolucao(false)
    }
  }

  const formatarValor = (valor: number): string => {
    return valor.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })
  }

  if (isLoading) {
    return (
      <div className="px-4 py-6 bg-gray-50">
        <div className="flex items-center justify-center gap-2 text-gray-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Carregando detalhes...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="px-4 py-6 bg-red-50">
        <p className="text-red-700 text-sm">Erro ao carregar detalhes: {error}</p>
      </div>
    )
  }

  if (!detalhes || (detalhes.receitas.length === 0 && detalhes.despesas.length === 0)) {
    return (
      <div className="px-4 py-6 bg-gray-50">
        <p className="text-gray-500 text-sm text-center">Nenhum detalhe disponível</p>
      </div>
    )
  }

  return (
    <div className="px-4 py-6 bg-gray-50 space-y-6">
      {/* Receitas */}
      {detalhes.receitas.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            📈 RECEITAS (R$ {formatarValor(detalhes.totais.receita)})
          </h4>
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">Categoria</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">Subcategoria</th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-gray-900 uppercase tracking-wider">Qtd</th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-gray-900 uppercase tracking-wider">Valor</th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-gray-900 uppercase tracking-wider">%</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {detalhes.receitas.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-3 py-2 text-gray-900">{item.categoria}</td>
                    <td className="px-3 py-2 text-gray-600">
                      {item.subcategoria || '-'}
                    </td>
                    <td className="px-3 py-2 text-right text-gray-600">{item.quantidade}</td>
                    <td className="px-3 py-2 text-right font-medium text-green-600">
                      R$ {formatarValor(item.valor)}
                    </td>
                    <td className="px-3 py-2 text-right text-gray-600">
                      {item.percentual.toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Despesas */}
      {detalhes.despesas.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            📉 DESPESAS (R$ {formatarValor(detalhes.totais.despesa)})
          </h4>
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">Categoria</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">Subcategoria</th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-gray-900 uppercase tracking-wider">Qtd</th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-gray-900 uppercase tracking-wider">Valor</th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-gray-900 uppercase tracking-wider">%</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {detalhes.despesas.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-3 py-2 text-gray-900">{item.categoria}</td>
                    <td className="px-3 py-2 text-gray-600">
                      {item.subcategoria || '-'}
                    </td>
                    <td className="px-3 py-2 text-right text-gray-600">{item.quantidade}</td>
                    <td className="px-3 py-2 text-right font-medium text-red-600">
                      R$ {formatarValor(item.valor)}
                    </td>
                    <td className="px-3 py-2 text-right text-gray-600">
                      {item.percentual.toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Botão Ver Evolução */}
      <div className="flex justify-center pt-4">
        <button
          onClick={carregarEvolucao}
          disabled={isLoadingEvolucao}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoadingEvolucao ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Carregando evolução...</span>
            </>
          ) : (
            <>
              <TrendingUp className="h-4 w-4" />
              <span>{mostrarGrafico ? 'Ocultar' : 'Ver'} Evolução no Tempo</span>
              {mostrarGrafico ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </>
          )}
        </button>
      </div>

      {/* Gráfico de Evolução */}
      {mostrarGrafico && (
        <div className="mt-4">
          <GraficoEvolucao
            dados={evolucao}
            clienteNome={clienteNome}
            isLoading={isLoadingEvolucao}
          />
        </div>
      )}
    </div>
  )
}
