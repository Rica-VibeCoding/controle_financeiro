'use client'

import { useState, useEffect } from 'react'
import { cn } from '@/utilitarios/cn'

export interface Toast {
  id: string
  title?: string
  description?: string
  variant?: 'default' | 'success' | 'error' | 'warning'
  duration?: number
}

interface ToastProps {
  toast: Toast
  onRemove: (id: string) => void
}

export function ToastComponent({ toast, onRemove }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onRemove(toast.id)
    }, toast.duration || 5000)

    return () => clearTimeout(timer)
  }, [toast.id, toast.duration, onRemove])

  const variantStyles = {
    default: 'bg-white border-gray-200',
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800'
  }

  const icons = {
    default: '📄',
    success: '✅',
    error: '❌', 
    warning: '⚠️'
  }

  return (
    <div
      className={cn(
        'pointer-events-auto w-full max-w-sm rounded-lg border p-4 shadow-lg transition-all',
        'animate-in slide-in-from-right-full',
        variantStyles[toast.variant || 'default']
      )}
    >
      <div className="flex items-start gap-3">
        <span className="text-lg">
          {icons[toast.variant || 'default']}
        </span>
        <div className="flex-1">
          {toast.title && (
            <div className="font-semibold text-sm">
              {toast.title}
            </div>
          )}
          {toast.description && (
            <div className="text-sm opacity-90">
              {toast.description}
            </div>
          )}
        </div>
        <button
          onClick={() => onRemove(toast.id)}
          className="text-sm opacity-50 hover:opacity-100 transition-opacity"
        >
          ✕
        </button>
      </div>
    </div>
  )
}

interface ToasterProps {
  toasts: Toast[]
  onRemove: (id: string) => void
}

export function Toaster({ toasts, onRemove }: ToasterProps) {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <ToastComponent
          key={toast.id}
          toast={toast}
          onRemove={onRemove}
        />
      ))}
    </div>
  )
}