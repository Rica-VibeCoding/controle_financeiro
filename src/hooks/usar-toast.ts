'use client'

import { useState, useCallback } from 'react'

export interface Toast {
  id: string
  title?: string
  description?: string
  variant?: 'default' | 'success' | 'error' | 'warning'
  duration?: number
}

export function usarToast() {
  const [toasts, setToasts] = useState<Toast[]>([])

  const adicionarToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9)
    setToasts((prev) => [...prev, { ...toast, id }])
  }, [])

  const removerToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  const toast = useCallback((props: Omit<Toast, 'id'>) => {
    adicionarToast(props)
  }, [adicionarToast])

  // Métodos de conveniência
  const sucesso = useCallback((title: string, description?: string) => {
    toast({ title, description, variant: 'success' })
  }, [toast])

  const erro = useCallback((title: string, description?: string) => {
    toast({ title, description, variant: 'error' })
  }, [toast])

  const aviso = useCallback((title: string, description?: string) => {
    toast({ title, description, variant: 'warning' })
  }, [toast])

  const info = useCallback((title: string, description?: string) => {
    toast({ title, description, variant: 'default' })
  }, [toast])

  return {
    toasts,
    toast,
    sucesso,
    erro,
    aviso,
    info,
    removerToast
  }
}