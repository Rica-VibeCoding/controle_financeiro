import { memo } from 'react'
import { LucideIcon } from 'lucide-react'
import { cn } from '@/utilitarios/cn'

interface CardFinanceiroProps {
  titulo: string
  valor: number
  icone: LucideIcon
  tipo: 'receita' | 'despesa' | 'saldo' | 'cartao'
  loading?: boolean
}

function CardFinanceiroComponent({ 
  titulo, 
  valor, 
  icone: Icone, 
  tipo,
  loading = false 
}: CardFinanceiroProps) {
  const formatarValor = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(valor)
  }

  const obterEstilosCard = () => {
    if (tipo === 'receita') {
      return 'bg-orange-100 border-orange-200 text-orange-900'
    }
    
    if (tipo === 'saldo') {
      const corSaldo = valor >= 0 ? 'text-green-700' : 'text-red-700'
      return `bg-gray-50 border-gray-200 ${corSaldo}`
    }
    
    return 'bg-gray-50 border-gray-200 text-gray-700'
  }

  const obterCorIcone = () => {
    if (tipo === 'receita') return 'text-orange-600'
    if (tipo === 'despesa') return 'text-gray-600'
    if (tipo === 'saldo') return valor >= 0 ? 'text-green-600' : 'text-red-600'
    if (tipo === 'cartao') return 'text-gray-600'
    return 'text-gray-600'
  }

  if (loading) {
    return (
      <div className="w-[220px] h-[120px] rounded-lg border border-gray-200 bg-gray-50 p-6 animate-pulse flex flex-col justify-between">
        <div className="flex items-center gap-3">
          <div className="w-4 h-4 bg-gray-300 rounded"></div>
          <div className="h-3 bg-gray-300 rounded w-20"></div>
        </div>
        <div className="h-9 bg-gray-300 rounded w-24"></div>
      </div>
    )
  }

  return (
    <div 
      className={cn(
        "w-[220px] h-[120px] rounded-lg border p-6 transition-all duration-300 hover:shadow-md hover:scale-[1.02] flex flex-col justify-between",
        obterEstilosCard()
      )}
      title={`${titulo}: ${formatarValor(valor)}`}
    >
      <div className="flex items-center gap-3">
        <Icone className={cn("h-4 w-4", obterCorIcone())} />
        <p className="text-sm font-normal opacity-70">
          {titulo}
        </p>
      </div>
      
      <div>
        <p className="text-3xl font-bold leading-tight">
          {formatarValor(valor)}
        </p>
      </div>
    </div>
  )
}

export const CardFinanceiro = memo(CardFinanceiroComponent)