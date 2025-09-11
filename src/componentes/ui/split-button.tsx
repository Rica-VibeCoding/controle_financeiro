'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Button } from '@/componentes/ui/button'
import { Icone, type IconName } from '@/componentes/ui/icone'
import { cn } from '@/utilitarios/cn'
import { cva, type VariantProps } from 'class-variance-authority'

interface SplitButtonAction {
  label: string
  icon: IconName
  onClick: () => void
  disabled?: boolean
}

const splitButtonVariants = cva(
  "inline-flex rounded-md shadow-sm",
  {
    variants: {
      variant: {
        default: "",
        outline: "",
        secondary: "",
        destructive: ""
      },
      size: {
        default: "",
        sm: "",
        lg: ""
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
)

export interface SplitButtonProps extends VariantProps<typeof splitButtonVariants> {
  primaryLabel: string
  primaryIcon: IconName
  onPrimaryClick: () => void
  actions: SplitButtonAction[]
  disabled?: boolean
  className?: string
}

export function SplitButton({
  primaryLabel,
  primaryIcon,
  onPrimaryClick,
  actions,
  disabled = false,
  variant = "default",
  size = "default",
  className
}: SplitButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Fechar ao clicar fora
  const handleClickOutside = useCallback((event: MouseEvent) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
      setIsOpen(false)
    }
  }, [])

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, handleClickOutside])

  // Navegação por teclado
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen) return

      if (event.key === 'Escape') {
        setIsOpen(false)
        return
      }

      // Arrow Down/Up para navegar entre opções
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault()
        const buttons = dropdownRef.current?.querySelectorAll('[role="menuitem"]') as NodeListOf<HTMLButtonElement>
        if (!buttons.length) return

        const currentIndex = Array.from(buttons).findIndex(btn => btn === document.activeElement)
        let nextIndex = currentIndex

        if (event.key === 'ArrowDown') {
          nextIndex = currentIndex + 1 >= buttons.length ? 0 : currentIndex + 1
        } else if (event.key === 'ArrowUp') {
          nextIndex = currentIndex - 1 < 0 ? buttons.length - 1 : currentIndex - 1
        }

        buttons[nextIndex]?.focus()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  const handleItemClick = useCallback((action: SplitButtonAction) => {
    if (!action.disabled) {
      setIsOpen(false)
      action.onClick()
    }
  }, [])

  return (
    <div className={cn("relative", splitButtonVariants({ variant, size }), className)} ref={dropdownRef}>
      {/* Botão Principal */}
      <Button
        onClick={onPrimaryClick}
        disabled={disabled}
        variant={variant}
        size={size}
        className="rounded-r-none border-r-0"
      >
        <Icone name={primaryIcon} className="w-4 h-4 mr-2" />
        {primaryLabel}
      </Button>

      {/* Botão Dropdown */}
      <Button
        type="button"
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          setIsOpen(!isOpen)
        }}
        disabled={disabled}
        variant={variant}
        size={size}
        className={cn(
          "rounded-l-none px-2 border-l border-white/20",
          variant === "outline" && "border-l-gray-300"
        )}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label="Mais opções de transação"
      >
        <Icone 
          name="chevron-down" 
          className={cn(
            'w-4 h-4 transition-all duration-300 ease-in-out',
            isOpen && 'rotate-180 scale-110'
          )} 
        />
      </Button>

      {/* Menu Dropdown */}
      {isOpen && (
        <div 
          className={cn(
            "absolute top-full right-0 mt-2 w-max min-w-[160px] bg-white border border-gray-200 rounded-lg shadow-xl z-[9999]",
            "animate-slide-down-and-fade"
          )}
        >
          <div className="py-1.5">
            {actions.map((action, index) => (
              <button
                key={index}
                onClick={() => handleItemClick(action)}
                disabled={action.disabled}
                className={cn(
                  'w-full px-3 py-2.5 text-left font-medium text-sm text-gray-700',
                  'hover:bg-blue-50 hover:text-blue-700 focus:bg-blue-50 focus:text-blue-700 focus:outline-none',
                  'flex items-center gap-3 transition-all duration-200 ease-in-out',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                  'first:rounded-t-lg last:rounded-b-lg',
                  'transform hover:translate-x-2 hover:scale-[1.02]'
                )}
                role="menuitem"
                tabIndex={0}
                style={{
                  animationDelay: `${index * 100}ms`,
                  animation: `slide-down-and-fade 0.3s ease-out ${index * 100}ms both`
                }}
              >
                <Icone 
                  name={action.icon} 
                  className={cn(
                    "w-4 h-4 transition-all duration-200",
                    // Cores específicas por contexto
                    action.icon === 'credit-card' && "text-blue-600",
                    action.icon === 'arrow-left-right' && "text-green-600", 
                    action.icon === 'folder' && "text-purple-600",
                    // Fallback para outros ícones
                    !['credit-card', 'arrow-left-right', 'folder'].includes(action.icon) && "text-gray-500",
                    "hover:scale-110"
                  )} 
                />
                {action.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}