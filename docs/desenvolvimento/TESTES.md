# 🧪 Testes

> **Guia de testes e checklist de funcionalidades**

---

## 📋 Checklist de Funcionalidades

### ✅ Transações Básicas

- [ ] Criar receita simples → Aparece no dashboard
- [ ] Criar despesa simples → Diminui saldo total
- [ ] Criar transferência → Move valor entre contas
- [ ] Editar transação → Valores são atualizados
- [ ] Excluir transação → Saldo é recalculado

### ✅ Parcelamento

- [ ] Criar compra 6x → Gera 6 parcelas com datas certas
- [ ] Marcar parcela como paga → Só essa parcela muda status
- [ ] Excluir grupo parcelamento → Remove todas as parcelas

### ✅ Importação CSV

- [ ] Upload Nubank cartão → Detecta formato automaticamente
- [ ] Classificação inteligente → Sugere categorias
- [ ] Preview antes de salvar → Permite edição
- [ ] Detecção duplicatas → Avisa sobre repetições

### ✅ Backup/Restore

- [ ] Exportar dados → Gera ZIP com todos os dados
- [ ] Progress em tempo real → Mostra % de conclusão
- [ ] Importar backup → Restaura dados corretamente
- [ ] Validação integridade → Verifica relacionamentos

### ✅ PWA Mobile

- [ ] Instalar no celular → Aparece como app nativo
- [ ] Funciona sem barra browser → Modo standalone
- [ ] Ícone na home screen → Ícone personalizado
- [ ] Performance mobile → Touch gestures funcionam

### ✅ Sistema Multiusuário

- [ ] Criar convite → Gera link único
- [ ] Aceitar convite → Adiciona ao workspace
- [ ] Remover usuário → Perde acesso imediatamente
- [ ] Alterar role → Atualiza permissões

---

## 🔥 Testes de Stress

### Volume de Dados

```bash
# Teste com muitas transações:
# 1. Importar CSV com +1000 transações
# 2. Verificar se dashboard ainda carrega rápido
# 3. Testar paginação nas listas
# 4. Verificar se backup funciona com volume alto
```

### Concorrência

```bash
# Teste de múltiplas abas:
# 1. Abrir sistema em múltiplas abas
# 2. Criar transação em uma aba
# 3. Verificar se outras abas atualizam (SWR)
```

### Performance Mobile

```bash
# Teste mobile:
# 1. Instalar PWA no celular
# 2. Testar performance em 3G simulado
# 3. Verificar gestos touch
```

---

## 🛠️ Setup de Testes (Jest)

### Instalação

```bash
npm install --save-dev jest @testing-library/react @testing-library/jest-dom
```

### Configuração

```javascript
// jest.config.js
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
};
```

---

## 📝 Exemplos de Testes

### Teste de Componente

```typescript
// __tests__/card-transacao.test.tsx
import { render, screen } from '@testing-library/react';
import CardTransacao from '@/componentes/transacoes/card-transacao';

describe('CardTransacao', () => {
  it('renderiza descrição da transação', () => {
    const transacao = {
      id: '1',
      descricao: 'Compra Supermercado',
      valor: 150.00,
      tipo: 'despesa'
    };

    render(<CardTransacao transacao={transacao} />);

    expect(screen.getByText('Compra Supermercado')).toBeInTheDocument();
    expect(screen.getByText('R$ 150,00')).toBeInTheDocument();
  });
});
```

### Teste de Hook

```typescript
// __tests__/usar-transacoes.test.ts
import { renderHook, waitFor } from '@testing-library/react';
import { usarTransacoes } from '@/hooks/usar-transacoes';

describe('usarTransacoes', () => {
  it('cria transação com sucesso', async () => {
    const { result } = renderHook(() => usarTransacoes());

    await waitFor(async () => {
      await result.current.criar({
        descricao: 'Teste',
        valor: 100,
        tipo: 'despesa'
      });
    });

    expect(result.current.error).toBeNull();
  });
});
```

---

## 🎯 Testes Manuais Essenciais

### Fluxo Completo de Usuário

1. **Registro**
   - [ ] Registrar novo usuário
   - [ ] Receber email de confirmação
   - [ ] Confirmar email
   - [ ] Login automático após confirmação

2. **Primeiro Uso**
   - [ ] Workspace criado automaticamente
   - [ ] Categorias padrão existem
   - [ ] Conta "Carteira" criada
   - [ ] Dashboard vazio aparece

3. **Transações**
   - [ ] Criar primeira transação
   - [ ] Ver no dashboard
   - [ ] Editar transação
   - [ ] Excluir transação

4. **Importação**
   - [ ] Fazer upload CSV
   - [ ] Ver preview
   - [ ] Confirmar importação
   - [ ] Validar transações no dashboard

---

## 🐛 Testes de Regressão

### Após Cada Update

```bash
# Checklist pós-update:
npx tsc --noEmit          # Validar TypeScript
npm run lint              # Linter
npm run build             # Build produção
npm run dev               # Testar desenvolvimento
```

### Funcionalidades Críticas

- [ ] Login/logout funciona
- [ ] Dashboard carrega
- [ ] Criar transação funciona
- [ ] Importação CSV funciona
- [ ] Backup/restore funciona

---

## 📊 Cobertura de Testes

### Meta de Cobertura

- **Componentes críticos:** >80%
- **Hooks:** >70%
- **Serviços:** >60%

### Gerar Relatório

```bash
npm test -- --coverage
```

---

## 🔧 Testes E2E (Futuro)

### Playwright/Cypress

```typescript
// e2e/transacoes.spec.ts
test('criar transação completa', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await page.click('text=Nova Transação');
  await page.fill('input[name="descricao"]', 'Teste');
  await page.fill('input[name="valor"]', '100');
  await page.click('button:has-text("Salvar")');

  await expect(page.locator('text=Teste')).toBeVisible();
});
```

---

## 💡 Boas Práticas

### Nomenclatura de Testes

```typescript
// ✅ Bom
test('cria transação quando todos os campos são válidos')

// ❌ Ruim
test('teste1')
```

### Arrange, Act, Assert

```typescript
test('calcula saldo corretamente', () => {
  // Arrange
  const transacoes = [
    { valor: 100, tipo: 'receita' },
    { valor: 50, tipo: 'despesa' }
  ];

  // Act
  const saldo = calcularSaldo(transacoes);

  // Assert
  expect(saldo).toBe(50);
});
```

---

## 🔗 Links Relacionados

- **[Personalização](PERSONALIZACAO.md)** - Hooks e componentes
- **[Performance](PERFORMANCE.md)** - Otimizações
- **[← Voltar ao índice](../README.txt)**
