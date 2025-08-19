'use client'

import { useEffect, useState } from 'react'
import { BarraDupla } from './barra-dupla'
import { DashboardGraficosService, DadoCategoria } from '@/servicos/supabase/dashboard-graficos'

interface GraficoCategoriasProps {
  periodo: {
    mes: number
    ano: number
  }
}

export function GraficoCategorias({ periodo }: GraficoCategoriasProps) {
  const [dados, setDados] = useState<DadoCategoria[]>([])
  const [loading, setLoading] = useState(true)

  const formatarValor = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(valor)
  }

  useEffect(() => {
    async function carregarDados() {
      setLoading(true)
      try {
        const dadosCategorias = await DashboardGraficosService.obterDadosGraficoCategorias(
          periodo.mes, 
          periodo.ano
        )
        setDados(dadosCategorias)
      } catch (error) {
        console.error('Erro ao carregar dados de categorias:', error)
        setDados([])
      } finally {
        setLoading(false)
      }
    }

    carregarDados()
  }, [periodo.mes, periodo.ano])

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 h-[300px]">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 Metas vs Gastos</h3>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-2 bg-gray-200 rounded mb-1"></div>
              <div className="h-2 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (dados.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 h-[300px] flex flex-col justify-center items-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 Metas vs Gastos</h3>
        <div className="text-center text-gray-500">
          <div className="text-4xl mb-2">📋</div>
          <p className="text-sm">Nenhuma meta configurada</p>
          <p className="text-xs">Configure suas metas em Configurações → Metas</p>
        </div>
      </div>
    )
  }

  const valorMaximo = Math.max(...dados.map(d => Math.max(d.meta, d.gasto)))

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 h-[300px]">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 Metas vs Gastos</h3>
      
      <div className="space-y-3 max-h-[240px] overflow-y-auto">
        {dados.map((categoria) => (
          <BarraDupla
            key={categoria.categoria_id}
            label={categoria.categoria_nome}
            valor1={categoria.meta}
            valor2={categoria.gasto}
            maxValue={valorMaximo}
            cor1="bg-green-500"
            cor2="bg-orange-500"
            status={categoria.status}
            formatarValor={formatarValor}
          />
        ))}
      </div>
    </div>
  )
}