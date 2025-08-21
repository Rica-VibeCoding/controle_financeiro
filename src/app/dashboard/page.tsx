'use client'

import { LayoutPrincipal } from '@/componentes/layout/layout-principal'
import { CardMetrica } from '@/componentes/dashboard/card-metrica'
import { GraficoTendencia } from '@/componentes/dashboard/grafico-tendencia'
import { GraficoCategorias } from '@/componentes/dashboard/grafico-categorias'
import { useCardsData } from '@/hooks/usar-cards-dados'
import { usePeriodo } from '@/hooks/usar-periodo'

export default function DashboardPage() {
  const { periodo } = usePeriodo()
  const { data: cards, error, isLoading } = useCardsData(periodo)

  return (
    <LayoutPrincipal>
      <div className="max-w-[1440px] mx-auto px-2 sm:px-3 lg:px-4 pt-0 pb-6">

        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <span className="text-sm text-gray-500">{periodo.mes} {periodo.ano}</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div style={{ animationDelay: '0.5s' }}>
            <GraficoTendencia />
          </div>
          
          <div style={{ animationDelay: '0.6s' }}>
            <GraficoCategorias periodo={periodo} />
          </div>
        </div>
      </div>
    </LayoutPrincipal>
  )
}