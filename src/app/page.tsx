'use client'

import { LayoutPrincipal } from '@/componentes/layout/layout-principal'
import { CardsFinanceiros } from '@/componentes/dashboard/cards-financeiros'
import { usarDadosDashboard } from '@/hooks/usar-dados-dashboard'

export default function Home() {
  // Buscar apenas dados dos cards (sem gráficos)
  const {
    loading,
    dadosCards,
  } = usarDadosDashboard()

  return (
    <LayoutPrincipal>
      <div className="px-4 space-y-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground mb-2">
            Dashboard
          </h1>
        </div>

        {/* Apenas Cards Financeiros */}
        <div className="flex justify-center">
          <CardsFinanceiros dados={dadosCards} loading={loading} />
        </div>
      </div>
    </LayoutPrincipal>
  )
}