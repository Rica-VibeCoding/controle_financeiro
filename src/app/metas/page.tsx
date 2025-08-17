'use client'

import { useState, useEffect } from 'react'
import { LayoutPrincipal } from '@/componentes/layout/layout-principal'
import { Button } from '@/componentes/ui/button'
import { FormularioMeta } from '@/componentes/metas/formulario-meta'
import { CardMeta } from '@/componentes/metas/card-meta'
import { LoadingText } from '@/componentes/comum/loading'
import { usarMetas } from '@/hooks/usar-metas'
import { Meta, NovaMeta } from '@/tipos/database'

export default function MetasPage() {
  const { metas, loading, carregar, criar, atualizar, excluir } = usarMetas()
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [metaEditando, setMetaEditando] = useState<Meta | null>(null)

  // Carregar metas na inicialização
  useEffect(() => {
    carregar()
  }, [carregar])

  // Criar nova meta
  const handleCriar = async (dados: NovaMeta) => {
    await criar(dados)
    setMostrarFormulario(false)
  }

  // Editar meta
  const handleEditar = (meta: Meta) => {
    setMetaEditando(meta)
    setMostrarFormulario(true)
  }

  // Atualizar meta
  const handleAtualizar = async (dados: NovaMeta) => {
    if (metaEditando) {
      await atualizar(metaEditando.id, dados)
      setMetaEditando(null)
      setMostrarFormulario(false)
    }
  }

  // Excluir meta
  const handleExcluir = async (meta: Meta) => {
    await excluir(meta.id)
  }

  // Cancelar formulário
  const handleCancelar = () => {
    setMostrarFormulario(false)
    setMetaEditando(null)
  }

  return (
    <LayoutPrincipal>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
              🎯 Metas de Orçamento
            </h1>
            <p className="text-muted-foreground">
              Defina e acompanhe seus limites de gastos por categoria ou total
            </p>
          </div>
          
          <Button 
            onClick={() => setMostrarFormulario(true)}
            disabled={mostrarFormulario}
          >
            + Nova Meta
          </Button>
        </div>

        {/* Formulário */}
        {mostrarFormulario && (
          <FormularioMeta
            aoSalvar={metaEditando ? handleAtualizar : handleCriar}
            aoCancelar={handleCancelar}
            metaInicial={metaEditando ? {
              nome: metaEditando.nome,
              descricao: metaEditando.descricao,
              valor_limite: metaEditando.valor_limite,
              periodo_inicio: metaEditando.periodo_inicio,
              periodo_fim: metaEditando.periodo_fim,
              tipo: metaEditando.tipo,
              categoria_id: metaEditando.categoria_id,
            } : undefined}
            titulo={metaEditando ? 'Editar Meta' : 'Nova Meta'}
          />
        )}

        {/* Lista de metas */}
        {!mostrarFormulario && (
          <div>
            {loading ? (
              <div className="text-center py-8">
                <LoadingText>Carregando metas...</LoadingText>
              </div>
            ) : metas.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🎯</div>
                <h3 className="text-lg font-medium mb-2">Nenhuma meta cadastrada</h3>
                <p className="text-muted-foreground mb-4">
                  Crie metas para controlar seus gastos por categoria ou total
                </p>
                <Button onClick={() => setMostrarFormulario(true)}>
                  Criar primeira meta
                </Button>
              </div>
            ) : (
              <div>
                {/* Resumo */}
                <div className="bg-blue-50 p-4 rounded-lg mb-6">
                  <h3 className="font-medium text-blue-900 mb-2">
                    📊 Resumo das Metas
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                    <div>
                      <span className="text-blue-700">Total de metas:</span>
                      <span className="font-medium ml-1">{metas.length}</span>
                    </div>
                    <div>
                      <span className="text-blue-700">Por categoria:</span>
                      <span className="font-medium ml-1">
                        {metas.filter(m => m.tipo === 'categoria').length}
                      </span>
                    </div>
                    <div>
                      <span className="text-blue-700">Totais:</span>
                      <span className="font-medium ml-1">
                        {metas.filter(m => m.tipo === 'total').length}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Grid de metas */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {metas.map((meta) => (
                    <CardMeta
                      key={meta.id}
                      meta={meta}
                      aoEditar={handleEditar}
                      aoExcluir={handleExcluir}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Informações sobre metas */}
        {!mostrarFormulario && metas.length > 0 && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-medium mb-2">💡 Como funcionam as metas</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground">
              <div>
                <p><strong>Alertas automáticos:</strong></p>
                <ul className="mt-1 space-y-1 text-xs">
                  <li>• <span className="text-yellow-600">50%:</span> Aviso amarelo</li>
                  <li>• <span className="text-orange-600">80%:</span> Aviso laranja</li>
                  <li>• <span className="text-red-600">100%:</span> Limite excedido</li>
                </ul>
              </div>
              <div>
                <p><strong>Cálculo:</strong></p>
                <p className="text-xs mt-1">
                  Soma todas as despesas do período (status "pago") 
                  comparado com o limite definido na meta.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </LayoutPrincipal>
  )
}