'use client'

import { CheckCircle, Edit2, Calendar } from 'lucide-react'
import { Button } from '@/componentes/ui/button'
import { formatarMoeda, formatarData } from '@/utilitarios/formatacao-valores'
import type { ContaPagarReceber } from '@/tipos/contas'

interface LinhaContaProps {
  conta: ContaPagarReceber
  onMarcarComoRealizado: (id: string) => void
  onEditar: (id: string) => void
}

export function LinhaConta({ conta, onMarcarComoRealizado, onEditar }: LinhaContaProps) {

  // Determinar cor baseado em dias até vencimento
  const obterCorStatus = () => {
    if (conta.dias_vencimento < 0) return { cor: 'text-red-600', icone: '🔴', bg: 'bg-red-50', border: 'border-red-500' }
    if (conta.dias_vencimento <= 7) return { cor: 'text-red-600', icone: '🔴', bg: 'bg-red-50', border: 'border-red-500' }
    if (conta.dias_vencimento <= 15) return { cor: 'text-yellow-600', icone: '🟡', bg: 'bg-yellow-50', border: 'border-yellow-500' }
    return { cor: 'text-green-600', icone: '🟢', bg: 'bg-green-50', border: 'border-green-500' }
  }

  const obterTextoVencimento = () => {
    if (conta.dias_vencimento < 0) {
      const diasAtrasado = Math.abs(conta.dias_vencimento)
      return `${diasAtrasado} dia${diasAtrasado !== 1 ? 's' : ''} atrasado`
    }
    if (conta.dias_vencimento === 0) return 'Vence hoje'
    if (conta.dias_vencimento === 1) return 'Vence amanhã'
    return `${conta.dias_vencimento} dias`
  }

  const status = obterCorStatus()

  return (
    <tr className={`hover:bg-gray-50 transition-colors ${status.bg} border-l-4 ${status.border}`}>
      {/* Status Visual */}
      <td className="px-4 py-4 whitespace-nowrap">
        <span className="text-2xl" aria-label={obterTextoVencimento()}>{status.icone}</span>
      </td>

      {/* Descrição + Categoria */}
      <td className="px-4 py-4">
        <div className="flex flex-col">
          <span className="font-medium text-gray-900">{conta.descricao}</span>
          <span className="text-sm text-gray-500">{conta.categoria}</span>
          {conta.subcategoria && (
            <span className="text-xs text-gray-400">→ {conta.subcategoria}</span>
          )}
        </div>
      </td>

      {/* Contato */}
      <td className="px-4 py-4 whitespace-nowrap">
        <span className="text-sm text-gray-700">
          {conta.contato || '-'}
        </span>
      </td>

      {/* Valor */}
      <td className="px-4 py-4 whitespace-nowrap text-right">
        <span className="font-semibold text-gray-900">
          {formatarMoeda(conta.valor)}
        </span>
      </td>

      {/* Data Vencimento */}
      <td className="px-4 py-4 whitespace-nowrap">
        <div className="flex items-center gap-2 text-sm">
          <Calendar className="h-4 w-4 text-gray-400" />
          <div className="flex flex-col">
            <span className="text-gray-700">{formatarData(conta.data_vencimento, 'medio')}</span>
            <span className={`text-xs ${status.cor} font-medium`}>
              {obterTextoVencimento()}
            </span>
          </div>
        </div>
      </td>

      {/* Ações */}
      <td className="px-4 py-4 whitespace-nowrap text-right">
        <div className="flex items-center gap-2 justify-end">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onMarcarComoRealizado(conta.id)}
            className="text-green-600 hover:bg-green-50 hover:text-green-700 border-green-200"
          >
            <CheckCircle className="h-4 w-4 mr-1" />
            Realizado
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onEditar(conta.id)}
            className="hover:bg-gray-50"
          >
            <Edit2 className="h-4 w-4" />
          </Button>
        </div>
      </td>
    </tr>
  )
}
