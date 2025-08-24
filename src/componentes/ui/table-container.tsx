'use client'

import { ReactNode } from 'react'
import { usarScrollHorizontal } from '@/hooks/usar-scroll-horizontal'
import { cn } from '@/utilitarios/cn'

interface TableContainerProps {
  children: ReactNode
  className?: string
}

export function TableContainer({ children, className }: TableContainerProps) {
  const { containerRef, canScrollLeft, canScrollRight } = usarScrollHorizontal()

  return (
    <div
      ref={containerRef}
      className={cn(
        'table-container',
        'border rounded-lg bg-white shadow-sm',
        'overflow-x-auto',
        {
          'scrollable-left': canScrollLeft,
          'scrollable-right': canScrollRight
        },
        className
      )}
      style={{
        WebkitOverflowScrolling: 'touch',
        scrollbarWidth: 'thin'
      }}
    >
      {children}
    </div>
  )
}