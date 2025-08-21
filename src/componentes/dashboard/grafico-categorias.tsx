'use client'

import { useCategoriasData } from '@/hooks/usar-categorias-dados'
import type { Periodo } from '@/tipos/dashboard'

interface GraficoCategoriasProps {
  periodo: Periodo
}

export function GraficoCategorias({ periodo }: GraficoCategoriasProps) {
  const { data: categorias, error, isLoading } = useCategoriasData(periodo)

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="h-6 bg-gray-200 rounded mb-4 animate-pulse"></div>
        <div className="space-y-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-1/3 animate-pulse"></div>
              <div className="h-3 bg-gray-200 rounded animate-pulse"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Categorias vs Metas</h3>
        <div className="flex flex-col items-center justify-center h-32 text-gray-500">
          <p className="text-sm mb-2">Erro ao conectar com banco de dados</p>
          <p className="text-xs text-gray-400">Verifique configurações do Supabase</p>
        </div>
      </div>
    )
  }

  if (!categorias || categorias.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Categorias vs Metas</h3>
        <div className="flex items-center justify-center h-32 text-gray-500">
          Nenhuma categoria encontrada
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 animate-slide-up">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Categorias vs Metas</h3>
      
      <div className="space-y-4">
        {categorias.map((categoria) => {
          const temMeta = categoria.meta !== null && categoria.meta > 0
          const temGasto = categoria.gasto > 0
          const larguraBarra = temMeta ? Math.min(categoria.percentual, 100) : 0
          const ultrapassouMeta = categoria.percentual > 100
          
          // Cores: verde padrão ou verde escuro se ultrapassou
          const corBarra = ultrapassouMeta ? '#059669' : '#10B981' // green-600 : green-500
          
          // Mostrar categorias que têm gastos OU metas OU são relevantes
          if (!temGasto && !temMeta) return null

          return (
            <div key={categoria.nome} className="space-y-2">
              {/* Nome da categoria e valores */}
              <div className="flex justify-between items-center text-sm">
                <span className="font-medium text-gray-700">{categoria.nome}</span>
                <div className="text-right">
                  <span className="text-gray-900 font-semibold">
                    {categoria.gasto.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                  {temMeta && (
                    <span className="text-gray-500 text-xs ml-1">
                      / {categoria.meta!.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </span>
                  )}
                  {!temMeta && temGasto && (
                    <span className="text-gray-400 text-xs ml-1">sem meta</span>
                  )}
                </div>
              </div>
              
              {/* Barra de progresso */}
              <div className="relative">
                <div className="w-full bg-gray-200 rounded-full h-6 overflow-hidden">
                  {temMeta && categoria.gasto > 0 && (
                    <div 
                      className="h-full rounded-full transition-all duration-500 ease-out flex items-center justify-center text-xs font-semibold text-white"
                      style={{ 
                        width: `${larguraBarra}%`, 
                        backgroundColor: corBarra,
                        minWidth: categoria.percentual >= 15 ? 'auto' : '0%' 
                      }}
                    >
                      {/* Mostrar percentual apenas se a barra for grande o suficiente */}
                      {categoria.percentual >= 15 && (
                        <span>{categoria.percentual}%</span>
                      )}
                    </div>
                  )}
                </div>
                
                {/* Status para casos especiais */}
                {!temMeta && categoria.gasto > 0 && (
                  <div className="absolute inset-0 flex items-center px-3">
                    <div className="w-full bg-blue-100 rounded-full h-6 flex items-center px-3">
                      <span className="text-xs text-blue-700 font-medium">
                        {categoria.gasto.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} - sem meta definida
                      </span>
                    </div>
                  </div>
                )}
                
                {!temMeta && categoria.gasto === 0 && (
                  <div className="absolute inset-0 flex items-center px-3">
                    <span className="text-xs text-gray-500 font-medium">Nenhum gasto no período</span>
                  </div>
                )}
                
                {temMeta && categoria.gasto === 0 && (
                  <div className="absolute inset-0 flex items-center px-3">
                    <span className="text-xs text-gray-500 font-medium">Não iniciado</span>
                  </div>
                )}
                
                {/* Percentual fora da barra quando ela é muito pequena */}
                {temMeta && categoria.gasto > 0 && categoria.percentual < 15 && (
                  <div className="absolute inset-0 flex items-center justify-end px-3">
                    <span className="text-xs text-gray-600 font-semibold">
                      {categoria.percentual}%
                    </span>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
      
      {/* Legenda */}
      <div className="mt-6 pt-4 border-t border-gray-100">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span>Dentro da meta</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-green-600 rounded-full"></div>
              <span>Meta ultrapassada</span>
            </div>
          </div>
          <span>Ordenado por valor gasto</span>
        </div>
      </div>
    </div>
  )
}