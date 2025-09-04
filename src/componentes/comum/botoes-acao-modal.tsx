'use client'

import { Button } from '@/componentes/ui/button'
import { Skeleton } from '@/componentes/ui/skeleton'

interface BotoesAcaoModalProps {
  /** Função chamada ao cancelar */
  onCancelar: () => void
  /** Função chamada ao salvar */
  onSalvar: () => void
  /** Indica se está salvando */
  salvando: boolean
  /** Indica se o botão salvar deve estar desabilitado */
  desabilitarSalvar: boolean
  /** Texto customizado para o botão salvar */
  textoSalvar?: string
  /** Texto customizado para o botão cancelar */
  textoCancelar?: string
  /** Exibe skeleton loading */
  carregando?: boolean
  /** Variant do botão salvar */
  variantSalvar?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  /** Cor de fundo customizada quando salvando */
  corSalvando?: string
  /** Ícone personalizado para o botão salvar */
  iconeSalvar?: React.ReactNode
  /** Ícone personalizado para o botão cancelar */
  iconeCancelar?: React.ReactNode
  /** Classe CSS adicional para container */
  className?: string
  /** Orientação dos botões */
  orientacao?: 'horizontal' | 'vertical'
  /** Tamanho dos botões */
  tamanho?: 'sm' | 'md' | 'lg'
}

export function BotoesAcaoModal({
  onCancelar,
  onSalvar,
  salvando,
  desabilitarSalvar,
  textoSalvar = 'Salvar',
  textoCancelar = 'Cancelar',
  carregando = false,
  variantSalvar = 'default',
  corSalvando,
  iconeSalvar,
  iconeCancelar,
  className = '',
  orientacao = 'horizontal',
  tamanho = 'md'
}: BotoesAcaoModalProps) {
  
  if (carregando) {
    return (
      <div className={`flex ${orientacao === 'vertical' ? 'flex-col' : 'flex-row'} gap-3 ${className}`}>
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-24" />
      </div>
    )
  }

  const sizeBotao = tamanho === 'sm' ? 'sm' : tamanho === 'lg' ? 'lg' : 'default'
  
  const containerClass = orientacao === 'vertical' 
    ? `flex flex-col gap-3 ${className}` 
    : `flex flex-row gap-3 justify-end ${className}`

  return (
    <div className={containerClass}>
      {/* Botão Cancelar */}
      <Button
        type="button"
        variant="outline"
        size={sizeBotao}
        onClick={onCancelar}
        disabled={salvando}
        className={`${orientacao === 'vertical' ? 'w-full' : ''} transition-all duration-200 ${
          salvando ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'
        }`}
      >
        <span className="flex items-center gap-2">
          {iconeCancelar}
          {textoCancelar}
        </span>
      </Button>

      {/* Botão Salvar */}
      <Button
        type="button"
        variant={variantSalvar}
        size={sizeBotao}
        onClick={onSalvar}
        disabled={desabilitarSalvar || salvando}
        className={`${orientacao === 'vertical' ? 'w-full' : ''} transition-all duration-200 relative ${
          salvando ? 'cursor-not-allowed' : ''
        }`}
        style={salvando && corSalvando ? { backgroundColor: corSalvando } : {}}
      >
        <span className={`flex items-center gap-2 transition-opacity duration-200 ${
          salvando ? 'opacity-0' : 'opacity-100'
        }`}>
          {iconeSalvar}
          {textoSalvar}
        </span>
        
        {/* Loading spinner quando salvando */}
        {salvando && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex items-center gap-2 text-white">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span className="text-sm">Salvando...</span>
            </div>
          </div>
        )}
      </Button>
    </div>
  )
}