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
  pararRecorrencia,
  buscarTransacoesRecorrentes
} from '@/servicos/supabase/transacoes'
import { usarToast } from './usar-toast'

interface FiltrosTransacao {
  tipo?: 'receita' | 'despesa' | 'transferencia'
  status?: 'previsto' | 'realizado'
  conta_id?: string
  data_inicio?: string
  data_fim?: string
}

export function usarTransacoes() {
  const [transacoes, setTransacoes] = useState<Transacao[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { sucesso, erro } = usarToast()

  // Carregar lista de transações
  const carregar = useCallback(async (
    limite: number = 50,
    offset: number = 0,
    filtros?: FiltrosTransacao
  ) => {
    try {
      setLoading(true)
      setError(null)
      const resposta = await obterTransacoes(filtros, { pagina: Math.floor(offset/limite) + 1, limite })
      const dados = resposta.dados
      setTransacoes(dados)
    } catch (err) {
      const mensagem = err instanceof Error ? err.message : 'Erro desconhecido'
      setError(mensagem)
      erro('Erro ao carregar transações', mensagem)
    } finally {
      setLoading(false)
    }
  }, [erro])

  // Criar nova transação
  const criar = useCallback(async (dadosTransacao: NovaTransacao) => {
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
      })

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
  }, [sucesso, erro])

  // Buscar transação por ID
  const buscarPorId = useCallback(async (id: string) => {
    try {
      setLoading(true)
      setError(null)
      return await obterTransacaoPorId(id)
    } catch (err) {
      const mensagem = err instanceof Error ? err.message : 'Erro ao buscar transação'
      setError(mensagem)
      erro('Erro ao buscar transação', mensagem)
      return null
    } finally {
      setLoading(false)
    }
  }, [erro])

  // Atualizar transação
  const atualizar = useCallback(async (id: string, dados: Partial<NovaTransacao>) => {
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

      await atualizarTransacao(id, dados)
      const transacaoAtualizada = await obterTransacaoPorId(id)
      
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
  }, [sucesso, erro])

  // Excluir transação
  const excluir = useCallback(async (id: string) => {
    try {
      setLoading(true)
      setError(null)
      
      await excluirTransacao(id)
      
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
  }, [sucesso, erro])

  // Calcular saldo de uma conta
  const calcularSaldoConta = useCallback(async (contaId: string) => {
    try {
      return await calcularSaldoConta(contaId)
    } catch (err) {
      const mensagem = err instanceof Error ? err.message : 'Erro ao calcular saldo'
      erro('Erro ao calcular saldo', mensagem)
      return 0
    }
  }, [erro])

  // Calcular saldo total
  const calcularSaldoTotal = useCallback(async () => {
    try {
      return await calcularSaldoTotal()
    } catch (err) {
      const mensagem = err instanceof Error ? err.message : 'Erro ao calcular saldo total'
      erro('Erro ao calcular saldo', mensagem)
      return 0
    }
  }, [erro])

  // Criar transação parcelada
  const criarParcelada = useCallback(async (dadosTransacao: NovaTransacao, numeroParcelas: number) => {
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
        tipo: 'despesa', // Parceladas são sempre despesas conforme PRD
        status: dadosTransacao.status || 'previsto'
      }, numeroParcelas)

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
  }, [sucesso, erro])

  // Excluir grupo de parcelas
  const excluirGrupoParcelamento = useCallback(async (grupoParcelamento: number) => {
    try {
      setLoading(true)
      setError(null)
      
      await excluirGrupoParcelamento(grupoParcelamento)
      
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
  }, [sucesso, erro])

  // Buscar parcelas por grupo
  const buscarParcelasPorGrupo = useCallback(async (grupoParcelamento: number) => {
    try {
      return await buscarParcelasPorGrupo(grupoParcelamento)
    } catch (err) {
      const mensagem = err instanceof Error ? err.message : 'Erro ao buscar parcelas'
      erro('Erro ao buscar parcelas', mensagem)
      return []
    }
  }, [erro])

  // Processar recorrências vencidas
  const processarRecorrenciasVencidas = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const recorrenciasVencidas = await obterTransacoesRecorrentesVencidas()
      const novasTransacoes: Transacao[] = []
      
      for (const transacao of recorrenciasVencidas) {
        try {
          const novaTransacao = await processarRecorrencia(transacao)
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
  }, [sucesso, erro])

  // Parar recorrência
  const pararRecorrencia = useCallback(async (id: string) => {
    try {
      setLoading(true)
      setError(null)
      
      await pararRecorrencia(id)
      
      // Atualizar transação na lista local
      setTransacoes(prev => prev.map(t => 
        t.id === id 
          ? { ...t, recorrente: false, proxima_recorrencia: null, frequencia_recorrencia: null }
          : t
      ))
      
      sucesso('Recorrência parada', 'A transação não será mais repetida automaticamente')
    } catch (err) {
      const mensagem = err instanceof Error ? err.message : 'Erro ao parar recorrência'
      setError(mensagem)
      erro('Erro ao parar recorrência', mensagem)
      throw err
    } finally {
      setLoading(false)
    }
  }, [sucesso, erro])

  // Buscar transações recorrentes
  const buscarTransacoesRecorrentesHook = useCallback(async () => {
    try {
      return await buscarTransacoesRecorrentes()
    } catch (err) {
      const mensagem = err instanceof Error ? err.message : 'Erro ao buscar transações recorrentes'
      erro('Erro ao buscar recorrências', mensagem)
      return []
    }
  }, [erro])

  return {
    // Estado
    transacoes,
    loading,
    error,
    
    // Ações CRUD
    carregar,
    criar,
    buscarPorId,
    atualizar,
    excluir,
    
    // Parcelamento
    criarParcelada,
    excluirGrupoParcelamento,
    buscarParcelasPorGrupo,
    
    // Recorrência
    processarRecorrenciasVencidas,
    pararRecorrencia,
    buscarTransacoesRecorrentes: buscarTransacoesRecorrentesHook,
    
    // Cálculos
    calcularSaldoConta,
    calcularSaldoTotal
  }
}