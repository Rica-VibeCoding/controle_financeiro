'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { LayoutPrincipal } from '@/componentes/layout/layout-principal'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/componentes/ui/card'
import { Button } from '@/componentes/ui/button'
import { obterCategoriasComSubcategorias } from '@/servicos/supabase/categorias'
import type { Categoria } from '@/tipos/database'

type CategoriaComSubcategorias = Categoria & {
  subcategorias: Array<{
    id: string
    nome: string
    categoria_id: string
    ativo: boolean
    created_at: string
  }>
}

export default function CategoriasPage() {
  const router = useRouter()
  const [categorias, setCategorias] = useState<CategoriaComSubcategorias[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    async function carregarCategorias() {
      try {
        setCarregando(true)
        setErro(null)
        const dadosCategorias = await obterCategoriasComSubcategorias()
        setCategorias(dadosCategorias)
      } catch (error) {
        setErro(error instanceof Error ? error.message : 'Erro ao carregar categorias')
      } finally {
        setCarregando(false)
      }
    }

    carregarCategorias()
  }, [])

  return (
    <LayoutPrincipal>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
              Categorias
            </h1>
            <p className="text-muted-foreground">
              Organize suas receitas e despesas por categorias
            </p>
          </div>
          
          <Button onClick={() => router.push('/categorias/nova')}>
            + Nova Categoria
          </Button>
        </div>

        {carregando && (
          <Card>
            <CardContent className="p-6">
              <div className="text-center text-muted-foreground">
                Carregando categorias...
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categorias.map((categoria) => (
              <Card key={categoria.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <span style={{ color: categoria.cor }}>●</span>
                      {categoria.nome}
                    </CardTitle>
                    <span className="text-2xl">{categoria.icone}</span>
                  </div>
                  <CardDescription>
                    {categoria.tipo === 'receita' ? '💰 Receita' : 
                     categoria.tipo === 'despesa' ? '💸 Despesa' : '🔄 Ambos'}
                     {categoria.subcategorias.length > 0 && (
                       <span className="ml-2">• {categoria.subcategorias.length} subcategorias</span>
                     )}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {categoria.subcategorias.length > 0 && (
                    <div className="space-y-1 mb-4">
                      <p className="text-sm font-medium text-muted-foreground">Subcategorias:</p>
                      <div className="flex flex-wrap gap-1">
                        {categoria.subcategorias.slice(0, 3).map((sub) => (
                          <span key={sub.id} className="text-xs bg-muted px-2 py-1 rounded">
                            {sub.nome}
                          </span>
                        ))}
                        {categoria.subcategorias.length > 3 && (
                          <span className="text-xs text-muted-foreground">
                            +{categoria.subcategorias.length - 3} mais
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                  
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => router.push(`/categorias/editar/${categoria.id}`)}
                    >
                      Editar
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1">
                      Subcategorias
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}

            {categorias.length === 0 && (
              <div className="col-span-full">
                <Card>
                  <CardContent className="p-6 text-center">
                    <div className="text-muted-foreground space-y-2">
                      <div className="text-4xl">🏷️</div>
                      <p>Nenhuma categoria cadastrada</p>
                      <p className="text-sm">Adicione categorias para organizar suas transações</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>📊 Estatísticas</CardTitle>
              <CardDescription>Resumo das suas categorias</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Total de categorias:</span>
                  <span className="font-semibold">{categorias.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Receitas:</span>
                  <span className="font-semibold text-green-600">
                    {categorias.filter(c => c.tipo === 'receita' || c.tipo === 'ambos').length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Despesas:</span>
                  <span className="font-semibold text-red-600">
                    {categorias.filter(c => c.tipo === 'despesa' || c.tipo === 'ambos').length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Subcategorias:</span>
                  <span className="font-semibold">
                    {categorias.reduce((total, cat) => total + cat.subcategorias.length, 0)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>🎯 Dicas</CardTitle>
              <CardDescription>Organize melhor suas finanças</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>• Use cores distintas para facilitar visualização</p>
                <p>• Crie subcategorias para detalhamento</p>
                <p>• Mantenha nomes simples e claros</p>
                <p>• Revise periodicamente suas categorias</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </LayoutPrincipal>
  )
}