# 📁 Estrutura do Projeto

> **Organização de arquivos e pastas**

---

## 🗂️ Visão Geral

```
controle-financeiro/
├── 📁 src/                    # Código fonte
├── 📁 public/                 # Arquivos estáticos
├── 📁 docs/                   # Documentação
├── 📁 sql/                    # Scripts SQL
├── 📁 scripts/                # Scripts utilitários
└── 📄 Arquivos de configuração
```

---

## 📁 /src - Código Fonte

### /app - Páginas (App Router)

```
/src/app/
├── /(protected)/              # Páginas protegidas por auth
│   ├── /dashboard/            # Dashboard principal
│   ├── /transacoes/           # Sistema de transações (abas)
│   ├── /relatorios/           # Relatórios e metas
│   ├── /contas/               # Gestão de contas
│   ├── /categorias/           # Gestão de categorias
│   ├── /configuracoes/        # Configurações
│   │   ├── /usuarios/         # Gestão de usuários
│   │   └── /metas/            # Metas mensais
│   └── /admin/                # Dashboard administrativo
│       └── /dashboard/        # Gestão super admin
│
├── /auth/                     # Autenticação
│   ├── /login-seguro/         # Login
│   ├── /register/             # Registro
│   └── /callback/             # Callback Supabase
│
├── /juntar/[codigo]/          # Aceitar convites
├── layout.tsx                 # Layout raiz
└── page.tsx                   # Página inicial
```

### /componentes - Componentes React

```
/src/componentes/
├── /layout/                   # Layout base
│   ├── cabecalho.tsx          # Cabeçalho
│   ├── menu-usuario.tsx       # Menu do usuário
│   └── navegacao.tsx          # Navegação
│
├── /dashboard/                # Dashboard específicos
│   ├── card-saldos-contas.tsx
│   ├── card-proxima-conta.tsx
│   ├── grafico-categorias.tsx
│   └── grafico-tendencia.tsx
│
├── /transacoes/               # Transações específicos
│   ├── lista-despesas.tsx
│   ├── lista-receitas.tsx
│   ├── lista-previstas.tsx
│   ├── campos-essenciais.tsx
│   └── paginacao-transacoes.tsx
│
├── /modais/                   # Modais do sistema
│   ├── modal-lancamento.tsx
│   ├── modal-transferencia.tsx
│   ├── modal-categoria.tsx
│   └── modal-conta.tsx
│
├── /importacao/               # Importação CSV
│   ├── modal-importacao-csv.tsx
│   ├── upload-csv.tsx
│   ├── preview-importacao.tsx
│   └── seletor-banco.tsx
│
├── /backup/                   # Backup/restore
│   ├── modal-exportar.tsx
│   ├── modal-importar.tsx
│   └── preview-importacao.tsx
│
├── /dashboard-admin/          # Dashboard admin
│   ├── tabela-gestao-usuarios.tsx
│   ├── tabela-gestao-workspaces.tsx
│   ├── card-kpi.tsx
│   └── grafico-crescimento.tsx
│
├── /ui/                       # Componentes UI base
│   ├── button.tsx
│   ├── card.tsx
│   ├── input.tsx
│   ├── modal.tsx
│   ├── tabs.tsx
│   └── dropdown-menu.tsx
│
└── /comum/                    # Componentes reutilizáveis
    ├── botoes-acao-modal.tsx
    ├── campos-essenciais-genericos.tsx
    └── secao-preview.tsx
```

### /servicos - Lógica de Negócio

```
/src/servicos/
├── /supabase/                 # API Supabase
│   ├── client.ts              # Cliente Supabase
│   ├── server.ts              # Server-side Supabase
│   ├── middleware.ts          # Middleware auth
│   ├── dashboard-queries.ts   # Queries dashboard
│   ├── dashboard-admin.ts     # Dashboard admin
│   ├── super-admin.ts         # Super admin
│   ├── permissoes-service.ts  # Permissões
│   └── convites-simples.ts    # Sistema de convites
│
├── /importacao/               # Sistema importação CSV
│   ├── processador-csv.ts
│   ├── importador-transacoes.ts
│   ├── classificador-historico.ts
│   ├── detector-formato.ts
│   ├── templates-banco.ts
│   └── validador-duplicatas.ts
│
├── /backup/                   # Backup e restore
│   ├── exportador-dados.ts
│   ├── importador-dados.ts
│   ├── resetador-dados.ts
│   └── validador-backup.ts
│
└── /recorrencia/              # Transações recorrentes
    └── processador-recorrencia.ts
```

### /hooks - Hooks Customizados

```
/src/hooks/
├── usar-transacoes.ts         # Transações CRUD
├── usar-cards-dados.ts        # Dados dashboard
├── usar-cartoes-dados.ts      # Dados cartões
├── usar-categorias-dados.ts   # Categorias
├── usar-contas-dados.ts       # Contas
├── usar-metas-mensais.ts      # Metas mensais
├── usar-projetos-dados.ts     # Projetos/centros custo
├── usar-proximas-contas.ts    # Contas a vencer
├── usar-tendencia-dados.ts    # Gráfico tendência
├── usar-backup-exportar.ts    # Exportar backup
├── usar-backup-importar.ts    # Importar backup
├── usar-dashboard-admin.ts    # Dashboard admin
├── usar-permissoes.ts         # Sistema permissões
└── usar-super-admin.ts        # Super admin
```

