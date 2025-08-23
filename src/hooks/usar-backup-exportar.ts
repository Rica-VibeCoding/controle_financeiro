import { useState, useCallback } from 'react'
import { ExportadorDados } from '@/servicos/backup/exportador-dados'
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
    const url = URL.createObjectURL(arquivo)
    const link = document.createElement('a')
    link.href = url
    link.download = nomeArquivo
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }, [])

  const exportarDados = useCallback(async (): Promise<boolean> => {
    if (estado.exportando) {
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
      const exportador = new ExportadorDados(onProgresso)
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
  }, [estado.exportando, configuracao, onProgresso, downloadArquivo])

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