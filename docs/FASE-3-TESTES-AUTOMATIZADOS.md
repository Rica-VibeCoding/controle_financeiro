# 🧪 FASE 3 - TESTES AUTOMATIZADOS - GUIA COMPLETO

## 🎯 OBJETIVO DA FASE 3

Implementar uma suite completa de testes automatizados para garantir qualidade, estabilidade e confiabilidade do sistema de controle financeiro.

---

## 📋 CHECKLIST DE TAREFAS

### ✅ **PREPARAÇÃO** 
- [ ] Verificar configuração Jest existente
- [ ] Validar ambiente de desenvolvimento
- [ ] Confirmar TypeScript funcionando
- [ ] Verificar build limpo

### 🔬 **TESTES UNITÁRIOS**
- [ ] Testes de componentes críticos (8-10 componentes)
- [ ] Testes de hooks customizados (6-8 hooks)
- [ ] Testes de utilitários e validações
- [ ] Testes de contextos React

### 🔗 **TESTES DE INTEGRAÇÃO**
- [ ] Fluxo de autenticação completo
- [ ] Criação e edição de transações
- [ ] Sistema de importação CSV
- [ ] Backup e restore de dados

### 🌐 **TESTES E2E**
- [ ] Configurar Playwright
- [ ] Cenários críticos de usuário
- [ ] Testes cross-browser
- [ ] Validação PWA mobile

### 📊 **COBERTURA E QUALIDADE**
- [ ] Atingir 80%+ cobertura de código
- [ ] Configurar relatórios automáticos
- [ ] Documentar casos de teste
- [ ] Validar todos os testes passando

---

## 🛠️ CONFIGURAÇÃO INICIAL

### **1. Verificar Configuração Jest**
```bash
# Verificar se Jest está configurado
ls -la jest.config.js
ls -la jest.setup.js

# Rodar testes existentes
npm test

# Ver cobertura atual
npm run test:coverage
```

### **2. Estrutura de Pastas**
```bash
# Criar estrutura de testes
mkdir -p src/__tests__/components
mkdir -p src/__tests__/hooks
mkdir -p src/__tests__/utils
mkdir -p src/__tests__/contexts
mkdir -p tests/e2e
mkdir -p tests/integration
```

### **3. Arquivo de Configuração de Testes**
```typescript
// jest.config.js (verificar se existe)
const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testEnvironment: 'jest-environment-jsdom',
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
}

module.exports = createJestConfig(customJestConfig)
```

---

## 🔬 TESTES UNITÁRIOS DETALHADOS

### **Componentes Críticos a Testar**

#### **1. Formulário de Transação**
```typescript
// src/__tests__/components/formulario-transacao.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { FormularioTransacao } from '@/componentes/transacoes/formulario-transacao'

describe('FormularioTransacao', () => {
  test('deve renderizar todos os campos obrigatórios', () => {
    render(<FormularioTransacao />)
    
    expect(screen.getByLabelText(/descrição/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/valor/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/tipo/i)).toBeInTheDocument()
  })

  test('deve validar campos obrigatórios', async () => {
    render(<FormularioTransacao />)
    
    fireEvent.click(screen.getByText(/salvar/i))
    
    await waitFor(() => {
      expect(screen.getByText(/descrição é obrigatória/i)).toBeInTheDocument()
    })
  })

  test('deve formatar valor monetário corretamente', () => {
    render(<FormularioTransacao />)
    
    const valorInput = screen.getByLabelText(/valor/i)
    fireEvent.change(valorInput, { target: { value: '1500.50' } })
    
    expect(valorInput).toHaveValue('1500.50')
  })
})
```

