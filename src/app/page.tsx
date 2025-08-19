'use client'

import { LayoutPrincipal } from '@/componentes/layout/layout-principal'
import { CardsFinanceiros } from '@/componentes/dashboard/cards-financeiros'
import { FiltroTemporal } from '@/componentes/dashboard/filtro-temporal'
import { usarFiltroTemporal } from '@/hooks/usar-filtro-temporal'

export default function Home() {
  const filtro = usarFiltroTemporal()

  return (
    <LayoutPrincipal>
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground mb-2">
            Dashboard
          </h1>
        </div>

        {/* Layout Responsivo: Cards sempre largura fixa, filtro embaixo em mobile */}
        <div className="flex flex-col xl:flex-row gap-8">
          {/* Cards Financeiros - largura fixa sempre */}
          <div className="flex-shrink-0">
            <CardsFinanceiros periodo={filtro.obterPeriodoAtivo()} />
          </div>
          
          {/* Filtro Temporal - vem embaixo em mobile */}
          <div className="flex justify-center xl:justify-start">
            <FiltroTemporal />
          </div>
        </div>
      </div>
    </LayoutPrincipal>
  )
}
