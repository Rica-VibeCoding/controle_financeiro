'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { LayoutPrincipal } from '@/componentes/layout/layout-principal'
import { Button } from '@/componentes/ui/button'
import { ListaTransacoes } from '@/componentes/transacoes/lista-transacoes'
import { ListaRecorrentes } from '@/componentes/transacoes/lista-recorrentes'
import { FiltrosTransacoes } from '@/componentes/comum/filtros-transacoes'
import { Paginacao } from '@/componentes/comum/paginacao'
import { ModalTransferencia } from '@/componentes/modais/modal-transferencia'
import { ModalLancamento } from '@/componentes/modais/modal-lancamento'
import { ModalParcelamento } from '@/componentes/modais/modal-parcelamento'
import { ModalImportacaoCSV } from '@/componentes/importacao/modal-importacao-csv'
import { useModais } from '@/contextos/modais-contexto'
import { Transacao } from '@/tipos/database'
import type { FiltrosTransacao, ParametrosPaginacao } from '@/tipos/filtros'
import { Icone } from '@/componentes/ui/icone'

export default function TransacoesPage() {
  const router = useRouter()
  const { modalAberto, dadosModal, abrirModal, fecharModal } = useModais()
  const [abaAtiva, setAbaAtiva] = useState<'transacoes' | 'recorrentes'>('transacoes')
  
  // Estados para filtros e paginação
  const [filtros, setFiltros] = useState<FiltrosTransacao>({})
  const [parametrosPaginacao, setParametrosPaginacao] = useState<ParametrosPaginacao>({
    pagina: 1,
    limite: 20,
    ordenacao: 'data',
    direcao: 'desc'
  })

  // Editar transação
  const handleEditar = (transacao: Transacao) => {
    abrirModal('lancamento', { transacaoId: transacao.id })
  }

  // Handlers para filtros e paginação
  const handleFiltrosChange = (novosFiltros: FiltrosTransacao) => {
    setFiltros(novosFiltros)
    setParametrosPaginacao(prev => ({ ...prev, pagina: 1 })) // Reset para primeira página
  }

  const handleLimparFiltros = () => {
    setFiltros({})
    setParametrosPaginacao(prev => ({ ...prev, pagina: 1 }))
  }

  const handleParametrosPaginacaoChange = (novosParametros: ParametrosPaginacao) => {
    setParametrosPaginacao(novosParametros)
  }

  return (
    <LayoutPrincipal>
      <div className="max-w-full mx-auto px-4 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
              Transações
            </h1>
          </div>
          
          <div className="flex gap-2">
            <Button onClick={() => abrirModal('lancamento')}>
              <span className="mr-1" aria-hidden="true"><Icone name="tag" className="w-4 h-4" /></span>
              Lançar
            </Button>
            <Button 
              variant="outline"
              onClick={() => abrirModal('parcelamento')}
            >
              <span className="mr-1" aria-hidden="true"><Icone name="credit-card" className="w-4 h-4" /></span>
              Parcelar
            </Button>
            <Button 
              variant="outline"
              onClick={() => abrirModal('transferencia')}
            >
              <span className="mr-1" aria-hidden="true"><Icone name="line-chart" className="w-4 h-4" /></span>
              Transferir
            </Button>
            <Button 
              variant="outline"
              onClick={() => abrirModal('importacao')}
            >
              <span className="mr-1" aria-hidden="true"><Icone name="folder" className="w-4 h-4" /></span>
              Importar CSV
            </Button>
          </div>
        </div>

        {/* Abas de navegação */}
        <div className="flex border-b">
          <button
            onClick={() => setAbaAtiva('transacoes')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              abaAtiva === 'transacoes'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Todas as Transações
          </button>
          <button
            onClick={() => setAbaAtiva('recorrentes')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              abaAtiva === 'recorrentes'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Recorrentes
          </button>
        </div>

        {/* Filtros e Busca */}
        {abaAtiva === 'transacoes' && (
          <FiltrosTransacoes
            filtros={filtros}
            onFiltrosChange={handleFiltrosChange}
            onLimpar={handleLimparFiltros}
          />
        )}

        {/* Conteúdo das abas */}
        <>
          {abaAtiva === 'transacoes' && (
            <>
              <ListaTransacoes
                aoEditar={handleEditar}
                aoExcluir={() => {}} // Exclusão já implementada no componente
              />
              {/* Paginação será integrada via Context API ou props futuras */}
            </>
          )}
          
          {abaAtiva === 'recorrentes' && (
            <ListaRecorrentes />
          )}
        </>

        {/* Modais */}
        <ModalLancamento
          isOpen={modalAberto === 'lancamento'}
          onClose={fecharModal}
          onSuccess={() => window.location.reload()}
          transacaoId={dadosModal?.transacaoId}
        />
        
        <ModalParcelamento
          isOpen={modalAberto === 'parcelamento'}
          onClose={fecharModal}
          onSuccess={() => window.location.reload()}
        />
        
        <ModalTransferencia 
          isOpen={modalAberto === 'transferencia'}
          onClose={fecharModal}
          onSuccess={() => window.location.reload()}
        />

        <ModalImportacaoCSV
          isOpen={modalAberto === 'importacao'}
          onClose={fecharModal}
          onSuccess={() => window.location.reload()}
        />
      </div>
    </LayoutPrincipal>
  )
}