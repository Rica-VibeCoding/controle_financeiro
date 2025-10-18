'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { PageGuard } from '@/componentes/ui/page-guard'
import { CardsKPI } from '@/componentes/relatorios/fluxo-caixa/cards-kpi'
import { FiltrosFluxoCaixa } from '@/componentes/relatorios/fluxo-caixa/filtros-fluxo-caixa'
import { GraficoPrevistoRealizado } from '@/componentes/relatorios/fluxo-caixa/grafico-previsto-realizado'
import { TabelaVariacao } from '@/componentes/relatorios/fluxo-caixa/tabela-variacao'
import { useFluxoCaixa } from '@/hooks/usar-fluxo-caixa'
import type { FiltrosFluxoCaixa as TipoFiltros } from '@/tipos/fluxo-caixa'

export default function FluxoCaixaPage() {
  const [filtros, setFiltros] = useState<TipoFiltros>({
    periodo: '12_meses',
    tipo: 'ambos'
  })

  const { dados, kpis, isLoading, error } = useFluxoCaixa(filtros)

  return (
    <PageGuard permissaoNecessaria="relatorios">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <header className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Fluxo de Caixa Projetado
          </h1>
          <p className="text-gray-600">
            Compare valores previstos com realizados e identifique desvios
          </p>
        </header>

        {/* KPIs */}
        <CardsKPI kpis={kpis} isLoading={isLoading} />

        {/* Filtros */}
        <FiltrosFluxoCaixa filtros={filtros} onFiltrosChange={setFiltros} />

        {/* Erro */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-700">
              Erro ao carregar dados: {error instanceof Error ? error.message : 'Erro desconhecido'}
            </p>
          </div>
        )}

        {/* Gráfico */}
        <GraficoPrevistoRealizado dados={dados} isLoading={isLoading} />

        {/* Tabela */}
        <TabelaVariacao dados={dados} isLoading={isLoading} />
      </div>
    </PageGuard>
  )
}
