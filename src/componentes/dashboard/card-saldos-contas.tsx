'use client'

import { memo, useCallback } from 'react'
import { useContasDados } from '@/hooks/usar-contas-dados'
import { Icone } from '@/componentes/ui/icone'
import { Skeleton } from '@/componentes/ui/skeleton'

export const CardSaldosContas = memo(function CardSaldosContas() {
  // TODOS OS HOOKS NO TOPO - SEMPRE EXECUTADOS
  const { data, error, isLoading } = useContasDados()
  
  const formatarValor = useCallback((valor: number): string => {
    return valor.toLocaleString('pt-BR', { 
      minimumFractionDigits: 2,
      maximumFractionDigits: 2 
    })
  }, [])

  const formatarData = useCallback((data: string): string => {
    return new Date(data).toLocaleDateString('pt-BR', { 
      day: '2-digit', 
      month: '2-digit' 
    })
  }, [])

  // RENDERIZAÇÃO CONDICIONAL APÓS HOOKS
  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="text-center text-red-500 text-sm">
          Erro ao carregar contas
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 animate-slide-up">
      {/* Header com total */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-900">
          Contas
        </h3>
        {isLoading ? (
          <Skeleton className="h-4 w-20" />
        ) : (
          <span className="text-sm font-semibold text-blue-600">
            {formatarValor(data?.totalSaldo || 0)}
          </span>
        )}
      </div>

      {/* Grid 2x2 de contas */}
      <div className="grid grid-cols-2 gap-3">
        {isLoading ? (
          // Loading skeletons
          Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="p-3 border border-gray-100 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Skeleton className="h-4 w-4 rounded" />
                <Skeleton className="h-3 w-16" />
              </div>
              <Skeleton className="h-4 w-20" />
            </div>
          ))
        ) : (
          // Renderizar contas reais + slots vazios se necessário
          Array.from({ length: 4 }).map((_, index) => {
            const conta = data?.contas[index]
            
            if (!conta) {
              return (
                <div key={index} className="p-3 border border-gray-100 rounded-lg bg-gray-50">
                  <div className="text-center text-gray-400 text-xs">
                    Slot vazio
                  </div>
                </div>
              )
            }

            return (
              <div 
                key={conta.id}
                className="group p-3 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer relative"
                title={`Hover para ver movimentações de ${conta.nome}`}
              >
                {/* Conteúdo principal da conta */}
                <div className="flex items-center space-x-2 mb-1">
                  <Icone 
                    name={conta.icone as any} 
                    className="h-4 w-4 text-blue-600" 
                  />
                  <span className="text-xs font-medium text-gray-700 truncate">
                    {conta.nome}
                  </span>
                </div>
                <div className="text-xs text-gray-500 mb-1 capitalize">
                  {conta.tipo.replace('_', ' ')}
                </div>
                <div className="text-sm font-semibold text-gray-900">
                  {formatarValor(conta.saldo)}
                </div>

                {/* Tooltip com últimas movimentações (hover) - Z-index alto para ficar acima de outros elementos */}
                <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-xl p-3 opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none z-[9999] max-w-[calc(100vw-2rem)]">
                  <div className="text-xs font-medium text-gray-900 mb-2">
                    Últimas movimentações:
                  </div>
                  {conta.ultimasMovimentacoes && conta.ultimasMovimentacoes.length > 0 ? (
                    <div className="space-y-1 max-h-48 overflow-y-auto">
                      {conta.ultimasMovimentacoes.slice(0, 20).map((mov, movIndex) => (
                        <div key={movIndex} className="flex justify-between items-center text-xs">
                          <div className="flex-1 truncate mr-2">
                            <span className="text-gray-700">{mov.descricao}</span>
                            <span className="text-gray-500 ml-1">({formatarData(mov.data)})</span>
                          </div>
                          <span className={`font-medium ${
                            mov.tipo === 'receita' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {mov.tipo === 'receita' ? '+' : '-'}{formatarValor(mov.valor)}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-xs text-gray-500">
                      Nenhuma movimentação recente
                    </div>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
})