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

  return (
    <div className="bg-gray-800 rounded-lg p-6 flex gap-6">
      {/* Grid de Meses - 2 linhas x 6 colunas */}
      <div className="flex-1">
        <div className="grid grid-cols-6 gap-3 mb-3">
          {meses.slice(0, 6).map((mes) => (
            <button
              key={mes.numero}
              onClick={() => handleClickMes(mes.numero)}
              disabled={!mesTemDados(mes.numero, anoAtivo)}
              className={cn(
                "px-3 py-2 text-sm font-normal rounded-md transition-all duration-150",
                obterEstiloMes(mes.numero)
              )}
            >
              {mes.nome}
            </button>
          ))}
        </div>
        
        <div className="grid grid-cols-6 gap-3">
          {meses.slice(6, 12).map((mes) => (
            <button
              key={mes.numero}
              onClick={() => handleClickMes(mes.numero)}
              disabled={!mesTemDados(mes.numero, anoAtivo)}
              className={cn(
                "px-3 py-2 text-sm font-normal rounded-md transition-all duration-150",
                obterEstiloMes(mes.numero)
              )}
            >
              {mes.nome}
            </button>
          ))}
        </div>
      </div>

      {/* Anos - lateral direita */}
      <div className="flex flex-col gap-3 justify-center">
        {anosDisponiveis.map((ano) => (
          <button
            key={ano}
            onClick={() => alterarAno(ano)}
            className={cn(
              "px-4 py-2 text-sm font-normal rounded-md transition-all duration-150 min-w-[60px]",
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