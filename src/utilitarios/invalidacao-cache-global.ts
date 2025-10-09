import { mutate } from 'swr'

/**
 * Sistema centralizado de invalidação de cache
 *
 * Usado após criar/editar/excluir dados para atualizar todas as telas
 * relevantes de forma manual e controlada.
 *
 * FILOSOFIA: Invalidação explícita apenas quando necessário
 */

/**
 * Invalida cache de transações e dados relacionados
 * Usar após: criar, editar, excluir transações
 */
export async function invalidarCacheTransacoes(workspaceId: string): Promise<void> {
  if (!workspaceId) {
    console.warn('⚠️ WorkspaceId não fornecido para invalidação')
    return
  }

  console.log('♻️ Invalidando cache de transações...')

  // 1. Invalidar todas as queries de transações
  await mutate(
    (key: any) =>
      Array.isArray(key) &&
      key[0] === 'transacoes' &&
      key[1] === workspaceId,
    undefined,
    { revalidate: true }
  )

  // 2. Invalidar dashboard (cards, gráficos que dependem de transações)
  await mutate(
    (key: any) =>
      Array.isArray(key) &&
      key[0]?.includes('dashboard') &&
      key[1] === workspaceId,
    undefined,
    { revalidate: true }
  )

  // 3. Invalidar saldos de contas (mudam com transações)
  await mutate(
    (key: any) =>
      Array.isArray(key) &&
      key[0] === 'contas' &&
      key[1] === workspaceId,
    undefined,
    { revalidate: true }
  )

  // 4. Invalidar cartões (saldos e limites mudam)
  await mutate(
    (key: any) =>
      Array.isArray(key) &&
      key[0] === 'cartoes' &&
      key[1] === workspaceId,
    undefined,
    { revalidate: true }
  )

  // 5. Invalidar próximas contas (podem ter sido pagas)
  await mutate(
    (key: any) =>
      Array.isArray(key) &&
      key[0] === 'proximas-contas' &&
      key[1] === workspaceId,
    undefined,
    { revalidate: true }
  )

  // 6. Dispatch evento para componentes que não usam SWR
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('atualizarTransacoes'))
  }

  console.log('✅ Cache de transações invalidado')
}

/**
 * Invalida cache de categorias
 * Usar após: criar, editar, excluir categorias/subcategorias
 */
export async function invalidarCacheCategorias(workspaceId: string): Promise<void> {
  if (!workspaceId) {
    console.warn('⚠️ WorkspaceId não fornecido para invalidação')
    return
  }

  console.log('♻️ Invalidando cache de categorias...')

  // Invalidar categorias
  await mutate(
    (key: any) =>
      Array.isArray(key) &&
      key[0] === 'categorias' &&
      key[1] === workspaceId,
    undefined,
    { revalidate: true }
  )

  // Dashboard pode exibir categorias em gráficos
  await mutate(
    (key: any) =>
      Array.isArray(key) &&
      key[0]?.includes('dashboard') &&
      key[1] === workspaceId,
    undefined,
    { revalidate: true }
  )

  console.log('✅ Cache de categorias invalidado')
}

/**
 * Invalida cache de contas
 * Usar após: criar, editar, excluir contas
 */
export async function invalidarCacheContas(workspaceId: string): Promise<void> {
  if (!workspaceId) {
    console.warn('⚠️ WorkspaceId não fornecido para invalidação')
    return
  }

  console.log('♻️ Invalidando cache de contas...')

  // 1. Contas
  await mutate(
    (key: any) =>
      Array.isArray(key) &&
      key[0] === 'contas' &&
      key[1] === workspaceId,
    undefined,
    { revalidate: true }
  )

  // 2. Cartões (são contas também)
  await mutate(
    (key: any) =>
      Array.isArray(key) &&
      key[0] === 'cartoes' &&
      key[1] === workspaceId,
    undefined,
    { revalidate: true }
  )

  // 3. Dashboard depende de saldos
  await mutate(
    (key: any) =>
      Array.isArray(key) &&
      key[0]?.includes('dashboard') &&
      key[1] === workspaceId,
    undefined,
    { revalidate: true }
  )

  console.log('✅ Cache de contas invalidado')
}

