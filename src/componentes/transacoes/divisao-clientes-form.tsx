'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/componentes/ui/button'
import { Input } from '@/componentes/ui/input'
import { Select } from '@/componentes/ui/select'
import { Label } from '@/componentes/ui/label'
import { DivisaoCliente } from '@/tipos/transacao-divisao'
import { Contato } from '@/tipos/database'
import { v4 as uuidv4 } from 'uuid'

interface DivisaoClientesFormProps {
  clientes: Contato[]
  valorTotal: number
  divisoesIniciais?: DivisaoCliente[]
  onChange: (divisoes: DivisaoCliente[]) => void
}

export function DivisaoClientesForm({
  clientes,
  valorTotal,
  divisoesIniciais = [],
  onChange
}: DivisaoClientesFormProps) {
  const [habilitado, setHabilitado] = useState(divisoesIniciais.length > 0)
  const [divisoes, setDivisoes] = useState<DivisaoCliente[]>(
    divisoesIniciais.length > 0
      ? divisoesIniciais
      : [{ id: uuidv4(), cliente_id: '', valor_alocado: 0 }]
  )

  // Calcular soma atual
  const somaAtual = divisoes.reduce((sum, div) => sum + (div.valor_alocado || 0), 0)
  const diferenca = valorTotal - somaAtual
  const valido = Math.abs(diferenca) < 0.01 // Tolerância de 1 centavo

  // Notificar mudanças (remove onChange das dependências para evitar loop)
  useEffect(() => {
    if (habilitado && divisoes.length > 0) {
      onChange(divisoes)
    } else {
      onChange([])
    }
  }, [habilitado, divisoes, onChange])

  const adicionarDivisao = () => {
    setDivisoes([...divisoes, {
      id: uuidv4(),
      cliente_id: '',
      valor_alocado: diferenca > 0 ? diferenca : 0
    }])
  }

  const removerDivisao = (index: number) => {
    if (divisoes.length === 1) {
      setHabilitado(false)
      setDivisoes([])
    } else {
      setDivisoes(divisoes.filter((_, i) => i !== index))
    }
  }

  const atualizarDivisao = (index: number, campo: keyof DivisaoCliente, valor: string | number) => {
    const novasDivisoes = [...divisoes]
    novasDivisoes[index] = { ...novasDivisoes[index], [campo]: valor }
    setDivisoes(novasDivisoes)
  }

  if (!habilitado) {
    return (
      <Button
        type="button"
        variant="outline"
        onClick={() => {
          setHabilitado(true)
          setDivisoes([{ id: uuidv4(), cliente_id: '', valor_alocado: valorTotal }])
        }}
        className="w-full mt-2"
      >
        ➕ Dividir entre múltiplos clientes
      </Button>
    )
  }

  return (
    <div className="border border-blue-200 rounded-lg p-4 mt-2 bg-blue-50/30">
      <div className="flex items-center justify-between mb-3">
        <Label className="text-sm font-semibold text-blue-900">
          📊 Divisão entre Clientes
        </Label>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            setHabilitado(false)
            setDivisoes([])
          }}
        >
          ✕ Cancelar divisão
        </Button>
      </div>

      <div className="space-y-2">
        {divisoes.map((divisao, index) => (
          <div key={divisao.id} className="grid grid-cols-[1fr,120px,40px] gap-2 items-end">
            <div className="space-y-1">
              <Label className="text-xs text-gray-600">Cliente</Label>
              <Select
                value={divisao.cliente_id}
                onChange={(e) => atualizarDivisao(index, 'cliente_id', e.target.value)}
                required
              >
                <option value="">Selecione...</option>
                {clientes.map(cliente => (
                  <option key={cliente.id} value={cliente.id}>
                    {cliente.nome}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-gray-600">Valor (R$)</Label>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                value={divisao.valor_alocado || ''}
                onChange={(e) => atualizarDivisao(index, 'valor_alocado', Number(e.target.value))}
                required
              />
            </div>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => removerDivisao(index)}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              🗑️
            </Button>
          </div>
        ))}
      </div>

      <div className="mt-3 pt-3 border-t border-blue-200">
        <div className="flex justify-between items-center text-sm mb-2">
          <span className="text-gray-600">Valor Total:</span>
          <span className="font-semibold">R$ {valorTotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between items-center text-sm mb-2">
          <span className="text-gray-600">Soma Alocada:</span>
          <span className={somaAtual > valorTotal ? 'text-red-600 font-semibold' : 'font-semibold'}>
            R$ {somaAtual.toFixed(2)}
          </span>
        </div>
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-600">Diferença:</span>
          <span className={!valido ? 'text-orange-600 font-semibold' : 'text-green-600 font-semibold'}>
            R$ {Math.abs(diferenca).toFixed(2)} {diferenca > 0 ? '(falta)' : diferenca < 0 ? '(excesso)' : '✓'}
          </span>
        </div>
      </div>

      {!valido && (
        <div className="mt-2 p-2 bg-orange-50 border border-orange-200 rounded text-xs text-orange-700">
          ⚠️ A soma deve ser igual ao valor total da transação
        </div>
      )}

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={adicionarDivisao}
        className="w-full mt-3"
      >
        ➕ Adicionar outro cliente
      </Button>
    </div>
  )
}
