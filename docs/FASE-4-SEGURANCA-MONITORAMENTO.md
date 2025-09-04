# 🔒 FASE 4 - SEGURANÇA E MONITORAMENTO - GUIA COMPLETO

## 🎯 OBJETIVO DA FASE 4

Implementar camada completa de segurança avançada e sistema de monitoramento para garantir proteção total do sistema em produção.

---

## 📋 CHECKLIST DE TAREFAS

### 🛡️ **HEADERS DE SEGURANÇA**
- [ ] Content Security Policy (CSP)
- [ ] X-Frame-Options
- [ ] X-Content-Type-Options
- [ ] Strict-Transport-Security (HSTS)
- [ ] Referrer-Policy
- [ ] Permissions-Policy

### 🔐 **VALIDAÇÃO E SANITIZAÇÃO**
- [ ] Sanitização de inputs do usuário
- [ ] Validação server-side rigorosa
- [ ] Prevenção de XSS
- [ ] Proteção CSRF
- [ ] Rate limiting em APIs

### 📊 **MONITORAMENTO E LOGS**
- [ ] Error tracking (Sentry)
- [ ] Performance monitoring
- [ ] Analytics de uso
- [ ] Logs estruturados
- [ ] Alertas automáticos

### 🔍 **AUDITORIA DE SEGURANÇA**
- [ ] npm audit e correções
- [ ] Lighthouse security scan
- [ ] OWASP compliance check
- [ ] Pentest básico
- [ ] Revisão de permissões

---

## 🛡️ IMPLEMENTAÇÃO DE SEGURANÇA

### **1. Headers de Segurança em Next.js**

```typescript
// next.config.ts - Atualizar com headers avançados
const nextConfig: NextConfig = {
  // ... configurações existentes
  
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // Content Security Policy
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Permissões para Next.js
              "style-src 'self' 'unsafe-inline' fonts.googleapis.com",
              "font-src 'self' fonts.gstatic.com",
              "img-src 'self' data: https:",
              "connect-src 'self' https://nzgifjdewdfibcopolof.supabase.co wss://nzgifjdewdfibcopolof.supabase.co",
              "frame-src 'none'",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'none'"
            ].join('; ')
          },
          
          // Prevent clickjacking
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          
          // Prevent MIME type sniffing
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          
          // Force HTTPS
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload'
          },
          
          // Control referrer info
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          
          // Browser permissions
          {
            key: 'Permissions-Policy',
            value: [
              'camera=()',
              'microphone=()',
              'geolocation=()',
              'payment=(self)',
              'usb=()',
              'magnetometer=()',
              'accelerometer=()',
              'gyroscope=()'
            ].join(', ')
          },
          
          // XSS Protection
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          }
        ]
      }
    ]
  }
}

export default nextConfig
```

### **2. Middleware de Segurança Avançado**

```typescript
// src/middleware.ts - Criar/atualizar
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { rateLimit } from './utilitarios/rate-limit'

// Rate limiting configuration
const limiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 500,
})

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Apply rate limiting to API routes
  if (pathname.startsWith('/api/')) {
    const response = NextResponse.next()
    
    try {
      const identifier = request.ip ?? '127.0.0.1'
      await limiter.check(response, 10, identifier) // 10 requests per minute
    } catch {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      )
    }
  }
  
  // Security headers for sensitive pages
  if (pathname.includes('/admin') || pathname.includes('/configuracoes')) {
    const response = NextResponse.next()
    
    // Additional security for admin pages
    response.headers.set('X-Robots-Tag', 'noindex, nofollow')
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
    
    return response
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|sw.js|manifest.json).*)',
  ],
}
```

### **3. Rate Limiting Utility**

