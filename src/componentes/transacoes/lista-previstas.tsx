'use client'

import { useState, useEffect, useCallback } from 'react'
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

interface TransacaoComRelacoes extends Transacao {
  categoria?: { nome: string; cor: string; icone: string }
  subcategoria?: { nome: string }
  conta?: { nome: string; tipo: string; banco?: string }
  conta_destino?: { nome: string; tipo: string; banco?: string }
  forma_pagamento?: { nome: string; tipo: string }
  centro_custo?: { nome: string; cor: string }
}

/**
 * Componente especializado para exibir transações previstas
 * Aplica filtro fixo: status='previsto' (incluindo receitas e despesas)
 * Gerencia próprio estado para evitar loading duplo
 */
export function ListaPrevistas() {
  const { abrirModal } = useModais()
  const { workspace } = useAuth()
  const { excluir } = usarTransacoes()
  const { confirm, ConfirmDialog } = useConfirmDialog()
  
  // Estados locais para evitar loading duplo
  const [previstas, setPrevistas] = useState<TransacaoComRelacoes[]>([])
  const [loading, setLoading] = useState(true) // Inicia como TRUE para evitar flash
  const [error, setError] = useState<string | null>(null)
  const [totalTransacoes, setTotalTransacoes] = useState(0)
  
  // Estados para filtros e paginação - específicos para previstas
  const [filtrosUsuario, setFiltrosUsuario] = useState<FiltrosTransacao>({})
  const [parametrosPaginacao, setParametrosPaginacao] = useState<ParametrosPaginacao>({
    pagina: 1,
    limite: 20,
    ordenacao: 'data',
    direcao: 'asc' // Ordenação crescente para ver próximas primeiro
  })

  // Carregar previstas
  const carregarPrevistas = useCallback(async () => {
    if (!workspace) return
    
    try {
      setLoading(true)
      setError(null)
      
      // Aplicar filtros do usuário + filtros fixos para previstas
      const resposta = await obterTransacoes(
        filtrosUsuario, 
        parametrosPaginacao, 
        workspace.id,
        { status: 'previsto' }
      )
      setPrevistas(resposta.dados as TransacaoComRelacoes[])
      setTotalTransacoes(resposta.total)
    } catch (err) {
      const mensagem = err instanceof Error ? err.message : 'Erro ao carregar previstas'
      setError(mensagem)
      console.error('Erro ao carregar previstas:', err)
    } finally {
      setLoading(false)
    }
  }, [workspace, filtrosUsuario, parametrosPaginacao])
  
  // Carregar dados quando componente montar ou dependências mudarem
  useEffect(() => {
    carregarPrevistas()
  }, [carregarPrevistas])

  // Escutar evento customizado para atualizar após mudanças
  useEffect(() => {
    const handleAtualizarTransacoes = () => {
      carregarPrevistas()
    }
    
    window.addEventListener('atualizarTransacoes', handleAtualizarTransacoes)
    
    return () => {
      window.removeEventListener('atualizarTransacoes', handleAtualizarTransacoes)
    }
  }, [carregarPrevistas])

  // Handler para editar transação
  const handleEditar = (transacao: Transacao) => {
    abrirModal('lancamento', { transacaoId: transacao.id })
  }

  // Handler para excluir transação
  const handleExcluir = (transacao: Transacao) => {
    confirm({
      title: 'Excluir Transação Prevista',
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
          console.error('Erro ao excluir prevista:', error)
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

  // Renderizar conteúdo das previstas
  const renderConteudoPrevistas = () => {
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
    
    if (previstas.length === 0) {
      return (
        <div className="text-center py-12 border rounded-lg">
          <div className="space-y-4">
            <div className="text-6xl opacity-50">📅</div>
            <div className="space-y-2">
              <h3 className="text-lg font-medium text-foreground">Nenhuma transação prevista</h3>
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
                <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Status</th>
                <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-32">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {previstas.map((prevista) => (
                <tr key={prevista.id} className="hover:bg-gray-50">
                  <td className="px-4 py-[9px] whitespace-nowrap text-sm text-gray-900">
                    {new Date(prevista.data).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-4 py-[9px] text-sm text-gray-900 w-[300px]">
                    <div className="font-medium break-words max-w-[270px] overflow-hidden" title={prevista.descricao}>
                      {prevista.descricao}
                    </div>
                    {prevista.observacoes && (
                      <div className="text-xs text-gray-500 line-clamp-1 mt-0.5" title={prevista.observacoes}>
                        {prevista.observacoes}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-[9px] whitespace-nowrap text-sm text-right">
                    <span className={`font-medium ${
                      prevista.tipo === 'receita' ? 'text-green-600' : 
                      prevista.tipo === 'despesa' ? 'text-red-600' : 
                      'text-blue-600'
                    }`}>
                      {prevista.tipo === 'receita' ? '+' : prevista.tipo === 'despesa' ? '-' : '→'} 
                      {prevista.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </span>
                  </td>
                  <td className="px-4 py-[9px] text-sm text-gray-900 hidden sm:table-cell">
                    <div className="truncate font-medium">{prevista.categoria?.nome || '-'}</div>
                    {prevista.subcategoria?.nome && (
                      <div className="text-xs text-gray-500 truncate mt-0.5">
                        {prevista.subcategoria.nome}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-[9px] text-sm text-gray-900 hidden md:table-cell">
                    <div className="truncate font-medium">{prevista.conta?.nome || '-'}</div>
                    {prevista.conta && (
                      <div className="text-xs text-gray-500 truncate mt-0.5">
                        {prevista.conta.tipo.replace('_', ' ')}
                        {prevista.conta.banco && ` • ${prevista.conta.banco}`}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-[9px] text-center hidden sm:table-cell">
                    <span className="text-xs text-yellow-600 flex items-center justify-center gap-1">
                      🕑 Previsto
                    </span>
                    {prevista.total_parcelas > 1 && (
                      <div className="text-xs text-gray-500 mt-0.5">
                        {prevista.parcela_atual}/{prevista.total_parcelas}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-[9px] whitespace-nowrap text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => handleEditar(prevista)}
                        className="text-muted-foreground hover:text-foreground p-1 rounded hover:bg-muted transition-colors"
                        title="Editar prevista"
                      >
                        <Icone name="pencil" className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleExcluir(prevista)}
                        className="text-destructive hover:text-destructive p-1 rounded hover:bg-destructive/10 transition-colors"
                        title="Excluir prevista"
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
      {/* Filtros de Previstas */}
      <FiltrosTransacoes
        filtros={filtrosUsuario}
        onFiltrosChange={handleFiltrosChange}
        onLimpar={handleLimparFiltros}
      />

      {/* Conteúdo das Previstas */}
      {renderConteudoPrevistas()}
      
      {/* Paginação */}
      {!loading && previstas.length > 0 && (
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