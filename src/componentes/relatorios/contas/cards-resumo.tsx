'use client'

import { DollarSign, TrendingUp, AlertCircle, Clock } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/componentes/ui/card'
import { formatarMoeda } from '@/utilitarios/formatacao-valores'
import type { ResumoContas } from '@/tipos/contas'

interface CardsResumoProps {
  resumo?: ResumoContas
  isLoading: boolean
}

export function CardsResumo({ resumo, isLoading }: CardsResumoProps) {

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-3">
              <div className="h-4 bg-gray-200 rounded w-28" />
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-32 mb-2" />
              <div className="h-4 bg-gray-200 rounded w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!resumo) {
    return null
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Card 1: A Pagar (30 dias) */}
      <Card className="border-l-4 border-l-blue-500 hover:shadow-lg transition-shadow">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-blue-600" />
            A Pagar (30 dias)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-900 mb-1">
            {formatarMoeda(resumo.aPagar30Dias.total)}
          </div>
          <p className="text-sm text-gray-500">
            {resumo.aPagar30Dias.quantidade} conta{resumo.aPagar30Dias.quantidade !== 1 ? 's' : ''}
          </p>
        </CardContent>
      </Card>

      {/* Card 2: A Receber (30 dias) */}
      <Card className="border-l-4 border-l-green-500 hover:shadow-lg transition-shadow">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-green-600" />
            A Receber (30 dias)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-900 mb-1">
            {formatarMoeda(resumo.aReceber30Dias.total)}
          </div>
          <p className="text-sm text-gray-500">
            {resumo.aReceber30Dias.quantidade} conta{resumo.aReceber30Dias.quantidade !== 1 ? 's' : ''}
          </p>
        </CardContent>
      </Card>

      {/* Card 3: Vencido (A Pagar) */}
      <Card className="border-l-4 border-l-red-500 hover:shadow-lg transition-shadow">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-600" />
            Vencido (Pagar)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600 mb-1">
            {formatarMoeda(resumo.vencidoPagar.total)}
          </div>
          <p className="text-sm text-gray-500">
            {resumo.vencidoPagar.quantidade} conta{resumo.vencidoPagar.quantidade !== 1 ? 's' : ''}
          </p>
        </CardContent>
      </Card>

      {/* Card 4: Atrasado (A Receber) */}
      <Card className="border-l-4 border-l-yellow-500 hover:shadow-lg transition-shadow">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
            <Clock className="h-4 w-4 text-yellow-600" />
            Atrasado (Receber)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-yellow-600 mb-1">
            {formatarMoeda(resumo.atrasadoReceber.total)}
          </div>
          <p className="text-sm text-gray-500">
            {resumo.atrasadoReceber.quantidade} conta{resumo.atrasadoReceber.quantidade !== 1 ? 's' : ''}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
