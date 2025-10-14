'use client'

export const dynamic = 'force-dynamic'

import NextDynamic from 'next/dynamic'
import { CardMetrica } from '@/componentes/dashboard/card-metrica'
import { SeletorPeriodo } from '@/componentes/dashboard/seletor-periodo'
import { useCardsData } from '@/hooks/usar-cards-dados'
import { usePeriodoContexto } from '@/contextos/periodo-contexto'
import { PageGuard } from '@/componentes/ui/page-guard'

// Lazy load componentes pesados
const GraficoTendencia = NextDynamic(() => import('@/componentes/dashboard/grafico-tendencia').then(mod => ({ default: mod.GraficoTendencia })), {
  ssr: false
})

const GraficoCategorias = NextDynamic(() => import('@/componentes/dashboard/grafico-categorias').then(mod => ({ default: mod.GraficoCategorias })), {
  ssr: false
})

const CardProximaConta = NextDynamic(() => import('@/componentes/dashboard/card-proxima-conta').then(mod => ({ default: mod.CardProximaConta })), {
  ssr: false
})

const CardSaldosContas = NextDynamic(() => import('@/componentes/dashboard/card-saldos-contas').then(mod => ({ default: mod.CardSaldosContas })), {
  ssr: false
})

const CardCartoesCredito = NextDynamic(() => import('@/componentes/dashboard/card-cartoes-credito').then(mod => ({ default: mod.CardCartoesCredito })), {
  ssr: false
})

const CardProjetosPessoais = NextDynamic(() => import('@/componentes/dashboard/card-projetos-melhorado').then(mod => ({ default: mod.CardProjetosPessoais })), {
  ssr: false
})

export default function DashboardPage() {
  const { periodo } = usePeriodoContexto()
  const { data: cards, error, isLoading } = useCardsData(periodo)

  return (
    <PageGuard permissaoNecessaria="dashboard">
      <div className="max-w-[1440px] mx-auto px-2 sm:px-3 lg:px-4 pt-0 pb-6">

        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <div className="flex items-center gap-4">
            <SeletorPeriodo />
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
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

        {/* Gráfico Tendência - Full Width */}
        <div className="mb-4">
          <div style={{ animationDelay: '0.5s' }}>
            <GraficoTendencia />
          </div>
        </div>

        {/* Layout: Coluna Esquerda (Cards empilhados) + Coluna Direita (Categorias) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* Coluna Esquerda: Contas + Cartões + Próximas + Projetos empilhados */}
          <div className="space-y-4">
            <div style={{ animationDelay: '0.6s' }}>
              <CardSaldosContas />
            </div>

            <div style={{ animationDelay: '0.7s' }}>
              <CardCartoesCredito />
            </div>

            <div style={{ animationDelay: '0.8s' }}>
              <CardProximaConta limite={3} />
            </div>

            <div style={{ animationDelay: '0.9s' }}>
              <CardProjetosPessoais limite={4} />
            </div>
          </div>

          {/* Coluna Direita: Categorias vs Metas */}
          <div style={{ animationDelay: '1.0s' }}>
            <GraficoCategorias />
          </div>

        </div>
      </div>
    </PageGuard>
  )
}