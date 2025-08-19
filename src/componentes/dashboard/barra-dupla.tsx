import { memo } from 'react'

interface BarraDuplaProps {
  label: string
  valor1: number
  valor2: number
  maxValue: number
  cor1: string
  cor2: string
  status?: 'normal' | 'atencao' | 'excedido'
  formatarValor?: (valor: number) => string
}

function BarraDuplaComponent({
  label,
  valor1,
  valor2,
  maxValue,
  cor1,
  cor2,
  status = 'normal',
  formatarValor = (v) => v.toLocaleString('pt-BR')
}: BarraDuplaProps) {
  const percentual1 = maxValue > 0 ? (valor1 / maxValue) * 100 : 0
  const percentual2 = maxValue > 0 ? (valor2 / maxValue) * 100 : 0

  const obterCorStatus = () => {
    if (status === 'excedido') return 'border-red-200 bg-red-50'
    if (status === 'atencao') return 'border-yellow-200 bg-yellow-50'
    return 'border-gray-200 bg-white'
  }

  return (
    <div className={`p-3 rounded-lg border transition-all duration-300 hover:shadow-sm ${obterCorStatus()}`}>
      {/* Header */}
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <div className="text-xs text-gray-500">
          {Math.round(percentual2)}%
        </div>
      </div>

      {/* Barras */}
      <div className="space-y-2">
        {/* Barra 1 */}
        <div className="flex items-center gap-2">
          <div className="w-16 text-xs text-gray-600 truncate">
            {formatarValor(valor1)}
          </div>
          <div className="flex-1 bg-gray-200 rounded-full h-2 relative">
            <div 
              className={`h-2 rounded-full transition-all duration-500 ease-out ${cor1}`}
              style={{ width: `${Math.min(percentual1, 100)}%` }}
            />
          </div>
        </div>

        {/* Barra 2 */}
        <div className="flex items-center gap-2">
          <div className="w-16 text-xs text-gray-600 truncate">
            {formatarValor(valor2)}
          </div>
          <div className="flex-1 bg-gray-200 rounded-full h-2 relative">
            <div 
              className={`h-2 rounded-full transition-all duration-500 ease-out ${cor2}`}
              style={{ width: `${Math.min(percentual2, 100)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export const BarraDupla = memo(BarraDuplaComponent)