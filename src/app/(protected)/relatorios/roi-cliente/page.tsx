'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { PageGuard } from '@/componentes/ui/page-guard'
import { CardsKPI } from '@/componentes/relatorios/roi-cliente/cards-kpi'
import { TabelaROI } from '@/componentes/relatorios/roi-cliente/tabela-roi'
import { FiltrosROI as FiltrosROIComponent } from '@/componentes/relatorios/roi-cliente/filtros-roi'
import { useROIClientes } from '@/hooks/usar-roi-clientes'
import type { FiltrosROI } from '@/tipos/roi-cliente'

export default function ROIClientePage() {
  const [filtros, setFiltros] = useState<FiltrosROI>({
    periodo: 'todo',
    ordenacao: 'margem_desc'
  })

  const { clientes, kpis, isLoading, error } = useROIClientes(filtros)

  return (
    <PageGuard permissaoNecessaria="relatorios">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <header className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            ROI por Cliente
          </h1>
          <p className="text-gray-600">
            Análise de rentabilidade e margem de lucro por cliente/projeto
          </p>
        </header>

        {/* KPIs */}
        <CardsKPI kpis={kpis} isLoading={isLoading} />

        {/* Filtros */}
        <FiltrosROIComponent filtros={filtros} onFiltrosChange={setFiltros} />

        {/* Erro */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-700">
              Erro ao carregar dados: {error instanceof Error ? error.message : 'Erro desconhecido'}
            </p>
          </div>
        )}

        {/* Tabela */}
        <TabelaROI clientes={clientes} isLoading={isLoading} filtros={filtros} />
      </div>
    </PageGuard>
  )
}
