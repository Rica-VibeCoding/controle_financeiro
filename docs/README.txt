# 💰 Sistema de Controle Financeiro Pessoal

> **🚀 Sistema completo de finanças pessoais com importação CSV inteligente, backup automático e PWA mobile**

Um sistema moderno e intuitivo para controle de finanças pessoais, desenvolvido com **Next.js 15.5.0** e **Supabase**.

---

## 📑 Índice de Documentação

### 🚀 **Para Começar Rápido**
- **[⚡ Quick Start - 5 Minutos](guias/QUICK-START.md)** ← **Comece aqui!**
- **[🛠️ Instalação Completa](guias/INSTALACAO-COMPLETA.md)** - Setup detalhado
- **[💻 Comandos Principais](guias/COMANDOS.md)** - npm run dev, build, etc.

### 📊 **Funcionalidades**
- **[📥 Importação CSV Inteligente](funcionalidades/IMPORTACAO-CSV.md)** - Nubank + classificação
- **[💾 Backup/Restore Completo](funcionalidades/BACKUP-RESTORE.md)** - Export ZIP
- **[📱 PWA - Aplicativo Mobile](funcionalidades/PWA-MOBILE.md)** - Instalar no celular
- **[👥 Sistema Multiusuário](funcionalidades/MULTIUSUARIO.md)** - Workspaces + convites
- **[🔐 Dashboard Admin](funcionalidades/DASHBOARD-ADMIN.md)** - Super admin 100%

### 🛠️ **Para Desenvolvedores**
- **[🔧 Personalização](desenvolvimento/PERSONALIZACAO.md)** - Hooks, componentes
- **[⚡ Otimização Performance](desenvolvimento/PERFORMANCE.md)** - SWR, cache
- **[🧪 Testes](desenvolvimento/TESTES.md)** - Checklist + stress tests

### 📚 **Referência Técnica**
- **[🛠️ Stack Tecnológica](specs/STACK-TECNICA.md)** - Next.js, Supabase, etc.
- **[📁 Estrutura Projeto](specs/ESTRUTURA-PROJETO.md)** - Arquitetura pastas
- **[🔧 Troubleshooting](guias/TROUBLESHOOTING.md)** - Problemas comuns

### 🤖 **Para IA/Claude**
- **[📋 Resumo.md](Resumo.md)** ⭐ **Leia SEMPRE primeiro!**

---

## 🎯 Visão Geral Rápida

### ✅ Funcionalidades Principais

- ✅ **Transações** - Sistema de abas único (receitas, despesas, previstas, recorrentes)
- ✅ **Parcelamento** - Compras divididas automaticamente
- ✅ **Recorrência** - Transações que se repetem
- ✅ **Metas** - Controle de orçamento por categoria
- ✅ **Relatórios** - Gráficos e dashboards intuitivos
- ✅ **Multi-contas** - Gestão de várias contas/cartões
- ✅ **Importação CSV** - Importação inteligente de extratos
- ✅ **Backup/Restore** - Backup completo dos dados
- ✅ **PWA Mobile** - Aplicativo instalável no celular
- ✅ **Sistema Multiusuário Completo** - Workspaces + convites + gestão de equipe
- ✅ **Gestão de Usuários** - Remover membros + alterar roles + tracking atividade
- ✅ **Sistema Super Admin** - Controle geral do sistema + gerenciamento global de usuários

---

## 🛠️ Stack Principal

### Frontend
- **Next.js 15.5.0** - Framework React com App Router + Turbopack
- **React 19.1.1** - Biblioteca de UI com recursos mais recentes
- **TypeScript 5** - Tipagem estática avançada
- **Tailwind CSS 4** - Estilização utilitária moderna

### Backend & Database
- **Supabase** - Backend as a Service
- **PostgreSQL** - Banco de dados
- **Supabase Storage** - Upload de anexos
- **Row Level Security** - Segurança nativa

### Deploy
- **Vercel** - Hospedagem frontend
- **Supabase Cloud** - Hospedagem backend

---

## 📋 Pré-requisitos

Antes de começar, certifique-se de ter instalado:

- **Node.js** (versão 18 ou superior) - Recomendado: Node.js 20+
- **npm** ou **yarn**
- **Git**
- Conta no **Supabase** (gratuita)
- Conta no **Vercel** (gratuita, opcional)

