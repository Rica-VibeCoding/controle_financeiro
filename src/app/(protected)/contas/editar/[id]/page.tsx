'use client'

export const dynamic = 'force-dynamic'

import { useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useModais } from '@/contextos/modais-contexto'

export default function EditarContaPage() {
  const router = useRouter()
  const params = useParams()
  const { conta: modalContaActions } = useModais()
  
  useEffect(() => {
    // Abre modal para edição e redireciona para página de listagem
    modalContaActions.abrir(params.id as string)
    router.push('/contas')
  }, [modalContaActions, router, params.id])
  
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        <p className="mt-4 text-muted-foreground">Abrindo modal para edição...</p>
      </div>
    </div>
  )
}