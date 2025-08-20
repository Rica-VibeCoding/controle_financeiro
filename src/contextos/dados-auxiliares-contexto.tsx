'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { Conta, Categoria, Subcategoria, FormaPagamento, CentroCusto } from '@/tipos/database'
import { obterCategorias } from '@/servicos/supabase/categorias'
import { obterContas } from '@/servicos/supabase/contas'
import { obterSubcategoriasPorCategoria } from '@/servicos/supabase/subcategorias'
import { obterFormasPagamento } from '@/servicos/supabase/formas-pagamento'
import { obterCentrosCusto } from '@/servicos/supabase/centros-custo'
import { logger } from '@/utilitarios/logger'

/**
 * Interface para dados auxiliares do sistema
 */
interface DadosAuxiliares {
  contas: Conta[]
  categorias: Categoria[]
  formasPagamento: FormaPagamento[]
  centrosCusto: CentroCusto[]
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
  centrosCusto: []
}

const DadosAuxiliaresContexto = createContext<DadosAuxiliaresContextType | undefined>(undefined)

interface DadosAuxiliaresProviderProps {
  children: ReactNode
}

/**
 * Provider para cache global de dados auxiliares
 * Carrega uma vez e compartilha entre todos os componentes
 */
export function DadosAuxiliaresProvider({ children }: DadosAuxiliaresProviderProps) {
  const [dados, setDados] = useState<DadosAuxiliares>(DADOS_VAZIOS)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [cacheSubcategorias, setCacheSubcategorias] = useState<CacheSubcategorias>({})

  /**
   * Carrega todos os dados auxiliares
   */
  const carregarDados = async () => {
    try {
      setLoading(true)
      setError(null)

      const [contasData, categoriasData, formasData, centrosData] = await Promise.all([
        obterContas(),
        obterCategorias(),
        obterFormasPagamento(),
        obterCentrosCusto()
      ])

      setDados({
        contas: contasData,
        categorias: categoriasData,
        formasPagamento: formasData,
        centrosCusto: centrosData
      })
    } catch (error) {
      logger.error('Erro ao carregar dados auxiliares:', error)
      setError(error instanceof Error ? error.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }

  /**
   * Obtém subcategorias com cache inteligente
   * @param categoriaId - ID da categoria
   * @returns Promise com array de subcategorias
   */
  const obterSubcategorias = async (categoriaId: string): Promise<Subcategoria[]> => {
    // Verificar cache primeiro
    if (cacheSubcategorias[categoriaId]) {
      return cacheSubcategorias[categoriaId]
    }

    try {
      const subcategorias = await obterSubcategoriasPorCategoria(categoriaId)
      
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
   * Recarrega todos os dados (para refresh manual)
   */
  const recarregarDados = async () => {
    setCacheSubcategorias({}) // Limpar cache de subcategorias
    await carregarDados()
  }

  // Carregar dados na inicialização
  useEffect(() => {
    carregarDados()
  }, [])

  const value: DadosAuxiliaresContextType = {
    dados,
    loading,
    error,
    obterSubcategorias,
    recarregarDados
  }

  return (
    <DadosAuxiliaresContexto.Provider value={value}>
      {children}
    </DadosAuxiliaresContexto.Provider>
  )
}

/**
 * Hook para usar dados auxiliares em qualquer componente
 * @returns Contexto de dados auxiliares
 */
export function useDadosAuxiliares() {
  const context = useContext(DadosAuxiliaresContexto)
  if (context === undefined) {
    throw new Error('useDadosAuxiliares deve ser usado dentro de DadosAuxiliaresProvider')
  }
  return context
}