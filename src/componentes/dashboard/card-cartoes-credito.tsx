'use client'

import { useCartoesDados } from '@/hooks/usar-cartoes-dados'
import { usePeriodoContexto } from '@/contextos/periodo-contexto'
import { Skeleton } from '@/componentes/ui/skeleton'

export function CardCartoesCredito() {
  const { periodo } = usePeriodoContexto()
  const { data, error, isLoading } = useCartoesDados(periodo)

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="text-center text-red-500 text-sm">
          Erro ao carregar cartões
        </div>
      </div>
    )
  }

  const formatarValor = (valor: number): string => {
    return valor.toLocaleString('pt-BR', { 
      minimumFractionDigits: 2,
      maximumFractionDigits: 2 
    })
  }

  const formatarData = (data: string): string => {
    return new Date(data).toLocaleDateString('pt-BR', { 
      day: '2-digit', 
      month: '2-digit' 
    })
  }

  // Componente do círculo de progresso
  const CirculoProgresso = ({ percentual }: { percentual: number }) => {
    const raio = 20
    const circunferencia = 2 * Math.PI * raio
    const progresso = (percentual / 100) * circunferencia
    
    return (
      <div className="relative w-12 h-12">
        <svg className="w-12 h-12 transform -rotate-90" viewBox="0 0 48 48">
          {/* Círculo de fundo */}
          <circle
            cx="24"
            cy="24"
            r={raio}
            fill="none"
            stroke="#374151"
            strokeWidth="3"
          />
          {/* Círculo de progresso */}
          <circle
            cx="24"
            cy="24"
            r={raio}
            fill="none"
            stroke="#10B981"
            strokeWidth="3"
            strokeDasharray={circunferencia}
            strokeDashoffset={circunferencia - progresso}
            strokeLinecap="round"
            className="transition-all duration-500 ease-in-out"
          />
        </svg>
        {/* Percentual no centro */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-semibold text-white">
            {percentual}%
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 animate-slide-up tooltip-container">
      {/* Header com total usado */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-900">
          Cartões de Crédito
        </h3>
        {isLoading ? (
          <Skeleton className="h-4 w-20" />
        ) : (
          <span className="text-sm font-semibold text-purple-600">
            {formatarValor(data?.totalUsado || 0)}
          </span>
        )}
      </div>

      {/* Grid de cartões */}
      <div className="space-y-3">
        {isLoading ? (
          // Loading skeletons
          Array.from({ length: 2 }).map((_, index) => (
            <div key={index} className="flex items-center space-x-3 p-3 bg-gray-800 rounded-lg">
              <Skeleton className="h-12 w-12 rounded-full bg-gray-700" />
              <div className="flex-1">
                <Skeleton className="h-3 w-24 mb-2 bg-gray-700" />
                <Skeleton className="h-4 w-32 bg-gray-700" />
              </div>
            </div>
          ))
        ) : (
          // Renderizar apenas cartões reais (responsivo)
          (data?.cartoes || []).map((cartao) => (
            <div 
              key={cartao.id}
              className="group flex items-center space-x-3 p-3 bg-gray-800 rounded-lg hover:bg-gray-750 transition-colors cursor-pointer relative"
              title={`Hover para ver transações de ${cartao.nome}`}
            >
              {/* Círculo de progresso */}
              <CirculoProgresso percentual={cartao.percentual} />
              
              {/* Informações do cartão */}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-white truncate mb-1">
                  {cartao.nome} | {cartao.banco}
                </div>
                <div className="text-xs text-gray-300 mb-1">
                  {formatarValor(cartao.usado)} | {formatarValor(cartao.limite)}
                </div>
                <div className="text-xs text-gray-400">
                  Fecha dia {cartao.dataFechamento}
                </div>
              </div>

              {/* Tooltip com últimas transações (hover) */}
              <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-xl p-3 opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none z-[9999] max-w-[calc(100vw-2rem)]">
                <div className="text-xs font-medium text-gray-900 mb-2">
                  Últimas transações:
                </div>
                {cartao.ultimasTransacoes && cartao.ultimasTransacoes.length > 0 ? (
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {cartao.ultimasTransacoes.slice(0, 20).map((trans, transIndex) => (
                      <div key={transIndex} className="flex justify-between items-center text-xs">
                        <div className="flex-1 truncate mr-2">
                          <span className="text-gray-700">{trans.descricao}</span>
                          <span className="text-gray-500 ml-1">({formatarData(trans.data)})</span>
                        </div>
                        <span className={`font-medium ${
                          trans.tipo === 'receita' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {trans.tipo === 'receita' ? '+' : '-'}{formatarValor(trans.valor)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-gray-500">
                    Nenhuma transação recente
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}