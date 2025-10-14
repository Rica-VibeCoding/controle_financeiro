# ⚡ Otimização de Performance

> **Guia de otimizações aplicadas e boas práticas**

---

## 🚀 Configuração SWR Otimizada

### Para Dados Financeiros

```typescript
// src/app/layout.tsx
<SWRConfig value={{
  refreshInterval: 60000,        // 1min - dados não mudam muito
  dedupingInterval: 10000,       // 10s - evita requests duplicados
  errorRetryCount: 2,            // Menos tentativas = mais rápido
  revalidateOnFocus: false,      // Não recarregar ao focar aba
  shouldRetryOnError: (error) => {
    // Não retry em erros de autorização
    return !error.message.includes('401');
  }
}}>
```

---

## 📦 Build Optimization

### Desenvolvimento com Turbopack

```bash
# 3x mais rápido que webpack
TURBOPACK=1 npm run dev
# ou
npm run dev --turbopack
```

### Build para Produção

```bash
NODE_ENV=production npm run build
npm run start
```

**Tempo atual:** ~43 segundos (otimizado)

### Análise de Bundle

```bash
npx @next/bundle-analyzer
```

**Target:** Bundle < 300KB gzipped

---

## 📊 Métricas de Performance

### 🎯 Targets

- **Lighthouse Score:** >90 (Performance, Accessibility, SEO)
- **First Contentful Paint:** <1.5s
- **Largest Contentful Paint:** <2.5s
- **Time to Interactive:** <3.5s
- **Bundle Size:** <300KB gzipped

### 🔥 Medição Real

```bash
# Lighthouse
npx lighthouse http://localhost:3000 --view

# Teste de carga
npx autocannon http://localhost:3000 -c 10 -d 30

# Bundle analysis
npx next-bundle-analyzer
```

---

## 💾 Otimização de Banco

### Índices Estratégicos

```sql
-- Já criados no schema
CREATE INDEX idx_fp_transacoes_data ON fp_transacoes(data);
CREATE INDEX idx_fp_transacoes_conta ON fp_transacoes(conta_id);
CREATE INDEX idx_fp_transacoes_categoria ON fp_transacoes(categoria_id);
CREATE INDEX idx_fp_transacoes_workspace ON fp_transacoes(workspace_id);
```

### Query Dashboard Otimizada

```sql
-- Executa em ~50ms
SELECT
  SUM(CASE WHEN tipo = 'receita' THEN valor ELSE -valor END) as saldo_total,
  COUNT(*) as total_transacoes
FROM fp_transacoes
WHERE data >= '2025-01-01'
AND workspace_id = current_workspace_id();
```

---

## 🔧 Cache Strategy

### Camadas de Cache

1. **SWR** - Cache automático de 1 minuto
2. **Supabase** - Connection pooling ativo
3. **Next.js** - Static pages onde possível
4. **Vercel** - Edge caching automático

### Configuração SWR por Hook

```typescript
// Cache curto para dados que mudam muito
const { data } = useSWR('/api/saldos', fetcher, {
  refreshInterval: 30000 // 30s
});

// Cache longo para dados estáticos
const { data } = useSWR('/api/categorias', fetcher, {
  refreshInterval: 300000 // 5min
});
```

---

## 🔍 Monitoramento

### Health Checks

```typescript
// src/app/api/health/route.ts
export async function GET() {
  const checks = {
    database: await testSupabaseConnection(),
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version
  };

  return Response.json(checks);
}
```

**Teste:** `curl http://localhost:3000/api/health`

---

## 📈 Performance Monitoring

### No Cliente

```typescript
if (typeof window !== 'undefined') {
  // Monitor LCP (Largest Contentful Paint)
  new PerformanceObserver((entryList) => {
    const entries = entryList.getEntries();
    const lastEntry = entries[entries.length - 1];
    console.log('LCP:', lastEntry.startTime);

    // Alerta se > 3 segundos
    if (lastEntry.startTime > 3000) {
      console.warn('⚠️ Performance degradada!');
    }
  }).observe({ entryTypes: ['largest-contentful-paint'] });
}
```

---

## 🎯 Otimizações Aplicadas

### Code Splitting

```typescript
// Lazy loading de componentes pesados
import dynamic from 'next/dynamic';

const GraficoTendencia = dynamic(
  () => import('@/componentes/dashboard/grafico-tendencia'),
  { ssr: false, loading: () => <Skeleton /> }
);
```

### Image Optimization

```typescript
import Image from 'next/image';

<Image
  src="/icon-192.png"
  width={192}
  height={192}
  alt="Logo"
  loading="lazy"
/>
```

---

## 💡 Boas Práticas

### 1. Evitar Re-renders Desnecessários

```typescript
import { memo } from 'react';

const CardTransacao = memo(({ transacao }) => {
  return <div>{transacao.descricao}</div>;
});
```

### 2. Use useMemo para Cálculos Pesados

```typescript
const saldoTotal = useMemo(() => {
  return transacoes.reduce((acc, t) => acc + t.valor, 0);
}, [transacoes]);
```

### 3. Debounce em Inputs de Busca

```typescript
import { useDeferredValue } from 'react';

const deferredQuery = useDeferredValue(searchQuery);
```

---

## 🐛 Debug de Performance

### React DevTools Profiler

1. Instalar React DevTools
2. Aba "Profiler"
3. Gravar interação
4. Analisar renders

### Network Tab

1. F12 > Network
2. Filtrar por "Fetch/XHR"
3. Ver tempo de cada request
4. Identificar gargalos

---

## 📊 Resultados Medidos

### Performance Real

- **Build time:** 43s (otimizado)
- **Dashboard load:** < 2s
- **Importação 1000 CSV:** ~10-15s
- **Backup 5000 transações:** ~20s

### Bundle Sizes

- **Main bundle:** ~180KB gzipped
- **Total JS:** ~250KB gzipped
- **CSS:** ~15KB gzipped

---

## 🔗 Links Relacionados

- **[Personalização](PERSONALIZACAO.md)** - Hooks e componentes
- **[Testes](TESTES.md)** - Testes automatizados
- **[← Voltar ao índice](../README.txt)**
