// MIGRAÇÃO PARA @supabase/ssr - elimina conflito de múltiplas instâncias
import { createClient as createNewClient } from './auth-client'
import { SupabaseClient } from '@supabase/supabase-js'

let supabaseInstance: SupabaseClient

export function getSupabaseClient(): SupabaseClient {
  if (!supabaseInstance) {
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      console.log('🔧 CLIENTE LEGADO: Usando cliente @supabase/ssr unificado')
    }
    supabaseInstance = createNewClient()
  }

  return supabaseInstance
}

// Evitar proxy no SSR para prevenir erros de webpack
export const supabase = typeof window !== 'undefined' 
  ? new Proxy({} as SupabaseClient, {
      get(target, prop) {
        return getSupabaseClient()[prop as keyof SupabaseClient]
      }
    })
  : getSupabaseClient()