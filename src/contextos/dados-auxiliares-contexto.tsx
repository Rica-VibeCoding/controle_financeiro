'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import useSWR from 'swr'
import { Conta, Categoria, Subcategoria, FormaPagamento, CentroCusto, Contato } from '@/tipos/database'
import { obterCategorias } from '@/servicos/supabase/categorias'
import { obterContas } from '@/servicos/supabase/contas'
import { obterSubcategoriasPorCategoria } from '@/servicos/supabase/subcategorias'
import { obterFormasPagamento } from '@/servicos/supabase/formas-pagamento'
import { obterCentrosCusto } from '@/servicos/supabase/centros-custo'
import { obterClientes, obterFornecedores } from '@/servicos/supabase/contatos-queries'
import { logger } from '@/utilitarios/logger'
import { useAuth } from '@/contextos/auth-contexto'

/**
 * Interface para dados auxiliares do sistema
 */
interface DadosAuxiliares {
  contas: Conta[]
  categorias: Categoria[]
  formasPagamento: FormaPagamento[]
  centrosCusto: CentroCusto[]
  clientes: Contato[]
  fornecedores: Contato[]
}

/**
 * Interface para cache de subcategorias por categoria
 */
interface CacheSubcategorias {
  [categoriaId: string]: Subcategoria[]
}

/**
 * Interface do contexto de dados auxiliares
 */
interface DadosAuxiliaresContextType {
  dados: DadosAuxiliares
  loading: boolean
  error: string | null
  obterSubcategorias: (categoriaId: string) => Promise<Subcategoria[]>
  recarregarDados: () => Promise<void>
}

/**
 * Dados auxiliares vazios (estado inicial)
 */
const DADOS_VAZIOS: DadosAuxiliares = {
  contas: [],
  categorias: [],
  formasPagamento: [],
  centrosCusto: [],
  clientes: [],
  fornecedores: []
}

const DadosAuxiliaresContexto = createContext<DadosAuxiliaresContextType | undefined>(undefined)

interface DadosAuxiliaresProviderProps {
  children: ReactNode
}

/**
 * Provider para cache global de dados auxiliares
 * Usa SWR para cache automático e revalidação
 */
export function DadosAuxiliaresProvider({ children }: DadosAuxiliaresProviderProps) {
  const { workspace } = useAuth()
  const [cacheSubcategorias, setCacheSubcategorias] = useState<CacheSubcategorias>({})

  /**
   * Função para carregar todos os dados auxiliares
   */
  const carregarDadosAuxiliares = async () => {
    if (!workspace) return DADOS_VAZIOS

    const [contasData, categoriasData, formasData, centrosData, clientesData, fornecedoresData] = await Promise.all([
      obterContas(false, workspace.id),
      obterCategorias(false, workspace.id),
      obterFormasPagamento(false, workspace.id),
      obterCentrosCusto(false, workspace.id),
      obterClientes(workspace.id),
      obterFornecedores(workspace.id)
    ])

    return {
      contas: contasData,
      categorias: categoriasData,
      formasPagamento: formasData,
      centrosCusto: centrosData,
      clientes: clientesData,
      fornecedores: fornecedoresData
    }
  }

  // Hook SWR para cache automático dos dados auxiliares
  const { data: dados = DADOS_VAZIOS, error, isLoading: loading, mutate: recarregarDados } = useSWR(
    workspace ? ['dados-auxiliares', workspace.id] : null,
    carregarDadosAuxiliares,
    {
      refreshInterval: 300000, // 5 minutos - dados auxiliares mudam pouco
      revalidateOnFocus: false,
      dedupingInterval: 60000, // 1 minuto
      errorRetryCount: 3,
      errorRetryInterval: 5000,
      onError: (error) => {
        logger.error('Erro ao carregar dados auxiliares:', error)
      }
    }
  )

  /**
   * Obtém subcategorias com cache inteligente
   * @param categoriaId - ID da categoria
   * @returns Promise com array de subcategorias
   */
  const obterSubcategorias = async (categoriaId: string): Promise<Subcategoria[]> => {
    if (!workspace) return []
    
    // Verificar cache primeiro
    if (cacheSubcategorias[categoriaId]) {
      return cacheSubcategorias[categoriaId]
    }

    try {
      const subcategorias = await obterSubcategoriasPorCategoria(categoriaId, workspace.id)
      
      // Atualizar cache
      setCacheSubcategorias(prev => ({
        ...prev,
        [categoriaId]: subcategorias
      }))

      return subcategorias
    } catch (error) {
      logger.error('Erro ao carregar subcategorias:', error)
      return []
    }
  }

  /**
   * Função para recarregar dados manualmente
   */
  const recarregarDadosManual = async () => {
    setCacheSubcategorias({}) // Limpar cache de subcategorias
    await recarregarDados() // Função do SWR
  }

  const value: DadosAuxiliaresContextType = {
    dados,
    loading,
    error: error?.message || null,
    obterSubcategorias,
    recarregarDados: recarregarDadosManual
  }

  return (
    <DadosAuxiliaresContexto.Provider value={value}>
      {children}
    </DadosAuxiliaresContexto.Provider>
  )
}

/**
 * Hook para usar o contexto de dados auxiliares
 */
export function useDadosAuxiliares() {
  const context = useContext(DadosAuxiliaresContexto)
  if (!context) {
    throw new Error('useDadosAuxiliares deve ser usado dentro de DadosAuxiliaresProvider')
  }
  return context
}