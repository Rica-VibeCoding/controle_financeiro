/**
 * Helpers para validação de autenticação em API Routes
 * Centraliza lógica repetida de auth/workspace
 */

import { NextResponse } from 'next/server'
import { getSession, getCurrentWorkspace } from './server'
import { logger } from '@/utilitarios/logger'

export interface ValidatedRequest {
  userId: string
  workspaceId: string
  userRole: 'owner' | 'member'
}

/**
 * Validar autenticação e workspace em API Route
 * Retorna dados validados ou NextResponse com erro
 */
export async function validateAPIAuth(): Promise<
  { success: true; data: ValidatedRequest } |
  { success: false; response: NextResponse }
> {
  try {
    // Validar autenticação
    const session = await getSession()
    if (!session?.user) {
      return {
        success: false,
        response: NextResponse.json(
          { error: 'Não autenticado' },
          { status: 401 }
        )
      }
    }

    // Validar workspace
    const workspace = await getCurrentWorkspace()
    if (!workspace) {
      return {
        success: false,
        response: NextResponse.json(
          { error: 'Workspace não encontrado' },
          { status: 404 }
        )
      }
    }

    // Extrair workspace ID de forma segura
    const workspaceId = Array.isArray(workspace)
      ? (workspace as Array<{ id?: string; userRole?: string }>)[0]?.id
      : (workspace as { id?: string; userRole?: string })?.id

    if (!workspaceId) {
      logger.error('ID do workspace não encontrado na estrutura retornada', { workspace })
      return {
        success: false,
        response: NextResponse.json(
          { error: 'ID do workspace não encontrado' },
          { status: 404 }
        )
      }
    }

    // Extrair userRole de forma segura
    const userRole = Array.isArray(workspace)
      ? (workspace as Array<{ userRole?: string }>)[0]?.userRole || 'member'
      : (workspace as { userRole?: string })?.userRole || 'member'

    return {
      success: true,
      data: {
        userId: session.user.id,
        workspaceId,
        userRole: userRole as 'owner' | 'member'
      }
    }
  } catch (error) {
    logger.error('Erro ao validar autenticação na API', { error: error instanceof Error ? error.message : 'Desconhecido' })
    return {
      success: false,
      response: NextResponse.json(
        { error: 'Erro ao validar autenticação' },
        { status: 500 }
      )
    }
  }
}

/**
 * Validar se usuário é owner do workspace
 */
export async function validateOwnerAccess(): Promise<
  { success: true; data: ValidatedRequest } |
  { success: false; response: NextResponse }
> {
  const authResult = await validateAPIAuth()

  if (!authResult.success) {
    return authResult
  }

  if (authResult.data.userRole !== 'owner') {
    return {
      success: false,
      response: NextResponse.json(
        { error: 'Acesso negado: apenas proprietários podem executar esta ação' },
        { status: 403 }
      )
    }
  }

  return authResult
}
