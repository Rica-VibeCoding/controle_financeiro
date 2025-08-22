'use client'

import React from 'react'
import { Plus, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { useProjetosDashboard } from '@/hooks/usar-projetos-dados'
import type { ProjetoPessoal } from '@/tipos/projetos-pessoais'

interface CardProjetosPessoaisProps {
  limite?: number
}

export function CardProjetosPessoais({ limite = 5 }: CardProjetosPessoaisProps) {
  const { data, isLoading, error } = useProjetosDashboard()

  // Proteção extra contra dados undefined
  const projetos = React.useMemo(() => {
    if (!data?.projetos || !Array.isArray(data.projetos)) return []
    return data.projetos.slice(0, limite)
  }, [data?.projetos, limite])

  // Mapeamento de cores para classes CSS (seguindo padrão do dashboard)
  const obterClassesCor = (cor: ProjetoPessoal['status_cor']) => {
    switch (cor) {
      case 'verde':
        return 'text-green-600 bg-green-50'
      case 'verde-escuro':
        return 'text-green-700 bg-green-100'
      case 'vermelho':
        return 'text-red-600 bg-red-50'
      case 'cinza':
      default:
        return 'text-gray-600 bg-gray-50'
    }
  }

  // Ícone baseado no tipo de resultado
  const obterIconeResultado = (projeto: ProjetoPessoal) => {
    if (projeto.modo_calculo === 'roi') {
      if (projeto.resultado > 0) return <TrendingUp className="w-4 h-4" />
      if (projeto.resultado < 0) return <TrendingDown className="w-4 h-4" />
      return <Minus className="w-4 h-4" />
    } else {
      // Para orçamento, sempre trending up/down baseado na % usada
      return projeto.percentual_principal >= 90 
        ? <TrendingDown className="w-4 h-4" /> 
        : <TrendingUp className="w-4 h-4" />
    }
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 animate-pulse">
        <div className="flex items-center justify-between mb-4">
          <div className="h-6 bg-gray-200 rounded w-36"></div>
        </div>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="h-4 bg-gray-200 rounded w-24"></div>
                <div className="h-5 bg-gray-200 rounded w-16"></div>
              </div>
              <div className="h-3 bg-gray-200 rounded w-32"></div>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-3 border-t border-gray-100">
          <div className="h-8 bg-gray-200 rounded w-full"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-gray-900">Projetos Pessoais</h3>
        </div>
        <div className="text-center py-4">
          <p className="text-sm text-red-600">Erro ao carregar projetos</p>
        </div>
      </div>
    )
  }

  if (!projetos.length) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-gray-900">Projetos Pessoais</h3>
        </div>
        <div className="text-center py-4">
          <p className="text-sm text-gray-500 mb-3">Nenhum projeto encontrado</p>
          <button className="inline-flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-700">
            <Plus className="w-4 h-4" />
            <span>Criar primeiro projeto</span>
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-900">Projetos Pessoais</h3>
        {data?.resumo && (
          <span className="text-xs text-gray-500">
            {data.resumo.projetos_ativos} ativo{data.resumo.projetos_ativos !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Lista de projetos */}
      <div className="space-y-3">
        {projetos.map((projeto) => (
          <div 
            key={projeto.id} 
            className="cursor-pointer group hover:bg-gray-50 rounded-lg p-2 -m-2 transition-colors"
          >
            {/* Linha principal: Nome + Status */}
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center space-x-2 min-w-0 flex-1">
                <div className={`w-4 h-4 rounded flex items-center justify-center ${obterClassesCor(projeto.status_cor)}`}>
                  {obterIconeResultado(projeto)}
                </div>
                <span className="text-sm font-medium text-gray-900 truncate">
                  {projeto.nome}
                </span>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${obterClassesCor(projeto.status_cor)}`}>
                {projeto.label_percentual}
              </span>
            </div>

            {/* Linha secundária: Resultado financeiro */}
            <div className="ml-6">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">
                  {projeto.modo_calculo === 'orcamento' ? (
                    <>
                      {projeto.valor_restante_orcamento !== null && projeto.valor_restante_orcamento >= 0 
                        ? `${projeto.valor_restante_orcamento.toLocaleString('pt-BR', { 
                            style: 'currency', 
                            currency: 'BRL', 
                            minimumFractionDigits: 0 
                          })} restante`
                        : 'Orçamento ultrapassado'
                      }
                    </>
                  ) : (
                    <>
                      ↗️ {projeto.total_receitas_formatado.replace('R$', '').trim()} 
                      ↘️ {projeto.total_despesas_formatado.replace('R$', '').trim()}
                    </>
                  )}
                </span>
                <span className={`font-medium ${
                  projeto.resultado >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {projeto.resultado >= 0 ? '+' : ''}{projeto.resultado_formatado}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer com ação */}
      <div className="mt-4 pt-3 border-t border-gray-100">
        <button className="w-full inline-flex items-center justify-center space-x-1 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg py-2 transition-colors">
          <Plus className="w-4 h-4" />
          <span>Novo Projeto</span>
        </button>
      </div>

      {/* Resumo opcional no rodapé */}
      {data?.resumo && projetos.length > 1 && (
        <div className="mt-2 pt-2 border-t border-gray-50">
          <div className="flex justify-between text-xs text-gray-500">
            <span>Total geral:</span>
            <span className={`font-medium ${
              data.resumo.resultado_geral >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {data.resumo.resultado_geral >= 0 ? '+' : ''}
              {data.resumo.resultado_geral.toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL',
                minimumFractionDigits: 0
              })}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}