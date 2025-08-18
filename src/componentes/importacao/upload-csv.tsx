'use client'

import { useState, useRef } from 'react'
import { Button } from '@/componentes/ui/button'
import { Input } from '@/componentes/ui/input'
import { Label } from '@/componentes/ui/label'

interface UploadCSVProps {
  onArquivoSelecionado: (arquivo: File | null) => void
  arquivo: File | null
  carregando?: boolean
}

export function UploadCSV({ 
  onArquivoSelecionado, 
  arquivo, 
  carregando = false 
}: UploadCSVProps) {
  const [arrastando, setArrastando] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleArquivoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
        alert('Por favor, selecione apenas arquivos CSV')
        return
      }
      onArquivoSelecionado(file)
    }
  }

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault()
    setArrastando(false)
    
    const file = event.dataTransfer.files[0]
    if (file) {
      if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
        alert('Por favor, selecione apenas arquivos CSV')
        return
      }
      onArquivoSelecionado(file)
    }
  }

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault()
    setArrastando(true)
  }

  const handleDragLeave = () => {
    setArrastando(false)
  }

  const handleRemoverArquivo = () => {
    onArquivoSelecionado(null)
    if (inputRef.current) {
      inputRef.current.value = ''
    }
  }

  return (
    <div className="space-y-4">
      <Label>Arquivo CSV</Label>
      
      {/* Área de Drop */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`
          border-2 border-dashed rounded-lg p-6 text-center transition-colors
          ${arrastando ? 'border-primary bg-primary/5' : 'border-gray-300'}
          ${carregando ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
        onClick={() => !carregando && inputRef.current?.click()}
      >
        <Input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv"
          onChange={handleArquivoChange}
          className="hidden"
          disabled={carregando}
        />
        
        {arquivo ? (
          <div className="space-y-2">
            <div className="text-sm font-medium text-green-600">
              ✅ {arquivo.name}
            </div>
            <div className="text-xs text-muted-foreground">
              {Math.round(arquivo.size / 1024)} KB
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                handleRemoverArquivo()
              }}
              disabled={carregando}
            >
              Remover
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">
              📁 Clique para selecionar ou arraste o arquivo CSV
            </div>
            <div className="text-xs text-muted-foreground">
              Apenas arquivos .csv são aceitos
            </div>
          </div>
        )}
      </div>
    </div>
  )
}