'use client'

import { useEffect, useState } from 'react'
import { BarraDupla } from './barra-dupla'
import { DashboardGraficosService, DadoCartao } from '@/servicos/supabase/dashboard-graficos'

interface GraficoCartoesProps {
  periodo: {
    mes: number
    ano: number
  }
}

export function GraficoCartoes({ periodo }: GraficoCartoesProps) {
  const [dados, setDados] = useState<DadoCartao[]>([])
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
        const dadosCartoes = await DashboardGraficosService.obterDadosGraficoCartoes(
          periodo.mes, 
          periodo.ano
        )
        setDados(dadosCartoes)
      } catch (error) {
        console.error('Erro ao carregar dados de cartões:', error)
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
        <h3 className="text-lg font-semibold text-gray-900 mb-4">💳 Gastos por Cartão</h3>
        <div className="space-y-3">
          {[1, 2].map((i) => (
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
        <h3 className="text-lg font-semibold text-gray-900 mb-4">💳 Gastos por Cartão</h3>
        <div className="text-center text-gray-500">
          <div className="text-4xl mb-2">💳</div>
          <p className="text-sm">Nenhum cartão configurado</p>
          <p className="text-xs">Cadastre cartões de crédito</p>
        </div>
      </div>
    )
  }

  const valorMaximo = Math.max(...dados.map(d => Math.max(d.limite, d.utilizacao)))

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 h-[300px]">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">💳 Gastos por Cartão</h3>
      
      <div className="space-y-3 max-h-[240px] overflow-y-auto">
        {dados.map((cartao) => (
          <BarraDupla
            key={cartao.conta_id}
            label={cartao.conta_nome}
            valor1={cartao.limite}
            valor2={cartao.utilizacao}
            maxValue={valorMaximo}
            cor1="bg-blue-500"
            cor2="bg-red-500"
            status={cartao.status}
            formatarValor={formatarValor}
          />
        ))}
      </div>
    </div>
  )
}