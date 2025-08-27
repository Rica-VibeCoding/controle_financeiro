'use client'

import { forwardRef } from 'react'
import { Input } from './input'
import { cn } from '@/utilitarios/cn'

export interface DateInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Permite limpar o valor com botão X */
  clearable?: boolean
  /** Função chamada quando o valor é limpo */
  onClear?: () => void
}

/**
 * Componente de input para datas com opção de limpeza
 * Resolve problema de campos date no mobile que não permitem remoção fácil do valor
 * 
 * @component
 * @example
 * ```tsx
 * <DateInput
 *   value={data}
 *   onChange={(e) => setData(e.target.value)}
 *   clearable
 *   onClear={() => setData('')}
 * />
 * ```
 */
const DateInput = forwardRef<HTMLInputElement, DateInputProps>(
  ({ className, clearable = true, onClear, value, ...props }, ref) => {
    const temValor = value && value !== ''

    return (
      <div className="relative">
        <Input
          type="date"
          className={cn(
            // Espaço extra para o botão X quando há valor
            temValor && clearable ? 'pr-10' : '',
            className
          )}
          value={value}
          ref={ref}
          {...props}
        />
        
        {/* Botão X para limpar - só aparece quando há valor e é clearable */}
        {temValor && clearable && (
          <button
            type="button"
            onClick={() => {
              onClear?.()
              // Se não tem onClear customizado, dispara o onChange padrão
              if (!onClear && props.onChange) {
                const syntheticEvent = {
                  target: { value: '' },
                  currentTarget: { value: '' }
                } as React.ChangeEvent<HTMLInputElement>
                props.onChange(syntheticEvent)
              }
            }}
            className={cn(
              "absolute right-2 top-1/2 -translate-y-1/2",
              "w-5 h-5 flex items-center justify-center rounded-full",
              "text-gray-400 hover:text-gray-600 hover:bg-gray-100",
              "focus:outline-none focus:ring-1 focus:ring-blue-500",
              "transition-colors duration-150",
              // Garantir que fica por cima do input
              "z-10"
            )}
            aria-label="Limpar data"
            title="Limpar data"
          >
            <span className="text-sm font-medium">×</span>
          </button>
        )}
      </div>
    )
  }
)

DateInput.displayName = "DateInput"

export { DateInput }