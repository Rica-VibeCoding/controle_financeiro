'use client'

import { GraficoCategorias } from './grafico-categorias'
import { GraficoCartoes } from './grafico-cartoes'

interface SecaoGraficosProps {
  periodo: {
    mes: number
    ano: number
  }
}

export function SecaoGraficos({ periodo }: SecaoGraficosProps) {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      {/* Gráfico de Categorias - Esquerda */}
      <GraficoCategorias periodo={periodo} />
      
      {/* Gráfico de Cartões - Direita */}
      <GraficoCartoes periodo={periodo} />
    </div>
  )
}