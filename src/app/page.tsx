'use client'

import { LayoutPrincipal } from '@/componentes/layout/layout-principal'
import { CardsFinanceiros } from '@/componentes/dashboard/cards-financeiros'
import { FiltroTemporal } from '@/componentes/dashboard/filtro-temporal'
import { SecaoGraficos } from '@/componentes/dashboard/secao-graficos'
import { usarFiltroTemporal } from '@/hooks/usar-filtro-temporal'

export default function Home() {
  const filtro = usarFiltroTemporal()

  return (
    <LayoutPrincipal>
      <div className="px-4 space-y-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground mb-2">
            Dashboard
          </h1>
        </div>

        {/* Layout Responsivo Inteligente */}
        <div className="flex flex-col 2xl:flex-row gap-6 items-start">
          {/* Cards Financeiros - grid responsivo */}
          <CardsFinanceiros periodo={filtro.obterPeriodoAtivo()} />
          
          {/* Filtro Temporal - largura fixa, embaixo em mobile */}
          <div className="w-full 2xl:w-auto flex justify-center 2xl:justify-start">
            <FiltroTemporal />
          </div>
        </div>
        
        {/* Seção de Gráficos */}
        <div className="mt-8">
          <SecaoGraficos periodo={filtro.obterPeriodoAtivo()} />
        </div>
      </div>
    </LayoutPrincipal>
  )
}
