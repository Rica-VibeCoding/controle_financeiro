'use client'

import { Select } from '@/componentes/ui/select'
import { Label } from '@/componentes/ui/label'
import { useDadosAuxiliares } from '@/contextos/dados-auxiliares-contexto'
import { 
  enriquecerContaComStatus, 
  obterIconeStatus, 
  obterCorStatus,
  detectarStatusPadrao 
} from '@/servicos/importacao/detector-status-conta'
import { TipoConta, StatusTransacao, ContaComStatusPadrao } from '@/tipos/importacao'

interface SeletorContaProps {
  contaSelecionada: string
  onContaChange: (contaId: string) => void
  desabilitado?: boolean
  // FASE 1: Callback para informar mudança de status padrão
  onStatusPadraoChange?: (statusPadrao: StatusTransacao) => void
}

export function SeletorConta({ 
  contaSelecionada, 
  onContaChange, 
  desabilitado = false,
  onStatusPadraoChange
}: SeletorContaProps) {
  const { dados } = useDadosAuxiliares()
  const { contas } = dados

  // FASE 1: Enriquecer contas com informações de status
  const contasComStatus: ContaComStatusPadrao[] = contas.map(conta => 
    enriquecerContaComStatus(conta)
  )

  // Encontrar conta selecionada para mostrar status
  const contaSelecionadaInfo = contasComStatus.find(c => c.id === contaSelecionada)

  const handleContaChange = (contaId: string) => {
    onContaChange(contaId)
    
    // FASE 1: Notificar mudança de status padrão
    if (onStatusPadraoChange && contaId) {
      const conta = contasComStatus.find(c => c.id === contaId)
      if (conta) {
        onStatusPadraoChange(conta.statusPadrao)
      }
    }
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="conta">Conta para Importação *</Label>
      <Select
        id="conta"
        value={contaSelecionada}
        onChange={(e) => handleContaChange(e.target.value)}
        disabled={desabilitado}
      >
        <option value="">Selecione uma conta</option>
        {contasComStatus.map((conta) => {
          const contaOriginal = contas.find(c => c.id === conta.id)
          return (
            <option key={conta.id} value={conta.id}>
              {conta.nome} ({conta.tipo}){contaOriginal?.banco && ` - ${contaOriginal.banco}`}
            </option>
          )
        })}
      </Select>
      
      {/* FASE 1: Mostrar informações de status quando conta selecionada */}
      {contaSelecionadaInfo && (
        <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
          <div className="flex items-center gap-2 text-sm">
            <span className="font-medium text-blue-900">Status das transações:</span>
            <span className={`flex items-center gap-1 ${obterCorStatus(contaSelecionadaInfo.statusPadrao)}`}>
              {obterIconeStatus(contaSelecionadaInfo.statusPadrao)}
              <strong>{contaSelecionadaInfo.statusPadrao}</strong>
            </span>
          </div>
          <p className="text-xs text-blue-700 mt-1">
            {contaSelecionadaInfo.descricaoStatus}
          </p>
        </div>
      )}
      
      {!contaSelecionada && (
        <p className="text-xs text-muted-foreground">
          Escolha a conta onde as transações serão importadas
        </p>
      )}
    </div>
  )
}