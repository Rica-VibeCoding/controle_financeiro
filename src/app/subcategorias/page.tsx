'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { LayoutPrincipal } from '@/componentes/layout/layout-principal'
import { Button } from '@/componentes/ui/button'
import { Icone } from '@/componentes/ui/icone'
import { Card, CardContent, CardHeader, CardTitle } from '@/componentes/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/componentes/ui/table'
import { TableContainer } from '@/componentes/ui/table-container'
import { obterSubcategorias, excluirSubcategoria } from '@/servicos/supabase/subcategorias'
import { obterCategorias } from '@/servicos/supabase/categorias'
import type { Subcategoria, Categoria } from '@/tipos/database'

type SubcategoriaComCategoria = Subcategoria & {
  categoria?: Categoria
}

export default function SubcategoriasPage() {
  const router = useRouter()
  const [subcategorias, setSubcategorias] = useState<SubcategoriaComCategoria[]>([])
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    async function carregarDados() {
      try {
        setCarregando(true)
        setErro(null)
        
        const [dadosSubcategorias, dadosCategorias] = await Promise.all([
          obterSubcategorias(),
          obterCategorias()
        ])
        
        // Associar subcategorias com suas categorias
        const subcategoriasComCategoria = dadosSubcategorias.map(sub => ({
          ...sub,
          categoria: dadosCategorias.find(cat => cat.id === sub.categoria_id)
        }))
        
        setSubcategorias(subcategoriasComCategoria)
        setCategorias(dadosCategorias)
      } catch (error) {
        setErro(error instanceof Error ? error.message : 'Erro ao carregar subcategorias')
      } finally {
        setCarregando(false)
      }
    }

    carregarDados()
  }, [])

  const handleExcluir = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir permanentemente esta subcategoria?')) {
      try {
        await excluirSubcategoria(id)
        setSubcategorias(prev => prev.filter(sub => sub.id !== id))
      } catch (error) {
        alert('Erro ao excluir subcategoria')
      }
    }
  }

  if (carregando) {
    return (
      <LayoutPrincipal>
        <div className="max-w-full mx-auto px-4 space-y-6">
          <div className="text-center py-8 text-muted-foreground">
            Carregando subcategorias...
          </div>
        </div>
      </LayoutPrincipal>
    )
  }

  return (
    <LayoutPrincipal>
      <div className="max-w-full mx-auto px-4 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Subcategorias</h1>
          </div>
          
          <Button onClick={() => router.push('/subcategorias/nova')}>
            <Icone name="plus-circle" className="w-4 h-4 mr-1" aria-hidden="true" />
            Nova Subcategoria
          </Button>
        </div>

        {erro && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <h4 className="font-medium text-red-800 mb-2">❌ Erro</h4>
            <p className="text-sm text-red-700">{erro}</p>
          </div>
        )}

        <TableContainer>
          <Table className="min-w-full">
            <TableHeader>
              <TableRow className="border-b bg-gray-50/50">
                <TableHead className="w-[160px] font-semibold sticky left-0 bg-gray-50/50 z-20">Nome</TableHead>
                <TableHead className="w-[140px] font-semibold">Categoria</TableHead>
                <TableHead className="w-[100px] font-semibold text-center hidden sm:table-cell">Status</TableHead>
                <TableHead className="w-[80px] font-semibold text-center">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subcategorias.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    <div className="space-y-2">
                      <div className="text-4xl" aria-hidden="true"><Icone name="tags" className="w-6 h-6" /></div>
                      <p>Nenhuma subcategoria cadastrada</p>
                      <p className="text-sm">Crie subcategorias para detalhar suas categorias</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                subcategorias.map((subcategoria) => (
                  <TableRow key={subcategoria.id} className="hover:bg-gray-50/50">
                    {/* Nome - sempre visível e fixo na esquerda */}
                    <TableCell className="sticky left-0 bg-white z-10">
                      <div className="font-medium">{subcategoria.nome}</div>
                    </TableCell>
                    {/* Categoria - sempre visível */}
                    <TableCell>
                      <div className="text-sm">
                        {subcategoria.categoria ? (
                          <div className="flex items-center gap-2">
                            <span style={{ color: subcategoria.categoria.cor }}>●</span>
                            {subcategoria.categoria.nome}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Categoria não encontrada</span>
                        )}
                      </div>
                    </TableCell>
                    
                    {/* Status - oculto em mobile */}
                    <TableCell className="text-center hidden sm:table-cell">
                      <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                        subcategoria.ativo 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {subcategoria.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 justify-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/subcategorias/editar/${subcategoria.id}`)}
                          title="Editar subcategoria"
                          className="h-8 w-8 p-0"
                        >
                          <Icone name="pencil" className="w-4 h-4" aria-hidden="true" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleExcluir(subcategoria.id)}
                          className="text-destructive hover:text-destructive h-8 w-8 p-0"
                          title="Excluir subcategoria"
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
        </TableContainer>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Icone name="line-chart" className="w-4 h-4" aria-hidden="true" />
              Resumo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground">
                  {subcategorias.length}
                </div>
                <p className="text-sm text-muted-foreground">Total de Subcategorias</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {subcategorias.filter(s => s.ativo).length}
                </div>
                <p className="text-sm text-muted-foreground">Ativas</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {categorias.length}
                </div>
                <p className="text-sm text-muted-foreground">Categorias Disponíveis</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </LayoutPrincipal>
  )
}