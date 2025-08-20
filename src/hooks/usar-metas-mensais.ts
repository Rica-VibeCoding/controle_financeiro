'use client'

import { useState, useCallback, useEffect } from 'react'
import { MetaMensal, MetaComProgresso, ResumoMetas, NovaMetaMensal } from '@/tipos/metas-mensais'
import { MetasMensaisService } from '@/servicos/supabase/metas-mensais'
import { gerarMesReferencia } from '@/utilitarios/metas-helpers'
import { usarToast } from './usar-toast'

interface EstadoMetasMensais {
  metasDoMes: MetaComProgresso[]
  resumo: ResumoMetas | null
  mesAtual: number
  loading: boolean
  error: string | null
}

export function useMetasMensais() {
  const [estado, setEstado] = useState<EstadoMetasMensais>({
    metasDoMes: [],
    resumo: null,
    mesAtual: gerarMesReferencia(),
    loading: false,
    error: null
  })

  const { sucesso, erro } = usarToast()

  // Carregar metas do mês
  const carregarMetasDoMes = useCallback(async (mesReferencia?: number) => {
    const mes = mesReferencia || estado.mesAtual
    
    try {
      setEstado(prev => ({ ...prev, loading: true, error: null }))
      
      const resumo = await MetasMensaisService.gerarResumoMetas(mes)
      
      setEstado(prev => ({
        ...prev,
        metasDoMes: resumo.categorias,
        resumo,
        mesAtual: mes,
        loading: false
      }))
    } catch (err) {
      const mensagem = err instanceof Error ? err.message : 'Erro ao carregar metas'
      setEstado(prev => ({ 
        ...prev, 
        loading: false, 
        error: mensagem 
      }))
      erro('Erro ao carregar metas', mensagem)
    }
  }, [estado.mesAtual, erro])

  // Criar ou atualizar meta
  const salvarMeta = useCallback(async (
    categoriaId: string, 
    valorMeta: number,
    mesReferencia?: number
  ) => {
    const mes = mesReferencia || estado.mesAtual
    
    try {
      setEstado(prev => ({ ...prev, loading: true, error: null }))

      // Validações
      const errosValidacao = MetasMensaisService.validarMeta({
        categoria_id: categoriaId,
        mes_referencia: mes,
        valor_meta: valorMeta
      })

      if (errosValidacao.length > 0) {
        throw new Error(errosValidacao.join(', '))
      }

      const novaMeta: NovaMetaMensal = {
        categoria_id: categoriaId,
        mes_referencia: mes,
        valor_meta: valorMeta
      }

      await MetasMensaisService.criarOuAtualizarMeta(novaMeta)
      
      // Recarregar metas para refletir mudanças
      await carregarMetasDoMes(mes)
      
      sucesso('Meta salva', `Meta de R$ ${valorMeta.toFixed(2)} definida com sucesso`)
    } catch (err) {
      const mensagem = err instanceof Error ? err.message : 'Erro ao salvar meta'
      setEstado(prev => ({ 
        ...prev, 
        loading: false, 
        error: mensagem 
      }))
      erro('Erro ao salvar meta', mensagem)
      throw err
    }
  }, [estado.mesAtual, carregarMetasDoMes, sucesso, erro])

  // Zerar meta
  const zerarMeta = useCallback(async (
    categoriaId: string,
    mesReferencia?: number
  ) => {
    return salvarMeta(categoriaId, 0, mesReferencia)
  }, [salvarMeta])

  // Renovar metas do mês anterior
  const renovarMetas = useCallback(async (mesReferencia?: number) => {
    const mes = mesReferencia || gerarMesReferencia()
    
    try {
      setEstado(prev => ({ ...prev, loading: true, error: null }))
      
      await MetasMensaisService.renovarMetasDoMesAnterior(mes)
      
      // Recarregar metas
      await carregarMetasDoMes(mes)
      
      sucesso('Metas renovadas', 'Metas copiadas do mês anterior com sucesso')
    } catch (err) {
      const mensagem = err instanceof Error ? err.message : 'Erro ao renovar metas'
      setEstado(prev => ({ 
        ...prev, 
        loading: false, 
        error: mensagem 
      }))
      erro('Erro ao renovar metas', mensagem)
    }
  }, [carregarMetasDoMes, sucesso, erro])

  // Inicializar metas para novo usuário
  const inicializarMetas = useCallback(async (mesReferencia?: number) => {
    const mes = mesReferencia || estado.mesAtual
    
    try {
      setEstado(prev => ({ ...prev, loading: true, error: null }))
      
      await MetasMensaisService.inicializarMetasParaNovoUsuario(mes)
      
      // Recarregar metas
      await carregarMetasDoMes(mes)
      
      sucesso('Metas inicializadas', 'Todas as categorias foram configuradas com meta R$ 0,00')
    } catch (err) {
      const mensagem = err instanceof Error ? err.message : 'Erro ao inicializar metas'
      setEstado(prev => ({ 
        ...prev, 
        loading: false, 
        error: mensagem 
      }))
      erro('Erro ao inicializar metas', mensagem)
    }
  }, [estado.mesAtual, carregarMetasDoMes, sucesso, erro])

  // Alterar mês visualizado
  const alterarMes = useCallback(async (novoMes: number) => {
    await carregarMetasDoMes(novoMes)
  }, [carregarMetasDoMes])

  // Buscar meta específica
  const buscarMetaPorCategoria = useCallback((categoriaId: string): MetaComProgresso | null => {
    return estado.metasDoMes.find(meta => meta.categoria_id === categoriaId) || null
  }, [estado.metasDoMes])

  // Calcular progresso de uma categoria específica
  const calcularProgressoCategoria = useCallback(async (
    categoriaId: string,
    mesReferencia?: number
  ) => {
    const mes = mesReferencia || estado.mesAtual
    
    try {
      const gastos = await MetasMensaisService.calcularGastosPorCategoria(categoriaId, mes)
      const meta = await MetasMensaisService.buscarMetaPorCategoriaeMes(categoriaId, mes)
      
      return {
        valor_gasto: gastos.valor_total,
        valor_meta: meta?.valor_meta || 0,
        quantidade_transacoes: gastos.quantidade_transacoes
      }
    } catch (err) {
      console.error('Erro ao calcular progresso:', err)
      return null
    }
  }, [estado.mesAtual])

  // Carregar automaticamente na inicialização
  useEffect(() => {
    carregarMetasDoMes()
  }, []) // Dependency array vazia para executar apenas uma vez

  return {
    // Estado
    metasDoMes: estado.metasDoMes,
    resumo: estado.resumo,
    mesAtual: estado.mesAtual,
    loading: estado.loading,
    error: estado.error,

    // Ações CRUD
    carregarMetasDoMes,
    salvarMeta,
    zerarMeta,
    
    // Operações especiais
    renovarMetas,
    inicializarMetas,
    alterarMes,

    // Utilitários
    buscarMetaPorCategoria,
    calcularProgressoCategoria
  }
}