```typescript
// src/utilitarios/rate-limit.ts
import { LRUCache } from 'lru-cache'

type Options = {
  uniqueTokenPerInterval?: number
  interval?: number
}

export function rateLimit(options: Options = {}) {
  const tokenCache = new LRUCache({
    max: options.uniqueTokenPerInterval || 500,
    ttl: options.interval || 60000,
  })

  return {
    check: (response: Response, limit: number, token: string) =>
      new Promise<void>((resolve, reject) => {
        const tokenCount = (tokenCache.get(token) as number[]) || [0]
        if (tokenCount[0] === 0) {
          tokenCache.set(token, tokenCount)
        }
        tokenCount[0] += 1

        const currentUsage = tokenCount[0]
        const isRateLimited = currentUsage >= limit

        response.headers.set('X-RateLimit-Limit', limit.toString())
        response.headers.set('X-RateLimit-Remaining', (limit - currentUsage).toString())

        return isRateLimited ? reject() : resolve()
      }),
  }
}
```

### **4. Input Sanitization**

```typescript
// src/utilitarios/sanitizacao.ts
import DOMPurify from 'isomorphic-dompurify'

export class Sanitizacao {
  /**
   * Sanitiza HTML para prevenir XSS
   */
  static sanitizeHtml(html: string): string {
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: [], // Não permitir tags HTML
      ALLOWED_ATTR: []
    })
  }

  /**
   * Sanitiza input de texto
   */
  static sanitizeText(text: string): string {
    return text
      .trim()
      .replace(/[<>\"']/g, '') // Remove caracteres potencialmente perigosos
      .substring(0, 1000) // Limita tamanho
  }

  /**
   * Sanitiza valores monetários
   */
  static sanitizeMoney(value: string): number {
    const cleanValue = value.replace(/[^0-9.,]/g, '')
    const numericValue = parseFloat(cleanValue.replace(',', '.'))
    return isNaN(numericValue) ? 0 : Math.abs(numericValue)
  }

  /**
   * Valida email
   */
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email) && email.length <= 255
  }

  /**
   * Valida workspace_id (UUID)
   */
  static isValidUUID(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    return uuidRegex.test(uuid)
  }
}
```

### **5. Validação Server-side**

```typescript
// src/utilitarios/validacao-servidor.ts
import { Sanitizacao } from './sanitizacao'

export interface ValidacaoResultado {
  valido: boolean
  erros: string[]
  dadosLimpos: any
}

export class ValidacaoServidor {
  static validarTransacao(dados: any): ValidacaoResultado {
    const erros: string[] = []
    const dadosLimpos: any = {}

    // Validar descrição
    if (!dados.descricao || typeof dados.descricao !== 'string') {
      erros.push('Descrição é obrigatória')
    } else {
      dadosLimpos.descricao = Sanitizacao.sanitizeText(dados.descricao)
      if (dadosLimpos.descricao.length < 2) {
        erros.push('Descrição deve ter pelo menos 2 caracteres')
      }
    }

    // Validar valor
    if (!dados.valor) {
      erros.push('Valor é obrigatório')
    } else {
      dadosLimpos.valor = Sanitizacao.sanitizeMoney(dados.valor.toString())
      if (dadosLimpos.valor <= 0) {
        erros.push('Valor deve ser maior que zero')
      }
    }

    // Validar tipo
    const tiposValidos = ['receita', 'despesa', 'transferencia']
    if (!tiposValidos.includes(dados.tipo)) {
      erros.push('Tipo de transação inválido')
    } else {
      dadosLimpos.tipo = dados.tipo
    }

    // Validar workspace_id
    if (!dados.workspace_id || !Sanitizacao.isValidUUID(dados.workspace_id)) {
      erros.push('Workspace ID inválido')
    } else {
      dadosLimpos.workspace_id = dados.workspace_id
    }

    return {
      valido: erros.length === 0,
      erros,
      dadosLimpos
    }
  }
}
```

---

## 📊 MONITORAMENTO COM SENTRY

### **1. Configuração Sentry**

```bash
# Instalar Sentry
npm install @sentry/nextjs
```

