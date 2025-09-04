/**
 * Helper para facilitar migração para multiusuário
 * Remove após conclusão da migração
 */

export function isMultiUserEnabled(): boolean {
  return process.env.NEXT_PUBLIC_MULTI_USER === 'true'
}

export function getDefaultWorkspaceId(): string | undefined {
  // Durante migração, pode retornar um workspace padrão
  // Remover após implementação completa
  return undefined
}

// Wrapper para queries durante migração
export async function queryWithWorkspace<T>(
  queryFn: (workspaceId?: string) => Promise<T>,
  workspaceId?: string
): Promise<T> {
  if (isMultiUserEnabled() && !workspaceId) {
    console.warn('Query executada sem workspaceId em modo multiusuário')
  }
  return queryFn(workspaceId)
}