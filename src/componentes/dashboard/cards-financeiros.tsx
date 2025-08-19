'use client'

import { TrendingUp, TrendingDown, Wallet, CreditCard } from 'lucide-react'
import { CardFinanceiro } from './card-financeiro'
import { usarDadosDashboard } from '@/hooks/usar-dados-dashboard'

interface CardsFinanceirosProps {
  periodo: {
    mes: number
    ano: number
  }
}

export function CardsFinanceiros({ periodo }: CardsFinanceirosProps) {
  const { dados, loading } = usarDadosDashboard(periodo)

  const cards = [
    {
      titulo: 'Receitas',
      valor: dados?.receitas || 0,
      icone: TrendingUp,
      tipo: 'receita' as const
    },
    {
      titulo: 'Despesas', 
      valor: dados?.despesas || 0,
      icone: TrendingDown,
      tipo: 'despesa' as const
    },
    {
      titulo: 'Saldo',
      valor: dados?.saldo || 0,
      icone: Wallet,
      tipo: 'saldo' as const
    },
    {
      titulo: 'Gastos no Cartão',
      valor: dados?.gastosCartao || 0,
      icone: CreditCard,
      tipo: 'cartao' as const
    }
  ]

  return (
    <div className="flex flex-wrap gap-6">
      {cards.map((card, index) => (
        <CardFinanceiro
          key={index}
          titulo={card.titulo}
          valor={card.valor}
          icone={card.icone}
          tipo={card.tipo}
          loading={loading}
        />
      ))}
    </div>
  )
}