# ⚡ Quick Start - 5 Minutos

> **Do zero ao sistema funcionando em 5 minutos**

---

## ✅ Passo 1: Clone e Instale (1 min)

```bash
git clone https://github.com/Rica-VibeCoding/controle_financeiro.git
cd controle_financeiro
npm install
```

---

## ✅ Passo 2: Configure Ambiente (1 min)

```bash
# Criar arquivo de configuração
echo 'NEXT_PUBLIC_SUPABASE_URL=https://nzgifjdewdfibcopolof.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im56Z2lmamRld2RmaWJjb3BvbG9mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc0NjA4NDAsImV4cCI6MjA2MzAzNjg0MH0.O7MKZNx_Cd-Z12iq8h0pq6Sq0bmJazcxDHvlVb4VJQc
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_DEV_URL=http://172.19.112.1:3000
NEXT_PUBLIC_DEV_MODE=true' > .env.local
```

---

## ✅ Passo 3: Configure Banco (1 min)

1. Acesse: [Supabase SQL Editor](https://supabase.com/dashboard/project/nzgifjdewdfibcopolof/sql)
2. Cole o conteúdo do arquivo `docs/schema.sql`
3. Clique em "Run" ▶️

---

## ✅ Passo 4: Rode o Sistema (1 min)

```bash
npm run dev --turbopack
```

🎉 **Acesse:** http://localhost:3000

---

## ✅ Passo 5: Primeiro Uso (1 min)

1. **Dashboard** aparecerá vazio (normal!)
2. **Clique "Nova Transação"**
3. **Preencha:** Salário, R$ 5.000, Receita
4. **Salve** ✅ Pronto! Sistema funcionando!

---

## 📋 Pré-requisitos

- **Node.js** (versão 18 ou superior) - Recomendado: Node.js 20+
- **npm** ou **yarn**
- **Git**
- Conta no **Supabase** (gratuita)

---

## 🔗 Próximos Passos

- **[Instalação Completa](INSTALACAO-COMPLETA.md)** - Setup detalhado
- **[Comandos Principais](COMANDOS.md)** - npm scripts
- **[← Voltar ao índice](../README.txt)**
