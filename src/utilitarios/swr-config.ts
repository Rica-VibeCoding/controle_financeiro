// Configuração SWR otimizada para uso pessoal
// Estratégia MANUAL-FIRST com Cache Persistente

import type { SWRConfiguration } from 'swr'

/**
 * Configuração SWR para uso pessoal - Invalidação manual + Cache persistente
 *
 * FILOSOFIA: "Só atualiza quando EU quero, mas com recuperação inteligente"
 * - ❌ Sem atualizações automáticas em background
 * - ❌ Sem reload ao trocar de aba
 * - ❌ Sem polling periódico
 * - ✅ Cache agressivo para performance
 * - ✅ Atualização manual via invalidação explícita após mutations
 *
 * FASE 1 - Cache Persistente (baseado no Portal Representação):
 * - ✅ Reconecta e revalida ao voltar online
 * - ✅ Retry em erros de rede (não em auth)
 * - ✅ Deduplicação para evitar requests duplicados
 * - ✅ fallbackData via localStorage (implementado nos hooks)
 */
export const SWR_CONFIG_OTIMIZADA: SWRConfiguration = {
  // === POLÍTICA DE REVALIDAÇÃO: MANUAL + RECONEXÃO ===
  revalidateOnFocus: false,       // ❌ Não atualiza ao trocar aba (performance)
  revalidateOnReconnect: true,    // ✅ FASE 1: Atualiza ao reconectar internet
  revalidateOnMount: true,        // ✅ Carrega ao abrir página pela primeira vez
  refreshInterval: 0,             // ❌ NUNCA atualizar automaticamente
  revalidateIfStale: false,       // ❌ Cache infinito (fallbackData gerencia expiração)

  // === PERFORMANCE E CACHE ===
  errorRetryCount: 2,             // Apenas 2 tentativas se falhar
  dedupingInterval: 5000,         // ✅ FASE 1: 5s para evitar requests duplicados

  // === UX OTIMIZADA ===
  suspense: false,                // Sem suspense (melhor controle loading)
  keepPreviousData: true,         // ✅ Mantém dados visíveis durante update manual

  // === TRATAMENTO DE ERROS ===
  shouldRetryOnError: (error: any) => {
    // Não retry em erros de autorização
    if (error?.message?.includes('401')) return false
    if (error?.message?.includes('403')) return false
    // ✅ FASE 1: Retry em outros erros (rede, timeout, etc)
    return true
  },

  // === CONFIGURAÇÕES DE CACHE ===
  fallbackData: undefined         // Configurado individualmente em cada hook
}

/**
 * Configuração específica para dados críticos (transações principais)
 * Mesma estratégia manual-first - cache infinito
 */
export const SWR_CONFIG_DADOS_CRITICOS: SWRConfiguration = {
  ...SWR_CONFIG_OTIMIZADA
}

/**
 * Configuração para dados auxiliares (categorias, formas pagamento)
 * Mesma estratégia manual-first - cache infinito
 */
export const SWR_CONFIG_DADOS_AUXILIARES: SWRConfiguration = {
  ...SWR_CONFIG_OTIMIZADA
}

// Tipagem para facilitar uso
export type TipoConfigSWR = 'otimizada' | 'criticos' | 'auxiliares'

/**
 * Função helper para obter configuração baseada no tipo de dados
 */
export function obterConfigSWR(tipo: TipoConfigSWR = 'otimizada'): SWRConfiguration {
  switch (tipo) {
    case 'criticos':
      return SWR_CONFIG_DADOS_CRITICOS
    case 'auxiliares':
      return SWR_CONFIG_DADOS_AUXILIARES
    default:
      return SWR_CONFIG_OTIMIZADA
  }
}