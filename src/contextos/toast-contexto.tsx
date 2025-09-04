'use client'

import React, { createContext, useContext } from 'react'
import { usarToast } from '@/hooks/usar-toast'
import { Toaster } from '@/componentes/ui/toast'

interface ToastContextType {
  toast: (props: { title?: string; description?: string; variant?: 'default' | 'success' | 'error' | 'warning'; duration?: number }) => void
  sucesso: (title: string, description?: string) => void
  erro: (title: string, description?: string) => void
  aviso: (title: string, description?: string) => void
  info: (title: string, description?: string) => void
}

const ToastContext = createContext<ToastContextType | null>(null)

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast deve ser usado dentro de ToastProvider')
  }
  return context
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const { toasts, toast, sucesso, erro, aviso, info, removerToast } = usarToast()

  return (
    <ToastContext.Provider value={{ toast, sucesso, erro, aviso, info }}>
      {children}
      <Toaster toasts={toasts} onRemove={removerToast} />
    </ToastContext.Provider>
  )
}