import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Função para garantir URL válida (evitar malformação)
function getValidUrl() {
  let url = process.env.NEXT_PUBLIC_SUPABASE_URL
  
  if (!url || url.includes('ant_type') || !url.includes('.supabase.co')) {
    url = 'https://nzgifjdewdfibcopolof.supabase.co'
  }
  
  // Garantir que não há caracteres malformados
  url = url.replace(/\.ant_type.*$/, '.supabase.co')
  
  return url
}

function getValidKey() {
  return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im56Z2lmamRld2RmaWJjb3BvbG9mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc0NjA4NDAsImV4cCI6MjA2MzAzNjg0MH0.O7MKZNx_Cd-Z12iq8h0pq6Sq0bmJazcxDHvlVb4VJQc'
}

// Cliente para componentes servidor - Interface unificada
export async function createClient() {
  const cookieStore = await cookies()
  const url = getValidUrl()
  const key = getValidKey()
  
  if (process.env.NODE_ENV === 'development') {
    console.log('🔧 SERVER CLIENT: URL válida:', url)
  }
  
  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
          })
        } catch (error) {
          // SSR não pode definir cookies no Server Components
          // Isso será tratado no middleware
        }
      },
    },
  })
}

// Hook para obter sessão com validação de segurança
export async function getSession() {
  try {
    const supabase = await createClient()
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error) {
      console.warn('⚠️ Erro ao obter sessão:', error.message)
      return null
    }
    
    // Validar se sessão não está expirada
    if (session?.expires_at && new Date(session.expires_at * 1000) < new Date()) {
      console.warn('⏰ Sessão expirada detectada')
      return null
    }
    
    return session
  } catch (error) {
    console.error('💥 Erro crítico ao obter sessão:', error)
    return null
  }
}

// Hook para obter workspace atual com validações
export async function getCurrentWorkspace() {
  try {
    const session = await getSession()
    if (!session?.user?.id) return null

    const supabase = await createClient()
    const { data, error } = await supabase
      .from('fp_usuarios')
      .select(`
        workspace_id, 
        role,
        ativo,
        fp_workspaces (
          id,
          nome,
          owner_id,
          plano,
          ativo,
          created_at,
          updated_at
        )
      `)
      .eq('id', session.user.id)
      .eq('ativo', true)
      .single()

    if (error) {
      console.warn('⚠️ Erro ao obter workspace:', error.message)
      return null
    }
    
    // Validar se workspace está ativo
    if (!(data?.fp_workspaces as any)?.ativo) {
      console.warn('❌ Workspace inativo detectado')
      return null
    }

    return {
      ...data.fp_workspaces,
      userRole: data.role,
      userActive: data.ativo
    }
  } catch (error) {
    console.error('💥 Erro crítico ao obter workspace:', error)
    return null
  }
}

// Validar se usuário tem permissão no workspace
export async function validateWorkspaceAccess(userId: string, workspaceId: string): Promise<boolean> {
  try {
    if (!userId || !workspaceId) return false
    
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('fp_usuarios')
      .select('id, ativo')
      .eq('id', userId)
      .eq('workspace_id', workspaceId)
      .eq('ativo', true)
      .single()

    return !error && !!data
  } catch (error) {
    console.error('Erro na validação de acesso ao workspace:', error)
    return false
  }
}

// Validar se usuário é owner do workspace
export async function validateWorkspaceOwnership(userId: string, workspaceId: string): Promise<boolean> {
  try {
    if (!userId || !workspaceId) return false
    
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('fp_usuarios')
      .select('role')
      .eq('id', userId)
      .eq('workspace_id', workspaceId)
      .eq('ativo', true)
      .single()

    return !error && data?.role === 'owner'
  } catch (error) {
    console.error('Erro na validação de ownership do workspace:', error)
    return false
  }
}

// Função para refresh de sessão seguro
export async function refreshUserSession() {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.refreshSession()
    
    if (error) {
      console.warn('⚠️ Falha no refresh da sessão:', error.message)
      return { success: false, error: error.message }
    }
    
    return { success: true, session: data.session }
  } catch (error: any) {
    console.error('💥 Erro crítico no refresh da sessão:', error)
    return { success: false, error: error.message }
  }
}

// Função para logout seguro
export async function signOut() {
  try {
    const supabase = await createClient()
    const { error } = await supabase.auth.signOut()
    
    if (error) {
      console.warn('⚠️ Erro no logout:', error.message)
      return { success: false, error: error.message }
    }
    
    return { success: true }
  } catch (error: any) {
    console.error('💥 Erro crítico no logout:', error)
    return { success: false, error: error.message }
  }
}

// Interface para trabalhar com usuário e workspace atual
export interface AuthContext {
  user: any | null
  workspace: any | null
  userRole: 'owner' | 'member' | null
  isAuthenticated: boolean
  isWorkspaceOwner: boolean
}

// Hook para obter contexto completo de auth
export async function getAuthContext(): Promise<AuthContext> {
  try {
    const session = await getSession()
    const workspace = await getCurrentWorkspace()
    
    return {
      user: session?.user || null,
      workspace: workspace || null,
      userRole: workspace?.userRole || null,
      isAuthenticated: !!session?.user,
      isWorkspaceOwner: workspace?.userRole === 'owner'
    }
  } catch (error) {
    console.error('💥 Erro ao obter contexto de autenticação:', error)
    return {
      user: null,
      workspace: null,
      userRole: null,
      isAuthenticated: false,
      isWorkspaceOwner: false
    }
  }
}