#### **2. Cards do Dashboard**
```typescript
// src/__tests__/components/card-saldos-contas.test.tsx
import { render, screen } from '@testing-library/react'
import { CardSaldosContas } from '@/componentes/dashboard/card-saldos-contas'

// Mock do hook
jest.mock('@/hooks/usar-contas-dados', () => ({
  useContasDados: () => ({
    data: [
      { id: '1', nome: 'Conta Corrente', saldo: 1500.00 },
      { id: '2', nome: 'Cartão Crédito', saldo: -500.00 }
    ],
    error: null,
    isLoading: false
  })
}))

describe('CardSaldosContas', () => {
  test('deve renderizar saldos das contas', () => {
    render(<CardSaldosContas />)
    
    expect(screen.getByText('Conta Corrente')).toBeInTheDocument()
    expect(screen.getByText('R$ 1.500,00')).toBeInTheDocument()
    expect(screen.getByText('Cartão Crédito')).toBeInTheDocument()
    expect(screen.getByText('-R$ 500,00')).toBeInTheDocument()
  })

  test('deve mostrar loading quando dados estão carregando', () => {
    // Mock loading state
    jest.mocked(useContasDados).mockReturnValue({
      data: null,
      error: null,
      isLoading: true
    })

    render(<CardSaldosContas />)
    
    expect(screen.getByTestId('skeleton')).toBeInTheDocument()
  })
})
```

### **Hooks Customizados a Testar**

#### **1. Hook de Transações**
```typescript
// src/__tests__/hooks/usar-transacoes.test.ts
import { renderHook, act } from '@testing-library/react'
import { usarTransacoes } from '@/hooks/usar-transacoes'

// Mock Supabase
jest.mock('@/servicos/supabase/transacoes')

describe('usarTransacoes', () => {
  test('deve criar transação com sucesso', async () => {
    const { result } = renderHook(() => usarTransacoes())
    
    await act(async () => {
      await result.current.criar({
        descricao: 'Teste',
        valor: 100,
        tipo: 'receita',
        conta_id: 'conta-1',
        workspace_id: 'workspace-1'
      })
    })
    
    expect(result.current.error).toBeNull()
    expect(result.current.loading).toBeFalsy()
  })

  test('deve lidar com erros de criação', async () => {
    // Mock erro
    const { result } = renderHook(() => usarTransacoes())
    
    await act(async () => {
      await result.current.criar({})
    })
    
    expect(result.current.error).toBeDefined()
  })
})
```

#### **2. Hook de Backup**
```typescript
// src/__tests__/hooks/usar-backup-exportar.test.ts
import { renderHook, act } from '@testing-library/react'
import { usarBackupExportar } from '@/hooks/usar-backup-exportar'

describe('usarBackupExportar', () => {
  test('deve exportar dados com progresso', async () => {
    const { result } = renderHook(() => usarBackupExportar())
    
    await act(async () => {
      await result.current.exportar({
        incluirTransacoes: true,
        incluirCategorias: true
      })
    })
    
    expect(result.current.exportando).toBeFalsy()
    expect(result.current.progresso).toBe(100)
  })
})
```

---

## 🔗 TESTES DE INTEGRAÇÃO

### **1. Fluxo de Autenticação**
```typescript
// tests/integration/auth-flow.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { AuthProvider } from '@/contextos/auth-contexto'
import LoginPage from '@/app/auth/login/page'

describe('Fluxo de Autenticação', () => {
  test('deve fazer login completo', async () => {
    render(
      <AuthProvider>
        <LoginPage />
      </AuthProvider>
    )
    
    // Preencher formulário
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' }
    })
    fireEvent.change(screen.getByLabelText(/senha/i), {
      target: { value: 'password123' }
    })
    
    // Submeter
    fireEvent.click(screen.getByText(/entrar/i))
    
    // Verificar redirecionamento
    await waitFor(() => {
      expect(window.location.pathname).toBe('/dashboard')
    })
  })
})
```

### **2. Importação CSV**
```typescript
// tests/integration/csv-import.test.tsx
describe('Importação CSV', () => {
  test('deve importar arquivo CSV do Nubank', async () => {
    const csvContent = `Data,Descrição,Valor
2025-01-01,UBER TRIP,25.50
2025-01-02,IFOOD DELIVERY,35.80`
    
    const file = new File([csvContent], 'nubank.csv', { type: 'text/csv' })
    
    // Simular upload e importação
    // Verificar se transações foram criadas
  })
})
```

