'use client'

import { useState } from 'react'
import { useCategoriasData } from '@/hooks/usar-categorias-dados'
import type { Periodo } from '@/tipos/dashboard'

// Constantes de configuração
const LARGURA_NOME_MIN = 96
const LARGURA_NOME_MAX = 160
const LARGURA_BARRA_THRESHOLD = 30
const CARACTERES_POR_PIXEL = 8
const PADDING_NOME = 16

interface GraficoCategoriasProps {
  periodo: Periodo
}

export function GraficoCategorias({ periodo }: GraficoCategoriasProps) {
  const { data: categorias, error, isLoading } = useCategoriasData(periodo)
  const [mostrarMetas, setMostrarMetas] = useState(false)

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

  // Filtrar apenas categorias com gasto > 0
  const categoriasComGasto = categorias.filter(categoria => categoria.gasto > 0)
  
  // Calcular maior gasto para escala absoluta (evitar -Infinity se array vazio)
  const maiorGasto = categoriasComGasto.length > 0 ? Math.max(...categoriasComGasto.map(c => c.gasto)) : 1
  
  // Calcular largura baseada no texto mais longo + gap mínimo
  const textoMaisLongo = categoriasComGasto.length > 0 ? Math.max(...categoriasComGasto.map(c => c.nome.length)) : 10
  const larguraNome = Math.max(LARGURA_NOME_MIN, Math.min(textoMaisLongo * CARACTERES_POR_PIXEL + PADDING_NOME, LARGURA_NOME_MAX))

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 animate-slide-up">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Categorias vs Metas</h3>
        
        {/* Toggle Switch para Metas */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Metas</span>
          <button
            onClick={() => setMostrarMetas(!mostrarMetas)}
            aria-label={`${mostrarMetas ? 'Ocultar' : 'Mostrar'} comparação com metas`}
            aria-pressed={mostrarMetas}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ${
              mostrarMetas ? 'bg-green-500' : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform duration-200 ${
                mostrarMetas ? 'translate-x-5' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>
      
      <div className="space-y-1.5">
        {categoriasComGasto.map((categoria) => {
          const temMeta = categoria.meta !== null && categoria.meta > 0
          const larguraBarraAbsoluta = (categoria.gasto / maiorGasto) * 100
          const ultrapassouMeta = temMeta && categoria.percentual > 100
          
          // Cor baseada no status da meta - todas as barras verde, exceto meta ultrapassada
          const corBarra = ultrapassouMeta ? '#047857' : '#10B981' // green-700 : green-500

          return (
            <div key={categoria.nome} className="flex items-center gap-1">
              {/* Nome da categoria - largura responsiva */}
              <div className="flex-shrink-0" style={{ width: `${larguraNome}px` }}>
                <span className="text-sm font-medium text-gray-700">{categoria.nome}</span>
              </div>
              
              {/* Barra de progresso - sem fundo cinza */}
              <div className="flex-1 relative h-4">
                <div 
                  className="h-full rounded transition-all duration-500 ease-out relative"
                  style={{ 
                    width: `${larguraBarraAbsoluta}%`, 
                    backgroundColor: corBarra
                  }}
                >
                  {/* Percentual dentro da barra quando ela é grande o suficiente E metas estão ativadas */}
                  {temMeta && mostrarMetas && larguraBarraAbsoluta >= LARGURA_BARRA_THRESHOLD && (
                    <div className="absolute right-2 top-0 h-full flex items-center">
                      <span className="text-xs font-semibold text-white">
                        {categoria.percentual}%
                      </span>
                    </div>
                  )}
                </div>
                
                {/* Percentual na frente da barra quando ela é pequena E metas estão ativadas */}
                {temMeta && mostrarMetas && larguraBarraAbsoluta < LARGURA_BARRA_THRESHOLD && (
                  <div className="absolute top-0 h-full flex items-center" style={{ left: `${larguraBarraAbsoluta}%` }}>
                    <span className="text-xs font-semibold text-gray-600 ml-2">
                      {categoria.percentual}%
                    </span>
                  </div>
                )}
              </div>
              
              {/* Valor - largura fixa, alinhado à direita (sem R$ e opacidade leve) */}
              <div className="w-20 -ml-1.5 flex-shrink-0 text-right opacity-90">
                <span className="text-sm font-semibold text-gray-900">
                  {categoria.gasto.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          )
        })}
      </div>
      
      {/* Legenda simplificada */}
      {mostrarMetas && (
        <div className="mt-4 pt-3 border-t border-gray-100">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Com meta</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-700 rounded-full"></div>
                <span>Meta ultrapassada</span>
              </div>
            </div>
            <span>Ordenado por valor</span>
          </div>
        </div>
      )}
    </div>
  )
}