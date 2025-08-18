'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { cn } from '@/utilitarios/cn'

const menuItems = [
  {
    title: 'Dashboard',
    href: '/',
    icon: '📊'
  },
  {
    title: 'Transações',
    href: '/transacoes',
    icon: '💳'
  },
  {
    title: 'Metas',
    href: '/metas',
    icon: '🎯'
  },
  {
    title: 'Relatórios',
    href: '/relatorios',
    icon: '📈'
  }
]

const cadastroItems = [
  {
    title: 'Contas',
    href: '/contas',
    icon: '🏦'
  },
  {
    title: 'Categorias',
    href: '/categorias',
    icon: '🏷️'
  },
  {
    title: 'Subcategorias',
    href: '/subcategorias',
    icon: '🏷️'
  },
  {
    title: 'Formas de Pagamento',
    href: '/formas-pagamento',
    icon: '💳'
  },
  {
    title: 'Centros de Custo',
    href: '/centros-custo',
    icon: '📂'
  }
]

export function Sidebar() {
  const pathname = usePathname()
  
  // Verificar se alguma página de cadastro está ativa
  const isCadastroActive = cadastroItems.some(item => pathname.startsWith(item.href))
  
  // Estado do menu cadastramento - abre automaticamente se estiver em uma página de cadastro
  const [cadastroExpanded, setCadastroExpanded] = useState(isCadastroActive)

  // Fechar menu cadastramento quando navegar para outras páginas
  useEffect(() => {
    if (!isCadastroActive) {
      setCadastroExpanded(false)
    }
  }, [isCadastroActive])

  return (
    <aside className="w-64 bg-muted/50 border-r border-border min-h-screen p-4">
      <nav className="space-y-2">
        {menuItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
              pathname === item.href
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            <span className="text-base">{item.icon}</span>
            {item.title}
          </Link>
        ))}
      </nav>
      
      <div className="mt-8 pt-4 border-t border-border">
        <div className="text-xs text-muted-foreground mb-2">Configurações</div>
        
        {/* Configurações */}
        <Link
          href="/configuracoes"
          className={cn(
            "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
            pathname === "/configuracoes"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          )}
        >
          <span className="text-base">⚙️</span>
          Configurações
        </Link>

        {/* Cadastramento - Seção Expansível */}
        <div className="mt-2">
          <button
            onClick={() => setCadastroExpanded(!cadastroExpanded)}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left",
              isCadastroActive
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            <span className="text-base">📝</span>
            <span className="flex-1">Cadastramento</span>
            <span className={cn(
              "text-xs transition-transform",
              cadastroExpanded ? "rotate-90" : "rotate-0"
            )}>
              ▶
            </span>
          </button>

          {/* Submenu Cadastramento */}
          {cadastroExpanded && (
            <div className="ml-4 mt-1 space-y-1 border-l border-border pl-2">
              {cadastroItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                    pathname.startsWith(item.href)
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <span className="text-sm">{item.icon}</span>
                  {item.title}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}