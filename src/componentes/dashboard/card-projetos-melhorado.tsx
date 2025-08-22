'use client'

import React from 'react'
import { TrendingUp, TrendingDown, Target, DollarSign } from 'lucide-react'
import { useProjetosDashboard } from '@/hooks/usar-projetos-dados'
import type { ProjetoPessoal } from '@/tipos/projetos-pessoais'

interface CardProjetosPessoaisProps {
  limite?: number
}

export function CardProjetosPessoais({ limite = 3 }: CardProjetosPessoaisProps) {
  const { data, isLoading, error } = useProjetosDashboard()

  // Proteção extra contra dados undefined
  const projetos = React.useMemo(() => {
    if (!data?.projetos || !Array.isArray(data.projetos)) return []
    return data.projetos.slice(0, limite)
  }, [data?.projetos, limite])

  // Função para obter ícone e descrição clara do status
  const obterStatusClaro = (projeto: ProjetoPessoal) => {
    if (projeto.modo_calculo === 'orcamento') {
      // Usar dados já calculados no serviço
      const valorRestante = projeto.valor_restante_orcamento || 0
      return {
        icone: <Target className="w-4 h-4" />,
        titulo: projeto.label_percentual,
        subtitulo: `R$ ${valorRestante.toLocaleString('pt-BR')} restante`,
        cor: projeto.status_cor === 'vermelho' ? 'text-red-600 bg-red-50' : 
             projeto.status_cor === 'verde-escuro' ? 'text-yellow-600 bg-yellow-50' :
             'text-green-600 bg-green-50'
      }
    } else {
      // Modo ROI - usar dados já calculados
      const temReceitas = projeto.total_receitas > 0
      if (!temReceitas) {
        return {
          icone: <DollarSign className="w-4 h-4" />,
          titulo: 'Projeto em desenvolvimento',
          subtitulo: `${projeto.total_despesas_formatado} investido`,
          cor: 'text-gray-600 bg-gray-50'
        }
      }
      
      const lucrativo = projeto.resultado > 0
      return {
        icone: lucrativo ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />,
        titulo: `${projeto.label_percentual} - ${lucrativo ? 'Lucro' : 'Prejuízo'} ${projeto.resultado_formatado}`,
        subtitulo: `${projeto.total_receitas_formatado} receitas - ${projeto.total_despesas_formatado} gastos`,
        cor: lucrativo ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'
      }
    }
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 animate-pulse">
        <div className="flex items-center justify-between mb-4">
          <div className="h-6 bg-gray-200 rounded w-36"></div>
        </div>
        <div className="space-y-4">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="h-5 bg-gray-200 rounded w-32"></div>
                <div className="h-6 bg-gray-200 rounded w-20"></div>
              </div>
              <div className="h-4 bg-gray-200 rounded w-full"></div>
            </div>
          ))}
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
        <div className="text-center py-6">
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <DollarSign className="w-6 h-6 text-gray-400" />
          </div>
          <p className="text-sm text-gray-500 mb-1">Nenhum projeto ativo</p>
          <p className="text-xs text-gray-400">Crie transações e associe a um centro de custo</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 animate-slide-up">
      {/* Header simples */}
      <div className="mb-4">
        <h3 className="text-sm font-medium text-gray-900">Projetos Pessoais</h3>
      </div>

      {/* Lista de projetos - design melhorado */}
      <div className="space-y-4">
        {projetos.map((projeto) => {
          const status = obterStatusClaro(projeto)
          
          return (
            <div 
              key={projeto.id} 
              className="cursor-pointer group hover:bg-gray-50 rounded-lg p-3 -m-3 transition-colors border-l-4"
              style={{ borderLeftColor: projeto.cor }}
            >
              {/* Cabeçalho do projeto */}
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center space-x-2 min-w-0 flex-1">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${status.cor}`}>
                    {status.icone}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-medium text-gray-900 truncate">
                      {projeto.nome}
                    </h4>
                    <p className="text-xs text-gray-500 truncate">
                      {status.titulo}
                    </p>
                  </div>
                </div>
                <div className="text-right ml-2">
                  <div className={`text-sm font-semibold ${
                    projeto.resultado >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {projeto.resultado >= 0 ? '+' : ''}{projeto.resultado_formatado}
                  </div>
                </div>
              </div>

              {/* Detalhes explicativos */}
              <div className="ml-10">
                <p className="text-xs text-gray-500">
                  {status.subtitulo}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}