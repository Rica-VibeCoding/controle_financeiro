# 🔧 Configuração Completa MCP Supabase

## ❌ Problema Identificado

Você está usando a **Service Role Key**, mas o MCP Supabase precisa de um **Personal Access Token (PAT)**.

## ✅ Solução - Como Criar Personal Access Token

### Passo 1: Acesse o Supabase Dashboard
1. Vá para: https://supabase.com/dashboard/account/tokens
2. Faça login na sua conta Supabase

### Passo 2: Criar Personal Access Token
1. Clique em **"Create new token"**
2. Nome sugerido: **"Claude Code MCP Server"**
3. Descrição: **"Token para MCP Supabase no Claude Code"**
4. Copie o token gerado (ele só aparece uma vez!)

### Passo 3: Configurar .mcp.json

Substitua o conteúdo do arquivo `.mcp.json` por:

```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": [
        "-y",
        "@supabase/mcp-server-supabase@latest",
        "--project-ref=nzgifjdewdfibcopolof"
      ],
      "env": {
        "SUPABASE_ACCESS_TOKEN": "SEU_PERSONAL_ACCESS_TOKEN_AQUI"
      }
    }
  }
}
```

**⚠️ IMPORTANTE:** Substitua `SEU_PERSONAL_ACCESS_TOKEN_AQUI` pelo token que você criou.

## 🚀 Para Acesso Total (sem --read-only)

Se quiser **acesso completo** para usar todas as funcionalidades MCP:

```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": [
        "-y",
        "@supabase/mcp-server-supabase@latest",
        "--project-ref=nzgifjdewdfibcopolof"
      ],
      "env": {
        "SUPABASE_ACCESS_TOKEN": "SEU_PERSONAL_ACCESS_TOKEN_AQUI"
      }
    }
  }
}
```

## 🛡️ Configuração Recomendada para Produção

Para desenvolvimento seguro, use **--read-only** para proteção:

```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": [
        "-y",
        "@supabase/mcp-server-supabase@latest",
        "--read-only",
        "--project-ref=nzgifjdewdfibcopolof"
      ],
      "env": {
        "SUPABASE_ACCESS_TOKEN": "SEU_PERSONAL_ACCESS_TOKEN_AQUI"
      }
    }
  }
}
```

## 🔍 Validação da Configuração

Após configurar, teste com estes comandos:

1. **Verificar URL do projeto:**
   ```
   mcp__supabase__get_project_url
   ```

2. **Listar tabelas:**
   ```
   mcp__supabase__list_tables
   ```

3. **Executar SQL simples:**
   ```sql
   mcp__supabase__execute_sql: SELECT version();
   ```

## 🛠️ Ferramentas MCP Supabase Disponíveis

### Database Operations
- `mcp__supabase__execute_sql` - Execução SQL direta
- `mcp__supabase__apply_migration` - Aplicar migrações
- `mcp__supabase__list_tables` - Listar tabelas
- `mcp__supabase__list_migrations` - Listar migrações

### Project Management  
- `mcp__supabase__get_project_url` - URL do projeto
- `mcp__supabase__get_anon_key` - Chave anônima
- `mcp__supabase__generate_typescript_types` - Gerar tipos TypeScript

### Documentation & Logs
- `mcp__supabase__search_docs` - Buscar documentação
- `mcp__supabase__get_logs` - Logs do sistema
- `mcp__supabase__get_advisors` - Recomendações

### Edge Functions
- `mcp__supabase__list_edge_functions` - Listar functions
- `mcp__supabase__deploy_edge_function` - Deploy functions

### Development Branches
- `mcp__supabase__create_branch` - Criar branch
- `mcp__supabase__list_branches` - Listar branches
- `mcp__supabase__merge_branch` - Merge branches
- `mcp__supabase__delete_branch` - Deletar branch

## ⚡ Próximos Passos

1. **Criar PAT no Supabase Dashboard**
2. **Atualizar .mcp.json com o token correto**
3. **Testar as funcionalidades**
4. **Explorar as 20+ ferramentas MCP disponíveis**

## 🔒 Segurança

- **Nunca compartilhe** seu Personal Access Token
- **Use .env** ou variáveis de ambiente para tokens em produção
- **Configure --read-only** para desenvolvimento seguro
- **Considere usar branches** para desenvolvimento

## 📞 Suporte

Após configurar, posso ajudar você a:
- Testar todas as funcionalidades MCP
- Configurar workflows otimizados
- Implementar automações avançadas
- Configurar debugging e monitoring

---

**💡 Dica:** Mantenha este arquivo como referência para configurações futuras!