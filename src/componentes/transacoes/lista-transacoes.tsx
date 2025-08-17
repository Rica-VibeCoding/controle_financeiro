'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/componentes/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/componentes/ui/table'
import { LoadingPage } from '@/componentes/comum/loading'
import { Transacao } from '@/tipos/database'
import { obterTransacoesSimples } from '@/servicos/supabase/transacoes-simples'

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

  useEffect(() => {
    async function carregarDados() {
      try {
        setCarregando(true)
        setErro(null)
        
        
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
    <div className="space-y-4">
      {/* Erro */}
      {erro && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <h4 className="font-medium text-red-800 mb-2">❌ Erro</h4>
          <p className="text-sm text-red-700">{erro}</p>
        </div>
      )}

      {/* Tabela */}
      <div className="border rounded-lg overflow-x-auto bg-white shadow-sm">
        <Table className="min-w-full">
          <TableHeader>
            <TableRow className="border-b bg-gray-50/50">
              <TableHead className="w-[110px] font-semibold whitespace-nowrap">Data</TableHead>
              <TableHead className="min-w-[250px] font-semibold">Descrição</TableHead>
              <TableHead className="w-[180px] font-semibold">Categoria</TableHead>
              <TableHead className="w-[130px] font-semibold text-right whitespace-nowrap">Valor</TableHead>
              <TableHead className="w-[150px] font-semibold">Conta</TableHead>
              <TableHead className="w-[110px] font-semibold text-center">Status</TableHead>
              <TableHead className="w-[90px] font-semibold text-center">Ações</TableHead>
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
                  <TableRow key={transacao.id} className="hover:bg-gray-50/50">
                    <TableCell className="font-mono text-sm whitespace-nowrap">
                      {new Date(transacao.data).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{transacao.descricao}</div>
                        {transacao.observacoes && (
                          <div className="text-xs text-muted-foreground truncate">
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
                        <div className="truncate">{(transacao as any).categoria?.nome || '-'}</div>
                        {(transacao as any).subcategoria?.nome && (
                          <div className="text-xs text-muted-foreground truncate">
                            {(transacao as any).subcategoria.nome}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      {formatarValor(transacao.valor, transacao.tipo)}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="truncate">{(transacao as any).conta?.nome || '-'}</div>
                        {transacao.tipo === 'transferencia' && (transacao as any).conta_destino && (
                          <div className="text-xs text-muted-foreground truncate">
                            → {(transacao as any).conta_destino.nome}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      {formatarStatus(transacao.status)}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 justify-center">
                        {aoEditar && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => aoEditar(transacao)}
                            title="Editar transação"
                            className="h-8 w-8 p-0"
                          >
                            ✏️
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => confirmarExclusao(transacao)}
                          className="text-destructive hover:text-destructive h-8 w-8 p-0"
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
    </div>
  )
}