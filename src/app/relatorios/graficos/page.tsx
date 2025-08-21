'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { LayoutPrincipal } from '@/componentes/layout/layout-principal'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/componentes/ui/card'
import { Button } from '@/componentes/ui/button'
import { Select } from '@/componentes/ui/select'
import { Label } from '@/componentes/ui/label'
import { usarToast } from '@/hooks/usar-toast'
import { Icone } from '@/componentes/ui/icone'

// Simulação de dados para gráficos (será substituído por dados reais)
interface DadosGrafico {
  label: string
  valor: number
  cor: string
}

interface ResumoMensal {
  mes: string
  receitas: number
  despesas: number
  saldo: number
}

export default function GraficosPage() {
  const router = useRouter()
  const { toast } = usarToast()
  
  const [carregando, setCarregando] = useState(true)
  const [periodo, setPeriodo] = useState('mes-atual')
  const [dadosCategorias, setDadosCategorias] = useState<DadosGrafico[]>([])
  const [resumoMensal, setResumoMensal] = useState<ResumoMensal[]>([])

  // Simulação de carregamento de dados
  useEffect(() => {
    const carregarDados = async () => {
      setCarregando(true)
      
      // Simula uma chamada à API
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Dados simulados - em produção seriam obtidos via API
      setDadosCategorias([
        { label: 'Alimentação', valor: 1200, cor: '#ef4444' },
        { label: 'Transporte', valor: 800, cor: '#f97316' },
        { label: 'Casa', valor: 600, cor: '#eab308' },
        { label: 'Lazer', valor: 400, cor: '#22c55e' },
        { label: 'Saúde', valor: 300, cor: '#06b6d4' },
        { label: 'Outros', valor: 200, cor: '#8b5cf6' }
      ])

      setResumoMensal([
        { mes: 'Jan/25', receitas: 5000, despesas: 3500, saldo: 1500 },
        { mes: 'Fev/25', receitas: 5200, despesas: 3800, saldo: 1400 },
        { mes: 'Mar/25', receitas: 4800, despesas: 4200, saldo: 600 },
        { mes: 'Abr/25', receitas: 5500, despesas: 3900, saldo: 1600 },
        { mes: 'Mai/25', receitas: 5000, despesas: 4100, saldo: 900 },
        { mes: 'Jun/25', receitas: 5300, despesas: 3700, saldo: 1600 }
      ])
      
      setCarregando(false)
    }

    carregarDados()
  }, [periodo])

  const totalDespesas = dadosCategorias.reduce((total, item) => total + item.valor, 0)

  return (
    <LayoutPrincipal>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => router.push('/relatorios')}
            >
              <Icone name="chevron-left" className="w-4 h-4 mr-1" aria-hidden="true" />
              Voltar
            </Button>
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
                Gráficos e Análises
              </h1>
              <p className="text-muted-foreground">
                Visualize suas finanças de forma clara e objetiva
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Label htmlFor="periodo" className="text-sm">Período:</Label>
            <Select
              value={periodo}
              onChange={(e) => setPeriodo(e.target.value)}
              className="w-40"
            >
              <option value="mes-atual">Mês Atual</option>
              <option value="ultimos-3-meses">Últimos 3 Meses</option>
              <option value="ultimos-6-meses">Últimos 6 Meses</option>
              <option value="ano-atual">Ano Atual</option>
            </Select>
          </div>
        </div>

        {carregando ? (
          <Card>
            <CardContent className="p-6">
              <div className="text-center text-muted-foreground">
                Carregando gráficos...
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Gráfico de Pizza - Gastos por Categoria */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icone name="list" className="w-4 h-4" aria-hidden="true" />
                  Gastos por Categoria
                </CardTitle>
                <CardDescription>
                  Distribuição dos seus gastos nas principais categorias
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Gráfico Simulado com CSS */}
                  <div className="space-y-4">
                    <h3 className="font-medium">Representação Visual</h3>
                    <div className="space-y-3">
                      {dadosCategorias.map((item, index) => {
                        const percentual = ((item.valor / totalDespesas) * 100).toFixed(1)
                        return (
                          <div key={item.label} className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="flex items-center gap-2">
                                <span 
                                  className="w-4 h-4 rounded"
                                  style={{ backgroundColor: item.cor }}
                                />
                                {item.label}
                              </span>
                              <span className="font-medium">{percentual}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="h-2 rounded-full"
                                style={{ 
                                  backgroundColor: item.cor,
                                  width: `${percentual}%`
                                }}
                              />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Tabela de Valores */}
                  <div className="space-y-4">
                    <h3 className="font-medium">Valores Detalhados</h3>
                    <div className="space-y-2">
                      {dadosCategorias.map((item) => (
                        <div key={item.label} className="flex justify-between items-center p-3 border rounded-lg">
                          <span className="flex items-center gap-2">
                            <span 
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: item.cor }}
                            />
                            {item.label}
                          </span>
                          <span className="font-medium">
                            {item.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </div>
                      ))}
                      <div className="flex justify-between items-center p-3 border-t-2 border-gray-300 font-bold">
                        <span>Total</span>
                        <span>
                          {totalDespesas.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Gráfico de Barras - Evolução Mensal */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icone name="line-chart" className="w-4 h-4" aria-hidden="true" />
                  Evolução Mensal
                </CardTitle>
                <CardDescription>
                  Comparativo entre receitas, despesas e saldo ao longo dos meses
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Gráfico de Barras Simulado */}
                  <div className="space-y-4">
                    {resumoMensal.map((mes) => {
                      const maxValor = Math.max(mes.receitas, mes.despesas)
                      return (
                        <div key={mes.mes} className="space-y-2">
                          <div className="flex justify-between text-sm font-medium opacity-90">
                            <span>{mes.mes}</span>
                            <span className={(mes.saldo >= 0 ? 'text-green-600' : 'text-red-600') + ' opacity-90'}>
                              Saldo: {mes.saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            {/* Receitas */}
                            <div className="space-y-1">
                              <div className="text-xs text-green-600 opacity-90">
                                Receitas: {mes.receitas.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </div>
                              <div className="w-full bg-gray-200 rounded h-4">
                                <div 
                                  className="h-4 bg-green-500 rounded"
                                  style={{ width: `${(mes.receitas / maxValor) * 100}%` }}
                                />
                              </div>
                            </div>
                            {/* Despesas */}
                            <div className="space-y-1">
                              <div className="text-xs text-red-600 opacity-90">
                                Despesas: {mes.despesas.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </div>
                              <div className="w-full bg-gray-200 rounded h-4">
                                <div 
                                  className="h-4 bg-red-500 rounded"
                                  style={{ width: `${(mes.despesas / maxValor) * 100}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {/* Resumo Geral */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                    <div className="text-center">
                      <div className="text-sm text-muted-foreground">Média de Receitas</div>
                      <div className="text-lg font-bold text-green-600 opacity-90">
                        {(resumoMensal.reduce((acc, m) => acc + m.receitas, 0) / resumoMensal.length).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm text-muted-foreground">Média de Despesas</div>
                      <div className="text-lg font-bold text-red-600 opacity-90">
                        {(resumoMensal.reduce((acc, m) => acc + m.despesas, 0) / resumoMensal.length).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm text-muted-foreground">Saldo Médio</div>
                      <div className="text-lg font-bold text-blue-600 opacity-90">
                        {(resumoMensal.reduce((acc, m) => acc + m.saldo, 0) / resumoMensal.length).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Cards de Insights */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Icone name="info" className="w-4 h-4" aria-hidden="true" />
                    Insights Automáticos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm">
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <div className="font-medium text-blue-800">Categoria com Maior Gasto</div>
                      <div className="text-blue-600">
                        {dadosCategorias[0]?.label} representa {((dadosCategorias[0]?.valor || 0) / totalDespesas * 100).toFixed(1)}% dos seus gastos
                      </div>
                    </div>
                    <div className="p-3 bg-green-50 rounded-lg">
                      <div className="font-medium text-green-800">Tendência</div>
                      <div className="text-green-600">
                        {resumoMensal.length > 1 && resumoMensal[resumoMensal.length - 1].saldo > resumoMensal[resumoMensal.length - 2].saldo 
                          ? 'Seu saldo está melhorando!' 
                          : 'Atenção: saldo em declínio'}
                      </div>
                    </div>
                    <div className="p-3 bg-yellow-50 rounded-lg">
                      <div className="font-medium text-yellow-800">Oportunidade</div>
                      <div className="text-yellow-600">
                        Considere reduzir gastos em {dadosCategorias[0]?.label} para melhorar o saldo
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Próximos Passos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-start gap-2">
                      <span className="text-lg">1️⃣</span>
                      <div>
                        <div className="font-medium">Defina Metas</div>
                        <div className="text-muted-foreground">
                          Crie metas para suas principais categorias de gasto
                        </div>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-lg">2️⃣</span>
                      <div>
                        <div className="font-medium">Monitore Tendências</div>
                        <div className="text-muted-foreground">
                          Acompanhe os gráficos mensalmente para identificar padrões
                        </div>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-lg">3️⃣</span>
                      <div>
                        <div className="font-medium">Otimize Gastos</div>
                        <div className="text-muted-foreground">
                          Foque nas categorias com maior impacto no orçamento
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}

        {/* Nota sobre dados simulados */}
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground text-center">
              <span className="font-medium">Nota:</span> Os gráficos mostram dados simulados para demonstração. 
              Em produção, eles refletirão suas transações reais do banco de dados.
            </div>
          </CardContent>
        </Card>
      </div>
    </LayoutPrincipal>
  )
}