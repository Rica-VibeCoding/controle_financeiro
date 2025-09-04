'use client'

import Link from 'next/link'
import { Icone } from './icone'

export interface BreadcrumbItem {
  href?: string
  label: string
  current?: boolean
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[]
  className?: string
}

export function Breadcrumbs({ items, className = '' }: BreadcrumbsProps) {
  return (
    <nav className={`flex ${className}`} aria-label="Breadcrumb">
      <ol className="flex items-center space-x-2 text-sm">
        {items.map((item, index) => (
          <li key={index} className="flex items-center">
            {index > 0 && (
              <Icone 
                name="chevron-right" 
                className="w-4 h-4 text-muted-foreground mx-2" 
                aria-hidden="true" 
              />
            )}
            
            {item.current || !item.href ? (
              <span 
                className="font-medium text-foreground" 
                aria-current={item.current ? 'page' : undefined}
              >
                {item.label}
              </span>
            ) : (
              <Link
                href={item.href}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {item.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}

// Hook para facilitar o uso com rotas
export function useBreadcrumbs(pathname: string): BreadcrumbItem[] {
  if (pathname.startsWith('/configuracoes/usuarios')) {
    return [
      { href: '/', label: 'Início' },
      { href: '/configuracoes', label: 'Configurações' },
      { label: 'Usuários', current: true }
    ]
  }
  
  if (pathname === '/configuracoes') {
    return [
      { href: '/', label: 'Início' },
      { label: 'Configurações', current: true }
    ]
  }
  
  return [
    { href: '/', label: 'Início' },
    { label: 'Página', current: true }
  ]
}