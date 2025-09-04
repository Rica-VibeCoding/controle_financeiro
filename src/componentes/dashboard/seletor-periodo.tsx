'use client'

import { Button } from '@/componentes/ui/button'
import { usePeriodoContexto } from '@/contextos/periodo-contexto'

export function SeletorPeriodo() {
  const { periodo, mudarMes, voltarParaHoje } = usePeriodoContexto()

  return (
    <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3">
      <Button
        variant="outline"
        size="sm"
        onClick={voltarParaHoje}
        className="text-sm font-medium order-2 sm:order-1"
      >
        Hoje
      </Button>
      
      <div className="flex items-center gap-2 order-1 sm:order-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => mudarMes('anterior')}
          className="h-8 w-8 p-0 hover:bg-gray-100"
        >
          <span className="text-lg">‹</span>
        </Button>
        
        <span className="text-sm text-gray-600 font-medium min-w-[120px] text-center">
          {periodo.mes} de {periodo.ano}
        </span>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => mudarMes('proximo')}
          className="h-8 w-8 p-0 hover:bg-gray-100"
        >
          <span className="text-lg">›</span>
        </Button>
      </div>
    </div>
  )
}