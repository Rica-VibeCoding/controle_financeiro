'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/componentes/ui/button'
import { Icone } from '@/componentes/ui/icone'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/componentes/ui/table'
import { LoadingPage } from '@/componentes/comum/loading'
import { Transacao } from '@/tipos/database'
import { obterTransacoesSimples } from '@/servicos/supabase/transacoes-simples'
import { excluirTransacao, excluirGrupoParcelamento } from '@/servicos/supabase/transacoes'

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
      'previsto': 'text-yellow-600',
      'realizado': 'text-green-600'
    }

    return (
      <span className={`text-sm flex items-center gap-1 ${cores[status as keyof typeof cores]}`}>
        <span aria-hidden="true">
          {status === 'realizado' ? (
            <Icone name="check-circle-2" className="w-3.5 h-3.5" />
          ) : (
            <Icone name="clock" className="w-3.5 h-3.5" />
          )}
        </span>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    )
  }

  // Hard delete da transação conforme solicitado
  const confirmarExclusao = async (transacao: Transacao) => {
    // Verificar se é transação parcelada
    const isParcelada = transacao.total_parcelas > 1
    const hasGrupoParcelamento = transacao.grupo_parcelamento !== null
    
    let mensagemConfirmacao = `⚠️ ATENÇÃO: Esta ação será PERMANENTE!\n\n`
    mensagemConfirmacao += `Transação: "${transacao.descricao}"\n`
    mensagemConfirmacao += `Valor: ${transacao.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}\n`
    mensagemConfirmacao += `Data: ${new Date(transacao.data).toLocaleDateString('pt-BR')}\n`
    
    // Opcões para transações parceladas
    if (isParcelada && hasGrupoParcelamento) {
      mensagemConfirmacao += `\n🔹 Esta é a parcela ${transacao.parcela_atual} de ${transacao.total_parcelas}\n`
      mensagemConfirmacao += `\nEscolha uma opção:\n`
      mensagemConfirmacao += `• OK = Excluir APENAS esta parcela\n`
      mensagemConfirmacao += `• Cancelar = Não excluir nada\n\n`
      mensagemConfirmacao += `💡 Para excluir TODAS as parcelas, clique no botão "🗑️📦" ao lado`
    } else {
      mensagemConfirmacao += `\nTem certeza que deseja excluir DEFINITIVAMENTE esta transação?`
    }
    
    const confirmar = window.confirm(mensagemConfirmacao)
    
    if (confirmar) {
      try {
        await excluirTransacao(transacao.id)
        
        // Atualizar lista local após exclusão
        setTransacoes(prev => prev.filter(t => t.id !== transacao.id))
        
        // Exibir feedback de sucesso
        alert(`✅ Transação "${transacao.descricao}" excluída com sucesso!`)
        
      } catch (error) {
        console.error('Erro ao excluir transação:', error)
        alert(`❌ Erro ao excluir transação: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
      }
    }
  }

  // Excluir todas as parcelas de um grupo
  const confirmarExclusaoGrupo = async (transacao: Transacao) => {
    if (!transacao.grupo_parcelamento) {
      alert('Esta transação não faz parte de um grupo de parcelas.')
      return
    }
    
    const confirmar = window.confirm(
      `⚠️ ATENÇÃO: Esta ação excluirá TODAS as parcelas!\n\n` +
      `Transação: "${transacao.descricao}"\n` +
      `Total de parcelas: ${transacao.total_parcelas}\n` +
      `Valor total: ${(transacao.valor * transacao.total_parcelas).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}\n\n` +
      `Tem certeza que deseja excluir DEFINITIVAMENTE todas as ${transacao.total_parcelas} parcelas?`
    )
    
    if (confirmar) {
      try {
        await excluirGrupoParcelamento(transacao.grupo_parcelamento)
        
        // Atualizar lista local removendo todas as parcelas do grupo
        setTransacoes(prev => prev.filter(t => t.grupo_parcelamento !== transacao.grupo_parcelamento))
        
        // Exibir feedback de sucesso
        alert(`✅ Todas as ${transacao.total_parcelas} parcelas de "${transacao.descricao}" foram excluídas com sucesso!`)
        
      } catch (error) {
        console.error('Erro ao excluir grupo de parcelas:', error)
        alert(`❌ Erro ao excluir parcelas: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
      }
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
              <TableHead className="w-[120px] font-semibold text-center">Ações</TableHead>
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
                            <Icone name="pencil" className="w-4 h-4" aria-hidden="true" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => confirmarExclusao(transacao)}
                          className="text-destructive hover:text-destructive h-8 w-8 p-0"
                          title={
                            transacao.total_parcelas > 1 && transacao.grupo_parcelamento
                              ? `Excluir apenas esta parcela (${transacao.parcela_atual}/${transacao.total_parcelas})`
                              : "Excluir transação"
                          }
                        >
                          <Icone name="trash-2" className="w-4 h-4" aria-hidden="true" />
                        </Button>
                        {/* Botão para excluir todas as parcelas */}
                        {transacao.total_parcelas > 1 && transacao.grupo_parcelamento && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => confirmarExclusaoGrupo(transacao)}
                            className="text-destructive hover:text-destructive h-8 w-8 p-0"
                            title={`Excluir TODAS as ${transacao.total_parcelas} parcelas`}
                          >
                            <Icone name="trash-2" className="w-4 h-4" aria-hidden="true" />
                          </Button>
                        )}
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