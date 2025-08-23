'use client'

import { useCallback, useRef, useState } from 'react'
import { Button } from '@/componentes/ui/button'
import { Card, CardContent } from '@/componentes/ui/card'
import { Upload, File, X, AlertCircle, CheckCircle2 } from 'lucide-react'

interface UploaderArquivoProps {
  onArquivoSelecionado: (arquivo: File) => void
  onArquivoRemovido: () => void
  arquivoSelecionado: File | null
  disabled?: boolean
  className?: string
}

export function UploaderArquivo({
  onArquivoSelecionado,
  onArquivoRemovido,
  arquivoSelecionado,
  disabled = false,
  className = ''
}: UploaderArquivoProps) {
  const [dragOver, setDragOver] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const validarArquivo = (arquivo: File): boolean => {
    setErro(null)

    // Validar extensão
    if (!arquivo.name.endsWith('.zip')) {
      setErro('Apenas arquivos ZIP são aceitos')
      return false
    }

    // Validar tamanho (máximo 50MB)
    const tamanhoMaximo = 50 * 1024 * 1024 // 50MB
    if (arquivo.size > tamanhoMaximo) {
      setErro('Arquivo muito grande. Tamanho máximo: 50MB')
      return false
    }

    // Validar se não está vazio
    if (arquivo.size === 0) {
      setErro('Arquivo está vazio')
      return false
    }

    return true
  }

  const handleArquivoSelecionado = useCallback((arquivo: File) => {
    if (validarArquivo(arquivo)) {
      onArquivoSelecionado(arquivo)
    }
  }, [onArquivoSelecionado])

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const arquivo = event.target.files?.[0]
    if (arquivo) {
      handleArquivoSelecionado(arquivo)
    }
  }

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault()
    event.stopPropagation()
    if (!disabled) {
      setDragOver(true)
    }
  }

  const handleDragLeave = (event: React.DragEvent) => {
    event.preventDefault()
    event.stopPropagation()
    setDragOver(false)
  }

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault()
    event.stopPropagation()
    setDragOver(false)

    if (disabled) return

    const arquivo = event.dataTransfer.files[0]
    if (arquivo) {
      handleArquivoSelecionado(arquivo)
    }
  }

  const handleRemoverArquivo = () => {
    onArquivoRemovido()
    setErro(null)
    if (inputRef.current) {
      inputRef.current.value = ''
    }
  }

  const formatarTamanhoArquivo = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className={className}>
      {!arquivoSelecionado ? (
        <Card
          className={`
            border-2 border-dashed transition-all duration-200 cursor-pointer
            ${dragOver ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          `}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !disabled && inputRef.current?.click()}
        >
          <CardContent className="flex flex-col items-center justify-center p-8 text-center">
            <Upload className={`w-12 h-12 mb-4 ${dragOver ? 'text-blue-500' : 'text-gray-400'}`} />
            
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {dragOver ? 'Solte o arquivo aqui' : 'Selecione um arquivo de backup'}
            </h3>
            
            <p className="text-sm text-gray-600 mb-4">
              Arraste e solte ou clique para selecionar um arquivo ZIP
            </p>
            
            <Button
              type="button"
              variant="outline"
              disabled={disabled}
              className="mb-2"
            >
              <Upload className="w-4 h-4 mr-2" />
              Escolher Arquivo
            </Button>
            
            <p className="text-xs text-gray-500">
              Apenas arquivos ZIP até 50MB são aceitos
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <File className="w-8 h-8 text-green-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-green-900 truncate">
                    {arquivoSelecionado.name}
                  </p>
                  <p className="text-xs text-green-700">
                    {formatarTamanhoArquivo(arquivoSelecionado.size)} • ZIP
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  {!disabled && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleRemoverArquivo}
                      className="h-8 w-8 p-0 hover:bg-red-100"
                    >
                      <X className="w-4 h-4 text-red-600" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {erro && (
        <Card className="border-red-200 bg-red-50 mt-3">
          <CardContent className="p-3">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-red-600" />
              <p className="text-sm text-red-700">{erro}</p>
            </div>
          </CardContent>
        </Card>
      )}

      <input
        ref={inputRef}
        type="file"
        accept=".zip"
        onChange={handleInputChange}
        className="hidden"
        disabled={disabled}
      />
    </div>
  )
}