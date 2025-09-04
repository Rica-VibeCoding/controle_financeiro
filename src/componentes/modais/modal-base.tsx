'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/componentes/ui/card'
import { Button } from '@/componentes/ui/button'

interface ModalBaseProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl'
  fixedWidth?: string
  showCloseButton?: boolean
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl'
}

export function ModalBase({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = 'lg',
  fixedWidth,
  showCloseButton = true,
  size
}: ModalBaseProps) {
  // Estado para controlar transições
  const [shouldRender, setShouldRender] = useState(false)
  const [isVisible, setIsVisible] = useState(false)

  // Controlar montagem/desmontagem com delay para animação
  useEffect(() => {
    if (isOpen) {
      setShouldRender(true)
      // Double RAF garante que CSS foi aplicado antes da animação
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsVisible(true)
        })
      })
    } else {
      setIsVisible(false)
      // Aguardar animação terminar antes de desmontar
      const timer = setTimeout(() => {
        setShouldRender(false)
      }, 300) // Mesmo tempo da animação CSS
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  // Fechar com ESC
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEsc)
      document.body.style.overflow = 'hidden' // Prevenir scroll
    }

    return () => {
      document.removeEventListener('keydown', handleEsc)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  if (!shouldRender) return null

  const sizeClasses = {
    xs: 'max-w-xs',
    sm: 'max-w-sm',
    md: 'max-w-md', 
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl'
  }
  
  const currentMaxWidth = size || maxWidth
  const hasTitle = title && title.trim() !== ''

  const modal = (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className={`absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity duration-300 ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div 
        className={`relative mx-4 max-h-[95vh] overflow-auto transition-all duration-300 ease-out ${
          isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        } ${fixedWidth ? '' : `w-full ${sizeClasses[currentMaxWidth as keyof typeof sizeClasses]}`}`}
        style={fixedWidth ? { width: fixedWidth } : {}}
      >
        <Card className="w-full shadow-xl border border-gray-200 bg-white">
          {hasTitle && (
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg text-gray-900">{title}</CardTitle>
                {showCloseButton && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onClose}
                    className="h-8 w-8 p-0 text-gray-500 hover:bg-gray-100 hover:text-gray-700 rounded-full transition-colors"
                  >
                    ✕
                  </Button>
                )}
              </div>
            </CardHeader>
          )}
          
          {!hasTitle && showCloseButton && (
            <div className="absolute top-2 right-2 z-10">
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-8 w-8 p-0 hover:bg-gray-200 hover:text-gray-700 rounded-full"
              >
                ✕
              </Button>
            </div>
          )}
          
          <CardContent className={hasTitle ? '' : 'pt-4'}>
            {children}
          </CardContent>
        </Card>
      </div>
    </div>
  )

  // Renderizar via portal para evitar problemas de z-index
  return createPortal(modal, document.body)
}