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
// Importar useAuth dinamicamente para evitar dependências circulares
import { useAuth } from '@/contextos/auth-contexto'
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
  const { workspace } = useAuth()
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
  const [isClient, setIsClient] = useState(false)

  // Garantir que só executa no cliente
  useEffect(() => {
    setIsClient(true)
  }, [])

  const carregarTransacoes = async () => {
    if (!workspace) return
    
    try {
      setCarregando(true)
      setErro(null)
      
      const resposta = await obterTransacoes(filtros, paramsPaginacao, workspace.id)
      
      setTransacoes(resposta.dados)
      setPaginacao(resposta)
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Erro desconhecido')
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    if (isClient) {
      carregarTransacoes()
    }
  }, [filtros, paramsPaginacao, workspace, isClient])

  const criar = async (transacao: NovaTransacao) => {
    if (!workspace) throw new Error('Workspace não encontrado')
    
    try {
      await criarTransacao(transacao, workspace.id)
      await carregarTransacoes()
    } catch (error) {
      throw error
    }
  }

  const atualizar = async (id: string, dados: AtualizarTransacao) => {
    if (!workspace) throw new Error('Workspace não encontrado')
    
    try {
      await atualizarTransacao(id, dados, workspace.id)
      await carregarTransacoes()
    } catch (error) {
      throw error
    }
  }

  const excluir = async (id: string) => {
    if (!workspace) throw new Error('Workspace não encontrado')
    
    try {
      await excluirTransacao(id, workspace.id)
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