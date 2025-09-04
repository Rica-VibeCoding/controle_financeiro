'use client'

import { Button } from '@/componentes/ui/button'
import { Select } from '@/componentes/ui/select'
import { Icone } from '@/componentes/ui/icone'
import type { ParametrosPaginacao } from '@/tipos/filtros'

interface PaginacaoTransacoesProps {
  parametros: ParametrosPaginacao
  total: number
  onChange: (novosParametros: ParametrosPaginacao) => void
}

export function PaginacaoTransacoes({
  parametros,
  total,
  onChange
}: PaginacaoTransacoesProps) {
  const { pagina, limite } = parametros
  const totalPaginas = Math.ceil(total / limite)
  const inicioItem = (pagina - 1) * limite + 1
  const fimItem = Math.min(pagina * limite, total)

  // Não mostrar paginação se houver poucos itens
  if (total <= 20) {
    return null
  }

  const irParaPagina = (novaPagina: number) => {
    if (novaPagina >= 1 && novaPagina <= totalPaginas) {
      onChange({ ...parametros, pagina: novaPagina })
    }
  }

  const alterarLimite = (novoLimite: number) => {
    const novasPaginas = Math.ceil(total / novoLimite)
    const novaPagina = Math.min(pagina, novasPaginas)
    onChange({ ...parametros, limite: novoLimite, pagina: novaPagina })
  }

  // Gerar números das páginas para mostrar
  const gerarNumerosPaginas = () => {
    const numeros = []
    const maxNumeros = 5
    
    if (totalPaginas <= maxNumeros) {
      for (let i = 1; i <= totalPaginas; i++) {
        numeros.push(i)
      }
    } else {
      // Lógica para mostrar páginas em torno da atual
      let inicio = Math.max(1, pagina - 2)
      let fim = Math.min(totalPaginas, pagina + 2)
      
      // Ajustar se estiver no início ou fim
      if (pagina <= 3) {
        fim = Math.min(5, totalPaginas)
      }
      if (pagina >= totalPaginas - 2) {
        inicio = Math.max(1, totalPaginas - 4)
      }
      
      for (let i = inicio; i <= fim; i++) {
        numeros.push(i)
      }
    }
    
    return numeros
  }

  const numerosPaginas = gerarNumerosPaginas()

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4">
      {/* Informações e seletor de itens por página */}
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <span>
          Mostrando {inicioItem}-{fimItem} de {total} transações
        </span>
        
        <div className="flex items-center gap-2">
          <span>Por página:</span>
          <Select
            value={limite.toString()}
            onChange={(e) => alterarLimite(parseInt(e.target.value))}
          >
            <option value="20">20</option>
            <option value="50">50</option>
            <option value="100">100</option>
          </Select>
        </div>
      </div>

      {/* Controles de navegação */}
      <div className="flex items-center gap-1">
        {/* Primeira página */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => irParaPagina(1)}
          disabled={pagina === 1}
          title="Primeira página"
        >
          <Icone name="chevron-left" className="w-4 h-4" />
        </Button>

        {/* Página anterior */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => irParaPagina(pagina - 1)}
          disabled={pagina === 1}
          title="Página anterior"
        >
          <Icone name="chevron-left" className="w-4 h-4" />
        </Button>

        {/* Números das páginas */}
        <div className="flex gap-1">
          {numerosPaginas.map((numeroPagina) => (
            <Button
              key={numeroPagina}
              variant={numeroPagina === pagina ? "default" : "outline"}
              size="sm"
              onClick={() => irParaPagina(numeroPagina)}
              className="min-w-[2.5rem]"
            >
              {numeroPagina}
            </Button>
          ))}
        </div>

        {/* Próxima página */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => irParaPagina(pagina + 1)}
          disabled={pagina === totalPaginas}
          title="Próxima página"
        >
          <Icone name="chevron-right" className="w-4 h-4" />
        </Button>

        {/* Última página */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => irParaPagina(totalPaginas)}
          disabled={pagina === totalPaginas}
          title="Última página"
        >
          <Icone name="chevron-right" className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}