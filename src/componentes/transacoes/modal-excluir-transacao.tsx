'use client'

import { ModalBase } from '@/componentes/modais/modal-base'
import { Button } from '@/componentes/ui/button'
import { Icone } from '@/componentes/ui/icone'
import type { Transacao } from '@/tipos/database'

interface ModalExcluirTransacaoProps {
  isOpen: boolean
  transacao: Transacao | null
  onClose: () => void
  onConfirm: () => Promise<void>
  carregando?: boolean
}

export function ModalExcluirTransacao({
  isOpen,
  transacao,
  onClose,
  onConfirm,
  carregando = false
}: ModalExcluirTransacaoProps) {
  if (!transacao) return null

  const isParcelada = transacao.total_parcelas > 1
  const hasGrupoParcelamento = transacao.grupo_parcelamento !== null

  const handleConfirm = async () => {
    try {
      await onConfirm()
      onClose()
    } catch (error) {
      // Erro já tratado no componente pai
    }
  }

  return (
    <ModalBase
      isOpen={isOpen}
      onClose={onClose}
      title=""
      size="xs"
    >
      <div className="space-y-3">
        {/* Header com ícone e mensagem */}
        <div className="flex items-start gap-2.5">
          <div className="flex-shrink-0 w-7 h-7 bg-red-50 rounded-lg flex items-center justify-center">
            <Icone name="trash-2" className="w-3.5 h-3.5 text-red-500" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-medium text-gray-900 leading-tight">
              Excluir esta transação?
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Esta ação não pode ser desfeita
            </p>
          </div>
        </div>

        {/* Informações da transação - ultra compacto */}
        <div className="bg-gray-50 rounded-md p-2 space-y-1.5">
          <p className="font-medium text-gray-900 text-sm leading-tight">
            {transacao.descricao}
          </p>
          
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">
              {new Date(transacao.data).toLocaleDateString('pt-BR')}
            </span>
            <span className={`text-sm font-semibold ${
              transacao.tipo === 'receita' ? 'text-green-600' :
              transacao.tipo === 'despesa' ? 'text-red-600' : 'text-blue-600'
            }`}>
              {transacao.tipo === 'receita' ? '+' : transacao.tipo === 'despesa' ? '-' : ''}
              {transacao.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </span>
          </div>

          {/* Aviso sobre parcelas - mais discreto */}
          {isParcelada && hasGrupoParcelamento && (
            <div className="border-t border-gray-200 pt-1 mt-1">
              <div className="flex items-center gap-1 text-xs text-amber-600">
                <Icone name="info" className="w-3 h-3" />
                <span>Parcela {transacao.parcela_atual}/{transacao.total_parcelas}</span>
              </div>
            </div>
          )}
        </div>

        {/* Botões de ação - micro */}
        <div className="flex gap-1.5 pt-1">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={carregando}
            className="flex-1 h-7 text-xs px-2"
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={carregando}
            className="flex-1 h-7 text-xs px-2"
          >
            {carregando ? (
              <>
                <Icone name="loader-2" className="w-3 h-3 mr-1 animate-spin" />
                Excluindo
              </>
            ) : (
              <>
                <Icone name="trash-2" className="w-3 h-3 mr-1" />
                Excluir
              </>
            )}
          </Button>
        </div>
      </div>
    </ModalBase>
  )
}