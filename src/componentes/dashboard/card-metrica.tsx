'use client'

import { TrendingUp, TrendingDown, DollarSign, CreditCard, Wallet, PiggyBank } from 'lucide-react'

interface CardMetricaProps {
  titulo: string
  valor: number | undefined
  valorAnterior?: number
  icone: 'receitas' | 'despesas' | 'saldo' | 'cartoes'
  percentual: number
  cor: 'green' | 'red' | 'blue' | 'purple'
  loading?: boolean
  valorLimite?: number
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

export function CardMetrica({ titulo, valor, valorAnterior, icone, percentual, cor, loading, valorLimite }: CardMetricaProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-2 animate-pulse">
        <div className="flex items-center justify-between mb-1 opacity-90">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gray-200 rounded-lg"></div>
            <div className="h-4 bg-gray-200 rounded w-20"></div>
          </div>
          <div className="h-6 bg-gray-200 rounded-full w-12"></div>
        </div>
        <div className="h-5 bg-gray-200 rounded w-28"></div>
      </div>
    )
  }

  const IconeComponente = icones[icone]
  const classes = colorClasses[cor]
  const valorFormatado = typeof valor === 'number'
    ? valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : '0,00'
  
  const valorAnteriorFormatado = typeof valorAnterior === 'number'
    ? valorAnterior.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : undefined

  const valorLimiteFormatado = typeof valorLimite === 'number'
    ? valorLimite.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : undefined

  // Layout especial para card de cartões (sem barra de progresso)
  if (icone === 'cartoes') {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-2 card-hover animate-slide-up h-full">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center space-x-2">
            <div className={`w-5 h-5 ${classes.bg} rounded-lg flex items-center justify-center opacity-95`}>
              <IconeComponente className={`w-2 h-2 ${classes.text} opacity-95`} />
            </div>
            <span className="text-sm font-medium text-gray-600">{titulo}</span>
          </div>
          <span className={`text-xs px-2 py-1 ${classes.badge} rounded-full font-medium`}>
            {Math.round(percentual)}%
          </span>
        </div>
        <div className="mb-2 opacity-90">
          <p className="text-lg leading-5 font-bold text-gray-900">
            {valorFormatado}
          </p>
          {valorLimiteFormatado && (
            <p className="text-[12px] text-gray-500 mt-0.5 opacity-90">
              de {valorLimiteFormatado} limite
            </p>
          )}
        </div>
      </div>
    )
  }

  // Layout padrão para outros cards
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-2 card-hover animate-slide-up h-full">
      <div className="flex items-center justify-between mb-1 opacity-90">
        <div className="flex items-center space-x-2">
          <div className={`w-5 h-5 ${classes.bg} rounded-lg flex items-center justify-center opacity-95`}>
            <IconeComponente className={`w-2 h-2 ${classes.text} opacity-95`} />
          </div>
          <span className="text-sm font-medium text-gray-600">{titulo}</span>
        </div>
        <span className={`text-xs px-2 py-1 ${classes.badge} rounded-full font-medium`}>
          {percentual > 0 ? '+' : ''}{Math.round(percentual)}%
        </span>
      </div>
      <div className="opacity-90">
        <p className="text-lg leading-5 font-bold text-gray-900">
          {valorFormatado}
        </p>
        {valorAnteriorFormatado && (
          <p className="text-[12px] text-gray-500 mt-0.5 opacity-90">{valorAnteriorFormatado} mês anterior</p>
        )}
      </div>
    </div>
  )
}