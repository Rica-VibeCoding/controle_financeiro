'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useModais } from '@/contextos/modais-contexto'

export const dynamic = 'force-dynamic'

// Desabilitar SSG para esta página (requer runtime do cliente)

export default function NovaContaPage() {
  const router = useRouter()
  const { conta: modalContaActions } = useModais()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])
  
  useEffect(() => {
    if (mounted) {
      // Abre modal e redireciona para página de listagem
    modalContaActions.abrir()
    router.push('/contas')
    }
  }, [modalContaActions, router])
  
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        <p className="mt-4 text-muted-foreground">Abrindo modal...</p>
      </div>
    </div>
  )
}