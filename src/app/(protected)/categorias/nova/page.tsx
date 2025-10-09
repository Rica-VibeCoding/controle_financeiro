'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useModais } from '@/contextos/modais-contexto'

export const dynamic = 'force-dynamic'

export default function NovaCategoriaPage() {
  const router = useRouter()
  const { categoria: modalCategoriaActions } = useModais()
  
  useEffect(() => {
    // Abre modal e redireciona para página de listagem
    modalCategoriaActions.abrir()
    router.push('/categorias')
  }, [modalCategoriaActions, router])
  
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        <p className="mt-4 text-muted-foreground">Abrindo modal...</p>
      </div>
    </div>
  )
}