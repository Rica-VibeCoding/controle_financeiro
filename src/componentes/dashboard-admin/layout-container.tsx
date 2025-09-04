'use client'

interface LayoutContainerProps {
  children: React.ReactNode;
}

/**
 * Container principal do dashboard admin - LIMPO E PRODUTIVO
 * Layout otimizado: sem header redundante, foco no conteúdo
 * Espaçamento reduzido para maior produtividade
 */
export function LayoutContainer({ children }: LayoutContainerProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Conteúdo principal - layout limpo e produtivo */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </div>
    </div>
  );
}