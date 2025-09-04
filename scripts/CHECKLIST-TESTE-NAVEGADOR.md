# ✅ CHECKLIST - TESTE MANUAL NO NAVEGADOR

## 🎯 TESTE RÁPIDO (5 minutos)

### ✅ CENÁRIO 1: Código 4YU2L0 com Usuário Novo
```
1. Abra: https://seudominio.com/auth/register?invite=4YU2L0
2. Verifique se mostra: "Você foi convidado por Ricardo"
3. Preencha:
   - Nome: "Teste Usuario 1"
   - Email: teste1@exemplo.com (NOVO, nunca usado)
   - Senha: teste123
4. Clique em "Criar Conta e Ingressar na Workspace"
5. ✅ Esperado: Mensagem de sucesso + redirecionamento para login
```

### ✅ CENÁRIO 2: Email Já Existente (Deve Falhar)
```
1. Mesmo link: ?invite=4YU2L0
2. Preencha com email do Ricardo: ricardo@seudominio.com
3. ✅ Esperado: Erro ANTES do registro
   "Este email já possui conta no sistema"
```

### ✅ CENÁRIO 3: Código Inválido
```
1. Link: https://seudominio.com/auth/register?invite=INVALIDO
2. ✅ Esperado: Formulário normal (sem contexto de convite)
```

---

## 🔍 LOGS PARA MONITORAR

### Console do Navegador (F12):
```
✅ Procurar por:
- "🔄 Iniciando aceitarConvite"
- "✅ Workspace do convite: Meu Workspace" 
- "👤 Usuário recém-criado encontrado"
- "✅ Convite aceito com sucesso"

❌ Não deve aparecer:
- Erros 500 ou 400
- "❌ Usuário não encontrado"
- "💥 Erro ao aceitar convite"
```

### Supabase Dashboard:
```
1. Tabela fp_convites_links:
   - Código 4YU2L0 deve SUMIR após uso
   
2. Tabela fp_usuarios:
   - Novo registro com email teste1@exemplo.com
   - workspace_id = do "Meu Workspace"
   - role = "member"
   - ativo = true

3. Tabela fp_audit_logs:
   - Novo log com action = "convite_usado"
   - metadata contém código e email
```

---

## 🚨 CASOS DE ERRO PARA TESTAR

### Email de Produção Real:
```
⚠️  CUIDADO: Use emails de teste apenas!
❌ NÃO usar emails reais de clientes
✅ Use: teste@exemplo.com, test@domain.com, etc.
```

### Códigos Expirados:
```
Se SUTOOJ não funcionar:
- Verifique expires_at no banco
- Se expirado: código será rejeitado corretamente
```

### Problemas de Conexão:
```
Se der erro 500:
1. Verifique logs do Supabase
2. Confirme RLS está funcionando
3. Teste em aba anônima (cache limpo)
```

---

## 📊 RESULTADOS ESPERADOS POR CENÁRIO

### ✅ SUCESSO COMPLETO:
1. Interface mostra convite corretamente
2. Formulário é submetido sem erros
3. Email de confirmação é enviado
4. Console mostra logs de sucesso
5. Banco tem novos registros corretos
6. Convite é consumido (deletado)

### ❌ FALHAS ESPERADAS:
1. Email duplicado → Erro antes do registro
2. Código inválido → Interface normal
3. Convite expirado → Erro de validação

---

## 🔧 TROUBLESHOOTING RÁPIDO

### Problema: "Código inválido"
```
Possíveis causas:
- Código expirado no banco
- Convite já foi usado
- Erro de digitação na URL

Solução:
- Verificar fp_convites_links no Supabase
- Criar novo convite se necessário
```

### Problema: "Erro ao aceitar convite"
```
Possíveis causas:
- admin.listUsers() retornando erro
- RLS bloqueando inserção
- Workspace_id inválido

Solução:
- Verificar logs do Supabase
- Confirmar usuário foi criado no auth.users
- Testar RLS manualmente
```

### Problema: Usuário criado mas não no workspace
```
Causa provável:
- aceitarConvite() falhou após signUp()
- Erro na inserção em fp_usuarios

Solução:
- Usuário deve fazer login e tentar aceitar convite novamente
- Ou admin pode adicionar manualmente
```

---

## ⏱️ TEMPO ESTIMADO PARA TESTE COMPLETO

- **Teste Básico**: 5 minutos
- **Verificação no Banco**: 3 minutos  
- **Teste de Casos de Erro**: 5 minutos
- **Total**: ~15 minutos

---

## 📝 RELATÓRIO PÓS-TESTE

Após os testes, confirme:

### ✅ FUNCIONANDO:
- [ ] Convite 4YU2L0 aceito com sucesso
- [ ] Novo usuário inserido no workspace correto
- [ ] Logs aparecem no console
- [ ] Email duplicado é rejeitado
- [ ] Código inválido é tratado

### 🔧 AJUSTES NECESSÁRIOS:
- [ ] Mensagens de erro podem ser melhoradas
- [ ] Performance pode ser otimizada  
- [ ] Logs podem ser mais detalhados

### 🎯 PRÓXIMOS PASSOS:
- [ ] Testar com mais usuários reais
- [ ] Monitorar performance em produção
- [ ] Documentar processo para outros admins

---

**💡 DICA FINAL**: Mantenha o console aberto (F12) durante todos os testes para capturar logs em tempo real e identificar problemas rapidamente.