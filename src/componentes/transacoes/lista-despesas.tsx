'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { FiltrosTransacoes } from '@/componentes/comum/filtros-transacoes'
import { PaginacaoTransacoes } from './paginacao-transacoes'
import { useModais } from '@/contextos/modais-contexto'
import { LoadingTransacoes } from '@/componentes/comum/loading'
import { Transacao } from '@/tipos/database'
import { obterTransacoes } from '@/servicos/supabase/transacoes'
import { useAuth } from '@/contextos/auth-contexto'
import { usarTransacoes } from '@/hooks/usar-transacoes'
import { useConfirmDialog } from '@/componentes/ui/confirm-dialog'
import { Icone } from '@/componentes/ui/icone'
import type { FiltrosTransacao, ParametrosPaginacao } from '@/tipos/filtros'
import { DebugLogger } from '@/utilitarios/debug-logger'

interface TransacaoComRelacoes extends Transacao {
  categoria?: { nome: string; cor: string; icone: string }
  subcategoria?: { nome: string }
  conta?: { nome: string; tipo: string; banco?: string }
  conta_destino?: { nome: string; tipo: string; banco?: string }
  forma_pagamento?: { nome: string; tipo: string }
  centro_custo?: { nome: string; cor: string }
}

/**
 * Componente especializado para exibir apenas despesas realizadas
 * Aplica filtros fixos: tipo='despesa' e status='realizado'
 * Gerencia próprio estado para evitar loading duplo
 */
