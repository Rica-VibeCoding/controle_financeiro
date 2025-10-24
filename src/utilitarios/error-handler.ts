interface AppError {
  code: string
  message: string
  details?: any
  timestamp: Date
}

export class ErrorHandler {
  static formatError(error: any): AppError {
    return {
      code: error.code || 'UNKNOWN_ERROR',
      message: error.message || 'Erro desconhecido',
      details: error.details || null,
      timestamp: new Date()
    }
  }

  static logError(error: AppError, context: string) {
    if (process.env.NODE_ENV === 'development') {
      console.group(`🚨 Erro em ${context}`)
      console.error('Código:', error.code)
      console.error('Mensagem:', error.message)
      console.error('Detalhes:', error.details)
      console.error('Timestamp:', error.timestamp.toISOString())
      console.groupEnd()
    }
    
    // Em produção, enviar para serviço de monitoramento
    // TODO: Integrar com Sentry, LogRocket, etc.
  }

  static getUserFriendlyMessage(error: AppError): string {
    const messages: Record<string, string> = {
      'NETWORK_ERROR': 'Problema de conexão. Tente novamente.',
      'AUTH_ERROR': 'Erro de autenticação. Faça login novamente.',
      'invalid_credentials': 'Email ou senha incorretos. Verifique seus dados.',
      'VALIDATION_ERROR': 'Dados inválidos. Verifique os campos.',
      'PERMISSION_ERROR': 'Você não tem permissão para esta ação.',
      'NOT_FOUND': 'Registro não encontrado.',
      'DUPLICATE_ERROR': 'Este registro já existe.',
      'UNKNOWN_ERROR': 'Erro inesperado. Tente novamente.'
    }

    return messages[error.code] || messages['UNKNOWN_ERROR']
  }
}

// Hook para usar tratamento de erros
export function useErrorHandler() {
  const showError = (error: any, context: string = 'Aplicação') => {
    const appError = ErrorHandler.formatError(error)
    ErrorHandler.logError(appError, context)

    // Mensagem já está sendo logada no console via logError()
    // Alert removido para melhor UX - erro aparece apenas no console
  }

  const handleAsync = async <T>(
    asyncFn: () => Promise<T>,
    context: string = 'Operação'
  ): Promise<{ data?: T; error?: AppError }> => {
    try {
      const data = await asyncFn()
      return { data }
    } catch (error) {
      const appError = ErrorHandler.formatError(error)
      ErrorHandler.logError(appError, context)
      return { error: appError }
    }
  }

  return { showError, handleAsync }
}

// Hook para toast/notifications (implementar depois)
export function useNotifications() {
  const showSuccess = (message: string) => {
    // TODO: Implementar toast success
    console.log(`✅ ${message}`)
  }

  const showError = (message: string) => {
    // TODO: Implementar toast error
    console.error(`❌ ${message}`)
  }

  const showWarning = (message: string) => {
    // TODO: Implementar toast warning
    console.warn(`⚠️ ${message}`)
  }

  return { showSuccess, showError, showWarning }
}