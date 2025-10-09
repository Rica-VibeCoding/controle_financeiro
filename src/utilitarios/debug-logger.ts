/**
 * Sistema de logging para debug
 * Emite eventos que o DebugPanel pode capturar
 */

type LogLevel = 'info' | 'warn' | 'error' | 'success' | 'lifecycle'

interface LogPayload {
  componente: string
  acao: string
  dados?: any
  timestamp?: string
}

export class DebugLogger {
  private static enabled = process.env.NODE_ENV === 'development'
  private static prefix = '[FinanceiroDebug]'

  static log(level: LogLevel, payload: LogPayload) {
    if (!this.enabled) return

    const { componente, acao, dados } = payload
    const timestamp = new Date().toISOString()

    // Log no console com cores
    const styles: Record<LogLevel, string> = {
      info: 'color: #3b82f6; font-weight: bold',
      warn: 'color: #f59e0b; font-weight: bold',
      error: 'color: #ef4444; font-weight: bold',
      success: 'color: #10b981; font-weight: bold',
      lifecycle: 'color: #8b5cf6; font-weight: bold'
    }

    const emoji: Record<LogLevel, string> = {
      info: 'ℹ️',
      warn: '⚠️',
      error: '❌',
      success: '✅',
      lifecycle: '🔄'
    }

    console.log(
      `%c${this.prefix} ${emoji[level]} [${componente}] ${acao}`,
      styles[level],
      dados ? dados : ''
    )

    // Emitir evento customizado para DebugPanel capturar
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('debugLog', {
          detail: {
            level,
            componente,
            acao,
            dados,
            timestamp
          }
        })
      )
    }
  }

  static lifecycle(componente: string, acao: string, dados?: any) {
    this.log('lifecycle', { componente, acao, dados })
  }

  static info(componente: string, acao: string, dados?: any) {
    this.log('info', { componente, acao, dados })
  }

  static warn(componente: string, acao: string, dados?: any) {
    this.log('warn', { componente, acao, dados })
  }

  static error(componente: string, acao: string, dados?: any) {
    this.log('error', { componente, acao, dados })
  }

  static success(componente: string, acao: string, dados?: any) {
    this.log('success', { componente, acao, dados })
  }

  // Rastrear performance
  static time(label: string) {
    if (!this.enabled) return
    console.time(`${this.prefix} ${label}`)
  }

  static timeEnd(label: string) {
    if (!this.enabled) return
    console.timeEnd(`${this.prefix} ${label}`)
  }

  // Rastrear mudanças de estado
  static trackStateChange(componente: string, estadoAntes: any, estadoDepois: any) {
    if (!this.enabled) return

    const mudancas: any = {}

    // Detectar o que mudou
    Object.keys({ ...estadoAntes, ...estadoDepois }).forEach(key => {
      if (estadoAntes[key] !== estadoDepois[key]) {
        mudancas[key] = {
          antes: estadoAntes[key],
          depois: estadoDepois[key]
        }
      }
    })

    if (Object.keys(mudancas).length > 0) {
      this.lifecycle(componente, 'Estado alterado', mudancas)
    }
  }
}
