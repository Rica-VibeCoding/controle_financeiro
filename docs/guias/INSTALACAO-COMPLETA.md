# 🛠️ Instalação Completa

> **Guia detalhado de instalação e configuração**

---

## 📋 Pré-requisitos

Certifique-se de ter instalado:

- **Node.js** (versão 18 ou superior) - Recomendado: Node.js 20+
- **npm** ou **yarn**
- **Git**
- Conta no **Supabase** (gratuita)
- Conta no **Vercel** (gratuita, opcional para deploy)

---

## 1️⃣ Clonar o Repositório

```bash
git clone https://github.com/Rica-VibeCoding/controle_financeiro.git
cd controle_financeiro
```

---

## 2️⃣ Instalar Dependências

```bash
npm install

# Componentes UI já estão incluídos no projeto
# Não é necessário instalar shadcn/ui separadamente
```

---

## 3️⃣ Configurar Variáveis de Ambiente

### Copiar Template

```bash
cp .env.example .env.local
```

### Editar .env.local

```env
# Supabase - Projeto: nzgifjdewdfibcopolof
NEXT_PUBLIC_SUPABASE_URL=https://nzgifjdewdfibcopolof.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im56Z2lmamRld2RmaWJjb3BvbG9mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc0NjA4NDAsImV4cCI6MjA2MzAzNjg0MH0.O7MKZNx_Cd-Z12iq8h0pq6Sq0bmJazcxDHvlVb4VJQc

# Chave secreta service_role (usar apenas no servidor/desenvolvimento)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im56Z2lmamRld2RmaWJjb3BvbG9mIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzQ2MDg0MCwiZXhwIjoyMDYzMDM2ODQwfQ.6D9JGbSXzQZtFSu96hA_4cTtde8C3G-WwPG3C4Ta5n0

# Ambiente
NODE_ENV=development

# URLs
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_STORAGE_URL=https://nzgifjdewdfibcopolof.supabase.co/storage/v1/object/public

# URL de desenvolvimento personalizada (para WSL/IP específico)
NEXT_PUBLIC_DEV_URL=http://172.19.112.1:3000

# Configurações da aplicação
NEXT_PUBLIC_APP_NAME="Controle Financeiro"
NEXT_PUBLIC_MAX_FILE_SIZE=5242880
NEXT_PUBLIC_DEV_MODE=true
```

---

## 4️⃣ Configurar Banco de Dados

### Executar Schema SQL

1. Acesse o [Supabase Dashboard](https://supabase.com/dashboard)
2. Vá para **SQL Editor**
3. Cole e execute o conteúdo do arquivo `docs/schema.sql`

### Verificar Criação das Tabelas

O script SQL cria automaticamente:
- ✅ 10 tabelas `fp_*` (com workspace_id e RLS)
- ✅ Bucket de storage `anexos-transacoes`
- ✅ Políticas de segurança RLS
- ✅ Índices de performance
- ✅ Functions SQL otimizadas

---

## 5️⃣ Configurar Storage (Anexos)

O storage é configurado automaticamente pelo `schema.sql`, mas se precisar configurar manualmente:

1. Vá para **Storage** no Supabase Dashboard
2. Verifique se existe o bucket: `anexos-transacoes`
3. As políticas RLS já estão configuradas

---

## 6️⃣ Iniciar Desenvolvimento

```bash
npm run dev --turbopack
```

Acesse: http://localhost:3000

---

## 7️⃣ Primeiro Uso

### Registrar Usuário

1. Acesse a tela de registro
2. Preencha email e senha
3. Confirme o email (verifique sua caixa de entrada)

### Sistema Cria Automaticamente

Ao confirmar o email, o sistema cria:
- ✅ Workspace pessoal (ex: "Família Silva")
- ✅ 9 categorias padrão (Alimentação, Transporte, etc.)
- ✅ 4 formas de pagamento padrão
- ✅ Conta "Carteira" inicial

### Primeira Transação

1. No dashboard, clique **"Nova Transação"**
2. Preencha:
   - **Descrição:** Salário
   - **Valor:** R$ 5.000,00
   - **Tipo:** Receita
3. Clique **"Salvar"**
4. ✅ Dashboard atualizado com saldo!

---

## 8️⃣ Deploy em Produção

### Conectar ao Vercel

1. Acesse [vercel.com](https://vercel.com)
2. Importe o repositório GitHub
3. Configure variáveis de ambiente (sem `NEXT_PUBLIC_DEV_MODE`)

### Variáveis de Produção

```env
NEXT_PUBLIC_SUPABASE_URL=https://nzgifjdewdfibcopolof.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anonima
NEXT_PUBLIC_APP_URL=https://seu-app.vercel.app
NODE_ENV=production
```

### Deploy Automático

Cada push na branch `main` faz deploy automaticamente ✅

---

## 🔧 Verificação Pós-Instalação

### Checklist

- [ ] `npm run dev` funciona sem erros
- [ ] Página inicial carrega (http://localhost:3000)
- [ ] Consegue registrar novo usuário
- [ ] Email de confirmação chega
- [ ] Login funciona após confirmar email
- [ ] Dashboard carrega com workspace criado
- [ ] Consegue criar primeira transação
- [ ] Transação aparece no dashboard

---

## 🆘 Problemas Comuns

Se encontrar problemas, consulte:
- **[Troubleshooting](TROUBLESHOOTING.md)** - Soluções para problemas comuns

---

## 🔗 Próximos Passos

- **[Comandos Principais](COMANDOS.md)** - Referência de comandos
- **[Funcionalidades](../funcionalidades/)** - Explorar recursos
- **[← Voltar ao índice](../README.txt)**
