'use client'

import { useState } from 'react'
import { Button } from '@/componentes/ui/button'
import { Card, CardContent } from '@/componentes/ui/card'
import { Transacao } from '@/tipos/database'
import { usarTransacoes } from '@/hooks/usar-transacoes'

interface ItemParcelaProps {
  transacao: Transacao
  aoEditar?: (transacao: Transacao) => void
  aoVerParcelas?: (grupoParcelamento: number) => void
}

export function ItemParcela({ 
  transacao, 
  aoEditar, 
  aoVerParcelas 
}: ItemParcelaProps) {
  const { excluirGrupoParcelamento } = usarTransacoes()
  const [expandido, setExpandido] = useState(false)

  // Formatar valor
  const formatarValor = (valor: number) => {
    return valor.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    })
  }

  // Formatar data
  const formatarData = (data: string) => {
    return new Date(data).toLocaleDateString('pt-BR')
  }

  // Excluir grupo de parcelas
  const handleExcluirGrupo = async () => {
    if (!transacao.grupo_parcelamento) return

    const confirmar = window.confirm(
      `Deseja excluir TODAS as ${transacao.total_parcelas} parcelas desta compra?\n\n` +
      `Esta ação não pode ser desfeita.`
    )

    if (confirmar) {
      try {
        await excluirGrupoParcelamento(transacao.grupo_parcelamento)
      } catch (error) {
        console.error('Erro ao excluir parcelas:', error)
      }
    }
  }

  // Ver todas as parcelas
  const handleVerParcelas = () => {
    if (transacao.grupo_parcelamento && aoVerParcelas) {
      aoVerParcelas(transacao.grupo_parcelamento)
    }
  }

  // Identificar se é primeira parcela do grupo
  const isPrimeiraParcela = transacao.parcela_atual === 1

  return (
    <div className={`border rounded-lg ${isPrimeiraParcela ? 'border-blue-200 bg-blue-50/50' : 'border-gray-200'}`}>
      <div className="p-3">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-medium text-sm">
                {transacao.descricao}
              </h4>
              {isPrimeiraParcela && (
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                  Parcelado
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span>
                Parcela {transacao.parcela_atual}/{transacao.total_parcelas}
              </span>
              <span>{formatarData(transacao.data)}</span>
              <span className="font-medium texto-despesa">
                {formatarValor(transacao.valor)}
              </span>
              <span className={`
                ${transacao.status === 'realizado' ? 'texto-realizado' : 
                  transacao.status === 'previsto' ? 'texto-previsto' : 
                  'texto-outro'}
              `}>
                {transacao.status}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {isPrimeiraParcela && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleVerParcelas}
                  className="text-xs h-7"
                >
                  Ver Todas
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setExpandido(!expandido)}
                  className="text-xs h-7"
                >
                  {expandido ? '▼' : '▶'}
                </Button>
              </>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={() => aoEditar?.(transacao)}
              className="text-xs h-7"
            >
              Editar
            </Button>
            {isPrimeiraParcela && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleExcluirGrupo}
                className="text-xs h-7 text-red-600 hover:text-red-700"
              >
                Excluir Grupo
              </Button>
            )}
          </div>
        </div>

        {/* Informações expandidas apenas para primeira parcela */}
        {isPrimeiraParcela && expandido && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-muted-foreground">Valor Total:</span>
                <div className="font-medium">
                  {formatarValor(transacao.valor * transacao.total_parcelas)}
                </div>
              </div>
              <div>
                <span className="text-muted-foreground">Conta:</span>
                <div className="font-medium">
                  {(transacao as any).conta?.nome || 'N/A'}
                </div>
              </div>
              <div>
                <span className="text-muted-foreground">Categoria:</span>
                <div className="font-medium">
                  {(transacao as any).categoria?.nome || 'N/A'}
                </div>
              </div>
              <div>
                <span className="text-muted-foreground">Forma Pgto:</span>
                <div className="font-medium">
                  {(transacao as any).forma_pagamento?.nome || 'N/A'}
                </div>
              </div>
            </div>
            
            {transacao.observacoes && (
              <div className="mt-2">
                <span className="text-muted-foreground text-xs">Observações:</span>
                <div className="text-xs">{transacao.observacoes}</div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}