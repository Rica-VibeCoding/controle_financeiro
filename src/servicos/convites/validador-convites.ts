/**
 * Validador e Rate Limiter para Sistema de Convites
 * Implementa validações de segurança e controle de taxa
 */

interface RateLimitData {
  count: number
  firstAttempt: number
  lastAttempt: number
}

interface ValidationResult {
  valid: boolean
  error?: string
}

/**
 * Classe para gerenciar rate limiting de convites
 *
 * Controla o número de convites que podem ser criados por workspace em um
 * período de 24 horas. Limite: 50 convites/dia (desenvolvimento) ou 10 (produção).
 * Usa localStorage para persistir dados entre sessões.
 *
 * @example
 * ```typescript
 * // Verificar se pode criar convite
 * const resultado = ConviteRateLimiter.podecriarConvite('workspace-uuid')
 * if (resultado.valid) {
 *   // Criar convite
 *   ConviteRateLimiter.registrarConvite('workspace-uuid')
 * }
 * ```
 */
export class ConviteRateLimiter {
  private static STORAGE_KEY = 'fp_convites_rate_limit'
  private static MAX_CONVITES_POR_DIA = 50 // Aumentado para desenvolvimento
  private static RESET_PERIOD_MS = 24 * 60 * 60 * 1000 // 24 horas

  /**
   * Verifica se pode criar novo convite
   */
  static podecriarConvite(workspaceId: string): ValidationResult {
    if (typeof window === 'undefined') {
      return { valid: true } // Skip no servidor
    }

    const key = `${this.STORAGE_KEY}_${workspaceId}`
    const dataStr = localStorage.getItem(key)
    
    if (!dataStr) {
      return { valid: true }
    }

    try {
      const data: RateLimitData = JSON.parse(dataStr)
      const agora = Date.now()
      
      // Reset se passou o período
      if (agora - data.firstAttempt > this.RESET_PERIOD_MS) {
        localStorage.removeItem(key)
        return { valid: true }
      }

      // Verificar limite
      if (data.count >= this.MAX_CONVITES_POR_DIA) {
        const horasRestantes = Math.ceil(
          (this.RESET_PERIOD_MS - (agora - data.firstAttempt)) / (60 * 60 * 1000)
        )
        return { 
          valid: false, 
          error: `Limite de ${this.MAX_CONVITES_POR_DIA} convites por dia atingido. Tente novamente em ${horasRestantes} horas.`
        }
      }

      return { valid: true }
    } catch {
      return { valid: true }
    }
  }

  /**
   * Registra criação de convite
   */
  static registrarConvite(workspaceId: string): void {
    if (typeof window === 'undefined') return

    const key = `${this.STORAGE_KEY}_${workspaceId}`
    const dataStr = localStorage.getItem(key)
    const agora = Date.now()
    
    let data: RateLimitData

    if (!dataStr) {
      data = {
        count: 1,
        firstAttempt: agora,
        lastAttempt: agora
      }
    } else {
      try {
        data = JSON.parse(dataStr)
        
        // Reset se passou o período
        if (agora - data.firstAttempt > this.RESET_PERIOD_MS) {
          data = {
            count: 1,
            firstAttempt: agora,
            lastAttempt: agora
          }
        } else {
          data.count++
          data.lastAttempt = agora
        }
      } catch {
        data = {
          count: 1,
          firstAttempt: agora,
          lastAttempt: agora
        }
      }
    }

    localStorage.setItem(key, JSON.stringify(data))
  }

  /**
   * Limpa rate limit (para testes ou admin)
   */
  static limparRateLimit(workspaceId: string): void {
    if (typeof window === 'undefined') return
    const key = `${this.STORAGE_KEY}_${workspaceId}`
    localStorage.removeItem(key)
  }
}

/**
 * Validador de código de convite
 *
 * Gerencia validação, geração e formatação de códigos de convite.
 * Códigos são compostos por 6 caracteres alfanuméricos maiúsculos (A-Z, 0-9).
 *
 * @example
 * ```typescript
 * // Gerar código
 * const codigo = ValidadorCodigoConvite.gerarCodigo() // "ABC123"
 *
 * // Validar formato
 * const validacao = ValidadorCodigoConvite.validarFormato(codigo)
 * if (validacao.valid) {
 *   console.log('Código válido')
 * }
 *
 * // Formatar para exibição
 * const formatado = ValidadorCodigoConvite.formatarCodigo('ABC123') // "ABC-123"
 * ```
 */
export class ValidadorCodigoConvite {
  // Formato: 6 caracteres alfanuméricos maiúsculos
  private static REGEX_CODIGO = /^[A-Z0-9]{6}$/

  /**
   * Valida formato do código
   */
  static validarFormato(codigo: string): ValidationResult {
    if (!codigo) {
      return { valid: false, error: 'Código não pode estar vazio' }
    }

    const codigoUpper = codigo.toUpperCase().trim()
    
    if (!this.REGEX_CODIGO.test(codigoUpper)) {
      return { 
        valid: false, 
        error: 'Código deve ter 6 caracteres alfanuméricos' 
      }
    }

    return { valid: true }
  }

  /**
   * Gera código válido
   */
  static gerarCodigo(): string {
    const caracteres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let codigo = ''
    
    for (let i = 0; i < 6; i++) {
      codigo += caracteres.charAt(Math.floor(Math.random() * caracteres.length))
    }
    
    return codigo
  }