---

## 🌐 TESTES E2E COM PLAYWRIGHT

### **1. Configuração Playwright**
```bash
# Instalar Playwright
npm install -D @playwright/test

# Configurar
npx playwright install
```

```typescript
// playwright.config.ts
import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],
})
```

### **2. Testes E2E Críticos**
```typescript
// tests/e2e/transacao-flow.spec.ts
import { test, expect } from '@playwright/test'

test('fluxo completo de transação', async ({ page }) => {
  // Login
  await page.goto('/auth/login')
  await page.fill('[data-testid="email"]', 'test@example.com')
  await page.fill('[data-testid="password"]', 'password123')
  await page.click('[data-testid="login-button"]')
  
  // Navegar para transações
  await page.click('[data-testid="nav-transacoes"]')
  
  // Criar nova transação
  await page.click('[data-testid="nova-transacao"]')
  await page.fill('[data-testid="descricao"]', 'Teste E2E')
  await page.fill('[data-testid="valor"]', '150.50')
  await page.selectOption('[data-testid="tipo"]', 'receita')
  
  // Salvar
  await page.click('[data-testid="salvar"]')
  
  // Verificar se aparece na lista
  await expect(page.locator('text=Teste E2E')).toBeVisible()
  await expect(page.locator('text=R$ 150,50')).toBeVisible()
})
```

```typescript
// tests/e2e/pwa.spec.ts
test('deve funcionar como PWA', async ({ page, context }) => {
  // Verificar service worker
  await page.goto('/')
  
  const swPromise = page.waitForEvent('serviceworker')
  const sw = await swPromise
  
  expect(sw).toBeTruthy()
  
  // Verificar manifest
  const manifestResponse = await page.request.get('/manifest.json')
  expect(manifestResponse.status()).toBe(200)
  
  const manifest = await manifestResponse.json()
  expect(manifest.name).toContain('Controle Financeiro')
  expect(manifest.display).toBe('standalone')
})
```

---

## 📊 COBERTURA DE CÓDIGO

### **Configurar Relatórios**
```json
// package.json - adicionar scripts
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:ci": "jest --ci --coverage --watchAll=false"
  }
}
```

### **Metas de Cobertura**
- **Statements:** 80%+
- **Branches:** 80%+
- **Functions:** 80%+
- **Lines:** 80%+

---

## 🔄 CI/CD PIPELINE

### **GitHub Actions**
```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20.19.4'
          
      - name: Install dependencies
        run: npm ci
        
      - name: TypeScript check
        run: npx tsc --noEmit
        
      - name: Run tests
        run: npm run test:ci
        
      - name: Build project
        run: npm run build
        
      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

---

## ✅ CRITÉRIOS DE ACEITAÇÃO

### **Fase 3 será considerada completa quando:**
1. ✅ Cobertura de testes ≥ 80%
2. ✅ Todos os testes unitários passando
3. ✅ Testes de integração funcionando
4. ✅ 3+ cenários E2E implementados
5. ✅ CI/CD configurado e funcionando
6. ✅ Build sem erros ou warnings
7. ✅ Documentação de testes atualizada

---

## 🚀 COMANDOS DE VALIDAÇÃO FINAL

```bash
# 1. TypeScript
npx tsc --noEmit

# 2. Testes
npm run test:coverage

# 3. Build
npm run build

# 4. E2E (se configurado)
npx playwright test

# 5. Lint (quando disponível)
npm run lint
```

---

## 📝 RELATÓRIO FINAL

Após concluir a Fase 3, gerar relatório com:
- Cobertura de código alcançada
- Número de testes implementados
- Cenários críticos cobertos
- Performance dos tests (tempo execução)
- Próximos passos recomendados

---

*Documento preparado para retomada sem contexto prévio*
*Tempo estimado total: 8-12 horas*
*Prioridade: Alta (essencial para produção)*