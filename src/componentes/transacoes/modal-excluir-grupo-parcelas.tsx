'use client'

import { ModalBase } from '@/componentes/modais/modal-base'
import { Button } from '@/componentes/ui/button'
import { Icone } from '@/componentes/ui/icone'
import type { Transacao } from '@/tipos/database'

interface ModalExcluirGrupoParcelasProps {
  isOpen: boolean
  transacao: Transacao | null
  onClose: () => void
  onConfirm: () => Promise<void>
  carregando?: boolean
}

export function ModalExcluirGrupoParcelas({
  isOpen,
  transacao,
  onClose,
  onConfirm,
  carregando = false
}: ModalExcluirGrupoParcelasProps) {
  if (!transacao || !transacao.grupo_parcelamento) return null

  const valorTotal = transacao.valor * transacao.total_parcelas

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
            <div className="flex items-center">
              <Icone name="trash-2" className="w-3 h-3 text-red-500" />
              <Icone name="folder" className="w-2 h-2 text-red-500 -ml-0.5" />
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-medium text-gray-900 leading-tight">
              Excluir {transacao.total_parcelas} parcelas?
            </h3>
            <p className="text-xs text-red-600 mt-0.5 font-medium">
              Remove TODAS permanentemente
            </p>
          </div>
        </div>

        {/* Informações do grupo - micro compacto */}
        <div className="bg-red-50 border border-red-200/50 rounded-md p-2 space-y-1.5">
          <p className="font-medium text-gray-900 text-sm leading-tight">
            {transacao.descricao}
          </p>
          
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <p className="text-xs text-gray-500 mb-0.5">{transacao.total_parcelas}x parcelas</p>
              <p className={`font-medium text-xs ${
                transacao.tipo === 'receita' ? 'text-green-600' :
                transacao.tipo === 'despesa' ? 'text-red-600' : 'text-blue-600'
              }`}>
                {transacao.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500 mb-0.5">Total</p>
              <p className={`font-bold text-sm ${
                transacao.tipo === 'receita' ? 'text-green-600' :
                transacao.tipo === 'despesa' ? 'text-red-600' : 'text-blue-600'
              }`}>
                {valorTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </p>
            </div>
          </div>
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
                Excluir Todas
              </>
            )}
          </Button>
        </div>
      </div>
    </ModalBase>
  )
}