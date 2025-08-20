'use client'

import { LayoutPrincipal } from '@/componentes/layout/layout-principal'
import { useCardsData } from '@/hooks/usar-cards-dados'
import { usePeriodo } from '@/hooks/usar-periodo'

export default function DashboardPage() {
  const { periodo } = usePeriodo()
  const { data: cards, error, isLoading } = useCardsData(periodo)

  return (
    <LayoutPrincipal>
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Dashboard</h1>
          <p className="text-gray-600">
            Período: {periodo.mes} {periodo.ano}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            FASE 1 - Estrutura Base Concluída ✅
          </h2>
          
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span>SWR configurado e funcionando</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span>Hooks SWR criados</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span>CSS customizado adicionado</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span>Interfaces TypeScript definidas</span>
            </div>
          </div>

          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-2">Status do Hook SWR:</h3>
            <div className="space-y-1 text-sm">
              <p>Loading: {isLoading ? '✅ Sim' : '❌ Não'}</p>
              <p>Error: {error ? '❌ ' + error.message : '✅ Sem erros'}</p>
              <p>Data: {cards ? '✅ Dados carregados' : '⏳ Aguardando'}</p>
            </div>
          </div>
        </div>
      </div>
    </LayoutPrincipal>
  )
}