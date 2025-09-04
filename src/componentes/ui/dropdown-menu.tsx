'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Icone, type IconName } from '@/componentes/ui/icone'

interface DropdownMenuItem {
  label: string
  onClick: () => void
  icon?: IconName
  disabled?: boolean
  variant?: 'default' | 'destructive'
}

interface DropdownMenuProps {
  items: DropdownMenuItem[]
  trigger?: React.ReactNode
  disabled?: boolean
}

/**
 * Componente Dropdown Menu reutilizável
 * Baseado no padrão usado em MenuUsuario
 */
export function DropdownMenu({ items, trigger, disabled }: DropdownMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Fechar menu ao clicar fora
  const handleClickOutside = useCallback((event: MouseEvent) => {
    if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
      setIsOpen(false)
    }
  }, [])

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, handleClickOutside])

  const handleItemClick = (item: DropdownMenuItem) => {
    if (!item.disabled) {
      setIsOpen(false)
      item.onClick()
    }
  }

  const defaultTrigger = (
    <button
      onClick={() => setIsOpen(!isOpen)}
      disabled={disabled}
      className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
      aria-expanded={isOpen}
      aria-haspopup="true"
    >
      <Icone name="more-horizontal" className="w-4 h-4" />
    </button>
  )

  return (
    <div className="relative" ref={menuRef}>
      {trigger || defaultTrigger}

      {isOpen && (
        <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-50 animate-in slide-in-from-top-2 duration-150">
          <div className="py-1">
            {items.map((item, index) => (
              <button
                key={index}
                onClick={() => handleItemClick(item)}
                disabled={item.disabled}
                className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                  item.variant === 'destructive' 
                    ? 'text-red-600 hover:bg-red-50' 
                    : 'text-gray-700'
                }`}
              >
                {item.icon && <Icone name={item.icon} className="w-4 h-4" />}
                {item.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}