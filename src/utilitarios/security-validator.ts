// Sistema de Validação e Sanitização de Segurança
import { createClient } from '@/servicos/supabase/auth-client'

// Rate Limiting em memória (para produção usar Redis/banco)
class RateLimiter {
  private static attempts: Map<string, { count: number; lastAttempt: number }> = new Map()
  private static readonly MAX_ATTEMPTS = 5
  private static readonly WINDOW_MS = 15 * 60 * 1000 // 15 minutos

  static checkRate(identifier: string): { allowed: boolean; remainingTime?: number } {
    const now = Date.now()
    const record = this.attempts.get(identifier)
    
    if (!record) {
      this.attempts.set(identifier, { count: 1, lastAttempt: now })
      return { allowed: true }
    }

    // Limpar registros antigos
    if (now - record.lastAttempt > this.WINDOW_MS) {
      this.attempts.set(identifier, { count: 1, lastAttempt: now })
      return { allowed: true }
    }

    if (record.count >= this.MAX_ATTEMPTS) {
      const remainingTime = this.WINDOW_MS - (now - record.lastAttempt)
      return { allowed: false, remainingTime }
    }

    record.count++
    record.lastAttempt = now
    return { allowed: true }
  }

  static reset(identifier: string): void {
    this.attempts.delete(identifier)
  }
}

// Sanitização de inputs
class InputSanitizer {
  static email(input: string): string {
    return input.toLowerCase().trim().replace(/[^a-zA-Z0-9@.\-_]/g, '')
  }

  static alphanumeric(input: string, maxLength: number = 50): string {
    return input.replace(/[^a-zA-Z0-9]/g, '').substring(0, maxLength)
  }

  static text(input: string, maxLength: number = 200): string {
    return input.trim().replace(/<[^>]*>/g, '').substring(0, maxLength)
  }

  static codigo(input: string): string {
    return input.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 6)
  }
}

// Validadores de formato
class FormatValidator {
  static email(email: string): boolean {
    const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
    return regex.test(email) && email.length <= 255
  }

  static password(password: string): { valid: boolean; errors: string[] } {
    const errors: string[] = []
    
    if (password.length < 6) {
      errors.push('Senha deve ter no mínimo 6 caracteres')
    }
    if (password.length > 128) {
      errors.push('Senha muito longa')
    }
    
    return { valid: errors.length === 0, errors }
  }

  static uuid(id: string): boolean {
    const regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    return regex.test(id)
  }

  static codigo(codigo: string): boolean {
    return /^[A-Z0-9]{6}$/.test(codigo)
  }
}

// Validador de permissões
export class PermissionValidator {
  static async canAccessWorkspace(userId: string, workspaceId: string): Promise<boolean> {
    try {
      if (!FormatValidator.uuid(userId) || !FormatValidator.uuid(workspaceId)) {
        return false
      }

      const supabase = createClient()
      const { data, error } = await supabase
        .from('fp_usuarios')
        .select('id')
        .eq('id', userId)
        .eq('workspace_id', workspaceId)
        .eq('ativo', true)
        .single()

      return !error && !!data
    } catch {
      return false
    }
  }

  static async isWorkspaceOwner(userId: string, workspaceId: string): Promise<boolean> {
    try {
      if (!FormatValidator.uuid(userId) || !FormatValidator.uuid(workspaceId)) {
        return false
      }

      const supabase = createClient()
      const { data, error } = await supabase
        .from('fp_usuarios')
        .select('role')
        .eq('id', userId)
        .eq('workspace_id', workspaceId)
        .eq('ativo', true)
        .single()

      return !error && data?.role === 'owner'
    } catch {
      return false
    }
  }

  static async isSuperAdmin(userId: string): Promise<boolean> {
    try {
      if (!FormatValidator.uuid(userId)) {
        return false
      }

      const supabase = createClient()
      const { data, error } = await supabase
        .from('fp_usuarios')
        .select('email')
        .eq('id', userId)
        .single()

      return !error && data?.email === 'conectamovelmar@gmail.com'
    } catch {
      return false
    }
  }
}

// Validador principal de autenticação
export class AuthValidator {
  static async validateLogin(email: string, password: string): Promise<{
    valid: boolean
    errors: string[]
    rateLimited?: boolean
    remainingTime?: number
  }> {
    const errors: string[] = []
    
    // Sanitizar inputs
    const cleanEmail = InputSanitizer.email(email)
    
    // Rate limiting por IP/email
    const rateCheck = RateLimiter.checkRate(`login:${cleanEmail}`)
    if (!rateCheck.allowed) {
      return {
        valid: false,
        errors: ['Muitas tentativas. Tente novamente em alguns minutos.'],
        rateLimited: true,
        remainingTime: rateCheck.remainingTime
      }
    }
    
    // Validar formato
    if (!FormatValidator.email(cleanEmail)) {
      errors.push('Email inválido')
    }
    
    const passwordCheck = FormatValidator.password(password)
    if (!passwordCheck.valid) {
      errors.push(...passwordCheck.errors)
    }
    
    return { valid: errors.length === 0, errors }
  }

  static async validateRegistration(email: string, password: string, nome: string): Promise<{
    valid: boolean
    errors: string[]
  }> {
    const errors: string[] = []
    
    // Sanitizar inputs
    const cleanEmail = InputSanitizer.email(email)
    const cleanNome = InputSanitizer.text(nome, 100)
    
    // Validar formato
    if (!FormatValidator.email(cleanEmail)) {
      errors.push('Email inválido')
    }
    
    const passwordCheck = FormatValidator.password(password)
    if (!passwordCheck.valid) {
      errors.push(...passwordCheck.errors)
    }
    
    if (cleanNome.length < 2) {
      errors.push('Nome deve ter no mínimo 2 caracteres')
    }
    
    return { valid: errors.length === 0, errors }
  }

  static resetRateLimit(email: string): void {
    const cleanEmail = InputSanitizer.email(email)
    RateLimiter.reset(`login:${cleanEmail}`)
  }
}

// Sistema de logs de segurança
export class SecurityLogger {
  static async logSecurityEvent(event: {
    type: 'login_attempt' | 'failed_login' | 'permission_denied' | 'suspicious_activity'
    userId?: string
    email?: string
    ip?: string
    userAgent?: string
    details?: any
  }) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('🔒 SECURITY EVENT:', {
        ...event,
        timestamp: new Date().toISOString()
      })
    }
    
    // TODO: Em produção, salvar em tabela de logs de segurança
    // ou enviar para serviço de monitoramento
  }
}

// Exportações
export {
  RateLimiter,
  InputSanitizer,
  FormatValidator
}