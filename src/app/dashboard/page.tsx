'use client'

import { LayoutPrincipal } from '@/componentes/layout/layout-principal'
import { CardMetrica } from '@/componentes/dashboard/card-metrica'
import { useCardsData } from '@/hooks/usar-cards-dados'
import { usePeriodo } from '@/hooks/usar-periodo'

export default function DashboardPage() {
  const { periodo } = usePeriodo()
  const { data: cards, error, isLoading } = useCardsData(periodo)

  return (
    <LayoutPrincipal>
      <div className="max-w-[1440px] mx-auto px-2 sm:px-3 lg:px-4 py-8">
        
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Dashboard</h1>
          <p className="text-gray-600">
            Período: {periodo.mes} {periodo.ano}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div style={{ animationDelay: '0.1s' }} className="h-full">
            <CardMetrica
              titulo="Receitas"
              valor={cards?.receitas.atual}
              valorAnterior={cards?.receitas.anterior}
              icone="receitas"
              percentual={cards?.receitas.percentual || 0}
              cor="green"
              loading={isLoading}
            />
          </div>
          
          <div style={{ animationDelay: '0.2s' }} className="h-full">
            <CardMetrica
              titulo="Despesas"
              valor={cards?.despesas.atual}
              valorAnterior={cards?.despesas.anterior}
              icone="despesas"
              percentual={cards?.despesas.percentual || 0}
              cor="red"
              loading={isLoading}
            />
          </div>
          
          <div style={{ animationDelay: '0.3s' }} className="h-full">
            <CardMetrica
              titulo="Saldo"
              valor={cards?.saldo.atual}
              valorAnterior={cards?.saldo.anterior}
              icone="saldo"
              percentual={cards?.saldo.percentual || 0}
              cor="blue"
              loading={isLoading}
            />
          </div>
          
          <div style={{ animationDelay: '0.4s' }} className="h-full">
            <CardMetrica
              titulo="Cartões"
              valor={cards?.gastosCartao.atual}
              valorLimite={cards?.gastosCartao.limite}
              mostrarBarraProgresso={true}
              icone="cartoes"
              percentual={cards?.gastosCartao.percentual || 0}
              cor="purple"
              loading={isLoading}
            />
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-700">Erro ao carregar dados: {error.message}</p>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            FASE 2 - Cards de Métricas ✅
          </h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h3 className="font-medium text-gray-900">Cards Implementados:</h3>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm">Receitas com comparativo</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm">Despesas com comparativo</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm">Saldo calculado</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm">Cartões - gastos vs limite</span>
                </div>
              </div>
            </div>
            
            {cards && (
              <div className="space-y-3">
                <h3 className="font-medium text-gray-900">Dados Atuais:</h3>
                <div className="space-y-2 text-sm">
                  <p>Receitas: {cards.receitas.atual.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                  <p>Despesas: {cards.despesas.atual.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                  <p>Saldo: {cards.saldo.atual.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                  <p>Cartões: {cards.gastosCartao.atual.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </LayoutPrincipal>
  )
}