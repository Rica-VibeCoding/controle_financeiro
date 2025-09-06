// Service Worker PWA Avançado - Versão 3.1
// Estratégia: Cache inteligente + Offline-first + Background Sync
const CACHE_VERSION = 'v3.1'
const CACHE_NAME = `controle-financeiro-assets-${CACHE_VERSION}`
const RUNTIME_CACHE = `controle-financeiro-runtime-${CACHE_VERSION}`
const OFFLINE_CACHE = `controle-financeiro-offline-${CACHE_VERSION}`

// ✅ Assets estáticos (cache agressivo)
const STATIC_PATTERNS = [
  '/_next/static/',
  '/static/',
  '/icons/',
  '/images/',
  '.css',
  '.js',
  '.woff2',
  '.woff',
  '.ttf',
  '.png',
  '.jpg',
  '.jpeg',
  '.svg',
  '.ico',
  '.webp',
  '.avif'
]

// Assets essenciais para cache imediato (apenas os que existem)
const ESSENTIAL_ASSETS = [
  '/',
  '/manifest.json'
]

// Páginas para cache offline (apenas as que existem)
const OFFLINE_PAGES = [
  '/',
  '/auth/login'
]

// Configuração de Background Sync
const BACKGROUND_SYNC_TAG = 'controle-financeiro-sync'

// Dados para cache estratégico (recursos críticos)
const STRATEGIC_CACHE_PATTERNS = [
  '/api/auth/session',
  '/_next/data/'
]

// Install event - cache otimizado com retry
self.addEventListener('install', (event) => {
  event.waitUntil(
    Promise.all([
      // Cache assets essenciais
      caches.open(CACHE_NAME).then(async (cache) => {
        try {
          await cache.addAll(ESSENTIAL_ASSETS)
        } catch (error) {
          // Retry individual para assets que falharam
          console.warn('SW: Retry individual de assets essenciais')
          for (const asset of ESSENTIAL_ASSETS) {
            try {
              await cache.add(asset)
            } catch (retryError) {
              console.warn(`SW: Falha ao cachear ${asset}:`, retryError)
            }
          }
        }
      }),
      
      // Inicializar cache offline
      caches.open(OFFLINE_CACHE).then(cache => {
        return cache.addAll(OFFLINE_PAGES.map(url => new Request(url, {
          headers: { 'X-Offline-Cache': 'true' }
        })))
      })
    ])
    .then(() => {
      console.log('SW: Instalação concluída com sucesso')
      self.skipWaiting()
    })
    .catch((error) => {
      console.error('SW: Falha na instalação:', error)
    })
  )
})

// Activate event - limpeza inteligente de cache
self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      // Limpar caches obsoletos
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName.startsWith('controle-financeiro') && 
                !cacheName.includes(CACHE_VERSION)) {
              console.log('SW: Removendo cache obsoleto:', cacheName)
              return caches.delete(cacheName)
            }
          })
        )
      }),
      
      // Pré-cache de páginas críticas (com tratamento de erros individual)
      caches.open(RUNTIME_CACHE).then(async (cache) => {
        try {
          // Tentar cache em lote primeiro
          await cache.addAll(OFFLINE_PAGES.map(url => 
            new Request(url, { 
              headers: { 'X-Preload-Cache': 'true' },
              mode: 'cors',
              credentials: 'same-origin'
            })
          ))
        } catch (error) {
          console.warn('SW: Fallback para cache individual de páginas offline')
          // Se falhar, cacheia individualmente (sem travar ativação)
          for (const url of OFFLINE_PAGES) {
            try {
              await cache.add(new Request(url, {
                headers: { 'X-Preload-Cache': 'true' },
                mode: 'cors', 
                credentials: 'same-origin'
              }))
            } catch (individualError) {
              console.warn(`SW: Falha ao cachear página ${url}:`, individualError)
              // Continua sem travar - página não será disponível offline
            }
          }
        }
      })
    ])
    .then(() => {
      console.log('SW: Ativação concluída - assumindo controle')
      self.clients.claim()
    })
    .catch(error => {
      console.error('SW: Erro na ativação:', error)
    })
  )
})

// Fetch event - padrão da indústria otimizado
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)
  
  // ✅ IGNORA requisições cross-origin
  if (!request.url.startsWith(self.location.origin)) {
    return
  }
  
  // ✅ IGNORA completamente APIs - deixa SWR gerenciar (padrão Netflix/GitHub)
  if (url.hostname.includes('supabase.co') || 
      url.pathname.startsWith('/api/') ||
      url.search.includes('api-version') ||
      request.headers.get('content-type')?.includes('application/json')) {
    return // Não intercepta - passa direto para SWR
  }
  
  // ✅ Cache-first APENAS para assets estáticos
  const isStaticAsset = STATIC_PATTERNS.some(pattern => 
    url.pathname.includes(pattern) || url.pathname.endsWith(pattern)
  )
  
  if (isStaticAsset) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse
        }
        
        // Se não está em cache, busca na rede e cacheia
        return fetch(request).then((networkResponse) => {
          // Só cacheia respostas válidas
          if (networkResponse.status === 200) {
            const responseClone = networkResponse.clone()
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone)
            })
          }
          return networkResponse
        }).catch((error) => {
          console.warn('SW: Falha ao buscar asset:', request.url, error)
          throw error
        })
      })
    )
  }
  
  // ✅ Todas as outras requisições passam direto (HTML, dados, etc.)
  // Deixa Next.js e SWR gerenciarem
})