'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/componentes/ui/button'
import { Card } from '@/componentes/ui/card'
import { AlertTriangle, CheckCircle, Trash2, RefreshCw } from 'lucide-react'

export default function LimparCachePage() {
  const [status, setStatus] = useState<string>('')
  const [limpo, setLimpo] = useState(false)
  const [serviceWorkers, setServiceWorkers] = useState<number>(0)
  const [caches, setCaches] = useState<string[]>([])

  useEffect(() => {
    verificarStatus()
  }, [])

  const verificarStatus = async () => {
    // Verificar Service Workers
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations()
      setServiceWorkers(registrations.length)
    }

    // Verificar Caches
    if ('caches' in window) {
      const cacheNames = await caches.keys()
      setCaches(cacheNames)
    }
  }

  const limparTudo = async () => {
    setStatus('🔄 Iniciando limpeza...')
    
    try {
      // 1. Desregistrar Service Workers
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations()
        for (const registration of registrations) {
          await registration.unregister()
          console.log('✅ Service Worker desregistrado:', registration.scope)
        }
        setStatus('✅ Service Workers removidos')
      }

      // 2. Limpar todos os caches
      if ('caches' in window) {
        const cacheNames = await caches.keys()
        for (const cacheName of cacheNames) {
          await caches.delete(cacheName)
          console.log('✅ Cache removido:', cacheName)
        }
        setStatus('✅ Caches limpos')
      }

      // 3. Limpar localStorage (exceto dados importantes)
      const keysToKeep = ['theme', 'debug-mode'] // Preservar algumas configurações
      const allKeys = Object.keys(localStorage)
      
      allKeys.forEach(key => {
        if (!keysToKeep.includes(key) && key.startsWith('supabase')) {
          localStorage.removeItem(key)
          console.log('✅ LocalStorage limpo:', key)
        }
      })
      setStatus('✅ LocalStorage limpo')

      // 4. Limpar sessionStorage
      sessionStorage.clear()
      setStatus('✅ SessionStorage limpo')

      // 5. Limpar IndexedDB (se usado)
      if ('indexedDB' in window) {
        const databases = await indexedDB.databases?.() || []
        for (const db of databases) {
          if (db.name) {
            indexedDB.deleteDatabase(db.name)
            console.log('✅ IndexedDB removido:', db.name)
          }
        }
      }

      setStatus('✅ Limpeza completa!')
      setLimpo(true)
      
      // Recarregar após 2 segundos
      setTimeout(() => {
        setStatus('🔄 Recarregando página...')
        window.location.href = '/'
      }, 2000)

    } catch (error) {
      console.error('Erro na limpeza:', error)
      setStatus('❌ Erro durante limpeza')
    }
  }

  const recarregar = () => {
    window.location.href = '/'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 p-4 flex items-center justify-center">
      <Card className="max-w-2xl w-full p-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="p-3 bg-orange-100 rounded-full">
              <AlertTriangle className="h-8 w-8 text-orange-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Limpeza de Cache de Emergência
              </h1>
              <p className="text-gray-600">
                Use apenas se o sistema estiver travando
              </p>
            </div>
          </div>

          {/* Status Atual */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <h2 className="font-semibold text-gray-700">Status Atual:</h2>
            <ul className="space-y-1 text-sm text-gray-600">
              <li>• Service Workers registrados: {serviceWorkers}</li>
              <li>• Caches armazenados: {caches.length}</li>
              {caches.map((cache, i) => (
                <li key={i} className="ml-4 text-xs">→ {cache}</li>
              ))}
            </ul>
          </div>

          {/* Aviso */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-yellow-800">
                <p className="font-semibold mb-1">⚠️ Atenção:</p>
                <ul className="space-y-1 ml-2">
                  <li>• Você será deslogado do sistema</li>
                  <li>• Configurações locais serão perdidas</li>
                  <li>• A página será recarregada automaticamente</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Status da limpeza */}
          {status && (
            <div className={`rounded-lg p-4 ${limpo ? 'bg-green-50 text-green-800' : 'bg-blue-50 text-blue-800'}`}>
              <div className="flex items-center gap-2">
                {limpo ? (
                  <CheckCircle className="h-5 w-5" />
                ) : (
                  <RefreshCw className="h-5 w-5 animate-spin" />
                )}
                <span className="font-medium">{status}</span>
              </div>
            </div>
          )}

          {/* Botões */}
          <div className="flex gap-3">
            <Button
              onClick={limparTudo}
              disabled={limpo}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Limpar Tudo e Recarregar
            </Button>
            <Button
              onClick={recarregar}
              variant="outline"
              className="flex-1"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Apenas Recarregar
            </Button>
          </div>

          {/* Instruções */}
          <div className="text-xs text-gray-500 space-y-1">
            <p className="font-semibold">Se o problema persistir:</p>
            <ol className="ml-4 space-y-1">
              <li>1. Abra o DevTools (F12)</li>
              <li>2. Vá em Application → Storage</li>
              <li>3. Clique em "Clear site data"</li>
              <li>4. Recarregue a página (Ctrl+F5)</li>
            </ol>
          </div>
        </div>
      </Card>
    </div>
  )
}