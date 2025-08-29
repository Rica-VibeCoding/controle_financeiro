import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

// Cliente para componentes servidor
export async function supabaseServer() {
  const cookieStore = cookies()
  return createServerComponentClient({ cookies: () => cookieStore })
}

// Hook para obter sessão
export async function getSession() {
  const supabase = await supabaseServer()
  const { data: { session } } = await supabase.auth.getSession()
  return session
}

// Hook para obter workspace atual
export async function getCurrentWorkspace() {
  const session = await getSession()
  if (!session) return null

  const supabase = await supabaseServer()
  const { data } = await supabase
    .from('fp_usuarios')
    .select('workspace_id, fp_workspaces(*)')
    .eq('id', session.user.id)
    .single()

  return data?.fp_workspaces
}