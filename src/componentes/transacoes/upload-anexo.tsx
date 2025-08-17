'use client'

import { useState, useRef } from 'react'
import { Button } from '@/componentes/ui/button'
import { Input } from '@/componentes/ui/input'
import { Label } from '@/componentes/ui/label'
import { LoadingText } from '@/componentes/comum/loading'
import { AnexosService } from '@/servicos/supabase/anexos'

interface UploadAnexoProps {
  onUploadSuccess: (url: string, fileName: string) => void
  onUploadError: (error: string) => void
  transacaoId?: string
  disabled?: boolean
  anexoAtual?: string
}

export function UploadAnexo({
  onUploadSuccess,
  onUploadError,
  transacaoId,
  disabled = false,
  anexoAtual
}: UploadAnexoProps) {
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [arquivoSelecionado, setArquivoSelecionado] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Selecionar arquivo
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validar arquivo
    const validacao = AnexosService.validarArquivo(file)
    if (!validacao.valido) {
      onUploadError(validacao.erro!)
      return
    }

    setArquivoSelecionado(file)

    // Criar preview para imagens
    if (file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    } else {
      setPreview(null)
    }
  }

  // Fazer upload
  const handleUpload = async () => {
    if (!arquivoSelecionado) return

    try {
      setUploading(true)
      const result = await AnexosService.uploadAnexo(arquivoSelecionado, transacaoId)
      onUploadSuccess(result.url, result.fileName)
      
      // Limpar seleção
      setArquivoSelecionado(null)
      setPreview(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (error) {
      const mensagem = error instanceof Error ? error.message : 'Erro no upload'
      onUploadError(mensagem)
    } finally {
      setUploading(false)
    }
  }

  // Remover anexo atual
  const handleRemover = async () => {
    if (!anexoAtual) return

    const confirmar = window.confirm('Deseja remover este anexo?')
    if (!confirmar) return

    try {
      const fileName = AnexosService.extrairNomeArquivo(anexoAtual)
      if (fileName) {
        await AnexosService.excluirAnexo(fileName)
      }
      onUploadSuccess('', '') // URL vazia = remover
    } catch (error) {
      const mensagem = error instanceof Error ? error.message : 'Erro ao remover anexo'
      onUploadError(mensagem)
    }
  }

  // Abrir seletor de arquivo
  const handleOpenFileSelector = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="space-y-3">
      <Label>Anexo (Comprovante/Nota Fiscal)</Label>
      
      <Input
        ref={fileInputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.webp,.pdf"
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled || uploading}
      />

      {anexoAtual && !arquivoSelecionado && (
        <div className="border rounded-lg p-3 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg">
                {anexoAtual.toLowerCase().includes('.pdf') ? '📄' : '🖼️'}
              </span>
              <div>
                <p className="text-sm font-medium">Anexo atual</p>
                <p className="text-xs text-muted-foreground">
                  {AnexosService.extrairNomeArquivo(anexoAtual) || 'arquivo.ext'}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => window.open(anexoAtual, '_blank')}
                className="text-xs"
              >
                Ver
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleRemover}
                disabled={disabled}
                className="text-xs text-red-600 hover:text-red-700"
              >
                Remover
              </Button>
            </div>
          </div>
        </div>
      )}

      {(!anexoAtual || arquivoSelecionado) && (
        <div className="space-y-3">
          {!arquivoSelecionado && (
            <div
              onClick={handleOpenFileSelector}
              className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                disabled ? 'border-gray-200 bg-gray-50' : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
              }`}
            >
              <div className="text-4xl mb-2">📎</div>
              <p className="text-sm font-medium mb-1">
                Clique para selecionar arquivo
              </p>
              <p className="text-xs text-muted-foreground">
                JPG, PNG, WebP ou PDF até 5MB
              </p>
            </div>
          )}

          {arquivoSelecionado && (
            <div className="border rounded-lg p-3">
              <div className="flex items-start gap-3">
                {preview && (
                  <div className="flex-shrink-0">
                    <img
                      src={preview}
                      alt="Preview"
                      className="w-16 h-16 object-cover rounded"
                    />
                  </div>
                )}

                {!preview && (
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 bg-red-100 rounded flex items-center justify-center">
                      <span className="text-2xl">📄</span>
                    </div>
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {arquivoSelecionado.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {AnexosService.formatarTamanho(arquivoSelecionado.size)} • {arquivoSelecionado.type}
                  </p>
                  
                  <div className="flex gap-2 mt-2">
                    <Button
                      size="sm"
                      onClick={handleUpload}
                      disabled={uploading || disabled}
                      className="text-xs"
                    >
                      {uploading ? 'Enviando...' : 'Enviar'}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setArquivoSelecionado(null)
                        setPreview(null)
                        if (fileInputRef.current) {
                          fileInputRef.current.value = ''
                        }
                      }}
                      disabled={uploading || disabled}
                      className="text-xs"
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {uploading && (
            <div className="text-center py-2">
              <LoadingText>Enviando arquivo...</LoadingText>
            </div>
          )}
        </div>
      )}

      <div className="text-xs text-muted-foreground">
        <p className="font-medium">Tipos aceitos:</p>
        <p>• Imagens: JPG, PNG, WebP</p>
        <p>• Documentos: PDF</p>
        <p>• Tamanho máximo: 5MB</p>
      </div>
    </div>
  )
}