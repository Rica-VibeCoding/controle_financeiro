'use client'

import { Button } from '@/componentes/ui/button'

interface HeaderProps {
  onMenuClick?: () => void
}

export function Header({ onMenuClick }: HeaderProps) {
  return (
    <header className="bg-white border-b border-border px-4 lg:px-6 h-16 flex items-center justify-between">
      <div className="flex items-center gap-4">
        {/* Menu mobile */}
        <Button 
          variant="ghost" 
          size="icon"
          className="lg:hidden"
          onClick={onMenuClick}
        >
          <span className="sr-only">Abrir menu</span>
          ☰
        </Button>
        
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-lg">💰</span>
          </div>
          <h1 className="text-lg lg:text-xl font-bold text-foreground">
            <span className="hidden sm:inline">Controle Financeiro</span>
            <span className="sm:hidden">Finanças</span>
          </h1>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon">
          <span className="sr-only">Menu do usuário</span>
          👤
        </Button>
      </div>
    </header>
  )
}