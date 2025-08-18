'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { LayoutPrincipal } from '@/componentes/layout/layout-principal'
import { FormularioParcelada } from '@/componentes/transacoes/formulario-parcelada'
import { usarTransacoes } from '@/hooks/usar-transacoes'
import { NovaTransacao } from '@/tipos/database'

export default function TransacaoParceladaPage() {
  const router = useRouter()
  const { criarParcelada } = usarTransacoes()
  const [carregando, setCarregando] = useState(false)

  // Criar transação parcelada
  const handleCriar = async (dados: NovaTransacao, numeroParcelas: number) => {
    try {
      setCarregando(true)
      await criarParcelada(dados, numeroParcelas)
      router.push('/transacoes')
    } catch (error) {
      console.error('Erro ao criar parcelamento:', error)
      // Toast de erro já é exibido pelo hook
    } finally {
      setCarregando(false)
    }
  }

  // Cancelar e voltar
  const handleCancelar = () => {
    router.push('/transacoes')
  }

  return (
    <LayoutPrincipal>
      <div className="max-w-4xl mx-auto space-y-6">
        <FormularioParcelada
          aoSalvar={handleCriar}
          aoCancelar={handleCancelar}
          titulo="Criar Parcelamento"
        />
      </div>
    </LayoutPrincipal>
  )
}