'use client'

import { useState } from 'react'
import { Header } from './header'
import { Sidebar } from './sidebar'
import { Toaster } from '@/componentes/ui/toast'
import { usarToast } from '@/hooks/usar-toast'
import { ErrorBoundary } from '@/componentes/comum/error-boundary'

interface LayoutPrincipalProps {
  children: React.ReactNode
}

export function LayoutPrincipal({ children }: LayoutPrincipalProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { toasts, removerToast } = usarToast()

  return (
    <div className="h-screen flex flex-col">
      <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
      <div className="flex-1 flex min-h-0">
        {/* Sidebar Desktop */}
        <div className="hidden lg:block">
          <Sidebar />
        </div>
        
        {/* Sidebar Mobile */}
        {sidebarOpen && (
          <>
            <div 
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <div className="fixed left-0 top-16 bottom-0 z-50 lg:hidden">
              <Sidebar />
            </div>
          </>
        )}
        
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        </main>
      </div>
      
      <Toaster toasts={toasts} onRemove={removerToast} />
    </div>
  )
}