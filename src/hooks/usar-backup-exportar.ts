import { useState, useCallback } from 'react'
import { ExportadorDados } from '@/servicos/backup/exportador-dados'
import { useAuth } from '@/contextos/auth-contexto'
import type { 
  EstadoExportacao, 
  ConfiguracaoExportacao, 
  ResumoExportacao,
  LogExportacao
} from '@/tipos/backup'

const configuracaoPadrao: ConfiguracaoExportacao = {
  incluirCategorias: true,
  incluirSubcategorias: true,
  incluirContas: true,
  incluirFormasPagamento: true,
  incluirCentrosCusto: true,
  incluirTransacoes: true,
  incluirMetas: true
}

export function usarBackupExportar() {
  const { workspace } = useAuth()
  const [estado, setEstado] = useState<EstadoExportacao>({
    exportando: false,
    progresso: 0,
    etapaAtual: '',
    erro: null
  })

  const [configuracao, setConfiguracao] = useState<ConfiguracaoExportacao>(configuracaoPadrao)
  const [ultimoResumo, setUltimoResumo] = useState<ResumoExportacao | null>(null)
  const [logs, setLogs] = useState<LogExportacao[]>([])

  const atualizarConfiguracao = useCallback((novaConfiguracao: Partial<ConfiguracaoExportacao>) => {
    setConfiguracao(prev => ({ ...prev, ...novaConfiguracao }))
  }, [])

  const resetarConfiguracao = useCallback(() => {
    setConfiguracao(configuracaoPadrao)
  }, [])

  const onProgresso = useCallback((progresso: number, etapaAtual: string) => {
    setEstado(prev => ({
      ...prev,
      progresso,
      etapaAtual
    }))
  }, [])

  const downloadArquivo = useCallback((arquivo: Blob, nomeArquivo: string) => {
    try {
      // Abordagem robusta que evita conflitos com Service Worker
      const url = URL.createObjectURL(arquivo)
      const link = document.createElement('a')
      
      // Definir atributos antes de adicionar ao DOM
      link.href = url
      link.download = nomeArquivo
      link.style.display = 'none'
      link.target = '_blank'
      
      // Adicionar ao DOM, clicar e remover
      document.body.appendChild(link)
      
      // Usar timeout para evitar conflitos
      setTimeout(() => {
        link.click()
        
        // Limpar após um pequeno delay
        setTimeout(() => {
          document.body.removeChild(link)
          URL.revokeObjectURL(url)
        }, 100)
      }, 10)
      
    } catch (error) {
      console.error('Erro no download do arquivo:', error)
      // Fallback: usar data URL
      const reader = new FileReader()
      reader.onload = () => {
        const link = document.createElement('a')
        link.href = reader.result as string
        link.download = nomeArquivo
        link.click()
      }
      reader.readAsDataURL(arquivo)
    }
  }, [])

  const exportarDados = useCallback(async (): Promise<boolean> => {
    if (estado.exportando || !workspace) {
      return false
    }

    setEstado({
      exportando: true,
      progresso: 0,
      etapaAtual: 'Iniciando...',
      erro: null
    })

    setLogs([])
    setUltimoResumo(null)

    try {
      const exportador = new ExportadorDados(workspace.id, onProgresso)
      const { arquivo, resumo } = await exportador.exportarTodosDados(configuracao)
      
      // Gerar nome do arquivo com timestamp
      const dataAtual = new Date()
      const timestamp = dataAtual.toISOString()
        .replace(/[:.]/g, '-')
        .split('T')[0] + '_' + 
        dataAtual.toTimeString().split(' ')[0].replace(/:/g, '-')
      
      const nomeArquivo = `backup_financeiro_${timestamp}.zip`

      // Fazer download
      downloadArquivo(arquivo, nomeArquivo)

      // Salvar resumo e logs
      setUltimoResumo(resumo)
      setLogs(exportador.obterLogs())

      setEstado({
        exportando: false,
        progresso: 100,
        etapaAtual: 'Concluído!',
        erro: null,
        arquivoGerado: nomeArquivo
      })

      return true

    } catch (error) {
      const mensagemErro = error instanceof Error ? error.message : 'Erro desconhecido durante exportação'
      
      setEstado({
        exportando: false,
        progresso: 0,
        etapaAtual: 'Erro na exportação',
        erro: mensagemErro
      })

      return false
    }
  }, [estado.exportando, configuracao, onProgresso, downloadArquivo, workspace])

  const reiniciarEstado = useCallback(() => {
    setEstado({
      exportando: false,
      progresso: 0,
      etapaAtual: '',
      erro: null
    })
    setLogs([])
  }, [])

  const obterEstatisticasConfiguracao = useCallback(() => {
    const tabelasSelecionadas = Object.entries(configuracao)
      .filter(([_, incluir]) => incluir)
      .map(([chave]) => chave.replace('incluir', ''))
    
    return {
      totalTabelas: Object.keys(configuracao).length,
      tabelasSelecionadas: tabelasSelecionadas.length,
      listaTabelas: tabelasSelecionadas
    }
  }, [configuracao])

  return {
    // Estado
    estado,
    configuracao,
    ultimoResumo,
    logs,

    // Ações
    exportarDados,
    atualizarConfiguracao,
    resetarConfiguracao,
    reiniciarEstado,

    // Utilitários
    obterEstatisticasConfiguracao,
    
    // Propriedades derivadas
    podeFazerExportacao: !estado.exportando,
    temDadosParaExportar: obterEstatisticasConfiguracao().tabelasSelecionadas > 0,
    exportacaoCompleta: estado.progresso === 100 && !estado.erro && !estado.exportando
  }
}