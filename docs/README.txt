# 💰 Sistema de Controle Financeiro Pessoal

Um sistema moderno e intuitivo para controle de finanças pessoais, desenvolvido com Next.js e Supabase.

## 🚀 Visão Geral

Sistema completo de controle financeiro pessoal com funcionalidades avançadas como:

- ✅ **Transações** - Receitas, despesas e transferências
- ✅ **Parcelamento** - Compras divididas automaticamente
- ✅ **Recorrência** - Transações que se repetem
- ✅ **Metas** - Controle de orçamento por categoria
- ✅ **Relatórios** - Gráficos e dashboards intuitivos
- ✅ **Multi-contas** - Gestão de várias contas/cartões

## 🛠️ Stack Tecnológica

### Frontend
- **Next.js 14** - Framework React com App Router
- **TypeScript** - Tipagem estática
- **Tailwind CSS** - Estilização utilitária
- **shadcn/ui** - Componentes modernos
- **Recharts** - Gráficos interativos
- **Context API** - Gerenciamento de estado React
- **Lucide React** - Ícones

### Backend & Database
- **Supabase** - Backend as a Service
- **PostgreSQL** - Banco de dados
- **Supabase Storage** - Upload de anexos
- **Row Level Security** - Segurança nativa

### Deploy
- **Vercel** - Hospedagem frontend
- **Supabase Cloud** - Hospedagem backend

## 📋 Pré-requisitos

Antes de começar, certifique-se de ter instalado:

- **Node.js** (versão 18 ou superior)
- **npm** ou **yarn**
- **Git**
- Conta no **Supabase** (gratuita)
- Conta no **Vercel** (gratuita, opcional)

## ⚡ Instalação Rápida

### 1. Clonar o Repositório

```bash
git clone https://github.com/Rica-VibeCoding/controle_financeiro.git
cd controle_financeiro
```

### 2. Instalar Dependências

```bash
npm install

# Configurar shadcn/ui
npx shadcn-ui@latest init

# Instalar componentes necessários
npx shadcn-ui@latest add button card dialog form input select toast badge table
```

### 3. Configurar Variáveis de Ambiente

Copie o arquivo de exemplo e configure suas credenciais:

```bash
cp .env.example .env.local
```

Edite o arquivo `.env.local`:

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

# Configurações da aplicação
NEXT_PUBLIC_APP_NAME="Controle Financeiro"
NEXT_PUBLIC_MAX_FILE_SIZE=5242880
```

### 4. Configurar Banco de Dados

Execute o script SQL no Supabase:

1. Acesse o [Supabase Dashboard](https://supabase.com/dashboard)
2. Vá para **SQL Editor**
3. Cole e execute o conteúdo do arquivo `docs/schema.sql`

### 5. Configurar Storage (Anexos)

O storage já é configurado automaticamente pelo script `schema.sql`, mas se precisar configurar manualmente:

1. Vá para **Storage** no Supabase Dashboard
2. Verificar se existe o bucket: `anexos-transacoes`
3. Se não existir, será criado automaticamente pelo script SQL

**Nota:** As políticas de acesso já estão incluídas no script `schema.sql`

### 6. Iniciar Desenvolvimento

```bash
npm run dev
```

Acesse: http://localhost:3000

## 📁 Estrutura do Projeto

```
controle-financeiro/
├── 📁 src/
│   ├── 📁 app/                    # Páginas (App Router)
│   │   ├── 📁 dashboard/          # Tela principal
│   │   ├── 📁 transacoes/         # Gestão de transações
│   │   ├── 📁 relatorios/         # Relatórios e metas
│   │   ├── 📁 contas/             # Gestão de contas
│   │   └── 📁 categorias/         # Gestão de categorias
│   │
│   ├── 📁 componentes/            # Componentes React
│   │   ├── 📁 layout/             # Layout base
│   │   ├── 📁 dashboard/          # Dashboard específicos
│   │   ├── 📁 transacoes/         # Transações específicos
│   │   ├── 📁 metas/              # Metas específicos
│   │   ├── 📁 ui/                 # Componentes shadcn/ui
│   │   └── 📁 comum/              # Componentes reutilizáveis
│   │
│   ├── 📁 servicos/               # Lógica de negócio
│   │   ├── 📁 supabase/           # API Supabase
│   │   ├── 📁 relatorios/         # Cálculos e processamento
│   │   └── 📁 recorrencia/        # Transações recorrentes
│   │
│   ├── 📁 hooks/                  # Hooks customizados
│   ├── 📁 contextos/              # Context API para estado global
│   ├── 📁 tipos/                  # Tipos TypeScript
│   └── 📁 utilitarios/            # Funções auxiliares
│
├── 📁 public/                     # Arquivos estáticos
├── 📁 docs/                       # Documentação do projeto
└── 📄 Arquivos de configuração
```

## 🎮 Comandos Principais

### Desenvolvimento

```bash
# Iniciar servidor de desenvolvimento
npm run dev

