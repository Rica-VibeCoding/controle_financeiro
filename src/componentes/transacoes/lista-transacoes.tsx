'use client'

import { useState } from 'react'
import { Button } from '@/componentes/ui/button'
import { Icone } from '@/componentes/ui/icone'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/componentes/ui/table'
import { TableContainer } from '@/componentes/ui/table-container'
import { LoadingPage, LoadingTransacoes } from '@/componentes/comum/loading'
import { ModalExcluirTransacao } from './modal-excluir-transacao'
import { ModalExcluirGrupoParcelas } from './modal-excluir-grupo-parcelas'
import { Transacao } from '@/tipos/database'
import { excluirTransacao, excluirGrupoParcelamento } from '@/servicos/supabase/transacoes'
import { usarToast } from '@/hooks/usar-toast'
import { useAuth } from '@/contextos/auth-contexto'

interface TransacaoComRelacoes extends Transacao {
  categoria?: { nome: string; cor: string; icone: string }
  subcategoria?: { nome: string }
  conta?: { nome: string; tipo: string; banco?: string }
  conta_destino?: { nome: string; tipo: string; banco?: string }
  forma_pagamento?: { nome: string; tipo: string }
  centro_custo?: { nome: string; cor: string }
}

// Interface antiga removida - componente agora é puro

interface ListaTransacoesPurasProps {
  transacoes: TransacaoComRelacoes[]
  loading: boolean
  error?: string | null
  aoEditar?: (transacao: Transacao) => void
  aoExcluir?: (transacao: Transacao) => void
  aoRecarregar?: () => void
}

/**
 * Componente puro para exibir lista de transações
 * Não gerencia estado próprio - recebe dados via props
 */
