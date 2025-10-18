'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/componentes/ui/card'
import { LucideIcon } from 'lucide-react'
import { ReactNode } from 'react'

// ===== TIPOS =====

export interface CardKPIBaseProps {
  /**
   * Título do KPI (ex: "Variação Total", "Taxa de Acerto")
   */
  titulo: string

  /**
   * Valor principal do KPI (formatado externamente)
   * Pode ser string formatada ou ReactNode para casos complexos
   */
  valor: string | number | ReactNode

  /**
   * Ícone do Lucide React
   */
  icone?: LucideIcon

  /**
   * Descrição/subtítulo abaixo do valor
   */
  descricao?: string

  /**
   * Classe CSS para cor do valor (ex: "text-green-600")
   */
  corValor?: string

  /**
   * Cor da borda lateral (ex: "border-l-blue-500")
   */
  corBorda?: string

  /**
   * Se está carregando
   */
  isLoading?: boolean

  /**
   * Conteúdo customizado adicional (renderizado abaixo da descrição)
   */
  children?: ReactNode

  /**
   * Classes CSS adicionais para o card
   */
  className?: string

  /**
   * Variante visual do card
   */
  variante?: 'padrao' | 'compacto' | 'destaque'
}

// ===== COMPONENTE =====

/**
 * Componente Base para Cards KPI
 *
 * Componente reutilizável para exibir KPIs (Key Performance Indicators)
 * em dashboards e relatórios.
 *
 * @example
 * // Uso básico
 * <CardKPIBase
 *   titulo="Variação Total"
 *   valor="+12,5%"
 *   icone={TrendingUp}
 *   descricao="Previsto vs Realizado"
 *   corValor="text-green-600"
 *   corBorda="border-l-blue-500"
 * />
 *
 * @example
 * // Com loading
 * <CardKPIBase
 *   titulo="Taxa de Acerto"
 *   valor="85,3%"
 *   icone={Target}
 *   isLoading={true}
 * />
 *
 * @example
 * // Variante compacta
 * <CardKPIBase
 *   titulo="Saldo"
 *   valor="R$ 1.234,56"
 *   variante="compacto"
 * />
 */
