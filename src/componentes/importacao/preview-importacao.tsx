'use client'

import { TransacaoImportada } from '@/tipos/importacao'
import { Card, CardContent, CardHeader, CardTitle } from '@/componentes/ui/card'

interface PreviewImportacaoProps {
  transacoes: TransacaoImportada[]
  duplicadas: TransacaoImportada[]
  onConfirmar: () => void
  onCancelar: () => void
  carregando?: boolean
}

export function PreviewImportacao({
  transacoes,
  duplicadas,
  onConfirmar,
  onCancelar,
  carregando = false
}: PreviewImportacaoProps) {
  const novas = transacoes.filter(t => 
    !duplicadas.some(d => d.identificador_externo === t.identificador_externo)
  )

  return (
    <div className="space-y-4">
      {/* Resumo */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{novas.length}</div>
            <div className="text-sm text-muted-foreground">Novas transações</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-orange-600">{duplicadas.length}</div>
            <div className="text-sm text-muted-foreground">Duplicadas (ignoradas)</div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Transações */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Transações a Importar</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-h-60 overflow-y-auto space-y-1">
            {novas.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">
                Nenhuma transação nova para importar
              </p>
            ) : (
              novas.map((transacao, index) => (
                <div 
                  key={index}
                  className="flex justify-between items-center p-2 border-b last:border-b-0 hover:bg-gray-50"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate pr-2">
                      {transacao.descricao.replace(/- •••\.\d+\.\d+-•• - .+$/, '').trim()}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(transacao.data).toLocaleDateString('pt-BR')}
                    </div>
                  </div>
                  <div className={`text-sm font-bold shrink-0 ${
                    transacao.tipo === 'receita' 
                      ? 'text-green-600' 
                      : 'text-red-600'
                  }`}>
                    {transacao.tipo === 'receita' ? '+' : '-'}R$ {transacao.valor.toFixed(2)}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Duplicadas (se existirem) */}
      {duplicadas.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg text-orange-600">
              Transações Duplicadas (Serão Ignoradas)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-40 overflow-y-auto space-y-1">
              {duplicadas.map((transacao, index) => (
                <div 
                  key={index}
                  className="flex justify-between items-center p-2 border-b last:border-b-0 bg-orange-50"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate pr-2">
                      {transacao.descricao.replace(/- •••\.\d+\.\d+-•• - .+$/, '').trim()}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(transacao.data).toLocaleDateString('pt-BR')}
                    </div>
                  </div>
                  <div className="text-sm font-bold text-orange-600 shrink-0">
                    R$ {transacao.valor.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Botões */}
      <div className="flex gap-3 justify-end">
        <button
          onClick={onCancelar}
          disabled={carregando}
          className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
        >
          Cancelar
        </button>
        <button
          onClick={onConfirmar}
          disabled={carregando || novas.length === 0}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
        >
          {carregando ? 'Importando...' : `Importar ${novas.length} transações`}
        </button>
      </div>
    </div>
  )
}