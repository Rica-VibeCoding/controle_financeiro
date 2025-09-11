import { type NextRequest } from 'next/server'
import { updateSession } from '@/servicos/supabase/middleware'
import { aplicarProtecaoRota } from '@/middleware/permissoes'

export async function middleware(request: NextRequest) {
  // Primeiro, atualizar sessão do Supabase
  const sessionResponse = await updateSession(request)
  
  // Se houve redirecionamento na sessão, retornar isso
  if (sessionResponse && sessionResponse.status !== 200) {
    return sessionResponse
  }
  
  // Aplicar proteção de rota baseada em permissões
  const protecaoResponse = await aplicarProtecaoRota(request)
  
  // Se houve bloqueio de permissão, retornar redirecionamento
  if (protecaoResponse) {
    return protecaoResponse
  }
  
  // Se chegou aqui, usuário tem acesso - retornar resposta da sessão ou continuar
  return sessionResponse
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}