  /**
   * Formata código para exibição
   */
  static formatarCodigo(codigo: string): string {
    const codigoUpper = codigo.toUpperCase().trim()
    // Adiciona hífen no meio para facilitar leitura: ABC-123
    if (codigoUpper.length === 6) {
      return `${codigoUpper.slice(0, 3)}-${codigoUpper.slice(3)}`
    }
    return codigoUpper
  }

  /**
   * Remove formatação do código
   */
  static limparCodigo(codigo: string): string {
    return codigo.toUpperCase().replace(/[^A-Z0-9]/g, '').trim()
  }
}

/**
 * Validador de dados de convite
 *
 * Valida dados relacionados a convites, incluindo workspace ID,
 * expiração de convites e dados de aceitação.
 *
 * @example
 * ```typescript
 * // Validar criação de convite
 * const validacao = ValidadorDadosConvite.validarCriacao('workspace-uuid')
 * if (!validacao.valid) {
 *   console.error(validacao.error)
 * }
 *
 * // Validar expiração
 * const expiracao = ValidadorDadosConvite.validarExpiracao('2025-12-31')
 * if (!expiracao.valid) {
 *   console.log('Convite expirado')
 * }
 * ```
 */
export class ValidadorDadosConvite {
  /**
   * Valida dados antes de criar convite
   */
  static validarCriacao(workspaceId: string): ValidationResult {
    if (!workspaceId) {
      return { valid: false, error: 'Workspace ID é obrigatório' }
    }

    // Validar formato UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(workspaceId)) {
      return { valid: false, error: 'Workspace ID inválido' }
    }

    return { valid: true }
  }

  /**
   * Valida se convite ainda é válido
   */
  static validarExpiracao(expiresAt: string | Date): ValidationResult {
    if (!expiresAt) {
      return { valid: false, error: 'Data de expiração inválida' }
    }

    const dataExpiracao = typeof expiresAt === 'string' 
      ? new Date(expiresAt) 
      : expiresAt

    if (!dataExpiracao || isNaN(dataExpiracao.getTime())) {
      return { valid: false, error: 'Data de expiração inválida' }
    }

    if (dataExpiracao <= new Date()) {
      return { valid: false, error: 'Convite expirado' }
    }

    return { valid: true }
  }

  /**
   * Valida se usuário pode aceitar convite
   */
  static validarAceitacao(
    userId: string,
    workspaceId: string,
    usuarioJaNoWorkspace: boolean
  ): ValidationResult {
    if (!userId) {
      return { valid: false, error: 'Usuário não autenticado' }
    }

    if (!workspaceId) {
      return { valid: false, error: 'Workspace inválido' }
    }

    if (usuarioJaNoWorkspace) {
      return { valid: false, error: 'Você já é membro deste workspace' }
    }

    return { valid: true }
  }
}

/**
 * Sanitizador de dados de convites
 *
 * Remove caracteres perigosos e normaliza dados de entrada para
 * prevenir injeção de código e garantir segurança dos dados.
 *
 * @example
 * ```typescript
 * // Sanitizar código
 * const codigoLimpo = SanitizadorConvite.sanitizarCodigo(' abc-123 ') // "ABC123"
 *
 * // Sanitizar dados de usuário
 * const dadosLimpos = SanitizadorConvite.sanitizarDadosUsuario({
 *   id: 'uuid',
 *   nome: '<script>alert("xss")</script>João',
 *   role: 'admin'
 * })
 * // { id: 'uuid', nome: 'João', role: 'member' }
 * ```
 */
export class SanitizadorConvite {
  /**
   * Sanitiza código de convite
   */
  static sanitizarCodigo(codigo: string): string {
    return ValidadorCodigoConvite.limparCodigo(codigo)
  }

  /**
   * Sanitiza dados do usuário
   */
  static sanitizarDadosUsuario(dados: any): any {
    return {
      id: dados.id,
      workspace_id: dados.workspace_id,
      nome: this.sanitizarTexto(dados.nome || 'Usuário'),
      role: dados.role === 'owner' ? 'owner' : 'member',
      ativo: Boolean(dados.ativo)
    }
  }

  /**
   * Sanitiza texto removendo caracteres perigosos
   */
  private static sanitizarTexto(texto: string): string {
    return texto
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<[^>]+>/g, '')
      .trim()
      .slice(0, 255) // Limita tamanho
  }
}

/**
 * Função helper para validação completa
 */
export function validarConviteCompleto(
  acao: 'criar' | 'aceitar',
  dados: any
): ValidationResult {
  if (acao === 'criar') {
    // Validar criação
    const validacaoDados = ValidadorDadosConvite.validarCriacao(dados.workspaceId)
    if (!validacaoDados.valid) return validacaoDados

    // Verificar rate limit
    const rateLimitCheck = ConviteRateLimiter.podecriarConvite(dados.workspaceId)
    if (!rateLimitCheck.valid) return rateLimitCheck

    return { valid: true }
  }

  if (acao === 'aceitar') {
    // Validar código
    const validacaoCodigo = ValidadorCodigoConvite.validarFormato(dados.codigo)
    if (!validacaoCodigo.valid) return validacaoCodigo

    // Validar expiração se fornecida
    if (dados.expiresAt) {
      const validacaoExpiracao = ValidadorDadosConvite.validarExpiracao(dados.expiresAt)
      if (!validacaoExpiracao.valid) return validacaoExpiracao
    }

    return { valid: true }
  }

  return { valid: false, error: 'Ação inválida' }
}