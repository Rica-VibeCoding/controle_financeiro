'use client'

import { Select } from '@/componentes/ui/select'
import { Label } from '@/componentes/ui/label'
import { useDadosAuxiliares } from '@/contextos/dados-auxiliares-contexto'

interface SeletorContaProps {
  contaSelecionada: string
  onContaChange: (contaId: string) => void
  desabilitado?: boolean
}

export function SeletorConta({ 
  contaSelecionada, 
  onContaChange, 
  desabilitado = false 
}: SeletorContaProps) {
  const { dados } = useDadosAuxiliares()
  const { contas } = dados

  return (
    <div className="space-y-2">
      <Label htmlFor="conta">Conta para Importação *</Label>
      <Select
        id="conta"
        value={contaSelecionada}
        onChange={(e) => onContaChange(e.target.value)}
        disabled={desabilitado}
      >
        <option value="">Selecione uma conta</option>
        {contas.map((conta) => (
          <option key={conta.id} value={conta.id}>
            {conta.nome} ({conta.tipo}){conta.banco && ` - ${conta.banco}`}
          </option>
        ))}
      </Select>
      {!contaSelecionada && (
        <p className="text-xs text-muted-foreground">
          Escolha a conta onde as transações serão importadas
        </p>
      )}
    </div>
  )
}