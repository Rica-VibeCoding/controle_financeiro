'use client'

import { useEffect, useState } from 'react'
import { useTransacoesContexto } from '@/contextos/transacoes-contexto'
import { obterCategorias } from '@/servicos/supabase/categorias'
import { calcularSaldoTotal } from '@/servicos/supabase/transacoes'
import { Categoria } from '@/tipos/database'
import { LayoutPrincipal } from '@/componentes/layout/layout-principal'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/componentes/ui/card'
import { Button } from '@/componentes/ui/button'
import { LoadingText } from '@/componentes/comum/loading'

export default function Home() {
  const { transacoes } = useTransacoesContexto()
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [saldoTotal, setSaldoTotal] = useState(0)
  const [receitasDoMes, setReceitasDoMes] = useState(0)
  const [despesasDoMes, setDespesasDoMes] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function carregarDados() {
      try {
        // Buscar categorias usando serviço
        const categoriasData = await obterCategorias()
        setCategorias(categoriasData.slice(0, 5))
        
        // Calcular saldo total usando serviço
        const saldoCalculado = await calcularSaldoTotal()
        setSaldoTotal(saldoCalculado)

        // Calcular receitas e despesas do mês usando dados do Context
        const hoje = new Date()
        const inicioDoMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString().split('T')[0]
        const fimDoMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).toISOString().split('T')[0]
        
        const transacoesDoMes = transacoes.filter(t => 
          t.data >= inicioDoMes && t.data <= fimDoMes && t.status === 'pago'
        )
        
        let receitas = 0
        let despesas = 0
        
        transacoesDoMes.forEach(transacao => {
          if (transacao.tipo === 'receita') {
            receitas += transacao.valor
          } else if (transacao.tipo === 'despesa') {
            despesas += transacao.valor
          }
        })
        
        setReceitasDoMes(receitas)
        setDespesasDoMes(despesas)

      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro desconhecido')
      } finally {
        setLoading(false)
      }
    }

    carregarDados()
  }, [])

  return (
    <LayoutPrincipal>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground mb-2">
            Dashboard
          </h1>
          <p className="text-muted-foreground">
            Bem-vindo ao seu sistema de controle financeiro
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Saldo Total</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${saldoTotal >= 0 ? 'texto-receita' : 'texto-despesa'}`}>
                {saldoTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </div>
              <p className="text-xs text-muted-foreground">Saldo do mês atual</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Receitas do Mês</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold texto-receita">
                {receitasDoMes.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </div>
              <p className="text-xs text-muted-foreground">
                {new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Despesas do Mês</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold texto-despesa">
                {despesasDoMes.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </div>
              <p className="text-xs text-muted-foreground">
                {new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Status do Sistema</CardTitle>
            <CardDescription>
              Verificação da configuração e conexão
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading && <LoadingText>Conectando ao Supabase...</LoadingText>}
            
            {error && (
              <div className="text-destructive bg-destructive/10 p-3 rounded">
                ❌ Erro: {error}
              </div>
            )}
            
            {!loading && !error && (
              <div className="space-y-4">
                <div className="text-green-600">
                  <div className="font-semibold mb-2">
                    🎉 Sistema funcionando perfeitamente!
                  </div>
                  <div className="text-sm text-muted-foreground mb-2">
                    {categorias.length} categorias configuradas:
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {categorias.map((cat) => (
                      <div key={cat.id} className="flex items-center gap-2 text-sm">
                        <span style={{ color: cat.cor }}>●</span>
                        {cat.nome} ({cat.tipo})
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="pt-4 border-t">
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 text-xs text-muted-foreground">
                    <div>✅ Next.js 14 + TypeScript</div>
                    <div>✅ Tailwind CSS + shadcn/ui</div>
                    <div>✅ Layout responsivo</div>
                    <div>✅ Sistema de notificações</div>
                    <div>✅ Tratamento de erros</div>
                    <div>✅ Conexão Supabase</div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex flex-col sm:flex-row gap-4">
          <Button className="flex-1">
            Nova Transação
          </Button>
          <Button variant="outline" className="flex-1">
            Ver Relatórios
          </Button>
        </div>
      </div>
    </LayoutPrincipal>
  )
}
