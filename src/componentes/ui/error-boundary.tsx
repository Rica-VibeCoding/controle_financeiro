'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { Button } from '@/componentes/ui/button'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('🚨 ErrorBoundary capturou erro:', error, errorInfo)
    
    // Log detalhado para debug
    const errorDetails = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString()
    }
    
    console.error('📊 Detalhes do erro:', errorDetails)
    
    // Chamar callback personalizado se fornecido
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }
  }

  render() {
    if (this.state.hasError) {
      // Usar fallback customizado se fornecido
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Fallback padrão
      return (
        <div className="flex items-center justify-center min-h-[400px] border border-red-200 rounded-lg bg-red-50">
          <div className="text-center space-y-4 p-8">
            <div className="text-6xl opacity-50">⚠️</div>
            <h3 className="text-lg font-medium text-red-800">
              Ops! Algo deu errado
            </h3>
            <p className="text-sm text-red-600 max-w-md">
              {this.state.error?.message || 'Erro inesperado na interface'}
            </p>
            
            {process.env.NODE_ENV === 'development' && (
              <details className="text-left">
                <summary className="cursor-pointer text-xs text-red-500 hover:text-red-700">
                  Detalhes técnicos (desenvolvimento)
                </summary>
                <pre className="mt-2 text-xs bg-red-100 p-2 rounded overflow-auto max-h-32">
                  {this.state.error?.stack}
                </pre>
              </details>
            )}
            
            <div className="flex gap-2 justify-center pt-2">
              <Button 
                variant="outline" 
                onClick={() => window.location.reload()}
                className="text-red-700 border-red-300 hover:bg-red-100"
              >
                Recarregar Página
              </Button>
              <Button 
                variant="outline"
                onClick={() => this.setState({ hasError: false, error: null })}
                className="text-red-700 border-red-300 hover:bg-red-100"
              >
                Tentar Novamente
              </Button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// Hook para reportar erros de componentes funcionais
export function useErrorHandler() {
  return (error: Error, errorInfo?: any) => {
    console.error('🚨 Erro capturado pelo hook:', error, errorInfo)
  }
}