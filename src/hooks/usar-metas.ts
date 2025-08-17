'use client'

import { useState, useCallback } from 'react'
import { Meta, NovaMeta } from '@/tipos/database'
import { MetasService } from '@/servicos/supabase/metas'
import { usarToast } from './usar-toast'

interface ProgressoMeta {
  valorGasto: number
  valorLimite: number
  percentual: number
  status: 'normal' | 'atencao' | 'alerta' | 'excedido'
}

export function usarMetas() {
  const [metas, setMetas] = useState<Meta[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { sucesso, erro } = usarToast()

  // Carregar lista de metas
  const carregar = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const dados = await MetasService.listar()
      setMetas(dados)
    } catch (err) {
      const mensagem = err instanceof Error ? err.message : 'Erro desconhecido'
      setError(mensagem)
      erro('Erro ao carregar metas', mensagem)
    } finally {
      setLoading(false)
    }
  }, [erro])

  // Criar nova meta
  const criar = useCallback(async (dadosMeta: NovaMeta) => {
    try {
      setLoading(true)
      setError(null)

      // Validações conforme serviço
      const errosValidacao = MetasService.validarMeta(dadosMeta)
      if (errosValidacao.length > 0) {
        throw new Error(errosValidacao.join(', '))
      }

      const novaMeta = await MetasService.criar(dadosMeta)

      // Atualizar lista local
      setMetas(prev => [novaMeta, ...prev])
      sucesso('Meta criada', 'Meta adicionada com sucesso')
      return novaMeta
    } catch (err) {
      const mensagem = err instanceof Error ? err.message : 'Erro ao criar meta'
      setError(mensagem)
      erro('Erro ao criar meta', mensagem)
      throw err
    } finally {
      setLoading(false)
    }
  }, [sucesso, erro])

  // Buscar meta por ID
  const buscarPorId = useCallback(async (id: string) => {
    try {
      setLoading(true)
      setError(null)
      return await MetasService.buscarPorId(id)
    } catch (err) {
      const mensagem = err instanceof Error ? err.message : 'Erro ao buscar meta'
      setError(mensagem)
      erro('Erro ao buscar meta', mensagem)
      return null
    } finally {
      setLoading(false)
    }
  }, [erro])

  // Atualizar meta
  const atualizar = useCallback(async (id: string, dados: Partial<NovaMeta>) => {
    try {
      setLoading(true)
      setError(null)

      // Validações se dados foram alterados
      if (Object.keys(dados).length > 0) {
        const errosValidacao = MetasService.validarMeta(dados)
        if (errosValidacao.length > 0) {
          throw new Error(errosValidacao.join(', '))
        }
      }

      const metaAtualizada = await MetasService.atualizar(id, dados)
      
      // Atualizar lista local
      setMetas(prev => 
        prev.map(m => m.id === id ? metaAtualizada : m)
      )
      
      sucesso('Meta atualizada', 'Alterações salvas com sucesso')
      return metaAtualizada
    } catch (err) {
      const mensagem = err instanceof Error ? err.message : 'Erro ao atualizar meta'
      setError(mensagem)
      erro('Erro ao atualizar meta', mensagem)
      throw err
    } finally {
      setLoading(false)
    }
  }, [sucesso, erro])

  // Excluir meta
  const excluir = useCallback(async (id: string) => {
    try {
      setLoading(true)
      setError(null)
      
      await MetasService.excluir(id)
      
      // Remover da lista local
      setMetas(prev => prev.filter(m => m.id !== id))
      
      sucesso('Meta excluída', 'Meta removida com sucesso')
    } catch (err) {
      const mensagem = err instanceof Error ? err.message : 'Erro ao excluir meta'
      setError(mensagem)
      erro('Erro ao excluir meta', mensagem)
      throw err
    } finally {
      setLoading(false)
    }
  }, [sucesso, erro])

  // Calcular progresso de uma meta
  const calcularProgresso = useCallback(async (meta: Meta): Promise<ProgressoMeta | null> => {
    try {
      return await MetasService.calcularProgresso(meta)
    } catch (err) {
      const mensagem = err instanceof Error ? err.message : 'Erro ao calcular progresso'
      erro('Erro ao calcular progresso', mensagem)
      return null
    }
  }, [erro])

  // Buscar metas do mês atual
  const buscarMetasDoMes = useCallback(async () => {
    try {
      return await MetasService.buscarMetasDoMes()
    } catch (err) {
      const mensagem = err instanceof Error ? err.message : 'Erro ao buscar metas do mês'
      erro('Erro ao buscar metas', mensagem)
      return []
    }
  }, [erro])

  // Calcular progresso de múltiplas metas
  const calcularProgressoMetas = useCallback(async (metasLista: Meta[]) => {
    const progressos: { [key: string]: ProgressoMeta } = {}
    
    for (const meta of metasLista) {
      try {
        const progresso = await MetasService.calcularProgresso(meta)
        progressos[meta.id] = progresso
      } catch (err) {
        console.error(`Erro ao calcular progresso da meta ${meta.id}:`, err)
      }
    }
    
    return progressos
  }, [])

  return {
    // Estado
    metas,
    loading,
    error,
    
    // Ações CRUD
    carregar,
    criar,
    buscarPorId,
    atualizar,
    excluir,
    
    // Cálculos e utilitários
    calcularProgresso,
    buscarMetasDoMes,
    calcularProgressoMetas
  }
}