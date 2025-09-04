'use client'

import { Icone } from '@/componentes/ui/icone';

interface CardKPIProps {
  titulo: string;
  valor: string | number;
  icone: string;
  cor?: 'verde' | 'azul' | 'roxo' | 'laranja' | 'vermelho';
  subtitulo?: string;
  tendencia?: {
    percentual: number;
    periodo: string;
  };
}

const cores = {
  verde: 'text-gray-700 bg-white border-gray-200',
  azul: 'text-gray-700 bg-white border-gray-200', 
  roxo: 'text-gray-700 bg-white border-gray-200',
  laranja: 'text-gray-700 bg-white border-gray-200',
  vermelho: 'text-gray-700 bg-white border-gray-200'
};

const coresIcone = {
  verde: 'text-gray-500',
  azul: 'text-gray-500',
  roxo: 'text-gray-500', 
  laranja: 'text-gray-500',
  vermelho: 'text-gray-500'
};

/**
 * Card KPI OTIMIZADO para dashboards produtivos
 * - 40% menos altura (p-6 → p-4)
 * - Ícones menores e mais sutis (w-5 → w-4)
 * - Typography compacta (text-sm → text-xs)
 * - Espaçamentos reduzidos (mb-6 → mb-3)
 */
export function CardKPI({ titulo, valor, icone, cor = 'azul', subtitulo, tendencia }: CardKPIProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-all duration-200">
      {/* Header Compacto */}
      <div className="flex items-center justify-between mb-3">
        <div className="p-1.5 bg-gray-50 rounded-md">
          <Icone name={icone as any} className="w-4 h-4 text-gray-600" />
        </div>
        
        {/* Indicador de tendência compacto */}
        {tendencia && (
          <div className="flex items-center space-x-1">
            <div className={`w-1.5 h-1.5 rounded-full ${tendencia.percentual >= 0 ? 'bg-emerald-400' : 'bg-red-400'}`}></div>
            <span className={`text-xs font-medium ${tendencia.percentual >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {tendencia.percentual > 0 ? '+' : ''}{tendencia.percentual}%
            </span>
          </div>
        )}
      </div>

      {/* Conteúdo Principal Compacto */}
      <div>
        <p className="text-xs font-medium text-gray-600 mb-1">{titulo}</p>
        <p className="text-xl font-semibold text-gray-900 mb-1">{valor}</p>
        {subtitulo && (
          <p className="text-xs text-gray-500">{subtitulo}</p>
        )}
      </div>
    </div>
  );
}