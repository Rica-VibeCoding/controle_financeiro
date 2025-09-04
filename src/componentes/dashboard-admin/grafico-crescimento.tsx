'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { DadosCrescimento } from '@/tipos/dashboard-admin';

interface GraficoCrescimentoProps {
  dados: DadosCrescimento[];
  loading?: boolean;
}

/**
 * Componente de gráfico para mostrar crescimento temporal
 * Exibe linhas para usuários, workspaces e volume
 */
export function GraficoCrescimento({ dados, loading = false }: GraficoCrescimentoProps) {
  if (loading) {
    return (
      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm"> {/* ← Reduzido padding */}
        <div className="animate-pulse">
          <div className="h-5 bg-gray-200 rounded w-1/3 mb-3"></div> {/* ← Reduzido altura */}
          <div className="h-48 bg-gray-100 rounded"></div> {/* ← Altura reduzida para 200px */}
        </div>
      </div>
    );
  }

  if (!dados || dados.length === 0) {
    return (
      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm"> {/* ← Reduzido padding */}
        <h3 className="text-base font-semibold text-gray-900 mb-3">📈 Crescimento do Sistema</h3> {/* ← Reduzido tamanho */}
        <div className="h-48 flex items-center justify-center text-gray-500"> {/* ← Altura reduzida */}
          <div className="text-center">
            <p className="text-base mb-2">📊</p>
            <p className="text-sm">Nenhum dado disponível</p>
          </div>
        </div>
      </div>
    );
  }

  // Formatar dados para o gráfico
  const dadosFormatados = dados.map(item => ({
    mes: item.mesNome,
    Usuários: item.usuarios,
    Workspaces: item.workspaces,
    'Volume (R$ mil)': Math.round(item.volume / 1000) // Converter para milhares
  }));

  // Formatador customizado para tooltip
  const formatarTooltip = (value: number, name: string) => {
    if (name === 'Volume (R$ mil)') {
      return [`R$ ${(value * 1000).toLocaleString('pt-BR')}`, 'Volume Total'];
    }
    return [value.toLocaleString('pt-BR'), name];
  };

  return (
    <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm"> {/* ← Reduzido padding */}
      {/* Header COMPACTO */}
      <div className="mb-4"> {/* ← Reduzido margin */}
        <h3 className="text-base font-semibold text-gray-900">📈 Crescimento</h3> {/* ← Título menor */}
        <p className="text-xs text-gray-600 mt-1">6 meses • Usuários, workspaces, volume</p> {/* ← Texto menor */}
      </div>

      {/* Gráfico REDUZIDO */}
      <div className="h-48"> {/* ← ALTURA REDUZIDA PARA 200px */}
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={dadosFormatados}
            margin={{
              top: 5,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="mes" 
              tick={{ fontSize: 12 }}
              stroke="#6b7280"
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              stroke="#6b7280"
            />
            <Tooltip 
              formatter={formatarTooltip}
              labelStyle={{ color: '#374151' }}
              contentStyle={{
                backgroundColor: '#ffffff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px'
              }}
            />
            <Legend />
            
            {/* Linhas do gráfico */}
            <Line 
              type="monotone" 
              dataKey="Usuários" 
              stroke="#3b82f6" 
              strokeWidth={3}
              dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6 }}
            />
            <Line 
              type="monotone" 
              dataKey="Workspaces" 
              stroke="#059669" 
              strokeWidth={3}
              dot={{ fill: '#059669', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6 }}
            />
            <Line 
              type="monotone" 
              dataKey="Volume (R$ mil)" 
              stroke="#7c3aed" 
              strokeWidth={3}
              dot={{ fill: '#7c3aed', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Footer informativo */}
      <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
        <p>Dados atualizados automaticamente</p>
        <div className="flex space-x-4">
          <span className="flex items-center">
            <div className="w-3 h-3 bg-blue-500 rounded-full mr-1"></div>
            Usuários
          </span>
          <span className="flex items-center">
            <div className="w-3 h-3 bg-green-600 rounded-full mr-1"></div>
            Workspaces
          </span>
          <span className="flex items-center">
            <div className="w-3 h-3 bg-purple-600 rounded-full mr-1"></div>
            Volume
          </span>
        </div>
      </div>
    </div>
  );
}