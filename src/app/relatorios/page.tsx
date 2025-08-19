'use client'

import { useRouter } from 'next/navigation'
import { LayoutPrincipal } from '@/componentes/layout/layout-principal'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/componentes/ui/card'
import { Button } from '@/componentes/ui/button'

export default function RelatoriosPage() {
  const router = useRouter()
  
  return (
    <LayoutPrincipal>
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
            Relatórios
          </h1>
          <p className="text-muted-foreground">
            Análises e gráficos das suas finanças
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">📊 Gastos por Categoria</CardTitle>
              <CardDescription>
                Visualize onde seu dinheiro está sendo gasto
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">
                Ver Relatório
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">📈 Evolução Mensal</CardTitle>
              <CardDescription>
                Acompanhe a evolução das suas finanças
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => router.push('/relatorios/graficos')}
              >
                Ver Gráfico
              </Button>
            </CardContent>
          </Card>


          <Card>
            <CardHeader>
              <CardTitle className="text-lg">🏦 Saldos por Conta</CardTitle>
              <CardDescription>
                Distribuição do dinheiro entre contas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">
                Ver Distribuição
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">📅 Resumo Mensal</CardTitle>
              <CardDescription>
                Receitas vs despesas do mês
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">
                Ver Resumo
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">💸 Gastos Recorrentes</CardTitle>
              <CardDescription>
                Análise das despesas que se repetem
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">
                Ver Análise
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>🚧 Página em Desenvolvimento</CardTitle>
            <CardDescription>
              Os relatórios detalhados serão implementados em breve
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>📈 Gráficos interativos com dados reais</p>
              <p>📊 Análises personalizáveis por período</p>
              <p>📋 Exportação em PDF e Excel</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </LayoutPrincipal>
  )
}