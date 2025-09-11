// Configuração SWR otimizada para o sistema financeiro
// Estratégia híbrida: sem refresh automático + backup 15min

import type { SWRConfiguration } from 'swr'

/**
 * Configuração SWR otimizada baseada na estratégia híbrida:
 * - Não atualiza automaticamente ao trocar de aba (melhor UX)
 * - Backup de 15 minutos se ficar muito tempo na mesma tela
 * - Performance otimizada para dados financeiros
 */
export const SWR_CONFIG_OTIMIZADA: SWRConfiguration = {
  // ESTRATÉGIA HÍBRIDA APROVADA
  revalidateOnFocus: false,       // ✅ Não atualiza ao trocar aba (evita refresh chato)
  refreshInterval: 900000,        // ✅ Backup: 15 minutos
  revalidateOnMount: true,        // ✅ Atualiza ao abrir página
  
  // OTIMIZAÇÕES DE PERFORMANCE
  dedupingInterval: 5000,         // 5s - evita requests duplicados
  errorRetryCount: 2,             // Menos tentativas = mais rápido
  revalidateIfStale: true,        // Revalida dados antigos
  
  // CONFIGURAÇÕES DE UX
  suspense: false,                // Sem suspense (melhor controle loading)
  revalidateOnReconnect: true,    // Atualiza quando volta conexão
  
  // CONFIGURAÇÕES DE ERRO
  shouldRetryOnError: (error: any) => {
    // Não retry em erros de autorização
    if (error?.message?.includes('401')) return false
    if (error?.message?.includes('403')) return false
    return true
  },
  
  // CONFIGURAÇÕES DE CACHE
  fallbackData: undefined,        // Sem fallback padrão
  keepPreviousData: true         // Mantém dados anteriores durante loading
}

/**
 * Configuração específica para dados críticos (transações principais)
 * Mesma estratégia, mas com cache um pouco mais agressivo
 */
export const SWR_CONFIG_DADOS_CRITICOS: SWRConfiguration = {
  ...SWR_CONFIG_OTIMIZADA,
  dedupingInterval: 3000,         // 3s para dados críticos
  refreshInterval: 600000,        // 10 minutos para dados mais importantes
}

/**
 * Configuração para dados auxiliares (categorias, formas pagamento)
 * Estes dados mudam raramente, então cache mais longo
 */
export const SWR_CONFIG_DADOS_AUXILIARES: SWRConfiguration = {
  ...SWR_CONFIG_OTIMIZADA,
  refreshInterval: 1800000,       // 30 minutos para dados auxiliares
  dedupingInterval: 30000,        // 30s - dados auxiliares podem ter cache maior
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