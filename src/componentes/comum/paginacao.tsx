'use client'

import { Button } from '@/componentes/ui/button'
import { Select } from '@/componentes/ui/select'
import { Label } from '@/componentes/ui/label'
import type { RespostaPaginada, ParametrosPaginacao } from '@/tipos/filtros'

interface PaginacaoProps<T> {
  dados: RespostaPaginada<T>
  parametros: ParametrosPaginacao
  onParametrosChange: (parametros: ParametrosPaginacao) => void
  carregando?: boolean
}

export function Paginacao<T>({ 
  dados, 
  parametros, 
  onParametrosChange,
  carregando = false 
}: PaginacaoProps<T>) {
  const { total, pagina, limite, total_paginas } = dados
  
  const handlePaginaChange = (novaPagina: number) => {
    onParametrosChange({
      ...parametros,
      pagina: novaPagina
    })
  }

  const handleLimiteChange = (novoLimite: number) => {
    onParametrosChange({
      ...parametros,
      limite: novoLimite,
      pagina: 1 // Reset para primeira página
    })
  }

  const handleOrdenacaoChange = (campo: string) => {
    const [ordenacao, direcao] = campo.split('-') as [string, 'asc' | 'desc']
    onParametrosChange({
      ...parametros,
      ordenacao: ordenacao as 'data' | 'valor' | 'descricao',
      direcao: direcao,
      pagina: 1 // Reset para primeira página
    })
  }

  const inicioItem = (pagina - 1) * limite + 1
  const fimItem = Math.min(pagina * limite, total)

  const gerarPaginas = () => {
    const paginas: number[] = []
    const maxPaginas = 5 // Mostrar no máximo 5 números de página
    
    let inicio = Math.max(1, pagina - Math.floor(maxPaginas / 2))
    const fim = Math.min(total_paginas, inicio + maxPaginas - 1)
    
    // Ajustar início se estivermos no final
    if (fim - inicio < maxPaginas - 1) {
      inicio = Math.max(1, fim - maxPaginas + 1)
    }
    
    for (let i = inicio; i <= fim; i++) {
      paginas.push(i)
    }
    
    return paginas
  }

  if (total === 0) {
    return null
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3 border-t">
      {/* Informações */}
      <div className="text-sm text-muted-foreground">
        Mostrando {inicioItem} a {fimItem} de {total} {total === 1 ? 'resultado' : 'resultados'}
      </div>

      {/* Controles de Paginação */}
      <div className="flex items-center gap-4">
        {/* Itens por página */}
        <div className="flex items-center gap-2">
          <Label htmlFor="limite" className="text-sm">Por página:</Label>
          <Select
            value={limite.toString()}
            onChange={(e) => handleLimiteChange(parseInt(e.target.value))}
            disabled={carregando}
            className="w-20"
          >
            <option value="10">10</option>
            <option value="20">20</option>
            <option value="50">50</option>
            <option value="100">100</option>
          </Select>
        </div>

        {/* Ordenação */}
        <div className="flex items-center gap-2">
          <Label htmlFor="ordenacao" className="text-sm">Ordenar:</Label>
          <Select
            value={`${parametros.ordenacao || 'data'}-${parametros.direcao || 'desc'}`}
            onChange={(e) => handleOrdenacaoChange(e.target.value)}
            disabled={carregando}
            className="w-40"
          >
            <option value="data-desc">Data (mais recente)</option>
            <option value="data-asc">Data (mais antiga)</option>
            <option value="valor-desc">Valor (maior)</option>
            <option value="valor-asc">Valor (menor)</option>
            <option value="descricao-asc">Descrição (A-Z)</option>
            <option value="descricao-desc">Descrição (Z-A)</option>
          </Select>
        </div>

        {/* Navegação de páginas */}
        {total_paginas > 1 && (
          <div className="flex items-center gap-1">
            {/* Primeira página */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePaginaChange(1)}
              disabled={pagina === 1 || carregando}
            >
              ««
            </Button>

            {/* Página anterior */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePaginaChange(pagina - 1)}
              disabled={pagina === 1 || carregando}
            >
              ‹
            </Button>

            {/* Números das páginas */}
            {gerarPaginas().map((numeroPagina) => (
              <Button
                key={numeroPagina}
                variant={numeroPagina === pagina ? "default" : "outline"}
                size="sm"
                onClick={() => handlePaginaChange(numeroPagina)}
                disabled={carregando}
                className="w-10"
              >
                {numeroPagina}
              </Button>
            ))}

            {/* Próxima página */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePaginaChange(pagina + 1)}
              disabled={pagina === total_paginas || carregando}
            >
              ›
            </Button>

            {/* Última página */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePaginaChange(total_paginas)}
              disabled={pagina === total_paginas || carregando}
            >
              »»
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}