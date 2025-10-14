# 💻 Comandos Principais

> **Referência rápida dos comandos mais usados**

---

## 🚀 Desenvolvimento

### Iniciar Servidor

```bash
# Com Turbopack (3x mais rápido - recomendado)
npm run dev --turbopack

# Modo padrão
npm run dev
```

Acesse: http://localhost:3000

---

## 🏗️ Build e Produção

### Build para Produção

```bash
npm run build
```

**Tempo esperado:** ~43 segundos (otimizado)

### Iniciar Servidor Produção

```bash
npm run start
```

Depois de fazer `npm run build`

---

## 🔍 Validação e Testes

### Validar TypeScript

```bash
npx tsc --noEmit
```

**Importante:** Execute SEMPRE antes de commit/push!

### Linting

```bash
npm run lint
```

### Análise de Bundle

```bash
npm run build:analyze
```

---

## 🗃️ Banco de Dados

### Gerar Tipos TypeScript

```bash
npx supabase gen types typescript --project-id nzgifjdewdfibcopolof > src/tipos/supabase.ts
```

Execute quando alterar schema do banco.

---

## 📦 Deploy

### Deploy Recomendado (GitHub → Vercel)

```bash
git add .
git commit -m "mensagem do commit"
git push origin main
```

Vercel faz deploy automático ✅

### Deploy Direto (menos recomendado)

```bash
vercel --prod
```

### Preview Deploy

```bash
vercel
```

---

## 🔧 Utilitários

### Limpar Cache

```bash
# Windows
Remove-Item -Recurse -Force .next

# Linux/Mac
rm -rf .next
rm -rf node_modules/.cache
```

### Verificar Versão Node.js

```bash
node --version
```

**Requerido:** v20.19.4 ou superior

### Reinstalar Dependências

```bash
rm -rf node_modules package-lock.json
npm install
```

---

## 🎯 Comandos Customizados

### Revisão Rápida de Código

```bash
qcheck
```

### Análise de Consistência

```bash
qplan
```

---

## 📊 Performance

### Lighthouse Audit

```bash
npx lighthouse http://localhost:3000 --view
```

### Teste de Carga

```bash
npx autocannon http://localhost:3000 -c 10 -d 30
```

---

## 🔗 Links Úteis

- **[Quick Start](QUICK-START.md)** - Rodar em 5 minutos
- **[Troubleshooting](TROUBLESHOOTING.md)** - Resolver problemas
- **[← Voltar ao índice](../README.txt)**
