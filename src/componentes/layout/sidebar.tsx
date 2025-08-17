'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
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
  },
  {
    title: 'Contas',
    href: '/contas',
    icon: '🏦'
  },
  {
    title: 'Categorias',
    href: '/categorias',
    icon: '🏷️'
  }
]

export function Sidebar() {
  const pathname = usePathname()

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
        <Link
          href="/configuracoes"
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
        >
          <span className="text-base">⚙️</span>
          Configurações
        </Link>
      </div>
    </aside>
  )
}