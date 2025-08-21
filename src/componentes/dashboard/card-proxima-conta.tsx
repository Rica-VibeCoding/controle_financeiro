'use client'

import { AlertCircle } from 'lucide-react'
import { Icone } from '@/componentes/ui/icone'
import { useProximasContas } from '@/hooks/usar-proximas-contas'
import { useModais } from '@/contextos/modais-contexto'
import type { ProximaConta } from '@/tipos/dashboard'

interface CardProximaContaProps {
  limite?: number
}

export function CardProximaConta({ limite = 3 }: CardProximaContaProps) {
  const { data: contas, isLoading, error } = useProximasContas()
  const { abrirModal } = useModais()

  const contasLimitadas = contas?.slice(0, limite) || []

  const handleClickConta = (conta: ProximaConta) => {
    // Abrir modal de edição com dados da transação
    abrirModal('lancamento', {
      id: conta.id,
      tipo: 'despesa',
      descricao: conta.descricao,
      valor: conta.valor,
      categoria: conta.categoria,
      modo: 'edicao'
    })
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 animate-pulse">
        <div className="flex items-center justify-between mb-4">
          <div className="h-6 bg-gray-200 rounded w-32"></div>
        </div>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-16"></div>
                </div>
                <div className="h-4 bg-gray-200 rounded w-20"></div>
              </div>
              <div className="h-3 bg-gray-200 rounded w-12 ml-6"></div>
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
          <h3 className="text-lg font-semibold text-gray-900">Próximas Contas</h3>
        </div>
        <div className="flex items-center justify-center py-8 text-red-500">
          <AlertCircle className="w-5 h-5 mr-2" />
          <span className="text-sm">Erro ao carregar</span>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 card-hover animate-slide-up h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Próximas Contas</h3>
      </div>

      {contasLimitadas.length === 0 ? (
        <div className="flex items-center justify-center py-8 text-gray-500">
          <span className="text-sm">Nenhuma conta pendente</span>
        </div>
      ) : (
        <div className="space-y-3">
          {contasLimitadas.map((conta) => (
            <div
              key={conta.id}
              onClick={() => handleClickConta(conta)}
              className="cursor-pointer hover:bg-gray-50 rounded-lg p-2 -m-2 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-4 h-4 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: conta.categoria.cor + '20' }}
                  >
                    <Icone 
                      name={conta.categoria.icone as any}
                      className="w-2.5 h-2.5"
                      style={{ color: conta.categoria.cor }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-700">
                    {conta.categoria.nome}
                  </span>
                </div>
                <span className="text-sm font-semibold text-gray-900">
                  R$ {conta.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="ml-6">
                <span 
                  className={`text-xs ${
                    conta.vencida 
                      ? 'text-orange-500 font-medium' 
                      : 'text-gray-500'
                  }`}
                >
                  {conta.vencida ? `há ${conta.dias} dias` : `em ${conta.dias} dias`}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}