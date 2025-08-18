'use client'

import { useState, useCallback } from 'react'

interface MensagemAnexo {
  tipo: 'erro' | 'sucesso'
  texto: string
}

export function usarUploadAnexo() {
  const [mensagemAnexo, setMensagemAnexo] = useState<MensagemAnexo | null>(null)
  const [anexoUrl, setAnexoUrl] = useState<string | undefined>()

  const handleUploadSuccess = useCallback((url: string) => {
    setAnexoUrl(url)
    setMensagemAnexo({ 
      tipo: 'sucesso', 
      texto: 'Arquivo anexado com sucesso!' 
    })
    
    // Limpar mensagem após 3 segundos
    setTimeout(() => setMensagemAnexo(null), 3000)
  }, [])

  const handleUploadError = useCallback((error: string) => {
    setMensagemAnexo({ 
      tipo: 'erro', 
      texto: error 
    })
    
    // Limpar mensagem após 5 segundos
    setTimeout(() => setMensagemAnexo(null), 5000)
  }, [])

  const limparMensagem = useCallback(() => {
    setMensagemAnexo(null)
  }, [])

  const resetarAnexo = useCallback(() => {
    setAnexoUrl(undefined)
    setMensagemAnexo(null)
  }, [])

  return {
    mensagemAnexo,
    anexoUrl,
    handleUploadSuccess,
    handleUploadError,
    limparMensagem,
    resetarAnexo,
    setAnexoUrl
  }
}