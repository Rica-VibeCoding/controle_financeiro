'use client'

import { useState, useCallback } from 'react'
import { Transacao, NovaTransacao } from '@/tipos/database'
import { 
  obterTransacoes,
  criarTransacao,
  obterTransacaoPorId,
  atualizarTransacao,
  excluirTransacao,
  calcularSaldoConta,
  calcularSaldoTotal,
  criarTransacaoParcelada,
  excluirGrupoParcelamento,
  buscarParcelasPorGrupo,
  obterTransacoesRecorrentesVencidas,
  processarRecorrencia,
  excluirRecorrencia,
  buscarTransacoesRecorrentes
} from '@/servicos/supabase/transacoes'
import { usarToast } from './usar-toast'
import { useAuth } from '@/contextos/auth-contexto'

import type { FiltrosTransacao } from '@/tipos/filtros'

export function usarTransacoes() {
  const { workspace } = useAuth()
  const [transacoes, setTransacoes] = useState<Transacao[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { sucesso, erro } = usarToast()

  // Estados para paginação
  const [totalTransacoes, setTotalTransacoes] = useState(0)
  const [totalPaginas, setTotalPaginas] = useState(0)

  // Carregar lista de transações
  const carregar = useCallback(async (
    limite: number = 50,
    offset: number = 0,
    filtros?: FiltrosTransacao
  ) => {
    if (!workspace) return
    
    try {
      setLoading(true)
      setError(null)
      const resposta = await obterTransacoes(filtros, { pagina: Math.floor(offset/limite) + 1, limite }, workspace.id)
      const dados = resposta.dados
      setTransacoes(dados)
      setTotalTransacoes(resposta.total)
      setTotalPaginas(resposta.total_paginas)
    } catch (err) {
      const mensagem = err instanceof Error ? err.message : 'Erro desconhecido'
      setError(mensagem)
      erro('Erro ao carregar transações', mensagem)
    } finally {
      setLoading(false)
    }
  }, [erro, workspace])

  // Criar nova transação
  const criar = useCallback(async (dadosTransacao: NovaTransacao) => {
    if (!workspace) {
      erro('Erro de autenticação', 'Workspace não encontrado')
      throw new Error('Workspace não encontrado')
    }
    
    try {
      setLoading(true)
      setError(null)

      // Validações conforme documentação
      if (dadosTransacao.valor <= 0) {
        throw new Error('Valor deve ser maior que zero')
      }
      if (dadosTransacao.valor > 99999999.99) {
        throw new Error('Valor máximo permitido: R$ 99.999.999,99')
      }
      if (!dadosTransacao.data || !dadosTransacao.descricao || !dadosTransacao.conta_id) {
        throw new Error('Campos obrigatórios: Data, Descrição e Conta')
      }
      if (dadosTransacao.tipo === 'transferencia' && !dadosTransacao.conta_destino_id) {
        throw new Error('Transferências precisam de conta destino')
      }

      const novaTransacao = await criarTransacao({
        ...dadosTransacao,
        status: dadosTransacao.status || 'previsto'
      }, workspace.id)

      // Atualizar lista local
      setTransacoes(prev => [novaTransacao, ...prev])
      sucesso('Transação criada', 'Transação adicionada com sucesso')
      return novaTransacao
    } catch (err) {
      const mensagem = err instanceof Error ? err.message : 'Erro ao criar transação'
      setError(mensagem)
      erro('Erro ao criar transação', mensagem)
      throw err
    } finally {
      setLoading(false)
    }
  }, [sucesso, erro, workspace])

  // Buscar transação por ID
  const buscarPorId = useCallback(async (id: string) => {
    if (!workspace) return null
    
    try {
      setLoading(true)
      setError(null)
      return await obterTransacaoPorId(id, workspace.id)
    } catch (err) {
      const mensagem = err instanceof Error ? err.message : 'Erro ao buscar transação'
      setError(mensagem)
      erro('Erro ao buscar transação', mensagem)
      return null
    } finally {
      setLoading(false)
    }
  }, [erro, workspace])

  // Atualizar transação
  const atualizar = useCallback(async (id: string, dados: Partial<NovaTransacao>) => {
    if (!workspace) {
      erro('Erro de autenticação', 'Workspace não encontrado')
      throw new Error('Workspace não encontrado')
    }
    
    try {
      setLoading(true)
      setError(null)

      // Validações se valor foi alterado
      if (dados.valor !== undefined) {
        if (dados.valor <= 0) {
          throw new Error('Valor deve ser maior que zero')
        }
        if (dados.valor > 99999999.99) {
          throw new Error('Valor máximo permitido: R$ 99.999.999,99')
        }
      }

      await atualizarTransacao(id, dados, workspace.id)
      const transacaoAtualizada = await obterTransacaoPorId(id, workspace.id)
      
      // Atualizar lista local
      if (transacaoAtualizada) {
        setTransacoes(prev => 
          prev.map(t => t.id === id ? transacaoAtualizada : t)
        )
      }
      
      sucesso('Transação atualizada', 'Alterações salvas com sucesso')
      return transacaoAtualizada
    } catch (err) {
      const mensagem = err instanceof Error ? err.message : 'Erro ao atualizar transação'
      setError(mensagem)
      erro('Erro ao atualizar transação', mensagem)
      throw err
    } finally {
      setLoading(false)
    }
  }, [sucesso, erro, workspace])

  // Excluir transação
  const excluir = useCallback(async (id: string) => {
    if (!workspace) {
      erro('Erro de autenticação', 'Workspace não encontrado')
      throw new Error('Workspace não encontrado')
    }
    
    try {
      setLoading(true)
      setError(null)
      
      await excluirTransacao(id, workspace.id)
      
      // Remover da lista local
      setTransacoes(prev => prev.filter(t => t.id !== id))
      
      sucesso('Transação excluída', 'Transação removida com sucesso')
    } catch (err) {
      const mensagem = err instanceof Error ? err.message : 'Erro ao excluir transação'
      setError(mensagem)
      erro('Erro ao excluir transação', mensagem)
      throw err
    } finally {
      setLoading(false)
    }
  }, [sucesso, erro, workspace])

  // Calcular saldo de uma conta
  const calcularSaldoContaHook = useCallback(async (contaId: string) => {
    if (!workspace) return 0
    
    try {
      return await calcularSaldoConta(contaId, workspace.id)
    } catch (err) {
      const mensagem = err instanceof Error ? err.message : 'Erro ao calcular saldo'
      erro('Erro ao calcular saldo', mensagem)
      return 0
    }
  }, [erro, workspace])

  // Calcular saldo total
  const calcularSaldoTotalHook = useCallback(async () => {
    if (!workspace) return 0
    
    try {
      return await calcularSaldoTotal(workspace.id)
    } catch (err) {
      const mensagem = err instanceof Error ? err.message : 'Erro ao calcular saldo total'
      erro('Erro ao calcular saldo', mensagem)
      return 0
    }
  }, [erro, workspace])

  // Criar transação parcelada
  const criarParcelada = useCallback(async (dadosTransacao: NovaTransacao, numeroParcelas: number) => {
    if (!workspace) {
      erro('Erro de autenticação', 'Workspace não encontrado')
      throw new Error('Workspace não encontrado')
    }
    
    try {
      setLoading(true)
      setError(null)

      // Validações conforme documentação
      if (dadosTransacao.valor <= 0) {
        throw new Error('Valor deve ser maior que zero')
      }
      if (dadosTransacao.valor > 99999999.99) {
        throw new Error('Valor máximo permitido: R$ 99.999.999,99')
      }
      if (numeroParcelas < 2 || numeroParcelas > 100) {
        throw new Error('Número de parcelas deve ser entre 2 e 100')
      }
      if (!dadosTransacao.data || !dadosTransacao.descricao || !dadosTransacao.conta_id) {
        throw new Error('Campos obrigatórios: Data, Descrição e Conta')
      }

      const parcelas = await criarTransacaoParcelada({
        ...dadosTransacao,
        status: dadosTransacao.status || 'previsto'
      }, numeroParcelas, workspace.id)

      // Atualizar lista local com todas as parcelas
      setTransacoes(prev => [...parcelas, ...prev])
      sucesso('Transação parcelada criada', `${numeroParcelas} parcelas criadas com sucesso`)
      return parcelas
    } catch (err) {
      const mensagem = err instanceof Error ? err.message : 'Erro ao criar transação parcelada'
      setError(mensagem)
      erro('Erro ao criar parcelamento', mensagem)
      throw err
    } finally {
      setLoading(false)
    }
  }, [sucesso, erro, workspace])

  // Excluir grupo de parcelas
  const excluirGrupoParcelamentoHook = useCallback(async (grupoParcelamento: number) => {
    if (!workspace) {
      erro('Erro de autenticação', 'Workspace não encontrado')
      throw new Error('Workspace não encontrado')
    }
    
    try {
      setLoading(true)
      setError(null)
      
      await excluirGrupoParcelamento(grupoParcelamento, workspace.id)
      
      // Remover parcelas da lista local
      setTransacoes(prev => prev.filter(t => t.grupo_parcelamento !== grupoParcelamento))
      
      sucesso('Parcelas excluídas', 'Todas as parcelas foram removidas com sucesso')
    } catch (err) {
      const mensagem = err instanceof Error ? err.message : 'Erro ao excluir parcelas'
      setError(mensagem)
      erro('Erro ao excluir parcelas', mensagem)
      throw err
    } finally {
      setLoading(false)
    }
  }, [sucesso, erro, workspace])

  // Buscar parcelas por grupo
  const buscarParcelasPorGrupoHook = useCallback(async (grupoParcelamento: number) => {
    if (!workspace) return []
    
    try {
      return await buscarParcelasPorGrupo(grupoParcelamento, workspace.id)
    } catch (err) {
      const mensagem = err instanceof Error ? err.message : 'Erro ao buscar parcelas'
      erro('Erro ao buscar parcelas', mensagem)
      return []
    }
  }, [erro, workspace])

  // Processar recorrências vencidas
  const processarRecorrenciasVencidas = useCallback(async () => {
    if (!workspace) return []
    
    try {
      setLoading(true)
      setError(null)
      
      const recorrenciasVencidas = await obterTransacoesRecorrentesVencidas(workspace.id)
      const novasTransacoes: Transacao[] = []
      
      for (const transacao of recorrenciasVencidas) {
        try {
          const novaTransacao = await processarRecorrencia(transacao, workspace.id)
          novasTransacoes.push(novaTransacao)
        } catch (err) {
          console.error(`Erro ao processar recorrência ${transacao.id}:`, err)
        }
      }
      
      if (novasTransacoes.length > 0) {
        // Atualizar lista local com as novas transações
        setTransacoes(prev => [...novasTransacoes, ...prev])
        sucesso('Recorrências processadas', `${novasTransacoes.length} transações recorrentes foram criadas`)
      }
      
      return novasTransacoes
    } catch (err) {
      const mensagem = err instanceof Error ? err.message : 'Erro ao processar recorrências'
      setError(mensagem)
      erro('Erro ao processar recorrências', mensagem)
      return []
    } finally {
      setLoading(false)
    }
  }, [sucesso, erro, workspace])

  // Excluir recorrência (hard delete)
  const excluirRecorrenciaHook = useCallback(async (id: string) => {
    if (!workspace) {
      erro('Erro de autenticação', 'Workspace não encontrado')
      throw new Error('Workspace não encontrado')
    }
    
    try {
      setLoading(true)
      setError(null)
      
      await excluirRecorrencia(id, workspace.id)
      
      // Remover da lista local (hard delete)
      setTransacoes(prev => prev.filter(t => t.id !== id))
      
      sucesso('Recorrência excluída', 'Configuração removida. Transações já criadas foram mantidas.')
    } catch (err) {
      const mensagem = err instanceof Error ? err.message : 'Erro ao excluir recorrência'
      setError(mensagem)
      erro('Erro ao excluir recorrência', mensagem)
      throw err
    } finally {
      setLoading(false)
    }
  }, [sucesso, erro, workspace])

  // Buscar transações recorrentes
  const buscarTransacoesRecorrentesHook = useCallback(async () => {
    if (!workspace) return []
    
    try {
      return await buscarTransacoesRecorrentes(workspace.id)
    } catch (err) {
      const mensagem = err instanceof Error ? err.message : 'Erro ao buscar transações recorrentes'
      erro('Erro ao buscar recorrências', mensagem)
      return []
    }
  }, [erro, workspace])

  return {
    // Estado
    transacoes,
    loading,
    error,
    totalTransacoes,
    totalPaginas,
    
    // Ações CRUD
    carregar,
    criar,
    buscarPorId,
    atualizar,
    excluir,
    
    // Parcelamento
    criarParcelada,
    excluirGrupoParcelamento: excluirGrupoParcelamentoHook,
    buscarParcelasPorGrupo: buscarParcelasPorGrupoHook,
    
    // Recorrência
    processarRecorrenciasVencidas,
    excluirRecorrencia: excluirRecorrenciaHook,
    buscarTransacoesRecorrentes: buscarTransacoesRecorrentesHook,
    
    // Cálculos
    calcularSaldoConta: calcularSaldoContaHook,
    calcularSaldoTotal: calcularSaldoTotalHook
  }
}