'use client'


import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useModais } from '@/contextos/modais-contexto'

export const dynamic = 'force-dynamic'

export default function EditarCentroCustoPage() {
  const router = useRouter()
  const params = useParams()
  const { centroCusto: modalCentroCustoActions } = useModais()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])
  
  useEffect(() => {
    if (mounted) {
      // Abre modal para edição e redireciona para página de listagem
    modalCentroCustoActions.abrir(params.id as string)
    router.push('/centros-custo')
    }
  }, [modalCentroCustoActions, router, params.id])
  
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        <p className="mt-4 text-muted-foreground">Abrindo modal para edição...</p>
      </div>
    </div>
  )
}