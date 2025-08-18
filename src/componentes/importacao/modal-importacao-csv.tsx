'use client'

import { useState } from 'react'
import { ModalBase } from '@/componentes/modais/modal-base'
import { Button } from '@/componentes/ui/button'
import { UploadCSV } from './upload-csv'
import { SeletorConta } from './seletor-conta'
import { usarToast } from '@/hooks/usar-toast'
import { processarCSV } from '@/servicos/importacao/processador-csv'
import { mapearLinhasNubank } from '@/servicos/importacao/mapeador-nubank'

interface ModalImportacaoCSVProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export function ModalImportacaoCSV({
  isOpen,
  onClose,
  onSuccess
}: ModalImportacaoCSVProps) {
  const [arquivo, setArquivo] = useState<File | null>(null)
  const [contaSelecionada, setContaSelecionada] = useState('')
  const [carregando, setCarregando] = useState(false)
  const [dadosProcessados, setDadosProcessados] = useState<any[]>([])
  
  const { erro, info, sucesso } = usarToast()

  const handleArquivoSelecionado = async (file: File | null) => {
    setArquivo(file)
    setDadosProcessados([])
    
    if (file) {
      setCarregando(true)
      try {
        const linhasCSV = await processarCSV(file)
        sucesso(`Arquivo processado: ${linhasCSV.length} transações encontradas`)
        setDadosProcessados(linhasCSV)
      } catch (error) {
        erro('Erro ao processar arquivo CSV')
        console.error(error)
      } finally {
        setCarregando(false)
      }
    }
  }

  const handleImportar = async () => {
    if (!arquivo || !contaSelecionada || dadosProcessados.length === 0) {
      erro('Selecione um arquivo CSV válido e uma conta')
      return
    }

    setCarregando(true)
    try {
      const transacoesMapeadas = mapearLinhasNubank(dadosProcessados, contaSelecionada)
      info(`Dados processados: ${transacoesMapeadas.length} transações mapeadas. Importação será finalizada na Fase 3.`)
      
      if (onSuccess) onSuccess()
      onClose()
    } catch (error) {
      erro('Erro ao mapear transações')
      console.error(error)
    } finally {
      setCarregando(false)
    }
  }

  const handleFechar = () => {
    setArquivo(null)
    setContaSelecionada('')
    setDadosProcessados([])
    onClose()
  }

  return (
    <ModalBase
      isOpen={isOpen}
      onClose={handleFechar}
      title="📂 Importar CSV"
      maxWidth="md"
    >
      <div className="space-y-6">
        {/* Seleção de Conta */}
        <SeletorConta
          contaSelecionada={contaSelecionada}
          onContaChange={setContaSelecionada}
          desabilitado={carregando}
        />

        {/* Upload de Arquivo */}
        <UploadCSV
          onArquivoSelecionado={handleArquivoSelecionado}
          arquivo={arquivo}
          carregando={carregando}
        />

        {/* Preview dos Dados */}
        {dadosProcessados.length > 0 && (
          <div className="bg-green-50 p-4 rounded-lg">
            <h4 className="font-medium text-green-900 mb-2">
              ✅ Arquivo Processado
            </h4>
            <p className="text-sm text-green-700">
              {dadosProcessados.length} transações encontradas e validadas.
              <br />Pronto para importar para a conta selecionada.
            </p>
          </div>
        )}

        {/* Informações */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">Formato Suportado</h4>
          <p className="text-sm text-blue-700">
            • Formato Nubank: Data, Valor, Identificador, Descrição<br/>
            • Evita automaticamente transações duplicadas<br/>
            • Importa sem categoria (pode categorizar depois)
          </p>
        </div>

        {/* Botões */}
        <div className="flex gap-3 justify-end">
          <Button 
            variant="outline" 
            onClick={handleFechar}
            disabled={carregando}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleImportar}
            disabled={!arquivo || !contaSelecionada || carregando || dadosProcessados.length === 0}
          >
            {carregando ? 'Processando...' : 'Importar'}
          </Button>
        </div>
      </div>
    </ModalBase>
  )
}