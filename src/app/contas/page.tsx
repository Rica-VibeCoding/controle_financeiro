'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { LayoutPrincipal } from '@/componentes/layout/layout-principal'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/componentes/ui/card'
import { Button } from '@/componentes/ui/button'
import { obterContasComSaldo } from '@/servicos/supabase/contas'
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
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
              Contas
            </h1>
            <p className="text-muted-foreground">
              Gerencie suas contas bancárias, cartões e dinheiro
            </p>
          </div>
          
          <Button onClick={() => router.push('/contas/nova')}>
            + Nova Conta
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {contas.map((conta) => (
              <Card key={conta.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{conta.nome}</CardTitle>
                    <span className="text-2xl">
                      {conta.tipo === 'conta_corrente' ? '🏦' : 
                       conta.tipo === 'poupanca' ? '🏛️' :
                       conta.tipo === 'cartao_credito' ? '💳' : '💰'}
                    </span>
                  </div>
                  <CardDescription>
                    {conta.tipo.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    {conta.banco && ` • ${conta.banco}`}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${conta.saldo >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {conta.saldo_formatado}
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => router.push(`/contas/editar/${conta.id}`)}
                    >
                      Editar
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1">
                      Extrato
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}

            {contas.length === 0 && (
              <div className="col-span-full">
                <Card>
                  <CardContent className="p-6 text-center">
                    <div className="text-muted-foreground space-y-2">
                      <div className="text-4xl">🏦</div>
                      <p>Nenhuma conta cadastrada</p>
                      <p className="text-sm">Adicione sua primeira conta para começar</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Resumo das Contas</CardTitle>
            <CardDescription>
              Visão geral do patrimônio distribuído
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {contas
                    .reduce((total, conta) => total + (conta.saldo > 0 ? conta.saldo : 0), 0)
                    .toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </div>
                <p className="text-sm text-muted-foreground">Total Positivo</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {contas
                    .reduce((total, conta) => total + (conta.saldo < 0 ? Math.abs(conta.saldo) : 0), 0)
                    .toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </div>
                <p className="text-sm text-muted-foreground">Total Negativo</p>
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