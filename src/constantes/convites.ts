/**
 * Configurações do sistema de convites
 *
 * Centraliza todas as constantes relacionadas ao sistema de convites,
 * facilitando manutenção e ajustes de configuração.
 */

/**
 * Configurações principais do sistema de convites
 */
export const CONVITES_CONFIG = {
  /**
   * Número máximo de convites por dia por workspace
   * Em desenvolvimento: 50 para facilitar testes
   * Em produção: recomendado 10 para prevenir abuso
   */
  MAX_CONVITES_POR_DIA: 50,

  /**
   * Período de reset do contador de convites (24 horas em milissegundos)
   */
  PERIODO_RESET_MS: 24 * 60 * 60 * 1000,

  /**
   * Dias até expiração do convite
   */
  EXPIRACAO_DIAS: 7,

  /**
   * Tamanho do código do convite (caracteres)
   */
  TAMANHO_CODIGO: 6,

  /**
   * Caracteres permitidos no código do convite
   * Apenas letras maiúsculas e números para facilitar leitura
   */
  CARACTERES_CODIGO: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',

  /**
   * Expressão regular para validar formato do código
   */
  REGEX_CODIGO: /^[A-Z0-9]{6}$/
} as const

export type ConvitesConfig = typeof CONVITES_CONFIG
