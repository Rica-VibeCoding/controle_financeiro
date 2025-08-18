'use client'

import { useState, useEffect, useCallback } from 'react'
import { NovaTransacao, Subcategoria } from '@/tipos/database'
import { obterSubcategoriasPorCategoria } from '@/servicos/supabase/subcategorias'
import { obterTransacaoPorId } from '@/servicos/supabase/transacoes'
import { useDadosAuxiliares } from '@/contextos/dados-auxiliares-contexto'
import { validarTransacao } from '@/utilitarios/validacao'

interface UseFormularioTransacaoOptions {
  transacaoInicial?: Partial<NovaTransacao>
  transacaoId?: string
}

export function usarFormularioTransacao({
  transacaoInicial = {},
  transacaoId
}: UseFormularioTransacaoOptions = {}) {
  // Dados auxiliares do Context
  const { dados: dadosAuxiliares, loading: dadosLoading } = useDadosAuxiliares()
  const { contas, categorias, formasPagamento, centrosCusto } = dadosAuxiliares

  // Estado do formulário
  const [dados, setDados] = useState<Partial<NovaTransacao>>({
    tipo: 'despesa',
    data: new Date().toISOString().split('T')[0],
    descricao: '',
    valor: 0,
    conta_id: '',
    status: 'previsto',
    recorrente: false,
    ...transacaoInicial
  })

  // Estados de controle
  const [subcategorias, setSubcategorias] = useState<Subcategoria[]>([])
  const [carregandoSubcategorias, setCarregandoSubcategorias] = useState(false)
  const [loading, setLoading] = useState(false)
  const [salvando, setSalvando] = useState(false)

  // Carregar transação para edição
  useEffect(() => {
    async function carregarTransacao() {
      if (!transacaoId) return
      
      try {
        setLoading(true)
        const transacao = await obterTransacaoPorId(transacaoId)
        if (transacao) {
          setDados({
            data: transacao.data,
            descricao: transacao.descricao,
            valor: transacao.valor,
            tipo: transacao.tipo,
            conta_id: transacao.conta_id,
            conta_destino_id: transacao.conta_destino_id || undefined,
            categoria_id: transacao.categoria_id || undefined,
            subcategoria_id: transacao.subcategoria_id || undefined,
            forma_pagamento_id: transacao.forma_pagamento_id || undefined,
            centro_custo_id: transacao.centro_custo_id || undefined,
            status: transacao.status,
            data_vencimento: transacao.data_vencimento || undefined,
            observacoes: transacao.observacoes || undefined,
            anexo_url: transacao.anexo_url || undefined,
            recorrente: transacao.recorrente,
            frequencia_recorrencia: transacao.frequencia_recorrencia || undefined,
            proxima_recorrencia: transacao.proxima_recorrencia || undefined,
            parcela_atual: transacao.parcela_atual,
            total_parcelas: transacao.total_parcelas
          })
        }
      } catch (error) {
        console.error('Erro ao carregar transação:', error)
      } finally {
        setLoading(false)
      }
    }

    carregarTransacao()
  }, [transacaoId])

  // Carregar subcategorias quando categoria muda
  useEffect(() => {
    async function carregarSubcategorias() {
      if (!dados.categoria_id) {
        setSubcategorias([])
        return
      }

      try {
        setCarregandoSubcategorias(true)
        const subcategoriasData = await obterSubcategoriasPorCategoria(dados.categoria_id)
        setSubcategorias(subcategoriasData)
      } catch (error) {
        console.error('Erro ao carregar subcategorias:', error)
      } finally {
        setCarregandoSubcategorias(false)
      }
    }

    carregarSubcategorias()
  }, [dados.categoria_id])

  // Atualizar campo do formulário
  const atualizarCampo = useCallback((campo: string, valor: any) => {
    setDados(prev => ({ ...prev, [campo]: valor }))
  }, [])

  // Resetar formulário
  const resetarFormulario = useCallback(() => {
    setDados({
      tipo: 'despesa',
      data: new Date().toISOString().split('T')[0],
      descricao: '',
      valor: 0,
      conta_id: '',
      status: 'previsto',
      recorrente: false,
      ...transacaoInicial
    })
    setSubcategorias([])
  }, [transacaoInicial])

  // Validar dados do formulário
  const validarDados = useCallback(() => {
    return validarTransacao(dados)
  }, [dados])

  // Calcular próxima recorrência
  const calcularProximaRecorrencia = useCallback((data: string, frequencia: string): string => {
    const dataBase = new Date(data)
    const proximaData = new Date(dataBase)

    switch (frequencia) {
      case 'semanal':
        proximaData.setDate(dataBase.getDate() + 7)
        break
      case 'quinzenal':
        proximaData.setDate(dataBase.getDate() + 15)
        break
      case 'mensal':
        proximaData.setMonth(dataBase.getMonth() + 1)
        break
      case 'bimestral':
        proximaData.setMonth(dataBase.getMonth() + 2)
        break
      case 'trimestral':
        proximaData.setMonth(dataBase.getMonth() + 3)
        break
      case 'semestral':
        proximaData.setMonth(dataBase.getMonth() + 6)
        break
      case 'anual':
        proximaData.setFullYear(dataBase.getFullYear() + 1)
        break
      default:
        proximaData.setMonth(dataBase.getMonth() + 1)
    }

    return proximaData.toISOString().split('T')[0]
  }, [])

  // Categorias filtradas por tipo
  const categoriasFiltradas = categorias.filter((cat: any) => 
    cat.tipo === dados.tipo || cat.tipo === 'ambos'
  )

  return {
    // Estado
    dados,
    subcategorias,
    
    // Dados auxiliares
    contas,
    categorias: categoriasFiltradas,
    formasPagamento,
    centrosCusto,
    
    // Estados de loading
    loading: dadosLoading || loading,
    carregandoSubcategorias,
    salvando,
    
    // Ações
    atualizarCampo,
    resetarFormulario,
    validarDados,
    calcularProximaRecorrencia,
    setSalvando
  }
}