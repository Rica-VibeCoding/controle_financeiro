'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/componentes/ui/card'
import { Button } from '@/componentes/ui/button'
import { Meta } from '@/tipos/database'
import { MetasService } from '@/servicos/supabase/metas'

interface CardMetaProps {
  meta: Meta
  aoEditar?: (meta: Meta) => void
  aoExcluir?: (meta: Meta) => void
}

interface ProgressoMeta {
  valorGasto: number
  valorLimite: number
  percentual: number
  status: 'normal' | 'atencao' | 'alerta' | 'excedido'
}

export function CardMeta({ meta, aoEditar, aoExcluir }: CardMetaProps) {
  const [progresso, setProgresso] = useState<ProgressoMeta | null>(null)
  const [loading, setLoading] = useState(true)

  // Carregar progresso da meta
  useEffect(() => {
    async function carregarProgresso() {
      try {
        const progressoData = await MetasService.calcularProgresso(meta)
        setProgresso(progressoData)
      } catch (error) {
        console.error('Erro ao carregar progresso:', error)
      } finally {
        setLoading(false)
      }
    }

    carregarProgresso()
  }, [meta])

  // Formatar data
  const formatarData = (data: string) => {
    return new Date(data).toLocaleDateString('pt-BR')
  }

  // Formatar valor
  const formatarValor = (valor: number) => {
    return valor.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    })
  }

  // Confirmar exclusão
  const confirmarExclusao = () => {
    if (!aoExcluir) return

    const confirmar = window.confirm(
      `Deseja excluir a meta "${meta.nome}"?\n\nEsta ação não pode ser desfeita.`
    )

    if (confirmar) {
      aoExcluir(meta)
    }
  }

  return (
    <Card className={`${
      progresso?.status === 'excedido' ? 'border-red-200 bg-red-50' :
      progresso?.status === 'alerta' ? 'border-orange-200 bg-orange-50' :
      progresso?.status === 'atencao' ? 'border-yellow-200 bg-yellow-50' :
      'border-gray-200'
    }`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg truncate">
              {meta.nome}
            </CardTitle>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                {meta.tipo === 'categoria' ? '📂 Categoria' : '💰 Total'}
              </span>
              {(meta as any).categoria && (
                <span 
                  className="text-xs px-2 py-1 rounded"
                  style={{ 
                    backgroundColor: `${(meta as any).categoria.cor}20`,
                    color: (meta as any).categoria.cor 
                  }}
                >
                  {(meta as any).categoria.nome}
                </span>
              )}
            </div>
          </div>
          
          <div className="flex gap-1 ml-2">
            {aoEditar && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => aoEditar(meta)}
                className="text-xs h-7"
              >
                ✏️
              </Button>
            )}
            {aoExcluir && (
              <Button
                size="sm"
                variant="outline"
                onClick={confirmarExclusao}
                className="text-xs h-7 text-red-600 hover:text-red-700"
              >
                🗑️
              </Button>
            )}
          </div>
        </div>
        
        {meta.descricao && (
          <p className="text-sm text-muted-foreground mt-2">
            {meta.descricao}
          </p>
        )}
      </CardHeader>

      <CardContent className="pt-0">
        {loading ? (
          <div className="text-center py-4 text-sm text-muted-foreground">
            Calculando progresso...
          </div>
        ) : progresso ? (
          <div className="space-y-3">
            {/* Barra de progresso */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progresso</span>
                <span className={MetasService.obterCorStatus(progresso.status)}>
                  {progresso.percentual.toFixed(1)}%
                </span>
              </div>
              
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className={`h-3 rounded-full transition-all duration-300 ${
                    progresso.status === 'excedido' ? 'bg-red-500' :
                    progresso.status === 'alerta' ? 'bg-orange-500' :
                    progresso.status === 'atencao' ? 'bg-yellow-500' :
                    'bg-green-500'
                  }`}
                  style={{ 
                    width: `${Math.min(progresso.percentual, 100)}%`
                  }}
                />
              </div>
            </div>

            {/* Valores */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-muted-foreground block">Gasto</span>
                <span className="font-medium text-red-600">
                  {formatarValor(progresso.valorGasto)}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block">Limite</span>
                <span className="font-medium">
                  {formatarValor(progresso.valorLimite)}
                </span>
              </div>
            </div>

            {/* Status */}
            <div className={`text-xs p-2 rounded ${
              progresso.status === 'excedido' ? 'bg-red-100 text-red-700' :
              progresso.status === 'alerta' ? 'bg-orange-100 text-orange-700' :
              progresso.status === 'atencao' ? 'bg-yellow-100 text-yellow-700' :
              'bg-green-100 text-green-700'
            }`}>
              {MetasService.obterDescricaoStatus(progresso.status)}
            </div>

            {/* Período */}
            <div className="text-xs text-muted-foreground pt-2 border-t">
              📅 {formatarData(meta.periodo_inicio)} até {formatarData(meta.periodo_fim)}
            </div>
          </div>
        ) : (
          <div className="text-center py-4 text-sm text-red-600">
            Erro ao calcular progresso
          </div>
        )}
      </CardContent>
    </Card>
  )
}