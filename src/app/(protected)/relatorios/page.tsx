'use client'

import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/componentes/ui/card'
import { Button } from '@/componentes/ui/button'
import { Icone } from '@/componentes/ui/icone'
import { PageGuard } from '@/componentes/ui/page-guard'

export default function RelatoriosPage() {
  const router = useRouter()
  
  return (
    <PageGuard permissaoNecessaria="relatorios">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Relatórios</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Icone name="list" className="w-4 h-4" aria-hidden="true" />
                Gastos por Categoria
              </CardTitle>
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
              <CardTitle className="text-lg flex items-center gap-2">
                <Icone name="line-chart" className="w-4 h-4" aria-hidden="true" />
                Evolução Mensal
              </CardTitle>
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
              <CardTitle className="text-lg flex items-center gap-2">
                <Icone name="wallet" className="w-4 h-4" aria-hidden="true" />
                Saldos por Conta
              </CardTitle>
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
              <CardTitle className="text-lg flex items-center gap-2">
                <Icone name="file-text" className="w-4 h-4" aria-hidden="true" />
                Resumo Mensal
              </CardTitle>
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
              <CardTitle className="text-lg flex items-center gap-2">
                <Icone name="refresh-ccw" className="w-4 h-4" aria-hidden="true" />
                Gastos Recorrentes
              </CardTitle>
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
            <CardTitle className="flex items-center gap-2">
              <Icone name="info" className="w-4 h-4" aria-hidden="true" />
              Página em Desenvolvimento
            </CardTitle>
            <CardDescription>
              Os relatórios detalhados serão implementados em breve
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p><Icone name="line-chart" className="inline w-4 h-4 mr-2" aria-hidden="true" />Gráficos interativos com dados reais</p>
              <p><Icone name="list" className="inline w-4 h-4 mr-2" aria-hidden="true" />Análises personalizáveis por período</p>
              <p><Icone name="file-text" className="inline w-4 h-4 mr-2" aria-hidden="true" />Exportação em PDF e Excel</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageGuard>
  )
}