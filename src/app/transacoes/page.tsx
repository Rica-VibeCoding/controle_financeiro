'use client'

import { useState } from 'react'
import Link from 'next/link'
import { LayoutPrincipal } from '@/componentes/layout/layout-principal'
import { Button } from '@/componentes/ui/button'
import { FormularioTransacao } from '@/componentes/transacoes/formulario-transacao'
import { ListaTransacoes } from '@/componentes/transacoes/lista-transacoes'
import { ListaRecorrentes } from '@/componentes/transacoes/lista-recorrentes'
import { FiltrosTransacoes } from '@/componentes/comum/filtros-transacoes'
import { Paginacao } from '@/componentes/comum/paginacao'
import { useTransacoesContexto } from '@/contextos/transacoes-contexto'
import { Transacao, NovaTransacao } from '@/tipos/database'
import type { FiltrosTransacao, ParametrosPaginacao } from '@/tipos/filtros'

export default function TransacoesPage() {
  const { criar, atualizar } = useTransacoesContexto()
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [transacaoEditando, setTransacaoEditando] = useState<Transacao | null>(null)
  const [abaAtiva, setAbaAtiva] = useState<'transacoes' | 'recorrentes'>('transacoes')
  
  // Estados para filtros e paginação
  const [filtros, setFiltros] = useState<FiltrosTransacao>({})
  const [parametrosPaginacao, setParametrosPaginacao] = useState<ParametrosPaginacao>({
    pagina: 1,
    limite: 20,
    ordenacao: 'data',
    direcao: 'desc'
  })

  // Criar nova transação
  const handleCriar = async (dados: NovaTransacao) => {
    await criar(dados)
    setMostrarFormulario(false)
  }

  // Editar transação
  const handleEditar = (transacao: Transacao) => {
    setTransacaoEditando(transacao)
    setMostrarFormulario(true)
  }

  // Atualizar transação
  const handleAtualizar = async (dados: NovaTransacao) => {
    if (transacaoEditando) {
      await atualizar(transacaoEditando.id, dados)
      setTransacaoEditando(null)
      setMostrarFormulario(false)
    }
  }

  // Cancelar formulário
  const handleCancelar = () => {
    setMostrarFormulario(false)
    setTransacaoEditando(null)
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
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
              Transações
            </h1>
            <p className="text-muted-foreground">
              Gerencie suas receitas, despesas, transferências e recorrências
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button 
              onClick={() => setMostrarFormulario(true)}
              disabled={mostrarFormulario}
            >
              + Nova Transação
            </Button>
            <Link href="/transacoes/parcelada">
              <Button variant="outline" disabled={mostrarFormulario}>
                💳 Parcelar
              </Button>
            </Link>
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
            📋 Todas as Transações
          </button>
          <button
            onClick={() => setAbaAtiva('recorrentes')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              abaAtiva === 'recorrentes'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            🔄 Recorrentes
          </button>
        </div>

        {/* Formulário */}
        {mostrarFormulario && (
          <FormularioTransacao
            aoSalvar={transacaoEditando ? handleAtualizar : handleCriar}
            aoCancelar={handleCancelar}
            transacaoInicial={transacaoEditando ? {
              data: transacaoEditando.data,
              descricao: transacaoEditando.descricao,
              valor: transacaoEditando.valor,
              tipo: transacaoEditando.tipo,
              conta_id: transacaoEditando.conta_id,
              conta_destino_id: transacaoEditando.conta_destino_id || undefined,
              categoria_id: transacaoEditando.categoria_id || undefined,
              subcategoria_id: transacaoEditando.subcategoria_id || undefined,
              forma_pagamento_id: transacaoEditando.forma_pagamento_id || undefined,
              centro_custo_id: transacaoEditando.centro_custo_id || undefined,
              status: transacaoEditando.status,
              observacoes: transacaoEditando.observacoes || undefined
            } : undefined}
            titulo={transacaoEditando ? 'Editar Transação' : 'Nova Transação'}
          />
        )}

        {/* Filtros e Busca */}
        {!mostrarFormulario && abaAtiva === 'transacoes' && (
          <FiltrosTransacoes
            filtros={filtros}
            onFiltrosChange={handleFiltrosChange}
            onLimpar={handleLimparFiltros}
          />
        )}

        {/* Conteúdo das abas */}
        {!mostrarFormulario && (
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
        )}
      </div>
    </LayoutPrincipal>
  )
}