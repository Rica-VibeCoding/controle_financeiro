'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { LayoutPrincipal } from '@/componentes/layout/layout-principal'
import { Button } from '@/componentes/ui/button'
import { Icone } from '@/componentes/ui/icone'
import { Card, CardContent, CardHeader, CardTitle } from '@/componentes/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/componentes/ui/table'
import { obterFormasPagamento, excluirFormaPagamento } from '@/servicos/supabase/formas-pagamento'
import type { FormaPagamento } from '@/tipos/database'

export default function FormasPagamentoPage() {
  const router = useRouter()
  const [formasPagamento, setFormasPagamento] = useState<FormaPagamento[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    async function carregarDados() {
      try {
        setCarregando(true)
        setErro(null)
        
        const dados = await obterFormasPagamento(true) // incluir inativas
        setFormasPagamento(dados)
      } catch (error) {
        setErro(error instanceof Error ? error.message : 'Erro ao carregar formas de pagamento')
      } finally {
        setCarregando(false)
      }
    }

    carregarDados()
  }, [])

  const handleExcluir = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir permanentemente esta forma de pagamento?')) {
      try {
        await excluirFormaPagamento(id)
        setFormasPagamento(prev => prev.filter(forma => forma.id !== id))
      } catch (error) {
        alert('Erro ao excluir forma de pagamento')
      }
    }
  }

  const getTipoLabel = (tipo: string) => {
    switch (tipo) {
      case 'vista': return 'À Vista'
      case 'credito': return 'Crédito'
      case 'debito': return 'Débito'
      default: return tipo
    }
  }

  if (carregando) {
    return (
      <LayoutPrincipal>
        <div className="max-w-full mx-auto px-4 space-y-6">
          <div className="text-center py-8 text-muted-foreground">
            Carregando formas de pagamento...
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
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Formas de Pagamento</h1>
          </div>
          
          <Button onClick={() => router.push('/formas-pagamento/nova')}>
            <Icone name="plus-circle" className="w-4 h-4 mr-1" aria-hidden="true" />
            Nova Forma de Pagamento
          </Button>
        </div>

        {erro && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <h4 className="font-medium text-red-800 mb-2">❌ Erro</h4>
            <p className="text-sm text-red-700">{erro}</p>
          </div>
        )}

        <div className="border rounded-lg overflow-x-auto bg-white shadow-sm">
          <Table className="min-w-full">
            <TableHeader>
              <TableRow className="border-b bg-gray-50/50">
                <TableHead className="min-w-[200px] font-semibold">Nome</TableHead>
                <TableHead className="w-[150px] font-semibold">Tipo</TableHead>
                <TableHead className="w-[150px] font-semibold text-center">Parcelamento</TableHead>
                <TableHead className="w-[120px] font-semibold text-center">Status</TableHead>
                <TableHead className="w-[90px] font-semibold text-center">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {formasPagamento.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    <div className="space-y-2">
                      <div className="text-4xl" aria-hidden="true"><Icone name="credit-card" className="w-6 h-6" /></div>
                      <p>Nenhuma forma de pagamento cadastrada</p>
                      <p className="text-sm">Crie formas de pagamento para suas transações</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                formasPagamento.map((forma) => (
                  <TableRow key={forma.id} className="hover:bg-gray-50/50">
                    <TableCell>
                      <div className="font-medium">{forma.nome}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {getTipoLabel(forma.tipo)}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                        forma.permite_parcelamento 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {forma.permite_parcelamento ? 'Permite' : 'Não permite'}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                        forma.ativo 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {forma.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 justify-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/formas-pagamento/editar/${forma.id}`)}
                          title="Editar forma de pagamento"
                          className="h-8 w-8 p-0"
                        >
                          <Icone name="pencil" className="w-4 h-4" aria-hidden="true" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleExcluir(forma.id)}
                          className="text-destructive hover:text-destructive h-8 w-8 p-0"
                          title="Excluir forma de pagamento"
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
                  {formasPagamento.length}
                </div>
                <p className="text-sm text-muted-foreground">Total</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {formasPagamento.filter(f => f.ativo).length}
                </div>
                <p className="text-sm text-muted-foreground">Ativas</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {formasPagamento.filter(f => f.permite_parcelamento).length}
                </div>
                <p className="text-sm text-muted-foreground">Permitem Parcelamento</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {formasPagamento.filter(f => f.tipo === 'credito').length}
                </div>
                <p className="text-sm text-muted-foreground">Crédito</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </LayoutPrincipal>
  )
}