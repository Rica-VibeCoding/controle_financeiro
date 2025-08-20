'use client'

import { TrendingUp, TrendingDown, DollarSign, CreditCard, Wallet, PiggyBank } from 'lucide-react'

interface CardMetricaProps {
  titulo: string
  valor: number | undefined
  icone: 'receitas' | 'despesas' | 'saldo' | 'cartoes'
  percentual: number
  cor: 'green' | 'red' | 'blue' | 'purple'
  loading?: boolean
}

const icones = {
  receitas: TrendingUp,
  despesas: TrendingDown,
  saldo: Wallet,
  cartoes: CreditCard
}

const colorClasses = {
  green: {
    bg: 'bg-green-100',
    text: 'text-green-600',
    badge: 'bg-green-100 text-green-600'
  },
  red: {
    bg: 'bg-red-100',
    text: 'text-red-600',
    badge: 'bg-red-100 text-red-600'
  },
  blue: {
    bg: 'bg-blue-100',
    text: 'text-blue-600',
    badge: 'bg-blue-100 text-blue-600'
  },
  purple: {
    bg: 'bg-purple-100',
    text: 'text-purple-600',
    badge: 'bg-purple-100 text-purple-600'
  }
}

export function CardMetrica({ titulo, valor, icone, percentual, cor, loading }: CardMetricaProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 animate-pulse">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
            <div className="h-4 bg-gray-200 rounded w-20"></div>
          </div>
          <div className="h-6 bg-gray-200 rounded-full w-12"></div>
        </div>
        <div className="h-8 bg-gray-200 rounded w-28"></div>
      </div>
    )
  }

  const IconeComponente = icones[icone]
  const classes = colorClasses[cor]
  const valorFormatado = valor?.toLocaleString('pt-BR', { 
    style: 'currency', 
    currency: 'BRL' 
  }) || 'R$ 0,00'

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 card-hover animate-slide-up">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <div className={`w-10 h-10 ${classes.bg} rounded-lg flex items-center justify-center`}>
            <IconeComponente className={`w-5 h-5 ${classes.text}`} />
          </div>
          <span className="text-sm font-medium text-gray-600">{titulo}</span>
        </div>
        <span className={`text-xs px-2 py-1 ${classes.badge} rounded-full font-medium`}>
          {percentual > 0 ? '+' : ''}{percentual.toFixed(1)}%
        </span>
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900">
          {valorFormatado}
        </p>
      </div>
    </div>
  )
}