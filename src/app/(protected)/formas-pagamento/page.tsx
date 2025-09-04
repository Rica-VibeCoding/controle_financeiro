'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { Button } from '@/componentes/ui/button'
import { Icone } from '@/componentes/ui/icone'
import { Card, CardContent, CardHeader, CardTitle } from '@/componentes/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/componentes/ui/table'
import { TableContainer } from '@/componentes/ui/table-container'
import { obterFormasPagamento, excluirFormaPagamento } from '@/servicos/supabase/formas-pagamento'
import { useAuth } from '@/contextos/auth-contexto'
import { useModais } from '@/contextos/modais-contexto'
import type { FormaPagamento } from '@/tipos/database'

// Lazy load do modal - só carrega quando necessário
const ModalFormaPagamento = dynamic(() => import('@/componentes/modais/modal-forma-pagamento').then(mod => ({ default: mod.ModalFormaPagamento })), {
  ssr: false
})

export default function FormasPagamentoPage() {
  const { workspace } = useAuth()
  const { modalFormaPagamento, formaPagamento: modalFormaPagamentoActions } = useModais()
  const [formasPagamento, setFormasPagamento] = useState<FormaPagamento[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  // Função para recarregar formas de pagamento
  const recarregarFormasPagamento = async () => {
    if (!workspace) return
    
    try {
      setCarregando(true)
      setErro(null)
      const dados = await obterFormasPagamento(true, workspace.id) // incluir inativas
      setFormasPagamento(dados)
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Erro ao carregar formas de pagamento')
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    recarregarFormasPagamento()
  }, [workspace])

  const handleExcluir = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir permanentemente esta forma de pagamento?')) {
      try {
        if (!workspace) return
        
        await excluirFormaPagamento(id, workspace.id)
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
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="text-center py-8 text-muted-foreground">
          Carregando formas de pagamento...
        </div>
      </div>
    )
  }

  return (
      <div className="max-w-full mx-auto px-4 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Formas de Pagamento</h1>
          </div>
          
          <Button onClick={() => modalFormaPagamentoActions.abrir()}>
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

        <TableContainer>
          <Table className="min-w-full">
            <TableHeader>
              <TableRow className="border-b bg-gray-50/50">
                <TableHead className="w-[140px] font-semibold sticky left-0 bg-gray-50/50 z-20">Nome</TableHead>
                <TableHead className="w-[100px] font-semibold">Tipo</TableHead>
                <TableHead className="w-[120px] font-semibold text-center hidden sm:table-cell">Parcelamento</TableHead>
                <TableHead className="w-[80px] font-semibold text-center hidden sm:table-cell">Status</TableHead>
                <TableHead className="w-[80px] font-semibold text-center">Ações</TableHead>
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
                    <TableCell className="sticky left-0 bg-white z-10">
                      <div className="font-medium">{forma.nome}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {getTipoLabel(forma.tipo)}
                      </div>
                    </TableCell>
                    <TableCell className="text-center hidden sm:table-cell">
                      <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                        forma.permite_parcelamento 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {forma.permite_parcelamento ? 'Permite' : 'Não permite'}
                      </span>
                    </TableCell>
                    <TableCell className="text-center hidden sm:table-cell">
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
                          onClick={() => modalFormaPagamentoActions.abrir(forma.id)}
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
        </TableContainer>

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

        {/* Modal de Forma de Pagamento */}
        <ModalFormaPagamento
          isOpen={modalFormaPagamento.isOpen}
          onClose={modalFormaPagamentoActions.fechar}
          onSuccess={recarregarFormasPagamento}
          formaPagamentoId={modalFormaPagamento.entidadeId}
        />
      </div>
  )
}