### /contextos - Context API

```
/src/contextos/
├── auth-contexto.tsx          # Autenticação
├── periodo-contexto.tsx       # Período selecionado
├── dados-auxiliares-contexto.tsx  # Dados auxiliares
├── modais-contexto.tsx        # Controle modais
└── toast-contexto.tsx         # Notificações toast
```

### /tipos - Interfaces TypeScript

```
/src/tipos/
├── database.ts                # Tipos principais
├── supabase.ts                # Tipos Supabase gerados
├── auth.ts                    # Tipos autenticação
├── dashboard.ts               # Tipos dashboard
├── dashboard-admin.ts         # Tipos dashboard admin
├── backup.ts                  # Tipos backup
├── importacao.ts              # Tipos importação
├── permissoes.ts              # Tipos permissões
└── metas-mensais.ts           # Tipos metas
```

### /utilitarios - Funções Auxiliares

```
/src/utilitarios/
├── validacao.ts               # Validações
├── formatacao-data.ts         # Formatação datas
├── logger.ts                  # Sistema de logs
├── debug-logger.ts            # Debug logs
├── swr-config.ts              # Configuração SWR
└── invalidacao-cache-global.ts # Cache invalidation
```

---

## 📁 /public - Arquivos Estáticos

```
/public/
├── manifest.json              # PWA manifest
├── sw.js                      # Service Worker
├── icon-192.png               # Ícone PWA 192x192
├── icon-512.png               # Ícone PWA 512x512
└── favicon.ico                # Favicon
```

---

## 📁 /docs - Documentação

```
/docs/
├── README.txt                 # Índice principal
├── Resumo.md                  # Contexto para IA
├── schema.sql                 # Schema do banco
│
├── /guias/                    # Guias práticos
│   ├── QUICK-START.md
│   ├── INSTALACAO-COMPLETA.md
│   ├── COMANDOS.md
│   └── TROUBLESHOOTING.md
│
├── /funcionalidades/          # Features detalhadas
│   ├── IMPORTACAO-CSV.md
│   ├── BACKUP-RESTORE.md
│   ├── PWA-MOBILE.md
│   ├── MULTIUSUARIO.md
│   └── DASHBOARD-ADMIN.md
│
├── /desenvolvimento/          # Para devs
│   ├── PERSONALIZACAO.md
│   ├── PERFORMANCE.md
│   └── TESTES.md
│
└── /specs/                    # Especificações
    ├── STACK-TECNICA.md
    └── ESTRUTURA-PROJETO.md
```

---

## 📁 /sql - Scripts SQL

```
/sql/
├── dashboard-admin-gestao.sql # Functions dashboard admin
├── fix-auth-error-complete.sql
├── funcao_calcular_saldos.sql
├── optimize-indexes-multiuser.sql
├── otimizacao-performance-completa.sql
└── ...
```

---

## 📄 Arquivos de Configuração

```
controle-financeiro/
├── .env.local                 # Variáveis de ambiente (git ignored)
├── .env.example               # Template de variáveis
├── .gitignore                 # Arquivos ignorados pelo git
├── next.config.ts             # Configuração Next.js
├── tailwind.config.ts         # Configuração Tailwind
├── tsconfig.json              # Configuração TypeScript
├── jest.config.js             # Configuração Jest
├── jest.setup.js              # Setup Jest
├── package.json               # Dependências e scripts
├── package-lock.json          # Lock de versões
├── CLAUDE.md                  # Instruções para IA
└── README.md                  # README do repositório
```

---

## 📋 Padrões de Nomenclatura

### Arquivos

- **Componentes:** `kebab-case.tsx` (ex: `modal-transacao.tsx`)
- **Hooks:** `usar-*.ts` (ex: `usar-transacoes.ts`)
- **Serviços:** `nome-servico.ts` (ex: `dashboard-queries.ts`)
- **Tipos:** `nome-tipo.ts` (ex: `database.ts`)

### Componentes

- **PascalCase:** `ModalTransacao`, `CardDashboard`
- **Props:** `ModalTransacaoProps`
- **Export:** `export default ModalTransacao`

### Variáveis

- **camelCase:** `dadosTransacao`, `saldoTotal`
- **Constantes:** `UPPER_SNAKE_CASE` (ex: `MAX_FILE_SIZE`)
- **Booleanos:** Prefixo `is`, `has`, `should` (ex: `isLoading`)

### Banco de Dados

- **Tabelas:** Prefixo `fp_` (ex: `fp_transacoes`)
- **Colunas:** `snake_case` (ex: `workspace_id`)
- **Functions:** `snake_case` (ex: `get_todos_usuarios`)

---

## 🔗 Links Relacionados

- **[Stack Técnica](STACK-TECNICA.md)** - Tecnologias usadas
- **[← Voltar ao índice](../README.txt)**
