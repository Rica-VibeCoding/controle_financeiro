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
import {
  TransacaoImportada,
  TransacaoClassificada,
  ResumoClassificacao,
  DadosClassificacao
} from '@/tipos/importacao'
import { detectarTipoLancamento } from '@/servicos/importacao/detector-tipos-lancamento'
import {
  buscarClassificacaoHistorica,
  buscarClassificacoesEmLote
} from '@/servicos/importacao/classificador-historico'
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
  
  // Estados para classificação inteligente
  const [transacoesClassificadas, setTransacoesClassificadas] = useState<TransacaoClassificada[]>([])
  const [resumoClassificacao, setResumoClassificacao] = useState<ResumoClassificacao>({
    reconhecidas: 0,
    pendentes: 0,
    duplicadas: 0
  })
  
  const { erro, sucesso } = usarToast()

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
      // 1. Detectar formato e mapear dados (código atual)
      const formato = detectarFormato(dadosProcessados)
      setFormatoDetectado(formato)
      const transacoesMap = formato.mapeador(dadosProcessados, contaSelecionada)
      
      // 2. NOVO: Classificação inteligente
      const transacoesClassificadas: TransacaoClassificada[] = []
      
      // Versão otimizada: buscar classificações em lote
      const dadosParaBusca = transacoesMap.map(t => ({
        descricao: t.descricao,
        conta_id: t.conta_id
      }))
      
      const classificacoesEncontradas = await buscarClassificacoesEmLote(dadosParaBusca)
      
      // Processar cada transação
      for (const transacao of transacoesMap) {
        const chave = `${transacao.descricao}|${transacao.conta_id}`
        const classificacao = classificacoesEncontradas.get(chave)
        
        // Detectar tipo de lançamento para sinalização
        const sinalizacao = detectarTipoLancamento(transacao)
        
        if (classificacao) {
          // Transação reconhecida
          transacoesClassificadas.push({
            ...transacao,
            classificacao_automatica: classificacao,
            status_classificacao: 'reconhecida',
            categoria_id: classificacao.categoria_id,
            subcategoria_id: classificacao.subcategoria_id,
            forma_pagamento_id: classificacao.forma_pagamento_id,
            formato_origem: formato.nome,
            sinalizacao,
            selecionada: sinalizacao.tipo === 'gasto_real' || sinalizacao.tipo === 'taxa_juro' // Padrão inteligente
          })
        } else {
          // Transação pendente
          transacoesClassificadas.push({
            ...transacao,
            status_classificacao: 'pendente',
            formato_origem: formato.nome,
            sinalizacao,
            selecionada: sinalizacao.tipo === 'gasto_real' || sinalizacao.tipo === 'taxa_juro' // Padrão inteligente
          })
        }
      }

      // 3. Verificar duplicatas (código atual)
      const { novas, duplicadas: dups } = await verificarDuplicatas(transacoesClassificadas)
      
      // Marcar duplicadas no status
      const duplicadasComStatus = dups.map(t => {
        const sinalizacao = detectarTipoLancamento(t)
        return {
          ...t,
          status_classificacao: 'duplicada' as const,
          formato_origem: formato.nome,
          sinalizacao,
          selecionada: false // Duplicadas não selecionadas por padrão
        }
      })

      // 4. Calcular resumo
      const resumo: ResumoClassificacao = {
        reconhecidas: novas.filter(t => 
          (t as TransacaoClassificada).status_classificacao === 'reconhecida'
        ).length,
        pendentes: novas.filter(t => 
          (t as TransacaoClassificada).status_classificacao === 'pendente'
        ).length,
        duplicadas: duplicadasComStatus.length
      }

      // 5. Atualizar estados
      setTransacoesMapeadas(novas)
      setDuplicadas(duplicadasComStatus)
      setTransacoesClassificadas([...novas as TransacaoClassificada[], ...duplicadasComStatus])
      setResumoClassificacao(resumo)
      setMostrarPreview(true)
      
      sucesso(
        `🧠 ${formato.nome}: ${resumo.reconhecidas} reconhecidas, ` +
        `${resumo.pendentes} pendentes, ${resumo.duplicadas} duplicadas`
      )
    } catch (error) {
      erro('Erro ao processar transações')
      logger.error(error)
    } finally {
      setCarregando(false)
    }
  }

  const handleConfirmarImportacao = async () => {
    // Usar transações selecionadas se tiver classificação, senão usar mapeadas
    const transacoesParaImportar = transacoesClassificadas.length > 0 
      ? transacoesClassificadas.filter(t => 
          t.status_classificacao !== 'duplicada' && (t.selecionada ?? true)
        )
      : transacoesMapeadas

    if (transacoesParaImportar.length === 0) {
      erro('Nenhuma transação selecionada para importar')
      return
    }

    setCarregando(true)
    try {
      const resultado = await importarTransacoes(transacoesParaImportar)
      
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

  const handleClassificarTransacao = (transacao: TransacaoClassificada, dados: DadosClassificacao) => {
    // Atualizar transação com nova classificação
    const transacaoAtualizada: TransacaoClassificada = {
      ...transacao,
      classificacao_automatica: dados,
      status_classificacao: 'reconhecida',
      categoria_id: dados.categoria_id,
      subcategoria_id: dados.subcategoria_id,
      forma_pagamento_id: dados.forma_pagamento_id
    }
    
    // Atualizar array de transações
    setTransacoesClassificadas(prev => 
      prev.map(t => t === transacao ? transacaoAtualizada : t)
    )
    
    // Atualizar transações mapeadas (para importação)
    setTransacoesMapeadas(prev => 
      prev.map(t => t === transacao ? transacaoAtualizada : t)
    )
    
    // Atualizar resumo
    setResumoClassificacao(prev => ({
      ...prev,
      reconhecidas: prev.reconhecidas + 1,
      pendentes: prev.pendentes - 1
    }))
    
    sucesso('✅ Transação classificada com sucesso!')
  }

  const handleToggleSelecaoTransacao = (
    transacao: TransacaoClassificada, 
    selecionada: boolean
  ) => {
    setTransacoesClassificadas(prev =>
      prev.map(t =>
        t.identificador_externo === transacao.identificador_externo
          ? { ...t, selecionada }
          : t
      )
    )
  }

  const handleVoltarUpload = () => {
    setMostrarPreview(false)
    setTransacoesMapeadas([])
    setDuplicadas([])
    setFormatoDetectado(null)
    setTransacoesClassificadas([])
    setResumoClassificacao({ reconhecidas: 0, pendentes: 0, duplicadas: 0 })
  }

  const handleFechar = () => {
    setArquivo(null)
    setContaSelecionada('')
    setDadosProcessados([])
    setTransacoesMapeadas([])
    setDuplicadas([])
    setMostrarPreview(false)
    setFormatoDetectado(null)
    setTransacoesClassificadas([])
    setResumoClassificacao({ reconhecidas: 0, pendentes: 0, duplicadas: 0 })
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
            // Novas props para classificação
            transacoesClassificadas={transacoesClassificadas}
            resumoClassificacao={resumoClassificacao}
            onClassificarTransacao={handleClassificarTransacao}
            onToggleSelecaoTransacao={handleToggleSelecaoTransacao}
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