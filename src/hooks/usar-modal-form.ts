'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contextos/auth-contexto'

interface UseModalFormConfig<T> {
  /** Estado inicial dos dados */
  estadoInicial: T
  /** Função para validar os dados */
  validar: (dados: T) => string[]
  /** Função para salvar os dados (criar ou atualizar) */
  salvar: (dados: T) => Promise<void>
  /** Função para carregar dados existentes (para edição) */
  carregar?: (id: string) => Promise<T>
  /** Função chamada após sucesso na operação */
  onSucesso?: () => void
  /** Função chamada em caso de erro */
  onErro?: (erro: string) => void
  /** Limpar formulário após sucesso */
  limparAposSucesso?: boolean
}

interface UseModalFormReturn<T> {
  /** Dados atuais do formulário */
  dados: T
  /** Lista de erros de validação */
  erros: string[]
  /** Indica se está carregando dados */
  carregandoDados: boolean
  /** Indica se está salvando */
  salvando: boolean
  /** Indica se é uma edição */
  editando: boolean
  /** ID do registro sendo editado */
  idEdicao: string | null
  /** Função para atualizar um campo */
  atualizarCampo: (campo: keyof T, valor: any) => void
  /** Função para atualizar múltiplos campos */
  atualizarCampos: (novossDados: Partial<T>) => void
  /** Função para inicializar edição com ID */
  inicializarEdicao: (id: string) => void
  /** Função para limpar formulário */
  limparFormulario: () => void
  /** Função para submeter o formulário */
  submeter: () => Promise<void>
  /** Função para validar sem submeter */
  validarFormulario: () => string[]
  /** Verifica se os dados mudaram do estado inicial */
  dadosMudaram: boolean
  /** Verifica se o formulário é válido */
  formularioValido: boolean
}

export function useModalForm<T extends Record<string, any>>({
  estadoInicial,
  validar,
  salvar,
  carregar,
  onSucesso,
  onErro,
  limparAposSucesso = true
}: UseModalFormConfig<T>): UseModalFormReturn<T> {
  
  const { workspace } = useAuth()
  const workspaceId = workspace?.id
  
  // Estados principais
  const [dados, setDados] = useState<T>(() => ({
    ...estadoInicial,
    workspace_id: estadoInicial.workspace_id || workspaceId || ''
  }))
  const [erros, setErros] = useState<string[]>([])
  const [carregandoDados, setCarregandoDados] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [idEdicao, setIdEdicao] = useState<string | null>(null)
  const [dadosOriginais, setDadosOriginais] = useState<T>(() => ({
    ...estadoInicial,
    workspace_id: estadoInicial.workspace_id || workspaceId || ''
  }))

  // Estados computados
  const editando = Boolean(idEdicao)
  const dadosMudaram = JSON.stringify(dados) !== JSON.stringify(dadosOriginais)
  const formularioValido = validar(dados).length === 0

  /**
   * Atualiza um campo específico
   */
  const atualizarCampo = useCallback((campo: keyof T, valor: any) => {
    setDados(prev => ({
      ...prev,
      [campo]: valor
    }))
    
    // Limpar erros relacionados ao campo
    setErros(prev => prev.filter(erro => !erro.includes(String(campo))))
  }, [])

  /**
   * Atualiza múltiplos campos
   */
  const atualizarCampos = useCallback((novosDados: Partial<T>) => {
    setDados(prev => ({
      ...prev,
      ...novosDados
    }))
    
    // Limpar erros dos campos atualizados
    const camposAtualizados = Object.keys(novosDados)
    setErros(prev => prev.filter(erro => 
      !camposAtualizados.some(campo => erro.includes(campo))
    ))
  }, [])

  /**
   * Inicializa edição carregando dados por ID
   */
  const inicializarEdicao = useCallback(async (id: string) => {
    if (!carregar) {
      console.warn('Função carregar não fornecida para edição')
      return
    }

    setIdEdicao(id)
    setCarregandoDados(true)
    setErros([])

    try {
      const dadosCarregados = await carregar(id)
      
      // Adicionar workspace_id se não estiver presente
      const dadosCompletos = {
        ...dadosCarregados,
        workspace_id: dadosCarregados.workspace_id || workspaceId
      }
      
      setDados(dadosCompletos)
      setDadosOriginais(dadosCompletos)
    } catch (error) {
      console.error('Erro ao carregar dados para edição:', error)
      const mensagemErro = error instanceof Error ? error.message : 'Erro ao carregar dados'
      setErros([mensagemErro])
      onErro?.(mensagemErro)
    } finally {
      setCarregandoDados(false)
    }
  }, [carregar, workspaceId, onErro])

  /**
   * Limpa o formulário para o estado inicial
   */
  const limparFormulario = useCallback(() => {
    const dadosLimpos = {
      ...estadoInicial,
      workspace_id: workspaceId || ''
    }
    
    setDados(dadosLimpos)
    setDadosOriginais(dadosLimpos)
    setErros([])
    setIdEdicao(null)
    setSalvando(false)
    setCarregandoDados(false)
  }, [estadoInicial, workspaceId])

  /**
   * Valida o formulário sem submeter
   */
  const validarFormulario = useCallback(() => {
    const novosErros = validar(dados)
    setErros(novosErros)
    return novosErros
  }, [dados, validar])

  /**
   * Submete o formulário (criar ou atualizar)
   */
  const submeter = useCallback(async () => {
    // Validação
    const novosErros = validar(dados)
    setErros(novosErros)
    
    if (novosErros.length > 0) {
      return
    }

    setSalvando(true)

    try {
      // Garantir que workspace_id está presente
      const dadosParaSalvar = {
        ...dados,
        workspace_id: dados.workspace_id || workspaceId
      }

      await salvar(dadosParaSalvar)
      
      // Sucesso
      onSucesso?.()
      
      if (limparAposSucesso) {
        limparFormulario()
      } else {
        // Atualizar dados originais para refletir o estado salvo
        setDadosOriginais(dadosParaSalvar)
      }
      
    } catch (error) {
      console.error('Erro ao salvar:', error)
      const mensagemErro = error instanceof Error ? error.message : 'Erro ao salvar dados'
      setErros([mensagemErro])
      onErro?.(mensagemErro)
    } finally {
      setSalvando(false)
    }
  }, [dados, validar, salvar, workspaceId, onSucesso, onErro, limparAposSucesso, limparFormulario])

  // Remove o useEffect problemático - workspace_id será gerenciado nos métodos

  return {
    dados,
    erros,
    carregandoDados,
    salvando,
    editando,
    idEdicao,
    atualizarCampo,
    atualizarCampos,
    inicializarEdicao,
    limparFormulario,
    submeter,
    validarFormulario,
    dadosMudaram,
    formularioValido
  }
}