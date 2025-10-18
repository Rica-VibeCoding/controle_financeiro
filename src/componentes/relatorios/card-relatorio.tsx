'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/componentes/ui/card'
import { Button } from '@/componentes/ui/button'
import { useRouter } from 'next/navigation'
import { ArrowRight } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

interface CardRelatorioProps {
  icone: LucideIcon
  titulo: string
  rota: string
  cor: 'green' | 'blue' | 'purple'
}

const coresMap = {
  green: {
    barra: 'bg-green-500',
    icone: 'text-green-600',
    hover: 'hover:border-green-500',
    botao: 'hover:bg-green-50 hover:text-green-700'
  },
  blue: {
    barra: 'bg-blue-500',
    icone: 'text-blue-600',
    hover: 'hover:border-blue-500',
    botao: 'hover:bg-blue-50 hover:text-blue-700'
  },
  purple: {
    barra: 'bg-purple-500',
    icone: 'text-purple-600',
    hover: 'hover:border-purple-500',
    botao: 'hover:bg-purple-50 hover:text-purple-700'
  }
}

export function CardRelatorio({
  icone: Icone,
  titulo,
  rota,
  cor
}: CardRelatorioProps) {
  const router = useRouter()
  const cores = coresMap[cor]

  return (
    <Card
      className={`
        group
        relative
        overflow-hidden
        transition-all
        duration-200
        hover:shadow-lg
        hover:-translate-y-1
        ${cores.hover}
        cursor-pointer
      `}
      onClick={() => router.push(rota)}
    >
      {/* Barra de cor no topo */}
      <div className={`h-1 w-full ${cores.barra}`} />

      <CardHeader className="text-center pb-4">
        {/* Ícone */}
        <div className="flex justify-center mb-4">
          <div className="p-4 rounded-full bg-gray-100 group-hover:bg-gray-200 transition-colors">
            <Icone className={`h-8 w-8 ${cores.icone}`} />
          </div>
        </div>

        {/* Título */}
        <CardTitle className="text-xl font-semibold">
          {titulo}
        </CardTitle>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Botão de ação */}
        <Button
          variant="outline"
          className={`w-full ${cores.botao} transition-colors`}
          onClick={(e) => {
            e.stopPropagation()
            router.push(rota)
          }}
        >
          Acessar Relatório
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>

        {/* Última atualização */}
        <p className="text-xs text-gray-500 text-center mt-4">
          📊 Atualizado em tempo real
        </p>
      </CardContent>
    </Card>
  )
}
