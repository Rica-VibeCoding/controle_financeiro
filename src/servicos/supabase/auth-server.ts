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

// Cliente para componentes servidor
export async function supabaseServer() {
  const cookieStore = await cookies()
  const url = getValidUrl()
  const key = getValidKey()
  
  console.log('🔧 AUTH SERVER: URL válida:', url)
  
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