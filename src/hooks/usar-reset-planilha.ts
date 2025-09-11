import { useState, useCallback } from 'react'
import { ResetadorDados } from '@/servicos/backup/resetador-dados'
import { usarToast } from './usar-toast'
import { useAuth } from '@/contextos/auth-contexto'
import type { 
  ConfiguracaoReset, 
  EstadoReset, 
  ResultadoReset, 
  PreviewReset 
} from '@/tipos/backup'

const configuracaoInicial: ConfiguracaoReset = {
  incluirTransacoes: false,
  incluirCategorias: false,
  incluirSubcategorias: false,
  incluirContas: false,
  incluirFormasPagamento: false,
  incluirCentrosCusto: false,
  incluirMetas: false,
  criarBackupAntes: true
}

const estadoInicial: EstadoReset = {
  resetando: false,
  progresso: 0,
  etapaAtual: '',
  erro: null,
  previewCarregado: false
}

export function usarResetPlanilha() {
  const { workspace } = useAuth()
  const [configuracao, setConfiguracao] = useState<ConfiguracaoReset>(configuracaoInicial)
  const [estado, setEstado] = useState<EstadoReset>(estadoInicial)
  const { erro, sucesso, aviso } = usarToast()

  const atualizarProgresso = useCallback((progresso: number, etapa: string) => {
    setEstado(prev => ({
      ...prev,
      progresso,
      etapaAtual: etapa
    }))
  }, [])

  const gerarPreview = useCallback(async (): Promise<PreviewReset | null> => {
    if (!Object.values(configuracao).slice(0, -1).some(Boolean)) {
      erro('Selecione pelo menos uma opção para resetar')
      return null
    }

    try {
      setEstado(prev => ({ ...prev, erro: null }))
      
      const resetador = new ResetadorDados(workspace?.id || '')
      const preview = await resetador.gerarPreview(configuracao)
      
      setEstado(prev => ({
        ...prev,
        previewCarregado: true,
        dadosParaReset: preview
      }))

      return preview
      
    } catch (error) {
      const mensagem = error instanceof Error ? error.message : 'Erro ao gerar preview'
      setEstado(prev => ({ ...prev, erro: mensagem }))
      erro(mensagem)
      return null
    }
  }, [configuracao, erro])

  const executarReset = useCallback(async (): Promise<ResultadoReset | null> => {
    if (!Object.values(configuracao).slice(0, -1).some(Boolean)) {
      erro('Selecione pelo menos uma opção para resetar')
      return null
    }

    try {
      setEstado(prev => ({
        ...prev,
        resetando: true,
        progresso: 0,
        etapaAtual: 'Iniciando...',
        erro: null
      }))

      const resetador = new ResetadorDados(workspace?.id || '', atualizarProgresso)
      const resultado = await resetador.resetarDados(configuracao)

      if (resultado.sucesso) {
        let mensagem = `Reset concluído! ${resultado.totalApagados} registros apagados`
        if (resultado.backupCriado && resultado.nomeBackup) {
          mensagem += `. Backup criado: ${resultado.nomeBackup}`
        }
        sucesso(mensagem)
      } else {
        erro('Reset concluído com erros. Verifique o resultado.')
      }

      // Exibir advertências se houver
      if (resultado.advertencias.length > 0) {
        resultado.advertencias.forEach(advertencia => {
          aviso(advertencia)
        })
      }

      // Reset da configuração após sucesso
      if (resultado.sucesso) {
        setConfiguracao(configuracaoInicial)
      }

      return resultado

    } catch (error) {
      const mensagem = error instanceof Error ? error.message : 'Erro durante reset'
      setEstado(prev => ({ ...prev, erro: mensagem }))
      erro(mensagem)
      return null
      
    } finally {
      setEstado(prev => ({
        ...prev,
        resetando: false,
        progresso: 0,
        etapaAtual: ''
      }))
    }
  }, [configuracao, atualizarProgresso, erro, sucesso, aviso, workspace])

  const alterarConfiguracao = useCallback((novaConfiguracao: Partial<ConfiguracaoReset>) => {
    setConfiguracao(prev => ({
      ...prev,
      ...novaConfiguracao
    }))
    
    // Reset do preview quando configuração muda
    setEstado(prev => ({
      ...prev,
      previewCarregado: false,
      dadosParaReset: undefined
    }))
  }, [])

  const resetarEstado = useCallback(() => {
    setEstado(estadoInicial)
    setConfiguracao(configuracaoInicial)
  }, [])

  const obterResumoSelecao = useCallback((): string => {
    const selecionadas = []
    
    if (configuracao.incluirTransacoes) selecionadas.push('Transações')
    if (configuracao.incluirCategorias) selecionadas.push('Categorias') 
    if (configuracao.incluirSubcategorias) selecionadas.push('Subcategorias')
    if (configuracao.incluirContas) selecionadas.push('Contas')
    if (configuracao.incluirFormasPagamento) selecionadas.push('Formas de Pagamento')
    if (configuracao.incluirCentrosCusto) selecionadas.push('Centros de Custo')
    if (configuracao.incluirMetas) selecionadas.push('Metas')

    if (selecionadas.length === 0) return 'Nenhuma opção selecionada'
    if (selecionadas.length === 1) return selecionadas[0]
    if (selecionadas.length === 2) return selecionadas.join(' e ')
    
    const ultimas = selecionadas.slice(-2)
    const primeiras = selecionadas.slice(0, -2)
    return `${primeiras.join(', ')}, ${ultimas.join(' e ')}`
  }, [configuracao])

  const validarSelecao = useCallback((): { valida: boolean; mensagem?: string } => {
    const algumaSelecionada = Object.values(configuracao).slice(0, -1).some(Boolean)
    
    if (!algumaSelecionada) {
      return { valida: false, mensagem: 'Selecione pelo menos uma opção para resetar' }
    }

    return { valida: true }
  }, [configuracao])

  return {
    // Estado
    configuracao,
    estado,
    
    // Ações
    gerarPreview,
    executarReset,
    alterarConfiguracao,
    resetarEstado,
    
    // Utilitários
    obterResumoSelecao,
    validarSelecao,
    
    // Computed
    podeExecutar: !estado.resetando && validarSelecao().valida,
    temSelecao: Object.values(configuracao).slice(0, -1).some(Boolean)
  }
}