---

## ⚡ Quick Commands

```bash
# Desenvolvimento rápido (com Turbopack)
npm run dev --turbopack

# Build produção (43s otimizado)
npm run build

# Validar TypeScript (SEMPRE antes de commit!)
npx tsc --noEmit

# Linting
npm run lint

# Iniciar servidor produção
npm run start
```

---

## 🚀 Deploy Vercel

### Deploy Recomendado (GitHub → Vercel)

```bash
git add .
git commit -m "mensagem do commit"
git push origin main  # Vercel faz deploy automático ✅
```

### Variáveis de Ambiente Produção

```env
NEXT_PUBLIC_SUPABASE_URL=https://nzgifjdewdfibcopolof.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anonima
NEXT_PUBLIC_APP_URL=https://seu-app.vercel.app
NODE_ENV=production
```

---

## 💸 Gestão de Transações

**Tipos Suportados:**
- **Receita** - Entradas financeiras (salário, freelance)
- **Despesa** - Saídas financeiras (compras, contas)
- **Transferência** - Movimentação entre contas próprias
- **Parcelada** - Despesas divididas automaticamente

**Recursos:**
- Categorização hierárquica (categoria → subcategoria)
- Upload de comprovantes (PDF, imagens)
- Status (pendente, pago, cancelado)
- Observações e centro de custo

---

## 🔄 Parcelamento Inteligente

```typescript
// Exemplo: Geladeira R$ 1.200 em 12x
const transacao = {
  descricao: 'Geladeira',
  valor: 1200.00,
  total_parcelas: 12
};

// Sistema cria automaticamente:
// Parcela 1/12: R$ 100,00 - 15/08/2025
// Parcela 2/12: R$ 100,00 - 15/09/2025
// ... até 12/12
```

---

## 📅 Transações Recorrentes

Configure uma vez e o sistema gera automaticamente:

- **Salário** - Todo dia 5 do mês
- **Aluguel** - Todo dia 10 do mês
- **Academia** - Todo dia 15 do mês

Transações recorrentes nascem com status "pendente" para confirmação.

---

## 🎯 Sistema de Metas

**Tipos de Meta:**
- **Por Categoria** - "Máximo R$ 500 em Alimentação/mês"
- **Total** - "Máximo R$ 3.000 gastos/mês"

**Alertas Visuais:**
- 🟢 Verde: 0-50% usado
- 🟡 Amarelo: 51-80% usado
- 🟠 Laranja: 81-99% usado
- 🔴 Vermelho: 100%+ usado (estourou)

---

## 📈 Dashboard e Relatórios

- **Saldo Total** - Soma de todas as contas
- **Receitas/Despesas do Mês** - Resumo mensal
- **Gráfico por Categorias** - Pizza dos gastos
- **Evolução Temporal** - Linha do tempo
- **Metas** - Progresso visual em barras

---

## 🏦 Bancos Suportados (Importação CSV)

- ✅ **Nubank (Cartão de Crédito)** - Detecta automaticamente
- ✅ **Nubank (Conta Corrente)** - Diferencia receitas/despesas
- ✅ **Cartões Genéricos** - Formato padrão CSV

**Classificação Inteligente:**
- Sistema aprende com transações anteriores
- Sugere categorias automaticamente
- Detecção de duplicatas

---

## 💾 Backup e Restauração

**Exportação Completa:**
- Todas as transações
- Categorias e subcategorias
- Contas e formas de pagamento
- Metas mensais

**Importação Inteligente:**
- Backup automático antes de importar
- Preview do que será importado
- Validação de integridade

---

## 📱 PWA - Aplicativo Mobile

**Instale como app no celular:**

- **Android:** Chrome → Menu → "Adicionar à tela inicial"
- **iPhone:** Safari → Compartilhar → "Adicionar à Tela de Início"
- **Desktop:** Chrome → Ícone de instalação na barra

**Benefícios:**
- ✅ Ícone na home screen
- ✅ Funciona sem barra do navegador
- ✅ Splash screen personalizada
- ✅ Experiência de app nativo

---

## 👥 Sistema Multiusuário

