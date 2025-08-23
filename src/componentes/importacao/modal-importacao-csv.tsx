'use client'

import { useState } from 'react'
import { ModalBase } from '@/componentes/modais/modal-base'
import { Button } from '@/componentes/ui/button'
import { UploadCSV } from './upload-csv'
import { SeletorConta } from './seletor-conta'
import { usarToast } from '@/hooks/usar-toast'
import { processarCSV } from '@/servicos/importacao/processador-csv'
import { detectarFormato } from '@/servicos/importacao/detector-formato'
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
  const [formatoDetectado, setFormatoDetectado] = useState<any>(null)
  
  const { erro, info, sucesso } = usarToast()

  const handleArquivoSelecionado = async (file: File | null) => {
    setArquivo(file)
    setDadosProcessados([])
    setFormatoDetectado(null)
    
    if (file) {
      setCarregando(true)
      try {
        const linhasCSV = await processarCSV(file)
        
        // Tentar detectar formato
        const formato = detectarFormato(linhasCSV)
        setFormatoDetectado(formato)
        
        sucesso(`${formato.icone} ${formato.nome} detectado: ${linhasCSV.length} transações`)
        setDadosProcessados(linhasCSV)
      } catch (error) {
        if (error instanceof Error && error.message.includes('formato não reconhecido')) {
          erro('Formato CSV não reconhecido. Verifique se é um arquivo de banco suportado.')
        } else {
          erro('Erro ao processar arquivo CSV')
        }
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
      // Detectar formato e mapear dados
      const formato = detectarFormato(dadosProcessados)
      setFormatoDetectado(formato)
      const transacoesMap = formato.mapeador(dadosProcessados, contaSelecionada)
      
      // Verificar duplicatas
      const { novas, duplicadas: dups } = await verificarDuplicatas(transacoesMap)
      
      setTransacoesMapeadas(novas)
      setDuplicadas(dups)
      setMostrarPreview(true)
      
      sucesso(`${formato.icone} ${formato.nome}: ${novas.length} transações prontas para importar. ${dups.length} duplicadas encontradas.`)
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
    setFormatoDetectado(null)
  }

  const handleFechar = () => {
    setArquivo(null)
    setContaSelecionada('')
    setDadosProcessados([])
    setTransacoesMapeadas([])
    setDuplicadas([])
    setMostrarPreview(false)
    setFormatoDetectado(null)
    onClose()
  }

  return (
    <ModalBase
      isOpen={isOpen}
      onClose={handleFechar}
      title={mostrarPreview ? "📋 Preview da Importação" : "📂 Importar CSV"}
      maxWidth={mostrarPreview ? "xl" : "md"}
    >
      <div className="space-y-4">
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
        {dadosProcessados.length > 0 && formatoDetectado && (
          <div className="space-y-3">
            {/* Formato Detectado */}
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
              <h4 className="font-medium text-blue-900 mb-1 flex items-center gap-2">
                🏦 Extrato | {formatoDetectado.nome}
              </h4>
              <p className="text-sm text-blue-700">
                {dadosProcessados.length} transações encontradas e validadas
              </p>
            </div>

            {/* Preview Rápido */}
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
              <h4 className="font-medium text-blue-900 mb-2">📄 Preview dos Dados</h4>
              <div className="text-xs font-mono text-blue-700 space-y-1 max-h-10 overflow-y-auto">
                {dadosProcessados.slice(0, 2).map((linha, idx) => (
                  <div key={idx} className="truncate">
                    {Object.values(linha as Record<string, unknown>).join(' | ')}
                  </div>
                ))}
                {dadosProcessados.length > 2 && (
                  <div className="text-blue-600">... e mais {dadosProcessados.length - 2} transações</div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Informações */}
        <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
          <h4 className="font-medium text-blue-900 mb-2">🏦 Formatos Suportados</h4>
          <div className="text-sm text-blue-700 space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-purple-600">🏦</span>
              <strong>Nubank:</strong> Data, Valor, Identificador, Descrição
            </div>
            <div className="flex items-center gap-2">
              <span className="text-blue-600">💳</span>
              <strong>Cartão de crédito:</strong> date, title, amount
            </div>
            <div className="flex items-center gap-2 text-xs text-blue-600 mt-2">
              <span>⚡</span>
              Detecção automática - apenas arraste o arquivo!
            </div>
            <div className="flex items-center gap-2 text-xs text-blue-600">
              <span>🔒</span>
              Evita automaticamente transações duplicadas
            </div>
          </div>
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