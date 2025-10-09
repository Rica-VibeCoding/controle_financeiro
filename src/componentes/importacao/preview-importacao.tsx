'use client'

import { useState } from 'react'
import { TransacaoImportada, TransacaoClassificada, ResumoClassificacao, DadosClassificacao } from '@/tipos/importacao'
import { FormatoCSV } from '@/servicos/importacao/detector-formato'
import { Card, CardContent, CardHeader, CardTitle } from '@/componentes/ui/card'
import { CardsResumoClassificacao } from './cards-resumo-classificacao'
import { LinhaTransacaoClassificada } from './linha-transacao-classificada'
import { ModalClassificacaoRapida } from './modal-classificacao-rapida'

interface PreviewImportacaoProps {
  // Props originais (manter compatibilidade)
  transacoes: TransacaoImportada[]
  duplicadas: TransacaoImportada[]
  onConfirmar: () => void
  onCancelar: () => void
  carregando?: boolean
  
  // Novas props para classificação
  transacoesClassificadas?: TransacaoClassificada[]
  resumoClassificacao?: ResumoClassificacao
  onClassificarTransacao?: (transacao: TransacaoClassificada, dados: DadosClassificacao) => void
  onToggleSelecaoTransacao?: (transacao: TransacaoClassificada, selecionada: boolean) => void
  formatoOrigem?: FormatoCSV
}

export function PreviewImportacao({
  transacoes,
  duplicadas,
  onConfirmar,
  onCancelar,
  carregando = false,
  transacoesClassificadas,
  resumoClassificacao,
  onClassificarTransacao,
  onToggleSelecaoTransacao,
  formatoOrigem
}: PreviewImportacaoProps) {
  
  const [transacaoParaClassificar, setTransacaoParaClassificar] = 
    useState<TransacaoClassificada | null>(null)

  // Usar dados classificados se disponíveis, senão fallback para original
  const usandoClassificacao = transacoesClassificadas && resumoClassificacao
  
  // Separar por status para exibição
  const novas = usandoClassificacao 
    ? transacoesClassificadas.filter(t => t.status_classificacao !== 'duplicada')
    : transacoes.filter(t => 
        !duplicadas.some(d => d.identificador_externo === t.identificador_externo)
      )
      
  // Contar transações selecionadas
  const transacoesSelecionadas = usandoClassificacao 
    ? (transacoesClassificadas || []).filter(t => 
        t.status_classificacao !== 'duplicada' && (t.selecionada ?? true)
      )
    : novas

  const duplicadasParaExibir = usandoClassificacao
    ? transacoesClassificadas.filter(t => t.status_classificacao === 'duplicada')
    : duplicadas

  const handleClassificarTransacao = (transacao: TransacaoClassificada, dados: DadosClassificacao) => {
    if (onClassificarTransacao) {
      onClassificarTransacao(transacao, dados)
    }
    setTransacaoParaClassificar(null)
  }

  return (
    <div className="space-y-4">
      {/* Cards de Resumo */}
      {usandoClassificacao ? (
        <CardsResumoClassificacao resumo={resumoClassificacao} />
      ) : (
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-600">{novas.length}</div>
              <div className="text-sm text-muted-foreground">Novas transações</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-orange-600">{duplicadasParaExibir.length}</div>
              <div className="text-sm text-muted-foreground">Duplicadas (ignoradas)</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Lista de Transações para Importar */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {usandoClassificacao ? 'Transações Classificadas' : 'Transações a Importar'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-h-60 overflow-y-auto space-y-2">
            {novas.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">
                Nenhuma transação nova para importar
              </p>
            ) : (
              novas.map((transacao, index) => (
                usandoClassificacao ? (
                  <LinhaTransacaoClassificada
                    key={index}
                    transacao={transacao as TransacaoClassificada}
                    onClick={() => {
                      const transacaoClass = transacao as TransacaoClassificada
                      // Permitir abrir classificação mesmo com match para conferência
                      setTransacaoParaClassificar(transacaoClass)
                    }}
                    onToggleSelecao={onToggleSelecaoTransacao}
                  />
                ) : (
                  // Fallback para layout original
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
                )
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Duplicadas */}
      {duplicadasParaExibir.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg text-orange-600">
              Transações Duplicadas (Serão Ignoradas)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-40 overflow-y-auto space-y-1">
              {duplicadasParaExibir.map((transacao, index) => (
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

      {/* Modal de Classificação */}
      {usandoClassificacao && onClassificarTransacao && (
        <ModalClassificacaoRapida
          isOpen={!!transacaoParaClassificar}
          onClose={() => setTransacaoParaClassificar(null)}
          transacao={transacaoParaClassificar}
          onClassificar={(dados) => handleClassificarTransacao(transacaoParaClassificar!, dados)}
          formatoOrigem={formatoOrigem}
        />
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
          disabled={carregando || transacoesSelecionadas.length === 0}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
        >
          {carregando ? 'Importando...' : `Importar ${transacoesSelecionadas.length} transações`}
        </button>
      </div>
    </div>
  )
}