# 🚀 Prompt para Continuar Refatoração do Sistema de Convites

**Use este prompt exatamente como está para iniciar novo chat e continuar a implementação.**

---

## PROMPT PARA COPIAR E COLAR:

```
Olá! Preciso continuar a implementação da refatoração do sistema de convites do meu projeto financeiro.

**CONTEXTO RÁPIDO:**
- Projeto: Sistema de Controle Financeiro Pessoal (Next.js 15 + Supabase)
- Fase 1 (Correções Urgentes): ✅ 100% Concluída
- Fase 2 (Refatoração Estrutural): ⏳ Próxima (4 tarefas)
- Chat anterior atingiu limite de contexto

**O QUE JÁ FOI FEITO:**
✅ SQL da trigger corrigida e aplicada no banco (migration `20251022060125`)
✅ 41 console.logs substituídos por logger
✅ Código validado (TypeScript + Build passando)
✅ Commit realizado da Fase 1

**O QUE PRECISO AGORA:**
Implementar a FASE 2 do plano de refatoração, que tem 4 tarefas:

**Tarefa 2.1:** Criar arquivo de tipos centralizados (`src/tipos/convites.ts`)
**Tarefa 2.2:** Refatorar função `aceitarConvite()` extraindo 4 funções menores
**Tarefa 2.3:** Criar hook `usar-registro-convite.ts`
**Tarefa 2.4:** Padronizar retornos com tipo genérico `Resultado<T>`

**DOCUMENTAÇÃO COMPLETA:**
Leia o arquivo @docs/desenvolvimento/PLANO-REFATORACAO-SISTEMA-CONVITES.md

Este arquivo contém:
- ✅ Status detalhado da Fase 1 concluída
- 📋 Plano completo da Fase 2 com código linha por linha
- 🔍 Validações necessárias após cada tarefa
- ⚠️ Riscos e rollback plan

**IMPORTANTE:**
1. Antes de começar, valide que a Fase 1 está OK (comandos no documento)
2. Siga o plano EXATAMENTE como descrito (tem diff completo de cada mudança)
3. Execute validações após CADA tarefa (TypeScript + Build)
4. Faça commit após cada tarefa concluída
5. Se encontrar alguma inconsistência, me pergunte antes de prosseguir

**ABORDAGEM:**
Por favor, leia a documentação primeiro e me apresente:
1. Resumo do que você entendeu da Fase 2
2. Lista das 4 tarefas com estimativa de complexidade
3. Validações que fará antes de começar
4. Sua recomendação de como executar (tudo de uma vez ou tarefa por tarefa)

Depois me pergunte como eu quero proceder.

Vamos começar?
```

---

## DICAS PARA O NOVO CHAT:

### Se o Chat Pedir Mais Contexto:

**Sobre o Projeto:**
- É um sistema financeiro pessoal multiusuário
- Next.js 15, React 19, TypeScript, Supabase
- Deploy na Vercel
- Preferências do Ricardo estão em `docs/Resumo.md`

**Sobre o Sistema de Convites:**
- Permite owners compartilharem acesso ao workspace
- Fluxo: Owner cria convite → Compartilha link → Usuário registra → Adicionado ao workspace
- Arquivo principal: `src/servicos/supabase/convites-simples.ts` (570 linhas)

**Problema da Fase 1 (já resolvido):**
- Trigger SQL buscava convite mais recente ao invés do código específico
- Causava bug quando havia 2+ convites ativos
- Solução: Passar `invite_code` via metadata + buscar pelo código exato

### Se o Chat Perguntar Sobre Riscos:

**Fase 2 tem risco Médio-Alto porque:**
- Mexe em função core (`aceitarConvite`) com 176 linhas
- Múltiplos caminhos de execução
- Usuários ativos podem ser afetados se quebrar

**Mitigação:**
- Plano tem diff completo de cada mudança
- Validações após cada tarefa
- Commit incremental para poder reverter
- Testes (quando habilitados) devem passar

### Comandos Úteis:

```bash
# Validar TypeScript
npx tsc --noEmit

# Build de produção
npm run build

# Verificar console.logs
grep -r "console\." src/servicos/supabase/convites-simples.ts

# Ver último commit
git log -1 --oneline

# Ver status do git
git status

# Rodar testes (quando habilitados)
npm test convites
```

---

## CHECKLIST PARA O RICARDO:

Antes de usar o prompt no novo chat:

- [ ] Commit da Fase 1 foi feito?
- [ ] Build está passando?
- [ ] TypeScript sem erros?
- [ ] Você leu a seção da Fase 2 no documento?
- [ ] Tem tempo para dedicar 4-6h à Fase 2?

---

## REFERÊNCIAS RÁPIDAS:

**Arquivos que serão modificados na Fase 2:**
- `src/tipos/convites.ts` (NOVO)
- `src/servicos/supabase/convites-simples.ts` (REFATORAR)
- `src/hooks/usar-registro-convite.ts` (NOVO)
- `src/app/auth/register/page.tsx` (AJUSTAR)

**Métricas de Sucesso da Fase 2:**
- ✅ Complexidade ciclomática: 15 → 6 (redução de 60%)
- ✅ Função maior: 176 → ~40 linhas (redução de 77%)
- ✅ Testes: 0% → habilitados e passando
- ✅ TypeScript: sem erros
- ✅ Build: passando

---

## PRÓXIMAS FASES (DEPOIS DA FASE 2):

**Fase 3:** Melhorias e Otimizações
- Rate limiting no servidor
- Validações mais robustas
- Retry logic
- Logs estruturados

**Estimativa Total:** Fase 2 (4-6h) + Fase 3 (3-4h) = 7-10h restantes

---

**BOA SORTE! 🚀**

Se tiver dúvidas durante a implementação, consulte a seção de troubleshooting no documento principal.
