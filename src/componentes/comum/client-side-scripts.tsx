'use client'

import { useEffect } from 'react'

/**
 * Componente seguro para scripts que precisam executar no cliente
 * Substitui dangerouslySetInnerHTML por useEffect seguro
 */
export function ClientSideScripts() {
  // Script 1: Silenciar avisos de preload em desenvolvimento
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
      const originalConsoleWarn = console.warn
      
      console.warn = (...args: any[]) => {
        const message = args.join(' ')
        if (message.includes('was preloaded using link preload but not used')) {
          return // Silenciar este aviso específico
        }
        originalConsoleWarn.apply(console, args)
      }

      // Cleanup: restaurar console original no unmount
      return () => {
        console.warn = originalConsoleWarn
      }
    }
  }, [])

  // Script 2: Service Worker registration seguro (TEMPORARIAMENTE DESABILITADO)
  useEffect(() => {
    // DESABILITADO - Causando problemas de MIME type em produção
    // TODO: Reabilitar após corrigir headers MIME no Vercel
    console.log('Service Worker temporariamente desabilitado para correção de MIME types')
    
    /*
    if ('serviceWorker' in navigator && typeof window !== 'undefined') {
      const registerSW = async () => {
        try {
          // Verifica se já existe um SW registrado
          const registration = await navigator.serviceWorker.getRegistration('/sw.js')
          
          if (!registration) {
            // Aguardar load event para não bloquear renderização
            if (document.readyState === 'loading') {
              window.addEventListener('load', async () => {
                try {
                  await navigator.serviceWorker.register('/sw.js', { 
                    updateViaCache: 'all' 
                  })
                } catch (error) {
                  // Falha silenciosamente - SW não é crítico
                }
              }, { once: true })
            } else {
              // Página já carregada, registrar imediatamente
              await navigator.serviceWorker.register('/sw.js', { 
                updateViaCache: 'all' 
              })
            }
          }
        } catch (error) {
          // Falha silenciosamente - SW não é crítico
        }
      }

      registerSW()
    }
    */
  }, [])

  return null // Componente não renderiza nada
}