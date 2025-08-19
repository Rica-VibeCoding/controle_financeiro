'use client'

import { cn } from '@/utilitarios/cn'
import { usarFiltroTemporal } from '@/hooks/usar-filtro-temporal'

export function FiltroTemporal() {
  const {
    mesAtivo,
    anoAtivo,
    anosDisponiveis,
    mesesComDados,
    alterarMes,
    alterarAno,
    mesTemDados,
    obterNomeMes
  } = usarFiltroTemporal()

  const meses = [
    { numero: 1, nome: 'Jan' },
    { numero: 2, nome: 'Fev' },
    { numero: 3, nome: 'Mar' },
    { numero: 4, nome: 'Abr' },
    { numero: 5, nome: 'Mai' },
    { numero: 6, nome: 'Jun' },
    { numero: 7, nome: 'Jul' },
    { numero: 8, nome: 'Ago' },
    { numero: 9, nome: 'Set' },
    { numero: 10, nome: 'Out' },
    { numero: 11, nome: 'Nov' },
    { numero: 12, nome: 'Dez' }
  ]

  const obterEstiloMes = (numeroMes: number) => {
    const temDados = mesTemDados(numeroMes, anoAtivo)
    const estaAtivo = mesAtivo === numeroMes
    
    if (estaAtivo) {
      return 'bg-orange-500 text-white font-medium'
    }
    
    if (!temDados) {
      return 'bg-gray-700 text-gray-500 cursor-not-allowed opacity-50'
    }
    
    return 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white cursor-pointer'
  }

  const obterEstiloAno = (ano: number) => {
    const estaAtivo = anoAtivo === ano
    
    if (estaAtivo) {
      return 'bg-orange-500 text-white font-medium'
    }
    
    return 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white cursor-pointer'
  }

  const handleClickMes = (numeroMes: number) => {
    if (mesTemDados(numeroMes, anoAtivo)) {
      alterarMes(numeroMes)
    }
  }

  const calcularLarguraFiltro = () => {
    const larguraBase = 300 // largura dos meses
    const larguraAno = 60 // largura de cada ano
    const colunas = Math.ceil(anosDisponiveis.length / 2) // 2 linhas, expandindo em colunas
    const larguraAnos = colunas * larguraAno + (colunas - 1) * 8 // incluindo gaps
    return larguraBase + larguraAnos + 16 + 4 // incluindo divisor e padding
  }

  return (
    <div 
      className="bg-gray-800 rounded-lg p-4 flex gap-4 h-[120px] flex-shrink-0"
      style={{ width: `${calcularLarguraFiltro()}px` }}
    >
      {/* Grid de Meses - 2 linhas x 6 colunas */}
      <div className="w-[300px] flex flex-col justify-center">
        <div className="grid grid-cols-6 gap-2 mb-2">
          {meses.slice(0, 6).map((mes) => (
            <button
              key={mes.numero}
              onClick={() => handleClickMes(mes.numero)}
              disabled={!mesTemDados(mes.numero, anoAtivo)}
              className={cn(
                "px-2 py-1.5 text-xs font-normal rounded transition-all duration-200 transform hover:scale-105",
                obterEstiloMes(mes.numero)
              )}
            >
              {mes.nome}
            </button>
          ))}
        </div>
        
        <div className="grid grid-cols-6 gap-2">
          {meses.slice(6, 12).map((mes) => (
            <button
              key={mes.numero}
              onClick={() => handleClickMes(mes.numero)}
              disabled={!mesTemDados(mes.numero, anoAtivo)}
              className={cn(
                "px-2 py-1.5 text-xs font-normal rounded transition-all duration-200 transform hover:scale-105",
                obterEstiloMes(mes.numero)
              )}
            >
              {mes.nome}
            </button>
          ))}
        </div>
      </div>

      {/* Linha divisória vertical */}
      <div className="w-px bg-gray-600 self-stretch"></div>

      {/* Anos - grid 2 linhas, expandindo lateralmente */}
      <div 
        className="grid grid-rows-2 gap-2 justify-center content-center"
        style={{ 
          gridTemplateColumns: `repeat(${Math.ceil(anosDisponiveis.length / 2)}, 60px)`,
          gap: '8px'
        }}
      >
        {anosDisponiveis.map((ano) => (
          <button
            key={ano}
            onClick={() => alterarAno(ano)}
            className={cn(
              "px-3 py-1.5 text-xs font-normal rounded transition-all duration-200 transform hover:scale-105 w-[60px]",
              obterEstiloAno(ano)
            )}
          >
            {ano}
          </button>
        ))}
      </div>
    </div>
  )
}