```typescript
// sentry.client.config.ts
import * as Sentry from '@sentry/nextjs'

const SENTRY_DSN = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN

Sentry.init({
  dsn: SENTRY_DSN,
  
  // Performance monitoring
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  // Session tracking
  autoSessionTracking: true,
  
  // Error filtering
  beforeSend(event) {
    // Filter out known issues
    if (event.exception) {
      const error = event.exception.values?.[0]
      
      // Skip hydration errors
      if (error?.value?.includes('Hydration')) {
        return null
      }
      
      // Skip network errors
      if (error?.value?.includes('Network Error')) {
        return null
      }
    }
    
    return event
  },
  
  // Additional context
  initialScope: {
    tags: {
      component: 'controle-financeiro'
    }
  }
})
```

### **2. Error Boundary Customizado**

```typescript
// src/componentes/comum/error-boundary.tsx
'use client'

import { Component, ReactNode } from 'react'
import * as Sentry from '@sentry/nextjs'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: any) {
    // Log to Sentry with additional context
    Sentry.withScope((scope) => {
      scope.setTag('component', 'ErrorBoundary')
      scope.setContext('errorInfo', errorInfo)
      Sentry.captureException(error)
    })
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="p-4 text-center">
          <h2 className="text-lg font-semibold text-red-600">
            Ops! Algo deu errado
          </h2>
          <p className="text-gray-600">
            Nosso time foi notificado e está trabalhando na correção.
          </p>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Tentar novamente
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
```

### **3. Performance Monitoring**

```typescript
// src/utilitarios/performance-monitor.ts
import * as Sentry from '@sentry/nextjs'

export class PerformanceMonitor {
  static measureFunction<T>(
    name: string,
    fn: () => T | Promise<T>
  ): T | Promise<T> {
    const transaction = Sentry.startTransaction({
      name,
      op: 'function'
    })

    try {
      const result = fn()
      
      if (result instanceof Promise) {
        return result.finally(() => transaction.finish())
      }
      
      transaction.finish()
      return result
    } catch (error) {
      transaction.setStatus('internal_error')
      transaction.finish()
      throw error
    }
  }

  static async measureQuery<T>(
    name: string,
    query: () => Promise<T>
  ): Promise<T> {
    const span = Sentry.startSpan({
      name,
      op: 'db.query'
    })

    try {
      const result = await query()
      span.setStatus('ok')
      return result
    } catch (error) {
      span.setStatus('internal_error')
      Sentry.captureException(error)
      throw error
    } finally {
      span.end()
    }
  }
}
```

---

## 🔍 AUDITORIA DE SEGURANÇA

### **1. NPM Security Audit**

```bash
# Verificar vulnerabilidades
npm audit

# Corrigir automaticamente
npm audit fix

# Forçar correções (cuidado)
npm audit fix --force

# Relatório detalhado
npm audit --json > security-report.json
```

### **2. Lighthouse Security Scan**

```bash
# Instalar Lighthouse CLI
npm install -g lighthouse

# Scan completo incluindo segurança
lighthouse http://localhost:3000 --view --preset=desktop --output=html --output-path=./lighthouse-report.html

# Foco em segurança
lighthouse http://localhost:3000 --only-categories=best-practices --view
```

### **3. OWASP Compliance Check**

