'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/componentes/ui/card'
import { Button } from '@/componentes/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/componentes/ui/table'
import { LoadingPage } from '@/componentes/comum/loading'
import { Transacao } from '@/tipos/database'
import { obterTransacoesSimples, verificarDadosBanco } from '@/servicos/supabase/transacoes-simples'

interface ListaTransacoesProps {
  aoEditar?: (transacao: Transacao) => void
  aoExcluir?: (transacao: Transacao) => void
}

export function ListaTransacoes({
  aoEditar,
  aoExcluir
}: ListaTransacoesProps) {
  const [transacoes, setTransacoes] = useState<any[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [statusBanco, setStatusBanco] = useState<any>(null)

  useEffect(() => {
    async function carregarDados() {
      try {
        setCarregando(true)
        setErro(null)
        
        // Verificar status do banco
        const status = await verificarDadosBanco()
        setStatusBanco(status)
        
        // Carregar transações
        const dadosTransacoes = await obterTransacoesSimples()
        setTransacoes(dadosTransacoes)
        
      } catch (error) {
        console.error('Erro ao carregar dados:', error)
        setErro(error instanceof Error ? error.message : 'Erro desconhecido')
      } finally {
        setCarregando(false)
      }
    }

    carregarDados()
  }, [])

  // Formatar valor
  const formatarValor = (valor: number, tipo: string) => {
    const valorFormatado = valor.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    })

    return (
      <span className={`font-medium ${
        tipo === 'receita' ? 'text-green-600' : 
        tipo === 'despesa' ? 'text-red-600' : 
        'text-blue-600'
      }`}>
        {tipo === 'receita' ? '+' : tipo === 'despesa' ? '-' : '→'} {valorFormatado}
      </span>
    )
  }

  // Formatar status
  const formatarStatus = (status: string) => {
    const cores = {
      'pendente': 'text-yellow-600',
      'pago': 'text-green-600',
      'cancelado': 'text-red-600'
    }

    const icones = {
      'pendente': '⏳',
      'pago': '✅',
      'cancelado': '❌'
    }

    return (
      <span className={`text-sm flex items-center gap-1 ${cores[status as keyof typeof cores]}`}>
        <span>{icones[status as keyof typeof icones]}</span>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    )
  }

  // Confirmar exclusão (temporário - sem Context API)
  const confirmarExclusao = (transacao: Transacao) => {
    if (window.confirm(`Tem certeza que deseja excluir a transação "${transacao.descricao}"?`)) {
      console.log('Exclusão temporariamente desabilitada para debug')
      // excluir(transacao.id)
    }
  }

  if (carregando) {
    return <LoadingPage />
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Transações</CardTitle>
        <CardDescription>
          Gerencie suas receitas, despesas e transferências
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Debug: Status do Banco */}
        {statusBanco && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-medium text-blue-800 mb-2">🔍 Status do Banco (Debug)</h4>
            <div className="text-sm text-blue-700">
              <p>Transações: {statusBanco.transacoes}</p>
              <p>Categorias: {statusBanco.categorias}</p>
              <p>Contas: {statusBanco.contas}</p>
            </div>
          </div>
        )}

        {/* Erro */}
        {erro && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <h4 className="font-medium text-red-800 mb-2">❌ Erro</h4>
            <p className="text-sm text-red-700">{erro}</p>
          </div>
        )}

        {/* Tabela */}
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Conta</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-24">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transacoes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    <div className="space-y-2">
                      <div className="text-4xl">📊</div>
                      <div>Nenhuma transação encontrada</div>
                      <div className="text-sm">Adicione sua primeira transação para começar</div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                transacoes.map((transacao) => (
                  <TableRow key={transacao.id}>
                    <TableCell className="font-mono text-sm">
                      {new Date(transacao.data).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{transacao.descricao}</div>
                        {transacao.observacoes && (
                          <div className="text-xs text-muted-foreground">
                            {transacao.observacoes}
                          </div>
                        )}
                        {transacao.total_parcelas > 1 && (
                          <div className="text-xs text-blue-600">
                            Parcela {transacao.parcela_atual}/{transacao.total_parcelas}
                          </div>
                        )}
                        {transacao.recorrente && (
                          <div className="text-xs text-purple-600">
                            🔄 Recorrente
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {(transacao as any).categoria?.nome || '-'}
                        {(transacao as any).subcategoria?.nome && (
                          <div className="text-xs text-muted-foreground">
                            {(transacao as any).subcategoria.nome}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {formatarValor(transacao.valor, transacao.tipo)}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{(transacao as any).conta?.nome || '-'}</div>
                        {transacao.tipo === 'transferencia' && (transacao as any).conta_destino && (
                          <div className="text-xs text-muted-foreground">
                            → {(transacao as any).conta_destino.nome}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {formatarStatus(transacao.status)}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {aoEditar && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => aoEditar(transacao)}
                            title="Editar transação"
                          >
                            ✏️
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => confirmarExclusao(transacao)}
                          className="text-destructive hover:text-destructive"
                          title="Excluir transação"
                        >
                          🗑️
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Estatísticas */}
        {transacoes.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6 p-4 bg-muted/50 rounded-lg">
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">
                {transacoes.length}
              </div>
              <div className="text-sm text-muted-foreground">Total</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {transacoes.filter(t => t.tipo === 'receita').length}
              </div>
              <div className="text-sm text-muted-foreground">Receitas</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {transacoes.filter(t => t.tipo === 'despesa').length}
              </div>
              <div className="text-sm text-muted-foreground">Despesas</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {transacoes.filter(t => t.tipo === 'transferencia').length}
              </div>
              <div className="text-sm text-muted-foreground">Transferências</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}