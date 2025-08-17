/**
 * Context API para gerenciar estado global de transações
 * 
 * QUANDO USAR:
 * - Lista principal de transações na aplicação
 * - Dados que precisam ser compartilhados entre múltiplos componentes
 * - Dashboard que mostra resumos de transações
 * - Qualquer componente que precisa de sincronização automática
 * 
 * VANTAGENS:
 * - Estado centralizado e sincronizado
 * - Evita prop drilling
 * - Atualizações automáticas em todos os componentes
 * 
 * COMO USAR:
 * 1. Envolver o app com <TransacoesProvider>
 * 2. Usar useTransacoesContexto() nos componentes
 */

'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { 
  obterTransacoes, 
  criarTransacao, 
  atualizarTransacao, 
  excluirTransacao 
} from '@/servicos/supabase/transacoes'
import type {
  FiltrosTransacao,
  ParametrosPaginacao,
  RespostaPaginada
} from '@/tipos/filtros'

// Tipos importados dos arquivos centralizados

// Importar tipos do database
import type { Transacao, NovaTransacao } from '@/tipos/database'

type TransacaoComRelacoes = Transacao & {
  categoria?: { nome: string; cor: string; icone: string }
  subcategoria?: { nome: string }
  conta?: { nome: string; tipo: string }
  conta_destino?: { nome: string; tipo: string }
  forma_pagamento?: { nome: string; tipo: string }
  centro_custo?: { nome: string; cor: string }
}

type AtualizarTransacao = Partial<NovaTransacao>

interface TransacoesContextoType {
  transacoes: TransacaoComRelacoes[]
  carregando: boolean
  erro: string | null
  paginacao: RespostaPaginada<TransacaoComRelacoes> | null
  recarregar: () => Promise<void>
  criar: (transacao: NovaTransacao) => Promise<void>
  atualizar: (id: string, dados: AtualizarTransacao) => Promise<void>
  excluir: (id: string) => Promise<void>
  aplicarFiltros: (filtros: FiltrosTransacao) => void
  aplicarPaginacao: (params: ParametrosPaginacao) => void
}

const TransacoesContexto = createContext<TransacoesContextoType | undefined>(undefined)

export function TransacoesProvider({ children }: { children: ReactNode }) {
  const [transacoes, setTransacoes] = useState<TransacaoComRelacoes[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [paginacao, setPaginacao] = useState<RespostaPaginada<TransacaoComRelacoes> | null>(null)
  const [filtros, setFiltros] = useState<FiltrosTransacao>({})
  const [paramsPaginacao, setParamsPaginacao] = useState<ParametrosPaginacao>({
    pagina: 1,
    limite: 20,
    ordenacao: 'data',
    direcao: 'desc'
  })

  const carregarTransacoes = async () => {
    try {
      setCarregando(true)
      setErro(null)
      
      const resposta = await obterTransacoes(filtros, paramsPaginacao)
      
      setTransacoes(resposta.dados)
      setPaginacao(resposta)
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Erro desconhecido')
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    carregarTransacoes()
  }, [filtros, paramsPaginacao])

  const criar = async (transacao: NovaTransacao) => {
    try {
      await criarTransacao(transacao)
      await carregarTransacoes()
    } catch (error) {
      throw error
    }
  }

  const atualizar = async (id: string, dados: AtualizarTransacao) => {
    try {
      await atualizarTransacao(id, dados)
      await carregarTransacoes()
    } catch (error) {
      throw error
    }
  }

  const excluir = async (id: string) => {
    try {
      await excluirTransacao(id)
      await carregarTransacoes()
    } catch (error) {
      throw error
    }
  }

  const aplicarFiltros = (novosFiltros: FiltrosTransacao) => {
    setFiltros(novosFiltros)
    setParamsPaginacao(prev => ({ ...prev, pagina: 1 }))
  }

  const aplicarPaginacao = (params: ParametrosPaginacao) => {
    setParamsPaginacao(params)
  }

  return (
    <TransacoesContexto.Provider value={{
      transacoes,
      carregando,
      erro,
      paginacao,
      recarregar: carregarTransacoes,
      criar,
      atualizar,
      excluir,
      aplicarFiltros,
      aplicarPaginacao
    }}>
      {children}
    </TransacoesContexto.Provider>
  )
}

export function useTransacoesContexto() {
  const contexto = useContext(TransacoesContexto)
  if (contexto === undefined) {
    throw new Error('useTransacoesContexto deve ser usado dentro de TransacoesProvider')
  }
  return contexto
}