export function ListaTransacoes({
  transacoes,
  loading,
  error,
  aoEditar,
  aoExcluir,
  aoRecarregar
}: ListaTransacoesPurasProps) {
  const { workspace } = useAuth()
  const { sucesso, erro } = usarToast()
  
  // Estados para modais
  const [modalExcluir, setModalExcluir] = useState<{
    isOpen: boolean
    transacao: Transacao | null
    carregando: boolean
  }>({ isOpen: false, transacao: null, carregando: false })
  
  const [modalExcluirGrupo, setModalExcluirGrupo] = useState<{
    isOpen: boolean
    transacao: Transacao | null
    carregando: boolean
  }>({ isOpen: false, transacao: null, carregando: false })

  // Componente puro - não gerencia carregamento próprio

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

  // Abrir modal de confirmação de exclusão
  const abrirModalExcluir = (transacao: Transacao) => {
    setModalExcluir({
      isOpen: true,
      transacao,
      carregando: false
    })
  }

  // Hard delete da transação conforme solicitado
  const confirmarExclusao = async (transacao: Transacao) => {
    setModalExcluir(prev => ({ ...prev, carregando: true }))
    
    if (!workspace) return
    
    try {
      await excluirTransacao(transacao.id, workspace.id)
      
      // Recarregar lista após exclusão
      if (aoRecarregar) {
        aoRecarregar()
      }
      
      // Fechar modal
      setModalExcluir({ isOpen: false, transacao: null, carregando: false })
      
      // Exibir feedback de sucesso
      sucesso(`Transação "${transacao.descricao}" excluída com sucesso!`)
      
    } catch (error) {
      console.error('Erro ao excluir transação:', error)
      setModalExcluir(prev => ({ ...prev, carregando: false }))
      erro(`Erro ao excluir transação: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
    }
  }

  // Abrir modal de confirmação de exclusão do grupo
  const abrirModalExcluirGrupo = (transacao: Transacao) => {
    if (!transacao.grupo_parcelamento) {
      erro('Esta transação não faz parte de um grupo de parcelas.')
      return
    }

    setModalExcluirGrupo({
      isOpen: true,
      transacao,
      carregando: false
    })
  }

  // Excluir todas as parcelas de um grupo
  const confirmarExclusaoGrupo = async (transacao: Transacao) => {
    if (!transacao.grupo_parcelamento) {
      erro('Esta transação não faz parte de um grupo de parcelas.')
      return
    }

    setModalExcluirGrupo(prev => ({ ...prev, carregando: true }))
    
    if (!workspace) return
    
    try {
      await excluirGrupoParcelamento(transacao.grupo_parcelamento, workspace.id)
      
      // Recarregar lista após exclusão do grupo
      if (aoRecarregar) {
        aoRecarregar()
      }
      
      // Fechar modal
      setModalExcluirGrupo({ isOpen: false, transacao: null, carregando: false })
      
      // Exibir feedback de sucesso
      sucesso(`Todas as ${transacao.total_parcelas} parcelas de "${transacao.descricao}" foram excluídas com sucesso!`)
      
    } catch (error) {
      console.error('Erro ao excluir grupo de parcelas:', error)
      setModalExcluirGrupo(prev => ({ ...prev, carregando: false }))
      erro(`Erro ao excluir parcelas: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
    }
  }

  if (loading) {
    return <LoadingTransacoes />
  }

  return (
    <div className="space-y-4">
      {/* Erro */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <h4 className="font-medium text-red-800 mb-2">❌ Erro</h4>
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Tabela */}
      <TableContainer>
        <Table className="min-w-full">
          <TableHeader>
            <TableRow className="border-b bg-gray-50/50">
              <TableHead className="w-[80px] font-semibold sticky left-0 bg-gray-50/50 z-20">Data</TableHead>
              <TableHead className="w-[300px] font-semibold">Descrição</TableHead>
              <TableHead className="w-[100px] font-semibold text-right whitespace-nowrap">Valor</TableHead>
              <TableHead className="w-[120px] font-semibold hidden sm:table-cell">Categoria</TableHead>
              <TableHead className="w-[130px] font-semibold hidden md:table-cell">Conta</TableHead>
              <TableHead className="w-[90px] font-semibold text-center hidden sm:table-cell">Status</TableHead>
              <TableHead className="w-[100px] font-semibold text-center">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
              {transacoes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12">
                    <div className="space-y-4">
                      <div className="text-6xl opacity-50">📊</div>
                      <div className="space-y-2">
                        <h3 className="text-lg font-medium text-foreground">Nenhuma transação encontrada</h3>
                        <p className="text-sm text-muted-foreground max-w-md mx-auto">
                          Comece adicionando sua primeira transação ou ajuste os filtros para encontrar o que procura
                        </p>
                      </div>
                      <div className="flex gap-2 justify-center pt-2">
                        <Button 
                          size="sm" 
                          onClick={() => aoEditar?.({} as Transacao)}
                          className="gap-2"
                        >
                          <Icone name="plus-circle" className="w-4 h-4" />
                          Nova Transação
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => window.location.reload()}
                          className="gap-2"
                        >
                          <Icone name="refresh-ccw" className="w-4 h-4" />
                          Limpar Filtros
                        </Button>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                transacoes.map((transacao) => (
                  <TableRow key={transacao.id} className="hover:bg-gray-50/50">
                    {/* Data - sempre visível e fixo na esquerda */}
                    <TableCell className="text-sm whitespace-nowrap sticky left-0 bg-white z-10">
                      {new Date(transacao.data).toLocaleDateString('pt-BR')}
                    </TableCell>
                    
                    {/* Descrição - sempre visível */}
                    <TableCell>
                      <div className="text-sm">
                        <div className="line-clamp-2 max-w-[270px] overflow-hidden" title={transacao.descricao}>
                          {transacao.descricao}
                        </div>
                        {transacao.observacoes && (
                          <div className="text-xs text-muted-foreground line-clamp-1" title={transacao.observacoes}>
                            {transacao.observacoes}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    
                    {/* Valor - prioritário */}
                    <TableCell className="text-right whitespace-nowrap">
                      {formatarValor(transacao.valor, transacao.tipo)}
                    </TableCell>
                    
                    {/* Categoria - oculta em mobile */}
                    <TableCell className="hidden sm:table-cell">
                      <div className="text-sm">
                        <div className="truncate">{transacao.categoria?.nome || '-'}</div>
                        {transacao.subcategoria?.nome && (
                          <div className="text-xs text-muted-foreground truncate">
                            {transacao.subcategoria.nome}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    
                    {/* Conta - oculta em mobile/tablet */}
                    <TableCell className="hidden md:table-cell">
                      <div className="text-sm">
                        <div className="truncate">{transacao.conta?.nome || '-'}</div>
                        {transacao.conta && (
                          <div className="text-xs text-muted-foreground truncate flex items-center gap-1">
                            <span>{transacao.conta.tipo.replace('_', ' ')}</span>
                            {transacao.conta.banco && (
                              <>
                                <span>•</span>
                                <span>{transacao.conta.banco}</span>
                              </>
                            )}
                          </div>
                        )}
                        {transacao.tipo === 'transferencia' && transacao.conta_destino && (
                          <div className="text-xs text-muted-foreground truncate mt-1">
                            → {transacao.conta_destino.nome}
                            <div className="flex items-center gap-1">
                              <span>{transacao.conta_destino.tipo.replace('_', ' ')}</span>
                              {transacao.conta_destino.banco && (
                                <>
                                  <span>•</span>
                                  <span>{transacao.conta_destino.banco}</span>
                                </>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    
                    {/* Status - oculto em mobile */}
                    <TableCell className="text-center hidden sm:table-cell">
                      <div className="space-y-1">
                        {formatarStatus(transacao.status)}
                        {transacao.total_parcelas > 1 && (
                          <div className="text-xs text-muted-foreground truncate">
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
                          onClick={() => abrirModalExcluir(transacao)}
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
                            onClick={() => abrirModalExcluirGrupo(transacao)}
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
      </TableContainer>

      {/* Modais */}
      <ModalExcluirTransacao
        isOpen={modalExcluir.isOpen}
        transacao={modalExcluir.transacao}
        carregando={modalExcluir.carregando}
        onClose={() => setModalExcluir({ isOpen: false, transacao: null, carregando: false })}
        onConfirm={async () => {
          if (modalExcluir.transacao) {
            await confirmarExclusao(modalExcluir.transacao)
          }
        }}
      />

      <ModalExcluirGrupoParcelas
        isOpen={modalExcluirGrupo.isOpen}
        transacao={modalExcluirGrupo.transacao}
        carregando={modalExcluirGrupo.carregando}
        onClose={() => setModalExcluirGrupo({ isOpen: false, transacao: null, carregando: false })}
        onConfirm={async () => {
          if (modalExcluirGrupo.transacao) {
            await confirmarExclusaoGrupo(modalExcluirGrupo.transacao)
          }
        }}
      />
    </div>
  )
}