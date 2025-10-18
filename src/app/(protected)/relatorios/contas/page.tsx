'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { PageGuard } from '@/componentes/ui/page-guard'
import { CardsResumo } from '@/componentes/relatorios/contas/cards-resumo'
import { FiltrosContasComponent } from '@/componentes/relatorios/contas/filtros-contas'
import { TabelaContas } from '@/componentes/relatorios/contas/tabela-contas'
import {
  usarResumoContas,
  usarContasPagarReceber,
  usarMarcarComoRealizado
} from '@/hooks/usar-contas-pagar-receber'
import { useModais } from '@/contextos/modais-contexto'
import { useToast } from '@/contextos/toast-contexto'
import type { FiltrosContas, AbaContas } from '@/tipos/contas'

export default function ContasPagarReceberPage() {
  const [abaAtiva, setAbaAtiva] = useState<AbaContas>('a_pagar')
  const [filtros, setFiltros] = useState<FiltrosContas>({
    periodo: '30_dias'
  })

  const { abrirModal } = useModais()
  const { sucesso, erro } = useToast()

  // Buscar dados
  const { resumo, isLoading: loadingResumo } = usarResumoContas()
  const { contas, isLoading: loadingContas } = usarContasPagarReceber(abaAtiva, filtros)
  const { marcarComoRealizado } = usarMarcarComoRealizado()

  // Handler: Marcar como realizado
  const handleMarcarComoRealizado = async (id: string) => {
    try {
      await marcarComoRealizado(id)
      sucesso('Conta marcada como realizada!')
    } catch (error) {
      erro('Erro ao atualizar conta')
      console.error(error)
    }
  }

  // Handler: Editar transação
  const handleEditar = (id: string) => {
    abrirModal('lancamento', id)
  }

  return (
    <PageGuard permissaoNecessaria="relatorios">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <header className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Contas a Pagar e Receber
          </h1>
          <p className="text-gray-600">
            Gestão completa de obrigações financeiras
          </p>
        </header>

        {/* Cards de Resumo */}
        <CardsResumo resumo={resumo} isLoading={loadingResumo} />

        {/* Filtros */}
        <FiltrosContasComponent filtros={filtros} onFiltrosChange={setFiltros} />

        {/* Tabela com Abas */}
        <TabelaContas
          contas={contas}
          isLoading={loadingContas}
          abaAtiva={abaAtiva}
          onAbaChange={setAbaAtiva}
          onMarcarComoRealizado={handleMarcarComoRealizado}
          onEditar={handleEditar}
        />
      </div>
    </PageGuard>
  )
}
