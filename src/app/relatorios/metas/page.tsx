'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { LayoutPrincipal } from '@/componentes/layout/layout-principal'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/componentes/ui/card'
import { Button } from '@/componentes/ui/button'
import { obterMetasComProgresso, criarMeta, desativarMeta } from '@/servicos/supabase/metas-funcoes'
import { obterCategorias } from '@/servicos/supabase/categorias'
import { usarToast } from '@/hooks/usar-toast'
import { obterIconePorNome } from '@/componentes/ui/icone-picker'
import type { MetaComProgresso } from '@/servicos/supabase/metas-funcoes'
import type { Categoria } from '@/tipos/database'

export default function MetasPage() {
  const router = useRouter()
  const { toast } = usarToast()
  
  const [metas, setMetas] = useState<MetaComProgresso[]>([])
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  const carregarDados = async () => {
    try {
      setCarregando(true)
      setErro(null)
      
      const [dadosMetas, dadosCategorias] = await Promise.all([
        obterMetasComProgresso(),
        obterCategorias()
      ])
      
      setMetas(dadosMetas)
      setCategorias(dadosCategorias)
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Erro ao carregar dados')
      toast({
        title: "Erro ao carregar metas",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "error"
      })
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    carregarDados()
  }, [])

  const handleDesativarMeta = async (metaId: string, nomeMeta: string) => {
    if (!confirm(`Tem certeza que deseja desativar a meta "${nomeMeta}"?`)) {
      return
    }

    try {
      await desativarMeta(metaId)
      toast({
        title: "Meta desativada",
        description: `A meta "${nomeMeta}" foi desativada com sucesso.`,
        variant: "success"
      })
      await carregarDados()
    } catch (error) {
      toast({
        title: "Erro ao desativar meta",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "error"
      })
    }
  }

  const getStatusColor = (status: MetaComProgresso['status_cor']) => {
    switch (status) {
      case 'verde': return 'bg-green-500'
      case 'amarelo': return 'bg-yellow-500'
      case 'laranja': return 'bg-orange-500'
      case 'vermelho': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const getStatusText = (status: MetaComProgresso['status_cor']) => {
    switch (status) {
      case 'verde': return 'No limite'
      case 'amarelo': return 'Atenção'
      case 'laranja': return 'Cuidado'
      case 'vermelho': return 'Ultrapassado'
      default: return 'Indefinido'
    }
  }

  return (
    <LayoutPrincipal>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => router.push('/relatorios')}
            >
              ← Voltar
            </Button>
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
                Controle de Metas
              </h1>
              <p className="text-muted-foreground">
                Monitore o progresso das suas metas financeiras
              </p>
            </div>
          </div>
          
          <Button>
            + Nova Meta
          </Button>
        </div>

        {carregando && (
          <Card>
            <CardContent className="p-6">
              <div className="text-center text-muted-foreground">
                Carregando metas...
              </div>
            </CardContent>
          </Card>
        )}

        {erro && (
          <Card>
            <CardContent className="p-6">
              <div className="text-center text-destructive">
                ❌ {erro}
              </div>
            </CardContent>
          </Card>
        )}

        {!carregando && !erro && (
          <>
            {/* Resumo das Metas */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-foreground">
                      {metas.length}
                    </div>
                    <p className="text-sm text-muted-foreground">Total de Metas</p>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {metas.filter(m => m.status_cor === 'verde').length}
                    </div>
                    <p className="text-sm text-muted-foreground">No Limite</p>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600">
                      {metas.filter(m => m.status_cor === 'amarelo' || m.status_cor === 'laranja').length}
                    </div>
                    <p className="text-sm text-muted-foreground">Em Atenção</p>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {metas.filter(m => m.status_cor === 'vermelho').length}
                    </div>
                    <p className="text-sm text-muted-foreground">Ultrapassadas</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Lista de Metas */}
            <div className="space-y-4">
              {metas.map((meta) => (
                <Card key={meta.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg flex items-center gap-2">
                          {meta.categoria && (() => {
                            const IconeComponente = obterIconePorNome(meta.categoria.icone)
                            return <IconeComponente size={16} style={{ color: meta.categoria.cor }} />
                          })()}
                          {meta.nome}
                          <span className={`inline-block w-3 h-3 rounded-full ${getStatusColor(meta.status_cor)}`} />
                        </CardTitle>
                        <CardDescription>
                          {meta.tipo === 'categoria' ? (
                            meta.categoria ? `Categoria: ${meta.categoria.nome}` : 'Categoria específica'
                          ) : 'Meta total de gastos'}
                          {meta.descricao && ` • ${meta.descricao}`}
                        </CardDescription>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-muted-foreground">
                          {new Date(meta.periodo_inicio).toLocaleDateString('pt-BR')} - {new Date(meta.periodo_fim).toLocaleDateString('pt-BR')}
                        </div>
                        <div className="text-sm font-medium">
                          {getStatusText(meta.status_cor)}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Barra de Progresso */}
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Progresso: {meta.percentual_usado}%</span>
                          <span>
                            {meta.valor_usado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} / {meta.valor_limite.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div 
                            className={`h-3 rounded-full ${getStatusColor(meta.status_cor)}`}
                            style={{ width: `${Math.min(meta.percentual_usado, 100)}%` }}
                          />
                        </div>
                      </div>

                      {/* Valores */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Valor Limite</p>
                          <p className="font-medium">
                            {meta.valor_limite.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Valor Usado</p>
                          <p className="font-medium">
                            {meta.valor_usado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Valor Restante</p>
                          <p className={`font-medium ${meta.valor_restante >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {meta.valor_restante.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </p>
                        </div>
                      </div>

                      {/* Ações */}
                      <div className="flex gap-2 pt-2">
                        <Button variant="outline" size="sm">
                          Editar
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDesativarMeta(meta.id, meta.nome)}
                        >
                          Desativar
                        </Button>
                        <Button variant="outline" size="sm">
                          Ver Detalhes
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {metas.length === 0 && (
                <Card>
                  <CardContent className="p-6 text-center">
                    <div className="text-muted-foreground space-y-2">
                      <div className="text-4xl">🎯</div>
                      <p>Nenhuma meta cadastrada</p>
                      <p className="text-sm">Crie metas para controlar seus gastos</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </>
        )}

        {/* Dicas */}
        <Card>
          <CardHeader>
            <CardTitle>💡 Dicas para Metas Eficazes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground">
              <div>
                <h4 className="font-medium text-foreground mb-2">Definindo Metas:</h4>
                <ul className="space-y-1 list-disc list-inside">
                  <li>Seja realista com os valores</li>
                  <li>Considere gastos sazonais</li>
                  <li>Revise mensalmente</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-foreground mb-2">Cores dos Status:</h4>
                <ul className="space-y-1">
                  <li className="flex items-center gap-2">
                    <span className="w-3 h-3 bg-green-500 rounded-full" />
                    Verde: 0-49% (dentro do limite)
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-3 h-3 bg-yellow-500 rounded-full" />
                    Amarelo: 50-79% (atenção)
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-3 h-3 bg-orange-500 rounded-full" />
                    Laranja: 80-99% (cuidado)
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-3 h-3 bg-red-500 rounded-full" />
                    Vermelho: 100%+ (ultrapassado)
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </LayoutPrincipal>
  )
}