```typescript
// src/utilitarios/security-checklist.ts
export const OWASPChecklist = {
  // A1 - Injection
  sqlInjection: {
    status: 'PROTECTED',
    method: 'Supabase RLS + Prepared Statements',
    details: 'Todas as queries usam Supabase client com proteção automática'
  },
  
  // A2 - Broken Authentication
  authentication: {
    status: 'PROTECTED',
    method: 'Supabase Auth + JWT',
    details: 'Autenticação robusta com tokens JWT e refresh tokens'
  },
  
  // A3 - Sensitive Data Exposure
  dataExposure: {
    status: 'PROTECTED',
    method: 'HTTPS + Headers + RLS',
    details: 'HTTPS obrigatório, headers de segurança, RLS no banco'
  },
  
  // A4 - XML External Entities (XXE)
  xxe: {
    status: 'NOT_APPLICABLE',
    method: 'No XML Processing',
    details: 'Sistema não processa XML'
  },
  
  // A5 - Broken Access Control
  accessControl: {
    status: 'PROTECTED',
    method: 'RLS + Middleware + Context',
    details: 'Row Level Security + middleware de autenticação'
  },
  
  // A6 - Security Misconfiguration
  misconfiguration: {
    status: 'PROTECTED',
    method: 'Security Headers + CSP',
    details: 'Headers de segurança completos configurados'
  },
  
  // A7 - Cross-Site Scripting (XSS)
  xss: {
    status: 'PROTECTED',
    method: 'Input Sanitization + CSP',
    details: 'Sanitização de inputs + Content Security Policy'
  },
  
  // A8 - Insecure Deserialization
  deserialization: {
    status: 'PROTECTED',
    method: 'JSON Only + Validation',
    details: 'Apenas JSON com validação rigorosa'
  },
  
  // A9 - Using Components with Known Vulnerabilities
  vulnerableComponents: {
    status: 'MONITORED',
    method: 'npm audit + Dependabot',
    details: 'Monitoramento contínuo de vulnerabilidades'
  },
  
  // A10 - Insufficient Logging & Monitoring
  logging: {
    status: 'IMPLEMENTED',
    method: 'Sentry + Performance Monitoring',
    details: 'Logs estruturados com Sentry e monitoring'
  }
}

export function generateSecurityReport(): string {
  const report = Object.entries(OWASPChecklist)
    .map(([key, value]) => {
      return `${key.toUpperCase()}:
Status: ${value.status}
Method: ${value.method}
Details: ${value.details}
---`
    })
    .join('\n')
  
  return `OWASP TOP 10 SECURITY REPORT\n${new Date().toISOString()}\n\n${report}`
}
```

### **4. Pentest Básico Automatizado**

```typescript
// tests/security/basic-pentest.test.ts
import { test, expect } from '@playwright/test'

test.describe('Basic Penetration Testing', () => {
  test('should have security headers', async ({ page }) => {
    const response = await page.goto('/')
    
    // Check security headers
    expect(response?.headers()['x-frame-options']).toBe('DENY')
    expect(response?.headers()['x-content-type-options']).toBe('nosniff')
    expect(response?.headers()['strict-transport-security']).toContain('max-age')
  })

  test('should prevent XSS in forms', async ({ page }) => {
    await page.goto('/transacoes')
    
    // Try XSS injection
    const xssPayload = '<script>alert("xss")</script>'
    await page.fill('[data-testid="descricao"]', xssPayload)
    
    // Verify it's sanitized
    const value = await page.inputValue('[data-testid="descricao"]')
    expect(value).not.toContain('<script>')
  })

  test('should have rate limiting', async ({ page }) => {
    // Make multiple rapid requests
    const requests = []
    for (let i = 0; i < 15; i++) {
      requests.push(page.request.post('/api/transacoes', { data: {} }))
    }
    
    const responses = await Promise.all(requests)
    const rateLimited = responses.some(r => r.status() === 429)
    expect(rateLimited).toBe(true)
  })

  test('should not expose sensitive information in errors', async ({ page }) => {
    // Try to access non-existent endpoint
    const response = await page.request.get('/api/nonexistent')
    const text = await response.text()
    
    // Should not expose stack traces or internal details
    expect(text).not.toContain('Error:')
    expect(text).not.toContain('at ')
    expect(text).not.toContain('/src/')
  })
})
```

---

## 📈 ANALYTICS E MONITORING

### **1. Performance Analytics**

