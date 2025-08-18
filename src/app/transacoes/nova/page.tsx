'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { LayoutPrincipal } from '@/componentes/layout/layout-principal'
import { FormularioTransacao } from '@/componentes/transacoes/formulario-transacao'
import { useTransacoesContexto } from '@/contextos/transacoes-contexto'
import { NovaTransacao } from '@/tipos/database'

export default function NovaTransacaoPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { criar, atualizar, obterPorId } = useTransacoesContexto()
  const [carregando, setCarregando] = useState(false)

  // Verificar se é edição
  const transacaoId = searchParams.get('editar')
  const isEdicao = !!transacaoId

  // Criar nova transação
  const handleCriar = async (dados: NovaTransacao) => {
    try {
      setCarregando(true)
      await criar(dados)
      router.push('/transacoes')
    } catch (error) {
      console.error('Erro ao criar transação:', error)
    } finally {
      setCarregando(false)
    }
  }

  // Atualizar transação existente
  const handleAtualizar = async (dados: NovaTransacao) => {
    if (!transacaoId) return
    
    try {
      setCarregando(true)
      await atualizar(transacaoId, dados)
      router.push('/transacoes')
    } catch (error) {
      console.error('Erro ao atualizar transação:', error)
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
        <FormularioTransacao
          aoSalvar={isEdicao ? handleAtualizar : handleCriar}
          aoCancelar={handleCancelar}
          titulo={isEdicao ? 'Editar Transação' : 'Nova Transação'}
          transacaoId={transacaoId || undefined}
        />
      </div>
    </LayoutPrincipal>
  )
}