'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { LayoutPrincipal } from '@/componentes/layout/layout-principal'
import { Card, CardContent, CardHeader, CardTitle } from '@/componentes/ui/card'
import { Button } from '@/componentes/ui/button'
import { Icone } from '@/componentes/ui/icone'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/componentes/ui/table'
import { TableContainer } from '@/componentes/ui/table-container'
import { obterContasComSaldo, excluirConta } from '@/servicos/supabase/contas'
import type { Conta } from '@/tipos/database'

type ContaComSaldo = Conta & {
  saldo: number
  saldo_formatado: string
}

export default function ContasPage() {
  const router = useRouter()
  const [contas, setContas] = useState<ContaComSaldo[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  const handleExcluir = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir permanentemente esta conta?')) {
      try {
        await excluirConta(id)
        setContas(prev => prev.filter(conta => conta.id !== id))
      } catch (error) {
        alert(error instanceof Error ? error.message : 'Erro ao excluir conta')
      }
    }
  }

  useEffect(() => {
    async function carregarContas() {
      try {
        setCarregando(true)
        setErro(null)
        const dadosContas = await obterContasComSaldo()
        setContas(dadosContas)
      } catch (error) {
        setErro(error instanceof Error ? error.message : 'Erro ao carregar contas')
      } finally {
        setCarregando(false)
      }
    }

    carregarContas()
  }, [])

  return (
    <LayoutPrincipal>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Contas</h1>
          </div>
          
          <Button onClick={() => router.push('/contas/nova')}>
            <Icone name="plus-circle" className="w-4 h-4 mr-1" aria-hidden="true" />
            Nova Conta
          </Button>
        </div>

        {carregando && (
          <Card>
            <CardContent className="p-6">
              <div className="text-center text-muted-foreground">
                Carregando contas...
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
          <TableContainer>
            <Table className="min-w-full">
              <TableHeader>
                <TableRow className="border-b bg-gray-50/50">
                  <TableHead className="w-[140px] font-semibold sticky left-0 bg-gray-50/50 z-20">Nome</TableHead>
                  <TableHead className="w-[100px] font-semibold text-right">Saldo</TableHead>
                  <TableHead className="w-[100px] font-semibold">Tipo</TableHead>
                  <TableHead className="w-[100px] font-semibold hidden sm:table-cell">Banco</TableHead>
                  <TableHead className="w-[110px] font-semibold text-right hidden md:table-cell">Limite</TableHead>
                  <TableHead className="w-[90px] font-semibold text-center hidden md:table-cell">Fechamento</TableHead>
                  <TableHead className="w-[80px] font-semibold text-center hidden sm:table-cell">Status</TableHead>
                  <TableHead className="w-[80px] font-semibold text-center">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      <div className="space-y-2">
                        <div className="text-4xl">🏦</div>
                        <p>Nenhuma conta cadastrada</p>
                        <p className="text-sm">Adicione sua primeira conta para começar</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  contas.map((conta) => (
                    <TableRow key={conta.id} className="hover:bg-gray-50/50">
                      {/* Nome - sempre visível e fixo na esquerda */}
                      <TableCell className="sticky left-0 bg-white z-10">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl" aria-hidden="true">
                            {conta.tipo === 'conta_corrente' ? (
                              <Icone name="building" className="w-5 h-5" />
                            ) : conta.tipo === 'poupanca' ? (
                              <Icone name="wallet" className="w-5 h-5" />
                            ) : conta.tipo === 'cartao_credito' ? (
                              <Icone name="credit-card" className="w-5 h-5" />
                            ) : (
                              <Icone name="folder" className="w-5 h-5" />
                            )}
                          </span>
                          <div className="font-medium">{conta.nome}</div>
                        </div>
                      </TableCell>
                      
                      {/* Saldo - prioritário */}
                      <TableCell className="text-right">
                        <span className={`font-semibold ${
                          conta.saldo >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {conta.saldo_formatado}
                        </span>
                      </TableCell>
                      
                      {/* Tipo - sempre visível */}
                      <TableCell>
                        <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                          conta.tipo === 'conta_corrente' ? 'bg-blue-100 text-blue-800' :
                          conta.tipo === 'poupanca' ? 'bg-green-100 text-green-800' :
                          conta.tipo === 'cartao_credito' ? 'bg-purple-100 text-purple-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {conta.tipo.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </span>
                      </TableCell>
                      
                      {/* Banco - oculto em mobile */}
                      <TableCell className="hidden sm:table-cell">
                        <span className="text-sm">{conta.banco || '-'}</span>
                      </TableCell>
                      
                      {/* Limite - oculto em mobile/tablet */}
                      <TableCell className="text-right hidden md:table-cell">
                        {conta.tipo === 'cartao_credito' && (conta as any).limite != null ? (
                          <span className="text-muted-foreground">
                            {(Number((conta as any).limite) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      
                      {/* Fechamento - oculto em mobile/tablet */}
                      <TableCell className="text-center hidden md:table-cell">
                        {conta.tipo === 'cartao_credito' && (conta as any).data_fechamento != null ? (
                          <span className="text-muted-foreground">
                            Dia {(conta as any).data_fechamento}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      
                      {/* Status - oculto em mobile */}
                      <TableCell className="text-center hidden sm:table-cell">
                        <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                          conta.ativo
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {conta.ativo ? 'Ativo' : 'Inativo'}
                        </span>
                      </TableCell>
                      
                      {/* Ações - sempre visível */}
                      <TableCell>
                        <div className="flex gap-1 justify-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push(`/contas/editar/${conta.id}`)}
                            title="Editar conta"
                            className="h-8 w-8 p-0"
                          >
                            <Icone name="pencil" className="w-4 h-4" aria-hidden="true" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleExcluir(conta.id)}
                            className="text-destructive hover:text-destructive h-8 w-8 p-0"
                            title="Excluir conta"
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
                  {contas.length}
                </div>
                <p className="text-sm text-muted-foreground">Total de Contas</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {contas
                    .reduce((total, conta) => total + (conta.saldo > 0 ? conta.saldo : 0), 0)
                    .toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </div>
                <p className="text-sm text-muted-foreground">Saldo Positivo</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {contas
                    .reduce((total, conta) => total + (conta.saldo < 0 ? Math.abs(conta.saldo) : 0), 0)
                    .toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </div>
                <p className="text-sm text-muted-foreground">Saldo Negativo</p>
              </div>
              <div className="text-center">
                <div className={`text-2xl font-bold ${
                  contas.reduce((total, conta) => total + conta.saldo, 0) >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {contas
                    .reduce((total, conta) => total + conta.saldo, 0)
                    .toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </div>
                <p className="text-sm text-muted-foreground">Patrimônio Líquido</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </LayoutPrincipal>
  )
}