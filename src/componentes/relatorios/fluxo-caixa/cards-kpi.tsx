'use client'

import { TrendingUp, Target, DollarSign } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/componentes/ui/card'
import type { KPIsFluxoCaixa } from '@/tipos/fluxo-caixa'

interface CardsKPIProps {
  kpis?: KPIsFluxoCaixa
  isLoading: boolean
}

export function CardsKPI({ kpis, isLoading }: CardsKPIProps) {
  const formatarValor = (valor: number): string => {
    return valor.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })
  }

  const obterCorVariacao = (percentual: number) => {
    if (percentual >= -5 && percentual <= 5) return 'text-green-600'
    if (percentual >= -10 && percentual <= 10) return 'text-yellow-600'
    return 'text-red-600'
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-3">
              <div className="h-4 bg-gray-200 rounded w-32" />
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-24 mb-1" />
              <div className="h-4 bg-gray-200 rounded w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  // Verificação defensiva: garantir que kpis e todas as propriedades existem
  if (!kpis) {
    return null
  }

  // Verificação adicional de valores não-null
  const temValoresValidos =
    typeof kpis.variacao_percentual === 'number' &&
    typeof kpis.taxa_acerto === 'number' &&
    typeof kpis.diferenca_total === 'number'

  if (!temValoresValidos) {
    return null
  }

  const corVariacao = obterCorVariacao(kpis.variacao_percentual)

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      {/* Card 1: Variação Total */}
      <Card className="border-l-4 border-l-blue-500">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Variação Total
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            <p className={`text-2xl font-bold ${corVariacao}`}>
              {kpis.variacao_percentual > 0 ? '+' : ''}
              {kpis.variacao_percentual.toFixed(1)}%
            </p>
            <p className="text-sm text-gray-600">
              Previsto vs Realizado
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Card 2: Taxa de Acerto */}
      <Card className="border-l-4 border-l-green-500">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
            <Target className="h-4 w-4" />
            Taxa de Acerto
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            <p className="text-2xl font-bold text-gray-900">
              {kpis.taxa_acerto.toFixed(1)}%
            </p>
            <p className="text-sm text-gray-600">
              Meses dentro de ±10%
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Card 3: Diferença Total */}
      <Card className="border-l-4 border-l-purple-500">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Diferença Total
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            <p className={`text-2xl font-bold ${kpis.diferenca_total >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              R$ {formatarValor(Math.abs(kpis.diferenca_total))}
            </p>
            <p className="text-sm text-gray-600">
              {kpis.diferenca_total >= 0 ? 'Acima' : 'Abaixo'} do previsto
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
