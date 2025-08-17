'use client'

import { AnexosService } from '@/servicos/supabase/anexos'

interface AnexoTransacaoProps {
  anexoUrl: string | null
  tamanho?: 'sm' | 'md'
}

export function AnexoTransacao({ anexoUrl, tamanho = 'sm' }: AnexoTransacaoProps) {
  if (!anexoUrl) return null

  const isPdf = anexoUrl.toLowerCase().includes('.pdf')
  const fileName = AnexosService.extrairNomeArquivo(anexoUrl) || 'anexo'
  
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    window.open(anexoUrl, '_blank')
  }

  if (tamanho === 'sm') {
    // Versão compacta para lista
    return (
      <button
        onClick={handleClick}
        className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 px-2 py-1 rounded transition-colors"
        title={`Ver anexo: ${fileName}`}
      >
        <span className="text-sm">
          {isPdf ? '📄' : '🖼️'}
        </span>
        <span>Anexo</span>
      </button>
    )
  }

  // Versão expandida
  return (
    <div className="border rounded-lg p-3 bg-gray-50">
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0">
          <div className={`w-12 h-12 rounded flex items-center justify-center ${
            isPdf ? 'bg-red-100' : 'bg-blue-100'
          }`}>
            <span className="text-xl">
              {isPdf ? '📄' : '🖼️'}
            </span>
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">
            {fileName}
          </p>
          <p className="text-xs text-muted-foreground">
            {isPdf ? 'Documento PDF' : 'Imagem'}
          </p>
        </div>
        
        <button
          onClick={handleClick}
          className="flex-shrink-0 text-xs bg-blue-600 text-white hover:bg-blue-700 px-3 py-1 rounded transition-colors"
        >
          👁️ Ver
        </button>
      </div>
    </div>
  )
}