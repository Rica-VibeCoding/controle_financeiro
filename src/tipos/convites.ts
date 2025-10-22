/**
 * Tipos centralizados para o sistema de convites
 *
 * Este arquivo define tipos TypeScript padronizados para:
 * - Resultados de operações (sucesso/erro)
 * - Entidades de domínio (convites, workspaces)
 * - Validações e rate limiting
 *
 * @module tipos/convites
 */

// ============================================================================
// TIPOS DE RESULTADO PADRONIZADOS
// ============================================================================

/**
 * Resultado de sucesso de uma operação
 * @template T - Tipo dos dados retornados
 */
export type ResultadoSucesso<T> = {
  success: true
  data: T
}

/**
 * Resultado de erro de uma operação
 */
export type ResultadoErro = {
  success: false
  error: string
  details?: unknown
}

/**
 * Resultado de uma operação assíncrona
 * Pode ser sucesso (com dados) ou erro (com mensagem)
 *
 * @template T - Tipo dos dados em caso de sucesso
 *
 * @example
 * ```typescript
 * function buscarUsuario(): Resultado<Usuario> {
 *   if (encontrado) {
 *     return { success: true, data: usuario }
 *   } else {
 *     return { success: false, error: 'Usuário não encontrado' }
 *   }
 * }
 * ```
 */
export type Resultado<T> = ResultadoSucesso<T> | ResultadoErro

// ============================================================================
// TIPOS DE DOMÍNIO - ENTIDADES
// ============================================================================

/**
 * Registro de convite na tabela fp_convites_links
 */
export type ConviteLink = {
  id: string
  workspace_id: string
  codigo: string
  criado_por: string
  ativo: boolean
  expires_at: string
  created_at: string
}

/**
 * Dados de um convite validado
 * Usado ao exibir informações do convite para o usuário
 */
export type DadosConvite = {
  codigo: string
  workspace: {
    id: string
    nome: string
  }
  criadorNome: string
}

// ============================================================================
// TIPOS DE RESULTADO ESPECÍFICOS
// ============================================================================

/**
 * Resultado da criação de um convite
 * Retorna link completo e código gerado
 */
export type ResultadoCriacaoConvite = Resultado<{
  link: string
  codigo: string
}>

/**
 * Resultado da validação de um convite
 * Retorna dados do convite se válido
 */
export type ResultadoValidacaoConvite = Resultado<DadosConvite>

/**
 * Resultado da aceitação de um convite
 * Retorna dados do workspace ao qual o usuário foi adicionado
 */
export type ResultadoAceitacaoConvite = Resultado<{
  workspaceId: string
  workspaceName: string
}>

// ============================================================================
// TIPOS DE VALIDAÇÃO
// ============================================================================

/**
 * Resultado de uma validação simples
 */
export type ValidacaoConvite = {
  valid: boolean
  error?: string
}

/**
 * Informações de rate limiting
 * Usado para controlar quantidade de convites criados
 */
export type RateLimitInfo = {
  convitesHoje: number
  limite: number
  resetEm: Date
}
