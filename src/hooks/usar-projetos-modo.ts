// Hook para gerenciar modo de exibição dos projetos pessoais
// Controla se deve mostrar apenas realizados ou incluir pendentes

import { useState, useEffect } from 'react'

// Tipos para configuração do modo projetos
export interface ConfiguracoesProjetos {
  mostrarPendentes: boolean
  ultimaAtualizacao: string
}

// Chave para localStorage
const STORAGE_KEY = 'configuracoes-projetos'

// Configuração padrão
const CONFIG_PADRAO: ConfiguracoesProjetos = {
  mostrarPendentes: false, // Padrão: apenas realizados
  ultimaAtualizacao: new Date().toISOString()
}

/**
 * Hook para gerenciar configurações de modo dos projetos pessoais
 * Persiste no localStorage seguindo padrão do projeto
 * 
 * @returns Estado e funções para controlar modo de exibição
 */
export function usarProjetosModo() {
  const [config, setConfig] = useState<ConfiguracoesProjetos>(CONFIG_PADRAO)
  const [loading, setLoading] = useState(true)

  // Carregar configuração do localStorage na inicialização
  useEffect(() => {
    try {
      const configSalva = localStorage.getItem(STORAGE_KEY)
      if (configSalva) {
        const parsed: ConfiguracoesProjetos = JSON.parse(configSalva)
        setConfig(parsed)
      }
    } catch (error) {
      console.warn('Erro ao carregar configurações de projetos:', error)
      // Manter configuração padrão em caso de erro
    } finally {
      setLoading(false)
    }
  }, [])

  // Função para atualizar configuração
  const atualizarConfig = (novaConfig: Partial<ConfiguracoesProjetos>) => {
    const configAtualizada: ConfiguracoesProjetos = {
      ...config,
      ...novaConfig,
      ultimaAtualizacao: new Date().toISOString()
    }

    setConfig(configAtualizada)
    
    // Persistir no localStorage
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(configAtualizada))
    } catch (error) {
      console.error('Erro ao salvar configurações de projetos:', error)
    }
  }

  // Função específica para alternar modo pendentes
  const alternarModosPendentes = (onMudanca?: () => void) => {
    const novoEstado = !config.mostrarPendentes
    atualizarConfig({ mostrarPendentes: novoEstado })
    
    // Executar callback imediatamente após mudança (para revalidação)
    if (onMudanca) {
      // Aguardar próximo tick para garantir que estado foi atualizado
      setTimeout(onMudanca, 0)
    }
  }

  // Função para resetar para padrão
  const resetarParaPadrao = () => {
    setConfig(CONFIG_PADRAO)
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch (error) {
      console.error('Erro ao resetar configurações:', error)
    }
  }

  return {
    // Estado atual
    mostrarPendentes: config.mostrarPendentes,
    ultimaAtualizacao: config.ultimaAtualizacao,
    loading,
    
    // Funções de controle
    alternarModosPendentes,
    atualizarConfig,
    resetarParaPadrao,
    
    // Estado completo da configuração
    config
  }
}

// Export default para compatibilidade
export default usarProjetosModo