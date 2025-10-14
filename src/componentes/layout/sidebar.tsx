'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { cn } from '@/utilitarios/cn'
import { Icone } from '@/componentes/ui/icone'
import { useAuth } from '@/contextos/auth-contexto'
import { verificarAcessoSuperAdmin } from '@/servicos/supabase/dashboard-admin'
import { ProtectedNavItem } from '@/componentes/ui/protected-link'

const menuItems = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: 'layout-dashboard' as const,
    permissao: 'dashboard' as const
  },
  {
    title: 'Transações',
    href: '/transacoes',
    icon: 'credit-card' as const,
    permissao: 'despesas' as const // Usar despesas como permissão base para transações
  },
  {
    title: 'Relatórios',
    href: '/relatorios',
    icon: 'line-chart' as const,
    permissao: 'relatorios' as const
  }
]

const cadastroItems = [
  {
    title: 'Contas',
    href: '/contas',
    icon: 'building' as const,
    permissao: 'cadastramentos' as const
  },
  {
    title: 'Categorias',
    href: '/categorias',
    icon: 'tag' as const,
    permissao: 'cadastramentos' as const
  },
  {
    title: 'Subcategorias',
    href: '/subcategorias',
    icon: 'tags' as const,
    permissao: 'cadastramentos' as const
  },
  {
    title: 'Formas de Pagamento',
    href: '/formas-pagamento',
    icon: 'credit-card' as const,
    permissao: 'cadastramentos' as const
  },
  {
    title: 'Centros de Custo',
    href: '/centros-custo',
    icon: 'folder' as const,
    permissao: 'cadastramentos' as const
  }
]

interface SidebarProps {
  onLinkClick?: () => void
}

export function Sidebar({ onLinkClick }: SidebarProps) {
  const pathname = usePathname()
  const { workspace, user } = useAuth()
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)
  
  // Verificar se usuário é owner do workspace
  const isOwner = workspace?.owner_id === user?.id
  
  // Verificar se usuário é super admin
  useEffect(() => {
    async function checkSuperAdmin() {
      if (user) {
        try {
          const superAdmin = await verificarAcessoSuperAdmin()
          setIsSuperAdmin(superAdmin)
        } catch (error) {
          console.error('Erro ao verificar super admin:', error)
          setIsSuperAdmin(false)
        }
      } else {
        setIsSuperAdmin(false)
      }
    }
    checkSuperAdmin()
  }, [user])
  
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
    <aside className="w-64 bg-sidebar border-r border-border lg:sticky lg:top-16 lg:h-[calc(100vh-64px)] h-full overflow-y-auto p-4 backdrop-blur-sm">
      <nav className="space-y-2">
        {menuItems.map((item) => (
          <ProtectedNavItem
            key={item.href}
            permissaoNecessaria={item.permissao}
          >
            <Link
              href={item.href}
              onClick={onLinkClick}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                pathname === item.href
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <Icone name={item.icon} className="w-4 h-4" aria-hidden="true" />
              {item.title}
            </Link>
          </ProtectedNavItem>
        ))}
      </nav>
      
      <div className="mt-8 pt-4 border-t border-border">
        <div className="text-xs text-muted-foreground mb-2">Configurações</div>
        
        {/* Configurações */}
        <ProtectedNavItem permissaoNecessaria="configuracoes">
          <Link
            href="/configuracoes"
            onClick={onLinkClick}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
              pathname === "/configuracoes"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            <Icone name="settings" className="w-4 h-4" aria-hidden="true" />
            Configurações
          </Link>
        </ProtectedNavItem>

        {/* Usuários (apenas para owners) */}
        {isOwner && (
          <Link
            href="/configuracoes/usuarios"
            onClick={onLinkClick}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
              pathname.startsWith("/configuracoes/usuarios")
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            <Icone name="users" className="w-4 h-4" aria-hidden="true" />
            Usuários
          </Link>
        )}

        {/* Metas */}
        <ProtectedNavItem permissaoNecessaria="configuracoes">
          <Link
            href="/configuracoes/metas"
            onClick={onLinkClick}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
              pathname.startsWith("/configuracoes/metas")
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            <Icone name="target" className="w-4 h-4" aria-hidden="true" />
            Metas
          </Link>
        </ProtectedNavItem>

        {/* Cadastramento - Seção Expansível */}
        <ProtectedNavItem permissaoNecessaria="configuracoes">
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
              <Icone name="tags" className="w-4 h-4" aria-hidden="true" />
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
                  <ProtectedNavItem
                    key={item.href}
                    permissaoNecessaria={item.permissao}
                  >
                    <Link
                      href={item.href}
                      onClick={onLinkClick}
                      className={cn(
                        "flex items-center gap-3 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                        pathname.startsWith(item.href)
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                      )}
                    >
                      <Icone name={item.icon} className="w-4 h-4" aria-hidden="true" />
                      {item.title}
                    </Link>
                  </ProtectedNavItem>
                ))}
              </div>
            )}
          </div>
        </ProtectedNavItem>

        {/* Dashboard Super Admin (apenas para super admin) */}
        {isSuperAdmin && (
          <Link
            href="/admin/dashboard"
            onClick={onLinkClick}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors mt-2",
              pathname.startsWith("/admin")
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            <Icone name="shield" className="w-4 h-4" aria-hidden="true" />
            Dashboard Admin
          </Link>
        )}
      </div>

      {/* Seção Relacionamento - Nova divisão separada */}
      <div className="mt-8 pt-4 border-t border-border">
        <div className="text-xs text-muted-foreground mb-2 px-3">Relacionamento</div>

        {/* Clientes */}
        <ProtectedNavItem permissaoNecessaria="configuracoes">
          <Link
            href="/clientes"
            onClick={onLinkClick}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
              pathname.startsWith("/clientes")
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            <Icone name="user" className="w-4 h-4" aria-hidden="true" />
            Clientes
          </Link>
        </ProtectedNavItem>

        {/* Fornecedores */}
        <ProtectedNavItem permissaoNecessaria="configuracoes">
          <Link
            href="/fornecedores"
            onClick={onLinkClick}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
              pathname.startsWith("/fornecedores")
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            <Icone name="building" className="w-4 h-4" aria-hidden="true" />
            Fornecedores
          </Link>
        </ProtectedNavItem>
      </div>
    </aside>
  )
}