**100% Funcionando:**
- **Workspaces** - Criados automaticamente para cada usuário
- **Convites** - Links únicos que expiram em 7 dias
- **Roles** - Owner (proprietário) e Member (membro)
- **Gestão** - Remover usuários, alterar roles
- **Tracking** - Ver última atividade de cada membro

**Como Usar:**
1. Menu > Configurações > Usuários
2. Criar Convite → Link copiado
3. Compartilhar via WhatsApp/Email
4. Destinatário aceita e entra no workspace

---

## 🔐 Dashboard Administrativo

**Super Admin - 100% Implementado:**
- **Acesso:** Apenas `conectamovelmar@gmail.com`
- **URL:** `/admin/dashboard`

**Funcionalidades:**
- Ver todos os usuários da plataforma
- Gestão completa de workspaces
- KPIs em tempo real
- Ativar/desativar usuários
- Métricas de crescimento

---

## 🔧 Troubleshooting Rápido

### Problemas de Auth
```bash
# Limpar cache
Remove-Item -Recurse -Force .next  # Windows
rm -rf .next                       # Linux/Mac
npm run dev
```

### Build Falha
```bash
# Validar ANTES de commit
npx tsc --noEmit
npm run lint
npm run build
```

### PWA Não Instala
```bash
# Verificar manifest
curl http://localhost:3000/manifest.json

# Verificar ícones
ls -la public/icon-192.png
```

**Mais soluções:** [Troubleshooting Completo](guias/TROUBLESHOOTING.md)

---

## 🚀 Links Rápidos

- **Supabase Dashboard:** [nzgifjdewdfibcopolof](https://supabase.com/dashboard/project/nzgifjdewdfibcopolof)
- **GitHub Repo:** [controle_financeiro](https://github.com/Rica-VibeCoding/controle_financeiro)
- **Deploy Vercel:** Seu app em produção

---

## 📖 Como Usar Esta Documentação

**Escolha seu caminho:**

1. **Novo no projeto?**
   → Leia [Quick Start](guias/QUICK-START.md) (5 minutos)

2. **Quer entender uma feature?**
   → Explore [Funcionalidades](funcionalidades/)

3. **Vai desenvolver?**
   → Comece em [Desenvolvimento](desenvolvimento/)

4. **Problema técnico?**
   → Consulte [Troubleshooting](guias/TROUBLESHOOTING.md)

5. **IA trabalhando no projeto?**
   → **Sempre leia [Resumo.md](Resumo.md) primeiro!**

---

## 🎓 Conceitos Importantes

### Workspaces
Cada usuário ou equipe tem um workspace isolado. Dados são totalmente separados entre workspaces.

### RLS (Row Level Security)
Segurança nativa do PostgreSQL. Cada usuário vê apenas dados do seu workspace.

### SWR (Stale-While-Revalidate)
Sistema de cache inteligente. Dados aparecem instantaneamente e atualizam em background.

### Turbopack
Build tool 3x mais rápido que Webpack. Usado em desenvolvimento.

---

## 🤝 Contribuição

### Padrões de Código

- **Nomes em português** para arquivos e variáveis
- **TypeScript** obrigatório
- **ESLint + Prettier** para formatação
- **Commits convencionais** (feat, fix, docs, etc.)

### Estrutura de Commit

```bash
feat: adiciona sistema de backup automático
fix: corrige cálculo de saldo em transferências
docs: atualiza README com novos comandos
refactor: reorganiza estrutura de pastas
```

---

## 📄 Licença

Este projeto está sob a licença **MIT**. Veja o arquivo LICENSE para mais detalhes.

---

## 🎉 Status do Projeto

✅ **Sistema Multiusuário** - 100% Funcionando
✅ **Dashboard Admin** - 100% Implementado
✅ **Sistema de Transações** - Refatorado (Janeiro 2025)
✅ **Importação CSV** - Totalmente funcional
✅ **Backup/Restore** - Operacional
✅ **PWA Mobile** - Instalável e funcional

**Deploy:** ✅ Vercel habilitado (build: 43s estável)
**Performance:** ✅ Lighthouse Score >90

---

**Feito com ❤️ no Brasil** 🇧🇷

**⭐ Se este projeto te ajudou, deixe uma star no GitHub!**
