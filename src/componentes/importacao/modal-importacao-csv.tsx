'use client'

import { useState } from 'react'
import { ModalBase } from '@/componentes/modais/modal-base'
import { Button } from '@/componentes/ui/button'
import { UploadCSV } from './upload-csv'
import { SeletorConta } from './seletor-conta'
import { usarToast } from '@/hooks/usar-toast'
import { processarCSV } from '@/servicos/importacao/processador-csv'
import { mapearLinhasNubank } from '@/servicos/importacao/mapeador-nubank'
import { verificarDuplicatas } from '@/servicos/importacao/validador-duplicatas'
import { importarTransacoes } from '@/servicos/importacao/importador-transacoes'
import { PreviewImportacao } from './preview-importacao'
import { TransacaoImportada } from '@/tipos/importacao'
import { logger } from '@/utilitarios/logger'

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
  const [transacoesMapeadas, setTransacoesMapeadas] = useState<TransacaoImportada[]>([])
  const [duplicadas, setDuplicadas] = useState<TransacaoImportada[]>([])
  const [mostrarPreview, setMostrarPreview] = useState(false)
  
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
        logger.error(error)
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
      // Mapear dados
      const transacoesMap = mapearLinhasNubank(dadosProcessados, contaSelecionada)
      
      // Verificar duplicatas
      const { novas, duplicadas: dups } = await verificarDuplicatas(transacoesMap)
      
      setTransacoesMapeadas(novas)
      setDuplicadas(dups)
      setMostrarPreview(true)
      
      sucesso(`${novas.length} transações prontas para importar. ${dups.length} duplicadas encontradas.`)
    } catch (error) {
      erro('Erro ao processar transações')
      logger.error(error)
    } finally {
      setCarregando(false)
    }
  }

  const handleConfirmarImportacao = async () => {
    if (transacoesMapeadas.length === 0) {
      erro('Nenhuma transação para importar')
      return
    }

    setCarregando(true)
    try {
      const resultado = await importarTransacoes(transacoesMapeadas)
      
      if (resultado.erros.length === 0) {
        sucesso(`✅ ${resultado.importadas} transações importadas com sucesso!`)
      } else if (resultado.importadas > 0) {
        sucesso(`✅ ${resultado.importadas} importadas. ${resultado.erros.length} com erro (veja console)`)
        logger.error('Detalhes dos erros:', resultado.erros)
      } else {
        erro(`❌ Nenhuma transação foi importada. ${resultado.erros.length} erros encontrados`)
        logger.error('Erros de importação:', resultado.erros)
        return // Não fecha o modal se nada foi importado
      }
      
      if (onSuccess) onSuccess()
      onClose()
    } catch (error) {
      erro('Erro ao importar transações')
      logger.error('Erro na importação:', error)
    } finally {
      setCarregando(false)
    }
  }

  const handleVoltarUpload = () => {
    setMostrarPreview(false)
    setTransacoesMapeadas([])
    setDuplicadas([])
  }

  const handleFechar = () => {
    setArquivo(null)
    setContaSelecionada('')
    setDadosProcessados([])
    setTransacoesMapeadas([])
    setDuplicadas([])
    setMostrarPreview(false)
    onClose()
  }

  return (
    <ModalBase
      isOpen={isOpen}
      onClose={handleFechar}
      title={mostrarPreview ? "📋 Preview da Importação" : "📂 Importar CSV"}
      maxWidth={mostrarPreview ? "xl" : "md"}
    >
      <div className="space-y-6">
        {mostrarPreview ? (
          <PreviewImportacao
            transacoes={transacoesMapeadas}
            duplicadas={duplicadas}
            onConfirmar={handleConfirmarImportacao}
            onCancelar={handleVoltarUpload}
            carregando={carregando}
          />
        ) : (
          <>
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
          </>
        )}
      </div>
    </ModalBase>
  )
}