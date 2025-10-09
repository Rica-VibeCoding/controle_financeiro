// Configuração SWR otimizada para uso pessoal
// Estratégia MANUAL-FIRST: Atualiza apenas quando usuário adiciona/edita dados

import type { SWRConfiguration } from 'swr'

/**
 * Configuração SWR para uso pessoal - Invalidação manual apenas
 *
 * FILOSOFIA: "Só atualiza quando EU quero"
 * - ❌ Sem atualizações automáticas em background
 * - ❌ Sem reload ao trocar de aba
 * - ❌ Sem polling periódico
 * - ✅ Cache agressivo para performance
 * - ✅ Atualização manual via invalidação explícita após mutations
 */
export const SWR_CONFIG_OTIMIZADA: SWRConfiguration = {
  // === POLÍTICA DE REVALIDAÇÃO: MANUAL ONLY ===
  revalidateOnFocus: false,       // ❌ Não atualiza ao trocar aba
  revalidateOnReconnect: false,   // ❌ Não atualiza ao reconectar
  revalidateOnMount: true,        // ✅ Carrega ao abrir página pela primeira vez
  refreshInterval: 0,             // ❌ NUNCA atualizar automaticamente (era 900000)

  // === PERFORMANCE E CACHE ===
  dedupingInterval: 2000,         // 2s - evita requests duplicados
  errorRetryCount: 2,             // Apenas 2 tentativas se falhar
  revalidateIfStale: false,       // ❌ Não revalidar dados "velhos" automaticamente

  // === UX OTIMIZADA ===
  suspense: false,                // Sem suspense (melhor controle loading)
  keepPreviousData: true,         // ✅ Mantém dados visíveis durante update manual

  // === TRATAMENTO DE ERROS ===
  shouldRetryOnError: (error: any) => {
    // Não retry em erros de autorização
    if (error?.message?.includes('401')) return false
    if (error?.message?.includes('403')) return false
    return false // Não ficar tentando - mostrar erro e parar
  },

  // === CONFIGURAÇÕES DE CACHE ===
  fallbackData: undefined         // Sem fallback padrão
}

/**
 * Configuração específica para dados críticos (transações principais)
 * Mesma estratégia manual-first
 */
export const SWR_CONFIG_DADOS_CRITICOS: SWRConfiguration = {
  ...SWR_CONFIG_OTIMIZADA,
  dedupingInterval: 1500,         // 1.5s - dados críticos atualizam mais rápido
  refreshInterval: 0              // ❌ Sem refresh automático
}

/**
 * Configuração para dados auxiliares (categorias, formas pagamento)
 * Dados que mudam raramente - cache muito longo
 */
export const SWR_CONFIG_DADOS_AUXILIARES: SWRConfiguration = {
  ...SWR_CONFIG_OTIMIZADA,
  dedupingInterval: 5000,         // 5s - dados auxiliares
  refreshInterval: 0              // ❌ Sem refresh automático
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