'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/componentes/ui/card'
import { Button } from '@/componentes/ui/button'
import { Icone } from '@/componentes/ui/icone'
import { LoadingText } from '@/componentes/comum/loading'
import { Transacao } from '@/tipos/database'
import { usarTransacoes } from '@/hooks/usar-transacoes'

export function ListaRecorrentes() {
  const { 
    buscarTransacoesRecorrentes, 
    processarRecorrenciasVencidas, 
    pararRecorrencia, 
    loading 
  } = usarTransacoes()
  
  const [recorrentes, setRecorrentes] = useState<Transacao[]>([])
  const [processando, setProcessando] = useState(false)

  // Carregar transações recorrentes
  useEffect(() => {
    async function carregarRecorrentes() {
      const dados = await buscarTransacoesRecorrentes()
      setRecorrentes(dados)
    }
    carregarRecorrentes()
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

  // Parar recorrência
  const handlePararRecorrencia = async (id: string, descricao: string) => {
    const confirmar = window.confirm(
      `Deseja parar a recorrência de "${descricao}"?\n\n` +
      'A transação não será mais repetida automaticamente.'
    )

    if (confirmar) {
      try {
        await pararRecorrencia(id)
        // Recarregar lista
        const dados = await buscarTransacoesRecorrentes()
        setRecorrentes(dados)
      } catch (error) {
        console.error('Erro ao parar recorrência:', error)
      }
    }
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
          <div className="text-center py-8 text-muted-foreground">
            <div className="text-4xl mb-2" aria-hidden="true"><Icone name="refresh-ccw" className="w-6 h-6" /></div>
            <p>Nenhuma transação recorrente cadastrada</p>
            <p className="text-sm">Crie uma transação e marque como recorrente</p>
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
                      onClick={() => handlePararRecorrencia(transacao.id, transacao.descricao)}
                      className="text-xs text-red-600 hover:text-red-700"
                    >
                      Parar
                    </Button>
                  </div>
                </div>
              </div>
            ))}

            {/* Informações úteis */}
            <div className="bg-blue-50 p-3 rounded text-sm text-blue-800 mt-4">
              <p className="font-medium">Dicas sobre transações recorrentes:</p>
              <ul className="mt-1 space-y-1 text-xs">
                <li>• <strong>Vencidas:</strong> Use "Processar Vencidas" para gerar as previstas</li>
                <li>• <strong>Automático:</strong> Transações são criadas como "previsto"</li>
                <li>• <strong>Manual:</strong> Marque como "realizado" após efetuar o pagamento</li>
                <li>• <strong>Parar:</strong> Use "Parar" para interromper a recorrência</li>
              </ul>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}