export function CardKPIBase({
  titulo,
  valor,
  icone: Icone,
  descricao,
  corValor = 'text-gray-900',
  corBorda,
  isLoading = false,
  children,
  className = '',
  variante = 'padrao'
}: CardKPIBaseProps) {
  // Classes base por variante
  const varianteClasses = {
    padrao: {
      card: 'border-l-4',
      header: 'pb-3',
      titulo: 'text-sm font-medium text-gray-600',
      valor: 'text-2xl font-bold',
      descricao: 'text-sm text-gray-600'
    },
    compacto: {
      card: 'border-l-2',
      header: 'pb-2',
      titulo: 'text-xs font-medium text-gray-600',
      valor: 'text-xl font-bold',
      descricao: 'text-xs text-gray-600'
    },
    destaque: {
      card: 'border-l-4 shadow-md',
      header: 'pb-4',
      titulo: 'text-base font-semibold text-gray-700',
      valor: 'text-3xl font-bold',
      descricao: 'text-sm text-gray-600'
    }
  }

  const classes = varianteClasses[variante]

  // Estado de loading
  if (isLoading) {
    return (
      <Card className={`${classes.card} ${corBorda || 'border-l-gray-300'} ${className} animate-pulse`}>
        <CardHeader className={classes.header}>
          <div className="h-4 bg-gray-200 rounded w-32" />
        </CardHeader>
        <CardContent>
          <div className="h-8 bg-gray-200 rounded w-24 mb-1" />
          <div className="h-4 bg-gray-200 rounded w-20" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={`${classes.card} ${corBorda || 'border-l-gray-300'} ${className}`}>
      <CardHeader className={classes.header}>
        <CardTitle className={`${classes.titulo} flex items-center gap-2`}>
          {Icone && <Icone className="h-4 w-4" />}
          {titulo}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          {/* Valor Principal */}
          <div className={`${classes.valor} ${corValor}`}>
            {typeof valor === 'string' || typeof valor === 'number' ? (
              <p>{valor}</p>
            ) : (
              valor
            )}
          </div>

          {/* Descrição */}
          {descricao && (
            <p className={classes.descricao}>{descricao}</p>
          )}

          {/* Conteúdo Customizado */}
          {children && (
            <div className="mt-2">
              {children}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// ===== COMPONENTE DE GRID =====

export interface CardKPIGridProps {
  /**
   * Número de colunas no grid (padrão: 3)
   */
  colunas?: 1 | 2 | 3 | 4

  /**
   * Espaçamento entre cards (padrão: 4)
   */
  gap?: 2 | 4 | 6 | 8

  /**
   * Margem inferior do grid (padrão: 6)
   */
  marginBottom?: 4 | 6 | 8

  /**
   * Cards KPI a serem renderizados
   */
  children: ReactNode

  /**
   * Classes CSS adicionais
   */
  className?: string
}

/**
 * Grid responsivo para Cards KPI
 *
 * Container que organiza múltiplos CardKPIBase em um grid responsivo.
 *
 * @example
 * <CardKPIGrid colunas={3} gap={4}>
 *   <CardKPIBase titulo="KPI 1" valor="100" />
 *   <CardKPIBase titulo="KPI 2" valor="200" />
 *   <CardKPIBase titulo="KPI 3" valor="300" />
 * </CardKPIGrid>
 */
export function CardKPIGrid({
  colunas = 3,
  gap = 4,
  marginBottom = 6,
  children,
  className = ''
}: CardKPIGridProps) {
  const colsClass = {
    1: 'md:grid-cols-1',
    2: 'md:grid-cols-2',
    3: 'md:grid-cols-3',
    4: 'md:grid-cols-4'
  }[colunas]

  const gapClass = `gap-${gap}`
  const mbClass = `mb-${marginBottom}`

  return (
    <div className={`grid grid-cols-1 ${colsClass} ${gapClass} ${mbClass} ${className}`}>
      {children}
    </div>
  )
}

// ===== VARIANTES PRÉ-CONFIGURADAS =====

/**
 * Card KPI de Loading (skeleton)
 */
export function CardKPILoading({ titulo, icone }: Pick<CardKPIBaseProps, 'titulo' | 'icone'>) {
  return (
    <CardKPIBase
      titulo={titulo}
      valor=""
      icone={icone}
      isLoading={true}
    />
  )
}

/**
 * Card KPI Compacto (para dashboards com muitos KPIs)
 */
export function CardKPICompacto(props: Omit<CardKPIBaseProps, 'variante'>) {
  return <CardKPIBase {...props} variante="compacto" />
}

/**
 * Card KPI de Destaque (para KPIs principais)
 */
export function CardKPIDestaque(props: Omit<CardKPIBaseProps, 'variante'>) {
  return <CardKPIBase {...props} variante="destaque" />
}

// ===== HELPERS =====

/**
 * Renderiza múltiplos cards KPI de loading
 *
 * @param count - Número de cards skeleton
 * @returns Array de cards loading
 *
 * @example
 * {isLoading ? renderKPILoadings(3) : <CardsReais />}
 */
export function renderKPILoadings(count: number = 3): ReactNode[] {
  return Array.from({ length: count }, (_, i) => (
    <Card key={i} className="border-l-4 border-l-gray-300 animate-pulse">
      <CardHeader className="pb-3">
        <div className="h-4 bg-gray-200 rounded w-32" />
      </CardHeader>
      <CardContent>
        <div className="h-8 bg-gray-200 rounded w-24 mb-1" />
        <div className="h-4 bg-gray-200 rounded w-20" />
      </CardContent>
    </Card>
  ))
}