```typescript
// src/utilitarios/analytics.ts
interface AnalyticsEvent {
  name: string
  properties?: Record<string, any>
  timestamp?: number
}

export class Analytics {
  private static events: AnalyticsEvent[] = []

  static track(name: string, properties?: Record<string, any>) {
    if (typeof window === 'undefined') return

    const event: AnalyticsEvent = {
      name,
      properties,
      timestamp: Date.now()
    }

    this.events.push(event)

    // Send to analytics service (privacy-focused)
    this.sendEvent(event)
  }

  private static sendEvent(event: AnalyticsEvent) {
    // Send to privacy-focused analytics
    // (avoid Google Analytics for privacy)
    
    if (process.env.NODE_ENV === 'production') {
      fetch('/api/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event)
      }).catch(() => {
        // Silently fail analytics
      })
    }
  }

  static trackPageView(page: string) {
    this.track('page_view', { page })
  }

  static trackUserAction(action: string, context?: Record<string, any>) {
    this.track('user_action', { action, ...context })
  }

  static trackPerformance(metric: string, value: number) {
    this.track('performance_metric', { metric, value })
  }
}
```

### **2. Health Check Endpoint**

```typescript
// src/app/api/health/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@/servicos/supabase/server'

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy'
  timestamp: string
  version: string
  services: {
    database: 'up' | 'down'
    auth: 'up' | 'down'
    storage: 'up' | 'down'
  }
  performance: {
    responseTime: number
    memoryUsage: number
  }
}

export async function GET(): Promise<NextResponse<HealthStatus>> {
  const startTime = Date.now()
  const status: HealthStatus = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    services: {
      database: 'up',
      auth: 'up',
      storage: 'up'
    },
    performance: {
      responseTime: 0,
      memoryUsage: process.memoryUsage().heapUsed / 1024 / 1024 // MB
    }
  }

  try {
    // Test database connection
    const supabase = await createClient()
    const { error: dbError } = await supabase
      .from('fp_workspaces')
      .select('id')
      .limit(1)
    
    if (dbError) {
      status.services.database = 'down'
      status.status = 'degraded'
    }

    // Test auth
    const { error: authError } = await supabase.auth.getSession()
    if (authError) {
      status.services.auth = 'down'
      status.status = 'degraded'
    }

  } catch (error) {
    status.status = 'unhealthy'
    status.services.database = 'down'
    status.services.auth = 'down'
  }

  status.performance.responseTime = Date.now() - startTime

  return NextResponse.json(status, {
    status: status.status === 'healthy' ? 200 : 503
  })
}
```

---

## ✅ CRITÉRIOS DE ACEITAÇÃO

### **Fase 4 será considerada completa quando:**

1. ✅ **Headers de Segurança:**
   - CSP configurado e funcionando
   - HSTS habilitado
   - X-Frame-Options definido
   - Score A+ no securityheaders.com

2. ✅ **Validação e Sanitização:**
   - Inputs sanitizados em todos os formulários
   - Validação server-side implementada
   - Rate limiting ativo
   - Proteção XSS/CSRF funcionando

3. ✅ **Monitoramento:**
   - Sentry configurado e capturando erros
   - Error boundary implementado
   - Performance monitoring ativo
   - Health check endpoint funcionando

4. ✅ **Auditoria:**
   - npm audit sem vulnerabilidades críticas
   - Lighthouse security score > 90
   - OWASP compliance verificado
   - Testes de segurança passando

5. ✅ **Documentação:**
   - Relatório de segurança completo
   - Guia de resposta a incidentes
   - Checklist de manutenção

---

## 🚀 COMANDOS DE VALIDAÇÃO FINAL

```bash
# 1. Audit de segurança
npm audit

# 2. Build sem warnings
npm run build

# 3. Testes de segurança
npm run test:security

# 4. Lighthouse security
lighthouse http://localhost:3000 --only-categories=best-practices

# 5. Health check
curl http://localhost:3000/api/health
```

---

## 📊 RELATÓRIO FINAL ESPERADO

- **Security Score:** A+ (securityheaders.com)
- **Lighthouse Security:** 90%+
- **Vulnerabilities:** 0 high/critical
- **Error Rate:** <0.1%
- **Performance Impact:** <5% overhead
- **Monitoring Coverage:** 100% error capture

---

*Documento preparado para implementação de segurança enterprise-grade*
*Tempo estimado total: 10-15 horas*
*Prioridade: Crítica (obrigatória para produção)*