# Build para produção
npm run build

# Iniciar servidor produção (após build)
npm run start

# Verificar código (linting)
npm run lint

# Verificar tipos TypeScript
npx tsc --noEmit
```

### Banco de Dados

```bash
# Gerar tipos TypeScript do Supabase
npx supabase gen types typescript --project-id nzgifjdewdfibcopolof > src/tipos/supabase.ts

# Reset completo do banco (cuidado!)
# Execute o schema.sql novamente no dashboard
```

### Deploy

```bash
# Deploy no Vercel
vercel --prod

# Preview deploy
vercel
```

## 📊 Funcionalidades Principais

### 💸 Gestão de Transações

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

### 🔄 Parcelamento Inteligente

```typescript
// Exemplo: Geladeira R$ 1.200 em 12x
const transacao = {
  descricao: 'Geladeira',
  valor: 1200.00, // R$ 1.200,00 em reais
  total_parcelas: 12
};

// Sistema cria automaticamente:
// Parcela 1/12: R$ 100,00 - 15/08/2025
// Parcela 2/12: R$ 100,00 - 15/09/2025
// ... até 12/12
```

### 📅 Transações Recorrentes

Configure uma vez e o sistema gera automaticamente:

- **Salário** - Todo dia 5 do mês
- **Aluguel** - Todo dia 10 do mês  
- **Academia** - Todo dia 15 do mês

Transações recorrentes nascem com status "pendente" para confirmação.

### 🎯 Sistema de Metas

**Tipos de Meta:**
- **Por Categoria** - "Máximo R$ 500 em Alimentação/mês"
- **Total** - "Máximo R$ 3.000 gastos/mês"

**Alertas Visuais:**
- 🟢 Verde: 0-50% usado
- 🟡 Amarelo: 51-80% usado
- 🟠 Laranja: 81-99% usado
- 🔴 Vermelho: 100%+ usado (estourou)

### 📈 Dashboard e Relatórios

- **Saldo Total** - Soma de todas as contas
- **Receitas/Despesas do Mês** - Resumo mensal
- **Gráfico por Categorias** - Pizza dos gastos
- **Evolução Temporal** - Linha do tempo
- **Metas** - Progresso visual em barras

## 🔧 Personalização

### Adicionar Nova Categoria

```typescript
import { criarCategoria } from '@/servicos/supabase/categorias';

await criarCategoria({
  nome: 'Pets',
  tipo: 'despesa',
  icone: 'heart',
  cor: '#F59E0B',
  ativo: true
});
```

### Criar Formulário Customizado

```typescript
// /componentes/meu-formulario.tsx
import { FormularioTransacao } from '@/componentes/transacoes/formulario-transacao';

export function MeuFormulario() {
  const { criar } = usarTransacoes();
  
  const aoSalvar = async (dados) => {
    await criar(dados);
    // Lógica customizada aqui
  };

  return (
    <FormularioTransacao 
      aoSalvar={aoSalvar}
      aoCancelar={() => {}}
    />
  );
}
```

### Adicionar Novo Gráfico

```typescript
// /componentes/graficos/meu-grafico.tsx
import { ResponsiveContainer, BarChart, Bar } from 'recharts';

export function MeuGrafico({ dados }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={dados}>
        <Bar dataKey="valor" fill="#3B82F6" />
      </BarChart>
    </ResponsiveContainer>
  );
}
```

### Usar Componentes shadcn/ui

```typescript
// /componentes/meu-formulario.tsx
import { Button } from '@/componentes/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/componentes/ui/card';
import { Input } from '@/componentes/ui/input';

export function MeuFormulario() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Nova Transação</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Input placeholder="Descrição" />
          <Input placeholder="Valor" type="number" />
          <Button>Salvar</Button>
        </div>
      </CardContent>
    </Card>
  );
}
```

## 🚀 Deploy Produção

### Vercel (Recomendado)

1. **Push para GitHub**
   ```bash
   git add .
   git commit -m "Setup inicial"
   git push origin main
   ```

2. **Conectar no Vercel**
   - Acesse [vercel.com](https://vercel.com)
   - Importe o repositório GitHub
   - Configure variáveis de ambiente

3. **Variáveis de Ambiente Produção**
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://nzgifjdewdfibcopolof.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anonima
   NEXT_PUBLIC_APP_URL=https://seu-app.vercel.app
   NODE_ENV=production
   ```

