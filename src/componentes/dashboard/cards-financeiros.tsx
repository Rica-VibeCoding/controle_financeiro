'use client'

import { TrendingUp, TrendingDown, Wallet, CreditCard } from 'lucide-react'
import { CardFinanceiro } from './card-financeiro'

// A interface agora define os dados que o componente espera receber
interface CardsFinanceirosProps {
  dados: {
    receitas: number
    despesas: number
    saldo: number
    gastosCartao: number
  }
  loading: boolean
}

export function CardsFinanceiros({ dados, loading }: CardsFinanceirosProps) {
  // O hook foi removido. O componente agora é "burro".
  const cards = [
    {
      titulo: 'Receitas',
      valor: dados.receitas,
      icone: TrendingUp,
      tipo: 'receita' as const,
    },
    {
      titulo: 'Despesas',
      valor: dados.despesas,
      icone: TrendingDown,
      tipo: 'despesa' as const,
    },
    {
      titulo: 'Saldo',
      valor: dados.saldo,
      icone: Wallet,
      tipo: 'saldo' as const,
    },
    {
      titulo: 'Gastos no Cartão',
      valor: dados.gastosCartao,
      icone: CreditCard,
      tipo: 'cartao' as const,
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 w-fit">
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