export function ListaDespesas() {
  const { abrirModal } = useModais()
  const { workspace } = useAuth()
  const { excluir } = usarTransacoes()
  const { confirm, ConfirmDialog } = useConfirmDialog()

  // Estados locais para evitar loading duplo
  const [despesas, setDespesas] = useState<TransacaoComRelacoes[]>([])
  const [loading, setLoading] = useState(true) // Inicia como TRUE para evitar flash
  const [error, setError] = useState<string | null>(null)
  const [totalTransacoes, setTotalTransacoes] = useState(0)

  // Estados para filtros e paginação - específicos para despesas
  const [filtrosUsuario, setFiltrosUsuario] = useState<FiltrosTransacao>({})
  const [parametrosPaginacao, setParametrosPaginacao] = useState<ParametrosPaginacao>({
    pagina: 1,
    limite: 20,
    ordenacao: 'data',
    direcao: 'desc'
  })

  // Ref para tracking de renders
  const renderCount = useRef(0)

  // Lifecycle: Component Mount
  useEffect(() => {
    renderCount.current++
    DebugLogger.lifecycle('ListaDespesas', 'Componente montado/atualizado', {
      renderCount: renderCount.current,
      workspace: workspace?.id,
      loading,
      totalDespesas: despesas.length
    })

    return () => {
      DebugLogger.lifecycle('ListaDespesas', 'Componente desmontado', {
        renderCount: renderCount.current
      })
    }
  }, [])

  // Carregar despesas
  const carregarDespesas = useCallback(async () => {
    if (!workspace) {
      DebugLogger.warn('ListaDespesas', 'carregarDespesas abortado - workspace ausente', {
        workspace: null
      })
      return
    }

    DebugLogger.time('ListaDespesas.carregarDespesas')
    DebugLogger.info('ListaDespesas', 'Iniciando carregamento de despesas', {
      workspaceId: workspace.id,
      filtros: filtrosUsuario,
      paginacao: parametrosPaginacao
    })

    try {
      setLoading(true)
      setError(null)

      // Aplicar filtros do usuário + filtros fixos para despesas
      const resposta = await obterTransacoes(
        filtrosUsuario,
        parametrosPaginacao,
        workspace.id,
        { tipo: 'despesa', status: 'realizado' }
      )

      setDespesas(resposta.dados as TransacaoComRelacoes[])
      setTotalTransacoes(resposta.total)

      DebugLogger.success('ListaDespesas', 'Despesas carregadas com sucesso', {
        total: resposta.total,
        carregadas: resposta.dados.length,
        pagina: parametrosPaginacao.pagina
      })
    } catch (err) {
      const mensagem = err instanceof Error ? err.message : 'Erro ao carregar despesas'
      setError(mensagem)

      DebugLogger.error('ListaDespesas', 'Erro ao carregar despesas', {
        erro: mensagem,
        workspaceId: workspace.id
      })

      console.error('Erro ao carregar despesas:', err)
    } finally {
      setLoading(false)
      DebugLogger.timeEnd('ListaDespesas.carregarDespesas')
    }
  }, [workspace, filtrosUsuario, parametrosPaginacao])
  
  // Carregar dados quando componente montar ou dependências mudarem
  useEffect(() => {
    carregarDespesas()
  }, [carregarDespesas])

  // Escutar evento customizado para atualizar após mudanças
  useEffect(() => {
    const handleAtualizarTransacoes = () => {
      DebugLogger.info('ListaDespesas', 'Evento atualizarTransacoes recebido - recarregando', {
        workspace: workspace?.id
      })
      carregarDespesas()
    }

    window.addEventListener('atualizarTransacoes', handleAtualizarTransacoes)

    DebugLogger.lifecycle('ListaDespesas', 'Listener registrado para atualizarTransacoes', {})

    return () => {
      window.removeEventListener('atualizarTransacoes', handleAtualizarTransacoes)
      DebugLogger.lifecycle('ListaDespesas', 'Listener removido', {})
    }
  }, [carregarDespesas, workspace])

  // Handler para editar transação
  const handleEditar = (transacao: Transacao) => {
    abrirModal('lancamento', { transacaoId: transacao.id })
  }

  // Handler para excluir transação
  const handleExcluir = (transacao: Transacao) => {
    confirm({
      title: 'Excluir Despesa',
      description: `Deseja excluir "${transacao.descricao}"?

• Data: ${new Date(transacao.data).toLocaleDateString('pt-BR')}
• Valor: ${transacao.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
• Esta ação não pode ser desfeita`,
      type: 'danger',
      confirmText: 'Excluir',
      cancelText: 'Cancelar',
      onConfirm: async () => {
        try {
          await excluir(transacao.id)
          window.dispatchEvent(new CustomEvent('atualizarTransacoes'))
        } catch (error) {
          console.error('Erro ao excluir despesa:', error)
        }
      }
    })
  }

  // Handlers para filtros e paginação
  const handleFiltrosChange = (novosFiltros: FiltrosTransacao) => {
    setFiltrosUsuario(novosFiltros)
    setParametrosPaginacao(prev => ({ ...prev, pagina: 1 })) // Reset para primeira página
  }

  const handleLimparFiltros = () => {
    setFiltrosUsuario({})
    setParametrosPaginacao(prev => ({ ...prev, pagina: 1 }))
  }

  // Renderizar conteúdo das despesas
  const renderConteudoDespesas = () => {
    if (loading) {
      return <LoadingTransacoes />
    }
    
    if (error) {
      return (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <h4 className="font-medium text-red-800 mb-2">❌ Erro</h4>
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )
    }
    
    if (despesas.length === 0) {
      return (
        <div className="text-center py-12 border rounded-lg">
          <div className="space-y-4">
            <div className="text-6xl opacity-50">💸</div>
            <div className="space-y-2">
              <h3 className="text-lg font-medium text-foreground">Nenhuma despesa realizada</h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Antes do primeiro lançamento, crie a sua primeira conta em Cadastros/Contas.
              </p>
            </div>
          </div>
        </div>
      )
    }
    
    return (
      <div className="border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">Data</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[300px]">Descrição</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-28">Valor</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Categoria</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Conta</th>
                <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-32">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {despesas.map((despesa) => (
                <tr key={despesa.id} className="hover:bg-gray-50">
                  <td className="px-4 py-[9px] whitespace-nowrap text-sm text-gray-900">
                    {new Date(despesa.data).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-4 py-[9px] text-sm text-gray-900 w-[300px]">
                    <div className="font-medium break-words max-w-[270px] overflow-hidden" title={despesa.descricao}>
                      {despesa.descricao}
                    </div>
                    {despesa.observacoes && (
                      <div className="text-xs text-gray-500 line-clamp-1 mt-0.5" title={despesa.observacoes}>
                        {despesa.observacoes}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-[9px] whitespace-nowrap text-sm text-right">
                    <span className="font-medium text-red-600">
                      - {despesa.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </span>
                  </td>
                  <td className="px-4 py-[9px] text-sm text-gray-900 hidden sm:table-cell">
                    <div className="truncate font-medium">{despesa.categoria?.nome || '-'}</div>
                    {despesa.subcategoria?.nome && (
                      <div className="text-xs text-gray-500 truncate mt-0.5">
                        {despesa.subcategoria.nome}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-[9px] text-sm text-gray-900 hidden md:table-cell">
                    <div className="truncate font-medium">{despesa.conta?.nome || '-'}</div>
                    {despesa.conta && (
                      <div className="text-xs text-gray-500 truncate mt-0.5">
                        {despesa.conta.tipo.replace('_', ' ')}
                        {despesa.conta.banco && ` • ${despesa.conta.banco}`}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-[9px] whitespace-nowrap text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => handleEditar(despesa)}
                        className="text-muted-foreground hover:text-foreground p-1 rounded hover:bg-muted transition-colors"
                        title="Editar despesa"
                      >
                        <Icone name="pencil" className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleExcluir(despesa)}
                        className="text-destructive hover:text-destructive p-1 rounded hover:bg-destructive/10 transition-colors"
                        title="Excluir despesa"
                      >
                        <Icone name="trash-2" className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Filtros de Despesas */}
      <FiltrosTransacoes
        filtros={filtrosUsuario}
        onFiltrosChange={handleFiltrosChange}
        onLimpar={handleLimparFiltros}
      />

      {/* Conteúdo das Despesas */}
      {renderConteudoDespesas()}
      
      {/* Paginação */}
      {!loading && despesas.length > 0 && (
        <PaginacaoTransacoes
          parametros={parametrosPaginacao}
          total={totalTransacoes}
          onChange={setParametrosPaginacao}
        />
      )}
      
      {/* Modal de Confirmação */}
      <ConfirmDialog />
    </div>
  )
}