4. **Deploy Automático**
   - Cada push na branch `main` faz deploy automaticamente

### Outras Plataformas

**Netlify:**
```bash
npm run build
# Upload da pasta .next para Netlify
```

**VPS próprio:**
```bash
npm run build
npm run start
# Configurar nginx/apache como proxy reverso
```

## 🧪 Testes

### Testes Manuais

1. **Fluxo Básico**
   ```bash
   # 1. Criar conta
   # 2. Criar categoria
   # 3. Criar transação
   # 4. Verificar saldo
   # 5. Criar meta
   # 6. Verificar relatório
   ```

2. **Testes de Parcelamento**
   ```bash
   # 1. Criar transação parcelada
   # 2. Verificar se todas as parcelas foram criadas
   # 3. Marcar algumas como pagas
   # 4. Verificar impacto no saldo
   ```

3. **Testes de Recorrência**
   ```bash
   # 1. Criar transação recorrente
   # 2. Verificar próxima data
   # 3. Simular processamento automático
   ```

### Dados de Teste

O sistema já vem com dados iniciais:

- **15 categorias** (Alimentação, Transporte, etc.)
- **25+ subcategorias** 
- **7 formas de pagamento**
- **5 centros de custo**
- **6 contas exemplo**

## 🔧 Troubleshooting

### Problemas Comuns

**1. Erro de conexão Supabase**
```bash
# Verifique as variáveis de ambiente
echo $NEXT_PUBLIC_SUPABASE_URL

# Teste conexão
curl https://nzgifjdewdfibcopolof.supabase.co/rest/v1/
```

**2. Erro de build TypeScript**
```bash
# Verificar tipos
npx tsc --noEmit

# Limpar cache
rm -rf .next
npm run build
```

**3. Erro de permissão Supabase**
```sql
-- Verificar políticas RLS
SELECT * FROM pg_policies WHERE tablename LIKE 'fp_%';

-- Resetar políticas se necessário
ALTER TABLE fp_transacoes DISABLE ROW LEVEL SECURITY;
```

**4. Upload de arquivos não funciona**
```bash
# Verificar bucket no Supabase Storage
# Configurar políticas públicas
# Verificar CORS se necessário
```

### Logs e Debug

```typescript
// Ativar logs detalhados no desenvolvimento
console.log('Debug transação:', transacao);

// Verificar conexão Supabase
console.log('Supabase client:', supabase);

// Monitorar queries
supabase.auth.onAuthStateChange((event, session) => {
  console.log('Auth event:', event, session);
});
```

## 📚 Recursos Adicionais

### Documentação Técnica

- 📋 **PRD** - Especificações completas do produto
- 🗃️ **Schema SQL** - Estrutura do banco de dados
- 🔌 **API Docs** - Documentação detalhada da API
- 🎨 **UI Guide** - Guia de componentes e design

### Links Úteis

- **Supabase Dashboard:** https://supabase.com/dashboard/project/nzgifjdewdfibcopolof
- **Vercel Dashboard:** https://vercel.com/dashboard
- **Next.js Docs:** https://nextjs.org/docs
- **Tailwind CSS:** https://tailwindcss.com/docs
- **shadcn/ui:** https://ui.shadcn.com/

### Comunidade

- **GitHub Issues:** https://github.com/Rica-VibeCoding/controle_financeiro/issues
- **Discussions:** https://github.com/Rica-VibeCoding/controle_financeiro/discussions
- **Pull Requests:** https://github.com/Rica-VibeCoding/controle_financeiro/pulls

## 🤝 Contribuição

### Como Contribuir

1. **Fork o projeto**
2. **Crie uma branch** (`git checkout -b feature/nova-funcionalidade`)
3. **Commit suas mudanças** (`git commit -m 'Adiciona nova funcionalidade'`)
4. **Push para a branch** (`git push origin feature/nova-funcionalidade`)
5. **Abra um Pull Request**

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
style: padroniza formatação dos componentes
refactor: reorganiza estrutura de pastas
test: adiciona testes para sistema de metas
```

## 📄 Licença

Este projeto está sob a licença **MIT**. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 👨‍💻 Autor

**Seu Nome**
- GitHub: [@seu-usuario](https://github.com/seu-usuario)
- LinkedIn: [Seu Perfil](https://linkedin.com/in/seu-perfil)
- Email: seu.email@exemplo.com

## 🎉 Agradecimentos

- **Supabase** - Backend incrível
- **Vercel** - Deploy simplificado  
- **shadcn/ui** - Componentes lindos
- **Comunidade** - Feedback valioso

---

**Feito com ❤️ e ☕ no Brasil** 🇧🇷

**⭐ Se este projeto te ajudou, deixe uma star!**