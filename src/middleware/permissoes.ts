import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/servicos/supabase/server'
import type { TipoPermissao } from '@/tipos/permissoes'

/**
 * Mapeamento de rotas para permissões necessárias
 * Usado pelo middleware para validar acesso às páginas
 */
const ROTAS_PERMISSOES: Record<string, TipoPermissao> = {
  '/dashboard': 'dashboard',
  // '/transacoes': removido - permite acesso livre, o componente faz controle interno por abas
  // Rotas de transações específicas removidas - agora usa sistema de abas único
  '/relatorios': 'relatorios',
  '/configuracoes': 'configuracoes',
  '/configuracoes/metas': 'configuracoes',
  '/contas': 'cadastramentos',
  '/categorias': 'cadastramentos',
  '/subcategorias': 'cadastramentos',
  '/formas-pagamento': 'cadastramentos',
  '/centros-custo': 'cadastramentos'
}

/**
 * Rotas que sempre são liberadas para todos os usuários autenticados
 */
const ROTAS_SEMPRE_LIBERADAS = [
  '/configuracoes/usuarios', // Apenas owners veem isso (já protegido no componente)
  '/auth',
  '/api'
]

/**
 * Verificar se usuário tem permissão para acessar uma rota específica
 */
export async function verificarPermissaoRota(
  request: NextRequest,
  rota: string
): Promise<boolean> {
  try {
    // Verificar se é rota sempre liberada
    if (ROTAS_SEMPRE_LIBERADAS.some(route => rota.startsWith(route))) {
      return true
    }

    // Verificar se precisa de permissão específica
    const permissaoNecessaria = ROTAS_PERMISSOES[rota]
    if (!permissaoNecessaria) {
      return true // Se não está mapeada, liberar acesso
    }

    const supabase = await createClient()
    const { data: { session }, error } = await supabase.auth.getSession()

    if (error || !session?.user) {
      return false // Não autenticado
    }

    // Buscar dados do usuário e workspace
    const { data: userData, error: userError } = await supabase
      .from('fp_usuarios')
      .select(`
        role,
        ativo,
        permissoes,
        fp_workspaces (
          id,
          ativo
        )
      `)
      .eq('id', session.user.id)
      .eq('ativo', true)
      .single()

    if (userError || !userData) {
      return false // Usuário não encontrado
    }

    // Verificar se workspace está ativo
    if (!(userData.fp_workspaces as any)?.ativo) {
      return false // Workspace inativo
    }

    // OWNERs sempre têm acesso total
    if (userData.role === 'owner') {
      return true
    }

    // Para MEMBERs, verificar permissões específicas
    const permissoes = userData.permissoes as Record<string, boolean>
    if (!permissoes || typeof permissoes !== 'object') {
      return false // Permissões inválidas
    }

    return permissoes[permissaoNecessaria] === true

  } catch (error) {
    console.error('Erro ao verificar permissão da rota:', error)
    return false // Em caso de erro, negar acesso
  }
}

/**
 * Middleware de redirecionamento para páginas sem permissão
 */
export function redirecionarSemPermissao(request: NextRequest): NextResponse {
  const url = request.nextUrl.clone()
  
  // Redirecionar para dashboard se não tiver permissão
  url.pathname = '/dashboard'
  url.searchParams.set('error', 'sem-permissao')
  
  return NextResponse.redirect(url)
}

/**
 * Aplicar proteção de rota no middleware principal
 * Exemplo de uso no middleware.ts:
 */
export async function aplicarProtecaoRota(request: NextRequest): Promise<NextResponse | null> {
  const { pathname } = request.nextUrl

  // Pular verificação para rotas de API e assets
  if (pathname.startsWith('/api') || 
      pathname.startsWith('/_next') || 
      pathname.includes('.')) {
    return null
  }

  // Verificar permissão para a rota atual
  const temPermissao = await verificarPermissaoRota(request, pathname)
  
  if (!temPermissao) {
    return redirecionarSemPermissao(request)
  }

  return null // Permitir acesso
}