'use client'

import { supabaseClient } from '@/servicos/supabase/auth-client'
import { useRouter } from 'next/navigation'

export function LogoutDevButton() {
  const router = useRouter()

  const handleLogout = async () => {
    try {
      await supabaseClient.auth.signOut()
      router.push('/auth/dev')
      router.refresh()
    } catch (error) {
      console.error('Erro no logout:', error)
    }
  }

  // Só mostrar em modo de desenvolvimento
  if (process.env.NEXT_PUBLIC_DEV_MODE !== 'true') {
    return null
  }

  return (
    <button
      onClick={handleLogout}
      className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
      title="Logout para desenvolvimento"
    >
      🔧 Dev Logout
    </button>
  )
}