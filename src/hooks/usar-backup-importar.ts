import { useState, useCallback } from 'react'
import { ValidadorBackup } from '@/servicos/backup/validador-backup'
import { ImportadorDados } from '@/servicos/backup/importador-dados'
import type { 
  EstadoImportacao,
  ConfiguracaoImportacao,
  ResumoValidacao,
  DadosImportacao,
  ResultadoImportacao,
  LogExportacao,
  PreviewImportacao
} from '@/tipos/backup'

const configuracaoPadrao: ConfiguracaoImportacao = {
  modoImportacao: 'incremental',
  validarIntegridade: true,
  criarBackupAntes: true,
  manterDadosExistentes: false
}

export function usarBackupImportar() {
  const [estado, setEstado] = useState<EstadoImportacao>({
    importando: false,
    progresso: 0,
    etapaAtual: '',
    erro: null
  })

  const [configuracao, setConfiguracao] = useState<ConfiguracaoImportacao>(configuracaoPadrao)
  const [arquivoSelecionado, setArquivoSelecionado] = useState<File | null>(null)
  const [ultimoResultado, setUltimoResultado] = useState<ResultadoImportacao | null>(null)
  const [logs, setLogs] = useState<LogExportacao[]>([])

  const atualizarConfiguracao = useCallback((novaConfiguracao: Partial<ConfiguracaoImportacao>) => {
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

  const selecionarArquivo = useCallback((arquivo: File) => {
    setArquivoSelecionado(arquivo)
    setEstado(prev => ({
      ...prev,
      erro: null,
      dadosCarregados: undefined,
      resumoValidacao: undefined
    }))
  }, [])

  const removerArquivo = useCallback(() => {
    setArquivoSelecionado(null)
    setEstado(prev => ({
      ...prev,
      erro: null,
      dadosCarregados: undefined,
      resumoValidacao: undefined
    }))
  }, [])

  const validarArquivo = useCallback(async (): Promise<boolean> => {
    if (!arquivoSelecionado) {
      setEstado(prev => ({ ...prev, erro: 'Nenhum arquivo selecionado' }))
      return false
    }

    setEstado(prev => ({
      ...prev,
      importando: true,
      progresso: 0,
      etapaAtual: 'Validando arquivo...',
      erro: null
    }))

    try {
      const validador = new ValidadorBackup()
      const resumo = await validador.validarArquivoBackup(arquivoSelecionado)
      
      if (!resumo.arquivoValido) {
        setEstado(prev => ({
          ...prev,
          importando: false,
          erro: 'Arquivo de backup inválido. Verifique os erros de validação.',
          resumoValidacao: resumo
        }))
        return false
      }

      // Carregar dados do arquivo
      const dados = await validador.carregarDadosDoArquivo(arquivoSelecionado)

      setEstado(prev => ({
        ...prev,
        importando: false,
        progresso: 100,
        etapaAtual: 'Arquivo validado com sucesso',
        dadosCarregados: dados,
        resumoValidacao: resumo
      }))

      return true

    } catch (error) {
      const mensagem = error instanceof Error ? error.message : 'Erro desconhecido ao validar arquivo'
      setEstado(prev => ({
        ...prev,
        importando: false,
        progresso: 0,
        etapaAtual: 'Erro na validação',
        erro: mensagem
      }))
      return false
    }
  }, [arquivoSelecionado])

  const gerarPreviewDados = useCallback((): PreviewImportacao[] => {
    if (!estado.dadosCarregados) return []

    const previews: PreviewImportacao[] = []
    const { dadosCarregados } = estado

    // Preview das categorias
    if (dadosCarregados.categorias?.length) {
      const amostra = dadosCarregados.categorias.slice(0, 3)
      previews.push({
        tabela: 'Categorias',
        registros: dadosCarregados.categorias,
        totalRegistros: dadosCarregados.categorias.length,
        colunas: ['nome', 'tipo', 'icone', 'cor'],
        amostra
      })
    }

    // Preview das contas
    if (dadosCarregados.contas?.length) {
      const amostra = dadosCarregados.contas.slice(0, 3)
      previews.push({
        tabela: 'Contas',
        registros: dadosCarregados.contas,
        totalRegistros: dadosCarregados.contas.length,
        colunas: ['nome', 'tipo', 'banco', 'limite'],
        amostra
      })
    }

    // Preview das transações
    if (dadosCarregados.transacoes?.length) {
      const amostra = dadosCarregados.transacoes.slice(0, 3)
      previews.push({
        tabela: 'Transações',
        registros: dadosCarregados.transacoes,
        totalRegistros: dadosCarregados.transacoes.length,
        colunas: ['data', 'descricao', 'valor', 'tipo'],
        amostra
      })
    }

    // Preview das outras tabelas
    if (dadosCarregados.subcategorias?.length) {
      previews.push({
        tabela: 'Subcategorias',
        registros: dadosCarregados.subcategorias,
        totalRegistros: dadosCarregados.subcategorias.length,
        colunas: ['nome'],
        amostra: dadosCarregados.subcategorias.slice(0, 3)
      })
    }

    if (dadosCarregados.formasPagamento?.length) {
      previews.push({
        tabela: 'Formas de Pagamento',
        registros: dadosCarregados.formasPagamento,
        totalRegistros: dadosCarregados.formasPagamento.length,
        colunas: ['nome', 'tipo'],
        amostra: dadosCarregados.formasPagamento.slice(0, 3)
      })
    }

    if (dadosCarregados.centrosCusto?.length) {
      previews.push({
        tabela: 'Centros de Custo',
        registros: dadosCarregados.centrosCusto,
        totalRegistros: dadosCarregados.centrosCusto.length,
        colunas: ['nome', 'descricao', 'valor_orcamento'],
        amostra: dadosCarregados.centrosCusto.slice(0, 3)
      })
    }

    if (dadosCarregados.metasMensais?.length) {
      previews.push({
        tabela: 'Metas Mensais',
        registros: dadosCarregados.metasMensais,
        totalRegistros: dadosCarregados.metasMensais.length,
        colunas: ['mes_referencia', 'valor_meta'],
        amostra: dadosCarregados.metasMensais.slice(0, 3)
      })
    }

    return previews
  }, [estado.dadosCarregados])

  const executarImportacao = useCallback(async (): Promise<boolean> => {
    if (!estado.dadosCarregados) {
      setEstado(prev => ({ ...prev, erro: 'Nenhum dado carregado para importação' }))
      return false
    }

    setEstado(prev => ({
      ...prev,
      importando: true,
      progresso: 0,
      etapaAtual: 'Iniciando importação...',
      erro: null
    }))

    setLogs([])
    setUltimoResultado(null)

    try {
      const importador = new ImportadorDados(onProgresso)
      const resultado = await importador.importarDados(estado.dadosCarregados, configuracao)

      setLogs(importador.obterLogs())
      setUltimoResultado(resultado)

      if (resultado.sucesso) {
        setEstado(prev => ({
          ...prev,
          importando: false,
          progresso: 100,
          etapaAtual: 'Importação concluída com sucesso!',
          erro: null
        }))
      } else {
        setEstado(prev => ({
          ...prev,
          importando: false,
          progresso: 0,
          etapaAtual: 'Importação falhou',
          erro: resultado.erros.join('; ')
        }))
      }

      return resultado.sucesso

    } catch (error) {
      const mensagem = error instanceof Error ? error.message : 'Erro desconhecido durante importação'
      
      setEstado(prev => ({
        ...prev,
        importando: false,
        progresso: 0,
        etapaAtual: 'Erro na importação',
        erro: mensagem
      }))

      return false
    }
  }, [estado.dadosCarregados, configuracao, onProgresso])

  const reiniciarEstado = useCallback(() => {
    setEstado({
      importando: false,
      progresso: 0,
      etapaAtual: '',
      erro: null
    })
    setArquivoSelecionado(null)
    setLogs([])
    setUltimoResultado(null)
  }, [])

  const obterEstatisticasDados = useCallback(() => {
    if (!estado.dadosCarregados) return null

    const { dadosCarregados } = estado
    const totalRegistros = 
      (dadosCarregados.categorias?.length || 0) +
      (dadosCarregados.subcategorias?.length || 0) +
      (dadosCarregados.contas?.length || 0) +
      (dadosCarregados.formasPagamento?.length || 0) +
      (dadosCarregados.centrosCusto?.length || 0) +
      (dadosCarregados.transacoes?.length || 0) +
      (dadosCarregados.metasMensais?.length || 0)

    const tabelasComDados = [
      dadosCarregados.categorias?.length && 'Categorias',
      dadosCarregados.subcategorias?.length && 'Subcategorias', 
      dadosCarregados.contas?.length && 'Contas',
      dadosCarregados.formasPagamento?.length && 'Formas de Pagamento',
      dadosCarregados.centrosCusto?.length && 'Centros de Custo',
      dadosCarregados.transacoes?.length && 'Transações',
      dadosCarregados.metasMensais?.length && 'Metas Mensais'
    ].filter(Boolean)

    return {
      totalRegistros,
      totalTabelas: tabelasComDados.length,
      tabelasComDados
    }
  }, [estado.dadosCarregados])

  return {
    // Estado
    estado,
    configuracao,
    arquivoSelecionado,
    ultimoResultado,
    logs,

    // Ações
    selecionarArquivo,
    removerArquivo,
    validarArquivo,
    executarImportacao,
    atualizarConfiguracao,
    resetarConfiguracao,
    reiniciarEstado,

    // Utilitários
    gerarPreviewDados,
    obterEstatisticasDados,

    // Propriedades derivadas
    podeValidarArquivo: !!arquivoSelecionado && !estado.importando,
    arquivoValidado: !!estado.resumoValidacao?.arquivoValido,
    podeImportar: !!estado.dadosCarregados && !estado.importando && estado.resumoValidacao?.arquivoValido,
    importacaoCompleta: !!ultimoResultado?.sucesso && !estado.importando,
    temErrosValidacao: (estado.resumoValidacao?.errosValidacao?.length || 0) > 0
  }
}