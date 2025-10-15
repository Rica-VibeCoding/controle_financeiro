'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import type { EvolucaoMensal } from '@/tipos/roi-cliente'

interface TooltipProps {
  active?: boolean
  payload?: any[]
  label?: string
}

function CustomTooltip({ active, payload, label }: TooltipProps) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
        <p className="font-medium text-gray-900 mb-2">{label}</p>
        {payload.map((entry: any, index: number) => {
          const nomeMetrica =
            entry.dataKey === 'receita' ? 'Receita' :
            entry.dataKey === 'despesa' ? 'Despesa' :
            'Lucro'

          return (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {nomeMetrica}: {entry.value.toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL'
              })}
            </p>
          )
        })}
      </div>
    )
  }
  return null
}

interface GraficoEvolucaoProps {
  dados: EvolucaoMensal[]
  clienteNome: string
  isLoading?: boolean
}

export function GraficoEvolucao({ dados, clienteNome, isLoading }: GraficoEvolucaoProps) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 h-96">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-64 mb-4"></div>
          <div className="h-80 bg-gray-100 rounded"></div>
        </div>
      </div>
    )
  }

  if (!dados || dados.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 h-96">
        <h4 className="text-base font-semibold text-gray-900 mb-4">
          Evolução Temporal - {clienteNome}
        </h4>
        <div className="flex items-center justify-center h-64 text-gray-500">
          <p>Nenhum dado de evolução disponível</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 h-96">
      <h4 className="text-base font-semibold text-gray-900 mb-4">
        Evolução Temporal - {clienteNome}
      </h4>

      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={dados} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <defs>
              <linearGradient id="gradientReceitasROI" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
              </linearGradient>
              <linearGradient id="gradientDespesasROI" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1}/>
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis
              dataKey="mes"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#64748b' }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#64748b' }}
              tickFormatter={(value) =>
                value.toLocaleString('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0
                })
              }
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: '14px' }}
              formatter={(value) => {
                if (value === 'receita') return 'Receita'
                if (value === 'despesa') return 'Despesa'
                return value
              }}
            />

            <Line
              type="monotone"
              dataKey="receita"
              stroke="#10b981"
              strokeWidth={3}
              dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: '#10b981', strokeWidth: 2 }}
              name="Receita"
            />
            <Line
              type="monotone"
              dataKey="despesa"
              stroke="#ef4444"
              strokeWidth={3}
              dot={{ fill: '#ef4444', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: '#ef4444', strokeWidth: 2 }}
              name="Despesa"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
