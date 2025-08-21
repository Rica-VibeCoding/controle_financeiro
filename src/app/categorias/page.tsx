'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { LayoutPrincipal } from '@/componentes/layout/layout-principal'
import { Card, CardContent, CardHeader, CardTitle } from '@/componentes/ui/card'
import { Button } from '@/componentes/ui/button'
import { Icone } from '@/componentes/ui/icone'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/componentes/ui/table'
import { obterCategoriasComSubcategorias, excluirCategoria } from '@/servicos/supabase/categorias'
import { obterIconePorNome } from '@/componentes/ui/icone-picker'
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

  const handleExcluir = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir permanentemente esta categoria?')) {
      try {
        await excluirCategoria(id)
        setCategorias(prev => prev.filter(cat => cat.id !== id))
      } catch (error) {
        alert(error instanceof Error ? error.message : 'Erro ao excluir categoria')
      }
    }
  }

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
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Categorias</h1>
          </div>
          
          <Button onClick={() => router.push('/categorias/nova')}>
            <Icone name="plus-circle" className="w-4 h-4 mr-1" aria-hidden="true" />
            Nova Categoria
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
          <div className="border rounded-lg overflow-x-auto bg-white shadow-sm">
            <Table className="min-w-full">
              <TableHeader>
                <TableRow className="border-b bg-gray-50/50">
                  <TableHead className="min-w-[200px] font-semibold">Nome</TableHead>
                  <TableHead className="w-[150px] font-semibold">Tipo</TableHead>
                  <TableHead className="w-[130px] font-semibold text-center">Subcategorias</TableHead>
                  <TableHead className="w-[120px] font-semibold text-center">Status</TableHead>
                  <TableHead className="w-[130px] font-semibold text-center">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categorias.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      <div className="space-y-2">
                        <div className="text-4xl" aria-hidden="true"><Icone name="tag" className="w-6 h-6" /></div>
                        <p>Nenhuma categoria cadastrada</p>
                        <p className="text-sm">Adicione categorias para organizar suas transações</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  categorias.map((categoria) => (
                    <TableRow key={categoria.id} className="hover:bg-gray-50/50">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <span style={{ color: categoria.cor }} className="text-lg">●</span>
                          {(() => {
                            const IconeComponente = obterIconePorNome(categoria.icone)
                            return <IconeComponente size={20} style={{ color: categoria.cor }} />
                          })()}
                          <div className="font-medium">{categoria.nome}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                          categoria.tipo === 'receita' ? 'bg-green-100 text-green-800' :
                          categoria.tipo === 'despesa' ? 'bg-red-100 text-red-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {categoria.tipo === 'receita' ? 'Receita' :
                           categoria.tipo === 'despesa' ? 'Despesa' : 'Ambos'}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="font-semibold">
                          {categoria.subcategorias.length}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                          categoria.ativo
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {categoria.ativo ? 'Ativo' : 'Inativo'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1 justify-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push(`/categorias/editar/${categoria.id}`)}
                            title="Editar categoria"
                            className="h-8 w-8 p-0"
                          >
                            <Icone name="pencil" className="w-4 h-4" aria-hidden="true" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleExcluir(categoria.id)}
                            className="text-destructive hover:text-destructive h-8 w-8 p-0"
                            title="Excluir categoria"
                          >
                            <Icone name="trash-2" className="w-4 h-4" aria-hidden="true" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Icone name="line-chart" className="w-4 h-4" aria-hidden="true" />
              Resumo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground">
                  {categorias.length}
                </div>
                <p className="text-sm text-muted-foreground">Total de Categorias</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {categorias.filter(c => c.tipo === 'receita' || c.tipo === 'ambos').length}
                </div>
                <p className="text-sm text-muted-foreground">Receitas</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {categorias.filter(c => c.tipo === 'despesa' || c.tipo === 'ambos').length}
                </div>
                <p className="text-sm text-muted-foreground">Despesas</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {categorias.reduce((total, cat) => total + cat.subcategorias.length, 0)}
                </div>
                <p className="text-sm text-muted-foreground">Subcategorias</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </LayoutPrincipal>
  )
}