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

/**
 * Hook simplificado para operações CRUD de transações
 * Estados locais foram removidos para evitar loading duplo
 * Cada componente gerencia seu próprio estado
 */
export function usarTransacoes() {
  const { workspace } = useAuth()
  const { sucesso, erro } = usarToast()

  // Criar nova transação
  const criar = useCallback(async (dadosTransacao: NovaTransacao) => {
    if (!workspace) {
      erro('Erro de autenticação', 'Workspace não encontrado')
      throw new Error('Workspace não encontrado')
    }
    
    try {
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

      sucesso('Transação criada', 'Transação adicionada com sucesso')
      return novaTransacao
    } catch (err) {
      const mensagem = err instanceof Error ? err.message : 'Erro ao criar transação'
      erro('Erro ao criar transação', mensagem)
      throw err
    }
  }, [sucesso, erro, workspace])

  // Buscar transação por ID
  const buscarPorId = useCallback(async (id: string) => {
    if (!workspace) return null
    
    try {
      return await obterTransacaoPorId(id, workspace.id)
    } catch (err) {
      const mensagem = err instanceof Error ? err.message : 'Erro ao buscar transação'
      erro('Erro ao buscar transação', mensagem)
      return null
    }
  }, [erro, workspace])

  // Atualizar transação
  const atualizar = useCallback(async (id: string, dados: Partial<NovaTransacao>) => {
    if (!workspace) {
      erro('Erro de autenticação', 'Workspace não encontrado')
      throw new Error('Workspace não encontrado')
    }
    
    try {
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
      
      sucesso('Transação atualizada', 'Alterações salvas com sucesso')
      return transacaoAtualizada
    } catch (err) {
      const mensagem = err instanceof Error ? err.message : 'Erro ao atualizar transação'
      erro('Erro ao atualizar transação', mensagem)
      throw err
    }
  }, [sucesso, erro, workspace])

  // Excluir transação
  const excluir = useCallback(async (id: string) => {
    if (!workspace) {
      erro('Erro de autenticação', 'Workspace não encontrado')
      throw new Error('Workspace não encontrado')
    }
    
    try {
      await excluirTransacao(id, workspace.id)
      sucesso('Transação excluída', 'Transação removida com sucesso')
    } catch (err) {
      const mensagem = err instanceof Error ? err.message : 'Erro ao excluir transação'
      erro('Erro ao excluir transação', mensagem)
      throw err
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

      sucesso('Transação parcelada criada', `${numeroParcelas} parcelas criadas com sucesso`)
      return parcelas
    } catch (err) {
      const mensagem = err instanceof Error ? err.message : 'Erro ao criar transação parcelada'
      erro('Erro ao criar parcelamento', mensagem)
      throw err
    }
  }, [sucesso, erro, workspace])

  // Excluir grupo de parcelas
  const excluirGrupoParcelamentoHook = useCallback(async (grupoParcelamento: number) => {
    if (!workspace) {
      erro('Erro de autenticação', 'Workspace não encontrado')
      throw new Error('Workspace não encontrado')
    }
    
    try {
      await excluirGrupoParcelamento(grupoParcelamento, workspace.id)
      sucesso('Parcelas excluídas', 'Todas as parcelas foram removidas com sucesso')
    } catch (err) {
      const mensagem = err instanceof Error ? err.message : 'Erro ao excluir parcelas'
      erro('Erro ao excluir parcelas', mensagem)
      throw err
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
        sucesso('Recorrências processadas', `${novasTransacoes.length} transações recorrentes foram criadas`)
      }
      
      return novasTransacoes
    } catch (err) {
      const mensagem = err instanceof Error ? err.message : 'Erro ao processar recorrências'
      erro('Erro ao processar recorrências', mensagem)
      return []
    }
  }, [sucesso, erro, workspace])

  // Excluir recorrência (hard delete)
  const excluirRecorrenciaHook = useCallback(async (id: string) => {
    if (!workspace) {
      erro('Erro de autenticação', 'Workspace não encontrado')
      throw new Error('Workspace não encontrado')
    }
    
    try {
      await excluirRecorrencia(id, workspace.id)
      sucesso('Recorrência excluída', 'Configuração removida. Transações já criadas foram mantidas.')
    } catch (err) {
      const mensagem = err instanceof Error ? err.message : 'Erro ao excluir recorrência'
      erro('Erro ao excluir recorrência', mensagem)
      throw err
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
    // Ações CRUD básicas
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