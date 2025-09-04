'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useModais } from '@/contextos/modais-contexto'

export default function NovoCentroCustoPage() {
  const router = useRouter()
  const { centroCusto: modalCentroCustoActions } = useModais()
  
  useEffect(() => {
    // Abre modal e redireciona para página de listagem
    modalCentroCustoActions.abrir()
    router.push('/centros-custo')
  }, [modalCentroCustoActions, router])
  
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        <p className="mt-4 text-muted-foreground">Abrindo modal...</p>
      </div>
    </div>
  )
}