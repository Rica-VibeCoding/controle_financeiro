'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/componentes/ui/card'
import { Button } from '@/componentes/ui/button'
import { Icone } from '@/componentes/ui/icone'
import { LoadingText } from '@/componentes/comum/loading'
import { useConfirmDialog } from '@/componentes/ui/confirm-dialog'
import { Transacao } from '@/tipos/database'
import { usarTransacoes } from '@/hooks/usar-transacoes'

export function ListaRecorrentes() {
  const { 
    buscarTransacoesRecorrentes, 
    processarRecorrenciasVencidas, 
    excluirRecorrencia
  } = usarTransacoes()
  
  const { confirm, ConfirmDialog } = useConfirmDialog()
  
  const [recorrentes, setRecorrentes] = useState<Transacao[]>([])
  const [loading, setLoading] = useState(false)
  const [processando, setProcessando] = useState(false)

  // Carregar transações recorrentes
  useEffect(() => {
    async function carregarRecorrentes() {
      try {
        setLoading(true)
        const dados = await buscarTransacoesRecorrentes()
        setRecorrentes(dados)
      } catch (error) {
        console.error('Erro ao carregar recorrentes:', error)
      } finally {
        setLoading(false)
      }
    }
    carregarRecorrentes()
  }, [buscarTransacoesRecorrentes])

  // Escutar evento customizado para atualizar após mudanças
  useEffect(() => {
    const handleAtualizarTransacoes = async () => {
      try {
        setLoading(true)
        const dados = await buscarTransacoesRecorrentes()
        setRecorrentes(dados)
      } catch (error) {
        console.error('Erro ao atualizar recorrentes:', error)
      } finally {
        setLoading(false)
      }
    }
    
    window.addEventListener('atualizarTransacoes', handleAtualizarTransacoes)
    
    return () => {
      window.removeEventListener('atualizarTransacoes', handleAtualizarTransacoes)
    }
  }, [buscarTransacoesRecorrentes])

  // Processar recorrências vencidas
  const handleProcessarRecorrencias = async () => {
    try {
      setProcessando(true)
      await processarRecorrenciasVencidas()
      // Recarregar lista
      const dados = await buscarTransacoesRecorrentes()
      setRecorrentes(dados)
    } catch (error) {
      console.error('Erro ao processar:', error)
    } finally {
      setProcessando(false)
    }
  }

  // Excluir recorrência (hard delete)
  const handleExcluirRecorrencia = (id: string, descricao: string) => {
    confirm({
      title: 'Excluir Transação Recorrente',
      description: `Deseja excluir a recorrência "${descricao}"?

• Configuração será removida definitivamente
• Transações já criadas serão mantidas
• Esta ação não pode ser desfeita`,
      type: 'danger',
      confirmText: 'Excluir',
      cancelText: 'Cancelar',
      onConfirm: async () => {
        try {
          await excluirRecorrencia(id)
          // Recarregar lista
          const dados = await buscarTransacoesRecorrentes()
          setRecorrentes(dados)
        } catch (error) {
          console.error('Erro ao excluir recorrência:', error)
        }
      }
    })
  }

  // Formatar data
  const formatarData = (data: string | null) => {
    return data ? new Date(data).toLocaleDateString('pt-BR') : 'N/A'
  }

  // Formatar valor
  const formatarValor = (valor: number, tipo: string) => {
    const valorFormatado = valor.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    })

    return (
      <span className={`font-medium ${
        tipo === 'receita' ? 'texto-receita' : 
        tipo === 'despesa' ? 'texto-despesa' : 
        'texto-transferencia'
      }`}>
        {tipo === 'receita' ? '+' : tipo === 'despesa' ? '-' : '→'} {valorFormatado}
      </span>
    )
  }

  // Formatar frequência
  const formatarFrequencia = (freq: string | null) => {
    const map: Record<string, string> = {
      'diario': 'Diário',
      'semanal': 'Semanal',
      'mensal': 'Mensal',
      'anual': 'Anual'
    }
    return freq ? map[freq] : 'N/A'
  }

  // Verificar se está vencida
  const isVencida = (proximaRecorrencia: string | null) => {
    if (!proximaRecorrencia) return false
    return new Date(proximaRecorrencia) <= new Date()
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <LoadingText>Carregando transações recorrentes...</LoadingText>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <Button 
              onClick={handleProcessarRecorrencias}
              disabled={processando}
              size="sm"
              className="bg-green-600 hover:bg-green-700"
            >
              {processando ? 'Processando...' : 'Processar Vencidas'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
        {recorrentes.length === 0 ? (
          <div className="text-center py-12">
            <div className="space-y-4">
              <div className="text-6xl opacity-50">🔄</div>
              <div className="space-y-2">
                <h3 className="text-lg font-medium text-foreground">Nenhuma transação recorrente</h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  Antes do primeiro lançamento, crie a sua primeira conta em Cadastros/Contas.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {recorrentes.map((transacao) => (
              <div 
                key={transacao.id} 
                className={`border rounded-lg p-4 ${
                  isVencida(transacao.proxima_recorrencia) 
                    ? 'border-orange-200 bg-orange-50' 
                    : 'border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-medium">{transacao.descricao}</h4>
                      {isVencida(transacao.proxima_recorrencia) && (
                        <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded">
                          Vencida
                        </span>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm text-muted-foreground">
                      <div>
                        <span className="block text-xs">Valor:</span>
                        <div>{formatarValor(transacao.valor, transacao.tipo)}</div>
                      </div>
                      <div>
                        <span className="block text-xs">Frequência:</span>
                        <div>{formatarFrequencia(transacao.frequencia_recorrencia)}</div>
                      </div>
                      <div>
                        <span className="block text-xs">Próxima:</span>
                        <div className={isVencida(transacao.proxima_recorrencia) ? 'text-orange-600 font-medium' : ''}>
                          {formatarData(transacao.proxima_recorrencia)}
                        </div>
                      </div>
                      <div>
                        <span className="block text-xs">Conta:</span>
                        <div>{(transacao as any).conta?.nome || 'N/A'}</div>
                        {(transacao as any).conta && (
                          <div className="text-xs text-muted-foreground flex items-center gap-1">
                            <span>{(transacao as any).conta.tipo.replace('_', ' ')}</span>
                            {(transacao as any).conta.banco && (
                              <>
                                <span>•</span>
                                <span>{(transacao as any).conta.banco}</span>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {transacao.observacoes && (
                      <div className="mt-2 text-xs text-muted-foreground">
                        <span className="font-medium">Obs:</span> {transacao.observacoes}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleExcluirRecorrencia(transacao.id, transacao.descricao)}
                      className="text-xs text-red-600 hover:text-red-700"
                    >
                      Excluir
                    </Button>
                  </div>
                </div>
              </div>
            ))}

          </div>
        )}
        </CardContent>
      </Card>
      
      {/* Modal de Confirmação */}
      <ConfirmDialog />
    </>
  )
}