'use client'

import { Trophy, DollarSign, TrendingUp } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/componentes/ui/card'
import type { CardKPI } from '@/tipos/roi-cliente'

interface CardsKPIProps {
  kpis?: CardKPI
  isLoading: boolean
}

export function CardsKPI({ kpis, isLoading }: CardsKPIProps) {
  const formatarValor = (valor: number): string => {
    return valor.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })
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

  if (!kpis) {
    return null
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      {/* Card 1: Melhor ROI % */}
      <Card className="border-l-4 border-l-green-500">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
            <Trophy className="h-4 w-4" />
            Melhor ROI %
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            <p className="text-2xl font-bold text-gray-900">
              {kpis.melhorRoiPercentual.valor.toFixed(1)}%
            </p>
            <p className="text-sm text-gray-600 truncate">
              {kpis.melhorRoiPercentual.cliente}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Card 2: Melhor ROI R$ */}
      <Card className="border-l-4 border-l-blue-500">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Melhor ROI R$
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            <p className="text-2xl font-bold text-gray-900">
              R$ {formatarValor(kpis.melhorRoiValor.valor)}
            </p>
            <p className="text-sm text-gray-600 truncate">
              {kpis.melhorRoiValor.cliente}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Card 3: Margem Mensal */}
      <Card className="border-l-4 border-l-purple-500">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Margem Mensal
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            <p className="text-2xl font-bold text-gray-900">
              {kpis.margemMensal.percentual.toFixed(1)}%
            </p>
            <p className="text-sm text-gray-600">
              Lucro: R$ {formatarValor(kpis.margemMensal.lucroTotal)}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
