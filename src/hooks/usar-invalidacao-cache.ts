import { mutate } from 'swr'
import { useAuth } from '@/contextos/auth-contexto'

export function useInvalidacaoCache() {
  const { workspace } = useAuth()

  const invalidarTransacoes = () => {
    if (!workspace) return
    mutate((key: any) => 
      Array.isArray(key) && 
      key[0]?.includes('transacoes') && 
      key[1] === workspace.id
    )
  }

  const invalidarCategorias = () => {
    if (!workspace) return
    mutate((key: any) => 
      Array.isArray(key) && 
      key[0]?.includes('categorias') && 
      key[1] === workspace.id
    )
  }

  const invalidarSubcategorias = () => {
    if (!workspace) return
    mutate((key: any) => 
      Array.isArray(key) && 
      key[0]?.includes('subcategorias') && 
      key[1] === workspace.id
    )
  }

  const invalidarContas = () => {
    if (!workspace) return
    mutate((key: any) => 
      Array.isArray(key) && 
      key[0]?.includes('contas') && 
      key[1] === workspace.id
    )
  }

  const invalidarFormasPagamento = () => {
    if (!workspace) return
    mutate((key: any) => 
      Array.isArray(key) && 
      key[0]?.includes('formas-pagamento') && 
      key[1] === workspace.id
    )
  }

  const invalidarCentrosCusto = () => {
    if (!workspace) return
    mutate((key: any) => 
      Array.isArray(key) && 
      key[0]?.includes('centros-custo') && 
      key[1] === workspace.id
    )
  }

  const invalidarMetas = () => {
    if (!workspace) return
    mutate((key: any) => 
      Array.isArray(key) && 
      key[0]?.includes('metas') && 
      key[1] === workspace.id
    )
  }

  const invalidarDashboard = () => {
    if (!workspace) return
    mutate((key: any) => 
      Array.isArray(key) && 
      key[0]?.includes('dashboard') && 
      key[1] === workspace.id
    )
  }

  const invalidarProjetos = () => {
    if (!workspace) return
    mutate((key: any) => 
      Array.isArray(key) && 
      key[0]?.includes('projetos') && 
      key[1] === workspace.id
    )
  }

  const invalidarTudo = () => {
    if (!workspace) return
    mutate((key: any) => 
      Array.isArray(key) && 
      key.includes(workspace.id)
    )
  }

  return {
    invalidarTransacoes,
    invalidarCategorias,
    invalidarSubcategorias,
    invalidarContas,
    invalidarFormasPagamento,
    invalidarCentrosCusto,
    invalidarMetas,
    invalidarDashboard,
    invalidarProjetos,
    invalidarTudo
  }
}