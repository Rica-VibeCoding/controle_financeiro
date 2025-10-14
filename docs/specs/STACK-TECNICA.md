# 🛠️ Stack Tecnológica

> **Tecnologias utilizadas no projeto**

---

## Frontend

### Core

- **Next.js 15.5.0** - Framework React com App Router + Turbopack
- **React 19.1.1** - Biblioteca de UI com recursos mais recentes
- **TypeScript 5** - Tipagem estática avançada

### Estilização

- **Tailwind CSS 4** - Estilização utilitária moderna
- **Componentes Customizados** - UI personalizada otimizada
- **Lucide React** - Ícones vetoriais

### Gráficos e Visualização

- **Recharts 2.15.4** - Gráficos interativos
- **Charts responsivos** - Otimizados para mobile

### Gerenciamento de Estado

- **Context API** - Estado global da aplicação
- **SWR** - Cache e data fetching
- **React Hooks** - Hooks customizados para lógica

---

## Backend & Database

### Plataforma

- **Supabase** - Backend as a Service
- **PostgreSQL** - Banco de dados relacional
- **Supabase Storage** - Upload de anexos
- **Row Level Security (RLS)** - Segurança nativa

### Autenticação

- **Supabase Auth** - Sistema de autenticação completo
- **Email confirmations** - Confirmação por email
- **Session management** - Gerenciamento de sessões

---

## Deploy e Infraestrutura

### Hospedagem

- **Vercel** - Hospedagem frontend
- **Supabase Cloud** - Hospedagem backend
- **Edge Functions** - Funções serverless

### CI/CD

- **GitHub Actions** - Integração contínua
- **Vercel Auto-deploy** - Deploy automático via GitHub
- **Preview deploys** - Ambiente de preview para PRs

---

## Desenvolvimento

### Runtime

- **Node.js 20.19.4** - Runtime JavaScript otimizado
- **npm** - Gerenciador de pacotes

### Build Tools

- **Turbopack** - Build tool ultra-rápido (3x mais rápido)
- **Next.js Compiler** - Compilador otimizado
- **SWC** - Compilador Rust para JavaScript

### Qualidade de Código

- **ESLint** - Linter JavaScript/TypeScript
- **Prettier** - Formatador de código
- **TypeScript** - Verificação de tipos

---

## Testes

### Framework

- **Jest** - Framework de testes
- **Testing Library** - Testes de componentes React
- **@testing-library/jest-dom** - Matchers customizados

### E2E (Planejado)

- **Playwright** ou **Cypress** - Testes end-to-end

---

## Bibliotecas Principais

### Dependências de Produção

```json
{
  "@supabase/ssr": "^0.5.2",
  "@supabase/supabase-js": "^2.47.10",
  "recharts": "^2.15.4",
  "swr": "^2.3.0",
  "jszip": "^3.10.1",
  "uuid": "^11.0.5",
  "lucide-react": "^0.469.0",
  "date-fns": "^4.1.0"
}
```

### Dependências de Desenvolvimento

```json
{
  "typescript": "^5",
  "eslint": "^9",
  "tailwindcss": "^4.0.0",
  "@types/react": "^19",
  "@types/node": "^22",
  "jest": "^29.7.0"
}
```

---

## Arquitetura

### Padrões Utilizados

- **Server Components** - Renderização server-side
- **Client Components** - Interatividade client-side
- **API Routes** - Endpoints customizados
- **Middleware** - Autenticação e validação

### Estrutura de Dados

- **PostgreSQL** - Banco relacional com 10 tabelas
- **RLS Policies** - Isolamento por workspace
- **Indexes** - Otimização de queries
- **Functions SQL** - Lógica no banco de dados

---

## Performance

### Otimizações Aplicadas

- ✅ **Code splitting** - Lazy loading de componentes
- ✅ **Image optimization** - Next.js Image component
- ✅ **SWR cache** - Cache inteligente de dados
- ✅ **Turbopack** - Build 3x mais rápido
- ✅ **Bundle size** - <300KB gzipped

### Métricas

- **Build time:** ~43 segundos
- **Lighthouse Score:** >90
- **First Paint:** <1.5s
- **Interactive:** <3s

---

## Segurança

### Implementações

- ✅ **RLS ativo** - Todas as tabelas protegidas
- ✅ **Workspace isolation** - Dados isolados por workspace
- ✅ **HTTPS obrigatório** - Produção
- ✅ **Email verification** - Confirmação obrigatória
- ✅ **Rate limiting** - Proteção contra abuse

---

## Integrações

### Serviços Externos

- **Supabase** - Backend completo
- **Vercel** - Deploy e hospedagem
- **GitHub** - Versionamento e CI/CD

### APIs

- **Supabase API** - RESTful + Realtime
- **Storage API** - Upload de arquivos
- **Auth API** - Autenticação

---

## Versões Mínimas

```
Node.js: >=18.0.0 (recomendado 20.19.4)
npm: >=9.0.0
TypeScript: >=5.0.0
Next.js: 15.5.0
React: 19.1.1
```

---

## 🔗 Links Relacionados

- **[Estrutura do Projeto](ESTRUTURA-PROJETO.md)** - Arquitetura de pastas
- **[← Voltar ao índice](../README.txt)**
