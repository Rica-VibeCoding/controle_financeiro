'use client'

import { useState } from 'react'
import { AlertTriangle, Info, CheckCircle, XCircle } from 'lucide-react'
import { Button } from './button'

interface ConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  type?: 'danger' | 'warning' | 'info' | 'success'
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  type = 'warning'
}: ConfirmDialogProps) {
  if (!isOpen) return null

  const getIcon = () => {
    const iconProps = { size: 24 }
    switch (type) {
      case 'danger':
        return <XCircle {...iconProps} className="text-red-600" />
      case 'warning':
        return <AlertTriangle {...iconProps} className="text-yellow-600" />
      case 'info':
        return <Info {...iconProps} className="text-blue-600" />
      case 'success':
        return <CheckCircle {...iconProps} className="text-green-600" />
    }
  }

  const getButtonVariant = () => {
    switch (type) {
      case 'danger':
        return 'destructive'
      case 'warning':
        return 'default'
      case 'info':
        return 'default'
      case 'success':
        return 'default'
      default:
        return 'default'
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Dialog */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        <div className="flex items-start gap-4">
          {getIcon()}
          <div className="flex-1">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {title}
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              {description}
            </p>
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={onClose}
              >
                {cancelText}
              </Button>
              <Button
                variant={getButtonVariant()}
                onClick={() => {
                  onConfirm()
                  onClose()
                }}
              >
                {confirmText}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Hook para usar o dialog
export function useConfirmDialog() {
  const [dialog, setDialog] = useState<{
    isOpen: boolean
    title: string
    description: string
    onConfirm: () => void
    type?: 'danger' | 'warning' | 'info' | 'success'
    confirmText?: string
    cancelText?: string
  }>({
    isOpen: false,
    title: '',
    description: '',
    onConfirm: () => {}
  })

  const confirm = (options: {
    title: string
    description: string
    onConfirm: () => void
    type?: 'danger' | 'warning' | 'info' | 'success'
    confirmText?: string
    cancelText?: string
  }) => {
    setDialog({
      ...options,
      isOpen: true
    })
  }

  const close = () => {
    setDialog(prev => ({ ...prev, isOpen: false }))
  }

  const ConfirmDialogComponent = () => (
    <ConfirmDialog
      isOpen={dialog.isOpen}
      onClose={close}
      onConfirm={dialog.onConfirm}
      title={dialog.title}
      description={dialog.description}
      type={dialog.type}
      confirmText={dialog.confirmText}
      cancelText={dialog.cancelText}
    />
  )

  return {
    confirm,
    ConfirmDialog: ConfirmDialogComponent
  }
}