/**
 * Invalida cache de formas de pagamento
 * Usar após: criar, editar, excluir formas de pagamento
 */
export async function invalidarCacheFormasPagamento(workspaceId: string): Promise<void> {
  if (!workspaceId) {
    console.warn('⚠️ WorkspaceId não fornecido para invalidação')
    return
  }

  console.log('♻️ Invalidando cache de formas de pagamento...')

  await mutate(
    (key: any) =>
      Array.isArray(key) &&
      key[0] === 'formas-pagamento' &&
      key[1] === workspaceId,
    undefined,
    { revalidate: true }
  )

  console.log('✅ Cache de formas de pagamento invalidado')
}

/**
 * Invalida cache de centros de custo
 * Usar após: criar, editar, excluir centros de custo
 */
export async function invalidarCacheCentrosCusto(workspaceId: string): Promise<void> {
  if (!workspaceId) {
    console.warn('⚠️ WorkspaceId não fornecido para invalidação')
    return
  }

  console.log('♻️ Invalidando cache de centros de custo...')

  await mutate(
    (key: any) =>
      Array.isArray(key) &&
      key[0] === 'centros-custo' &&
      key[1] === workspaceId,
    undefined,
    { revalidate: true }
  )

  console.log('✅ Cache de centros de custo invalidado')
}

/**
 * Invalida cache de projetos
 * Usar após: criar, editar, excluir projetos ou toggle de inclusão
 */
export async function invalidarCacheProjetos(workspaceId: string): Promise<void> {
  if (!workspaceId) {
    console.warn('⚠️ WorkspaceId não fornecido para invalidação')
    return
  }

  console.log('♻️ Invalidando cache de projetos...')

  await mutate(
    (key: any) =>
      Array.isArray(key) &&
      key[0] === 'projetos' &&
      key[1] === workspaceId,
    undefined,
    { revalidate: true }
  )

  // Dashboard pode mostrar projetos
  await mutate(
    (key: any) =>
      Array.isArray(key) &&
      key[0]?.includes('dashboard') &&
      key[1] === workspaceId,
    undefined,
    { revalidate: true }
  )

  console.log('✅ Cache de projetos invalidado')
}

/**
 * Invalida TODO o cache do workspace
 * Usar apenas em casos extremos: importação CSV, reset completo, etc.
 */
export async function invalidarCacheCompleto(workspaceId: string): Promise<void> {
  if (!workspaceId) {
    console.warn('⚠️ WorkspaceId não fornecido para invalidação')
    return
  }

  console.log('♻️♻️♻️ Invalidando TODO o cache...')

  // Invalida tudo relacionado ao workspace
  await mutate(
    (key: any) => Array.isArray(key) && key[1] === workspaceId,
    undefined,
    { revalidate: true }
  )

  // Dispatch evento global
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('atualizarTudo'))
  }

  console.log('✅✅✅ Cache completo invalidado')
}

/**
 * Invalida cache de dados auxiliares (categorias + formas + centros)
 * Útil quando múltiplos dados auxiliares foram alterados
 */
export async function invalidarCacheDadosAuxiliares(workspaceId: string): Promise<void> {
  if (!workspaceId) {
    console.warn('⚠️ WorkspaceId não fornecido para invalidação')
    return
  }

  console.log('♻️ Invalidando cache de dados auxiliares...')

  await Promise.all([
    invalidarCacheCategorias(workspaceId),
    invalidarCacheFormasPagamento(workspaceId),
    invalidarCacheCentrosCusto(workspaceId)
  ])

  console.log('✅ Cache de dados auxiliares invalidado')
}
