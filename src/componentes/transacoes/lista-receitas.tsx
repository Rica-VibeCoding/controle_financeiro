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
 * Componente especializado para exibir apenas receitas realizadas
 * Aplica filtros fixos: tipo='receita' e status='realizado'
 * Gerencia próprio estado para evitar loading duplo
 */
export function ListaReceitas() {
  const { abrirModal } = useModais()
  const { workspace } = useAuth()
  const { excluir } = usarTransacoes()
  const { confirm, ConfirmDialog } = useConfirmDialog()
  
  // Estados locais para evitar loading duplo
  const [receitas, setReceitas] = useState<TransacaoComRelacoes[]>([])
  const [loading, setLoading] = useState(true) // Inicia como TRUE para evitar flash
  const [error, setError] = useState<string | null>(null)
  const [totalTransacoes, setTotalTransacoes] = useState(0)
  
  // Estados para filtros e paginação - específicos para receitas
  const [filtrosUsuario, setFiltrosUsuario] = useState<FiltrosTransacao>({})
  const [parametrosPaginacao, setParametrosPaginacao] = useState<ParametrosPaginacao>({
    pagina: 1,
    limite: 20,
    ordenacao: 'data',
    direcao: 'desc'
  })

  // Carregar receitas
  const carregarReceitas = useCallback(async () => {
    if (!workspace) return
    
    try {
      setLoading(true)
      setError(null)
      
      // Aplicar filtros do usuário + filtros fixos para receitas
      const resposta = await obterTransacoes(
        filtrosUsuario, 
        parametrosPaginacao, 
        workspace.id,
        { tipo: 'receita', status: 'realizado' }
      )
      setReceitas(resposta.dados as TransacaoComRelacoes[])
      setTotalTransacoes(resposta.total)
    } catch (err) {
      const mensagem = err instanceof Error ? err.message : 'Erro ao carregar receitas'
      setError(mensagem)
      console.error('Erro ao carregar receitas:', err)
    } finally {
      setLoading(false)
    }
  }, [workspace, filtrosUsuario, parametrosPaginacao])
  
  // Carregar dados quando componente montar ou dependências mudarem
  useEffect(() => {
    carregarReceitas()
  }, [carregarReceitas])

  // Escutar evento customizado para atualizar após mudanças
  useEffect(() => {
    const handleAtualizarTransacoes = () => {
      carregarReceitas()
    }
    
    window.addEventListener('atualizarTransacoes', handleAtualizarTransacoes)
    
    return () => {
      window.removeEventListener('atualizarTransacoes', handleAtualizarTransacoes)
    }
  }, [carregarReceitas])

  // Handler para editar transação
  const handleEditar = (transacao: Transacao) => {
    abrirModal('lancamento', { transacaoId: transacao.id })
  }

  // Handler para excluir transação
  const handleExcluir = (transacao: Transacao) => {
    confirm({
      title: 'Excluir Receita',
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
          console.error('Erro ao excluir receita:', error)
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

  // Renderizar conteúdo das receitas
  const renderConteudoReceitas = () => {
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
    
    if (receitas.length === 0) {
      return (
        <div className="text-center py-12 border rounded-lg">
          <div className="space-y-4">
            <div className="text-6xl opacity-50">💵</div>
            <div className="space-y-2">
              <h3 className="text-lg font-medium text-foreground">Nenhuma receita realizada</h3>
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
              {receitas.map((receita) => (
                <tr key={receita.id} className="hover:bg-gray-50">
                  <td className="px-4 py-[9px] whitespace-nowrap text-sm text-gray-900">
                    {new Date(receita.data).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-4 py-[9px] text-sm text-gray-900 w-[300px]">
                    <div className="font-medium break-words max-w-[270px] overflow-hidden" title={receita.descricao}>
                      {receita.descricao}
                    </div>
                    {receita.observacoes && (
                      <div className="text-xs text-gray-500 line-clamp-1 mt-0.5" title={receita.observacoes}>
                        {receita.observacoes}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-[9px] whitespace-nowrap text-sm text-right">
                    <span className="font-medium text-green-600">
                      + {receita.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </span>
                  </td>
                  <td className="px-4 py-[9px] text-sm text-gray-900 hidden sm:table-cell">
                    <div className="truncate font-medium">{receita.categoria?.nome || '-'}</div>
                    {receita.subcategoria?.nome && (
                      <div className="text-xs text-gray-500 truncate mt-0.5">
                        {receita.subcategoria.nome}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-[9px] text-sm text-gray-900 hidden md:table-cell">
                    <div className="truncate font-medium">{receita.conta?.nome || '-'}</div>
                    {receita.conta && (
                      <div className="text-xs text-gray-500 truncate mt-0.5">
                        {receita.conta.tipo.replace('_', ' ')}
                        {receita.conta.banco && ` • ${receita.conta.banco}`}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-[9px] whitespace-nowrap text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => handleEditar(receita)}
                        className="text-muted-foreground hover:text-foreground p-1 rounded hover:bg-muted transition-colors"
                        title="Editar receita"
                      >
                        <Icone name="pencil" className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleExcluir(receita)}
                        className="text-destructive hover:text-destructive p-1 rounded hover:bg-destructive/10 transition-colors"
                        title="Excluir receita"
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
      {/* Filtros de Receitas */}
      <FiltrosTransacoes
        filtros={filtrosUsuario}
        onFiltrosChange={handleFiltrosChange}
        onLimpar={handleLimparFiltros}
      />

      {/* Conteúdo das Receitas */}
      {renderConteudoReceitas()}
      
      {/* Paginação */}
      {!loading && receitas.length > 0 && (
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