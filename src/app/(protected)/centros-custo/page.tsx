'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import NextDynamic from 'next/dynamic'
import { Button } from '@/componentes/ui/button'
import { Icone } from '@/componentes/ui/icone'
import { Card, CardContent, CardHeader, CardTitle } from '@/componentes/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/componentes/ui/table'
import { TableContainer } from '@/componentes/ui/table-container'
import { obterCentrosCusto, excluirCentroCusto } from '@/servicos/supabase/centros-custo'
import { useAuth } from '@/contextos/auth-contexto'
import { useModais } from '@/contextos/modais-contexto'
import type { CentroCusto } from '@/tipos/database'

// Lazy load do modal - só carrega quando necessário
const ModalCentroCusto = NextDynamic(() => import('@/componentes/modais/modal-centro-custo').then(mod => ({ default: mod.ModalCentroCusto })), {
  ssr: false
})

export default function CentrosCustoPage() {
  const { workspace } = useAuth()
  const { modalCentroCusto, centroCusto: modalCentroCustoActions } = useModais()
  const [centrosCusto, setCentrosCusto] = useState<CentroCusto[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  // Função para recarregar centros de custo
  const recarregarCentrosCusto = async () => {
    if (!workspace) return
    
    try {
      setCarregando(true)
      setErro(null)
      const dados = await obterCentrosCusto(true, workspace.id) // incluir inativos
      setCentrosCusto(dados)
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Erro ao carregar centros de custo')
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    recarregarCentrosCusto()
  }, [workspace])

  const handleExcluir = async (id: string) => {
    if (!workspace) return
    
    if (confirm('Tem certeza que deseja excluir permanentemente este centro de custo?')) {
      try {
        await excluirCentroCusto(id, workspace.id)
        setCentrosCusto(prev => prev.filter(centro => centro.id !== id))
      } catch (error: unknown) {
        alert('Erro ao excluir centro de custo')
      }
    }
  }

  if (carregando) {
    return (
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="text-center py-8 text-muted-foreground">
          Carregando centros de custo...
        </div>
      </div>
    )
  }

  return (
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Centros de Custo</h1>
          </div>
          
          <Button onClick={() => modalCentroCustoActions.abrir()}>
            <Icone name="plus-circle" className="w-4 h-4 mr-1" aria-hidden="true" />
            Novo Centro de Custo
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
                <TableHead className="w-[50px] font-semibold text-center sticky left-0 bg-gray-50/50 z-20">Cor</TableHead>
                <TableHead className="w-[140px] font-semibold sticky left-[50px] bg-gray-50/50 z-10">Nome</TableHead>
                <TableHead className="w-[200px] font-semibold">Descrição</TableHead>
                <TableHead className="w-[80px] font-semibold text-center hidden sm:table-cell">Status</TableHead>
                <TableHead className="w-[80px] font-semibold text-center">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {centrosCusto.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    <div className="space-y-2">
                      <div className="text-4xl" aria-hidden="true"><Icone name="folder" className="w-6 h-6" /></div>
                      <p>Nenhum centro de custo cadastrado</p>
                      <p className="text-sm">Crie centros para organizar suas transações por projeto ou área</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                centrosCusto.map((centro) => (
                  <TableRow key={centro.id} className="hover:bg-gray-50/50">
                    <TableCell className="text-center sticky left-0 bg-white z-10">
                      <div 
                        className="w-6 h-6 rounded-full mx-auto border border-gray-300" 
                        style={{ backgroundColor: centro.cor || '#3B82F6' }}
                        title={centro.cor || '#3B82F6'}
                      />
                    </TableCell>
                    <TableCell className="sticky left-[50px] bg-white z-10">
                      <div className="font-medium">{centro.nome}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-muted-foreground">
                        {centro.descricao || 'Sem descrição'}
                      </div>
                    </TableCell>
                    <TableCell className="text-center hidden sm:table-cell">
                      <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                        centro.ativo 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {centro.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 justify-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => modalCentroCustoActions.abrir(centro.id)}
                          title="Editar centro de custo"
                          className="h-8 w-8 p-0"
                        >
                          <Icone name="pencil" className="w-4 h-4" aria-hidden="true" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleExcluir(centro.id)}
                          className="text-destructive hover:text-destructive h-8 w-8 p-0"
                          title="Excluir centro de custo"
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
                  {centrosCusto.length}
                </div>
                <p className="text-sm text-muted-foreground">Total de Centros</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {centrosCusto.filter(c => c.ativo).length}
                </div>
                <p className="text-sm text-muted-foreground">Ativos</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {centrosCusto.filter(c => c.descricao).length}
                </div>
                <p className="text-sm text-muted-foreground">Com Descrição</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Icone name="info" className="w-4 h-4" aria-hidden="true" />
              Exemplos de Uso
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground">
              <div>
                <p className="font-medium text-foreground mb-2">Por Projeto:</p>
                <ul className="space-y-1">
                  <li>• Reforma da Casa</li>
                  <li>• Viagem de Férias</li>
                  <li>• Curso de Inglês</li>
                </ul>
              </div>
              <div>
                <p className="font-medium text-foreground mb-2">Por Área:</p>
                <ul className="space-y-1">
                  <li>• Pessoal</li>
                  <li>• Trabalho</li>
                  <li>• Família</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Modal de Centro de Custo */}
        <ModalCentroCusto
          isOpen={modalCentroCusto.isOpen}
          onClose={modalCentroCustoActions.fechar}
          onSuccess={recarregarCentrosCusto}
          centroCustoId={modalCentroCusto.entidadeId}
        />
      </div>
  )
}