## 📋 Hierarquia de Leitura - Documentação Modular

**SEMPRE siga esta ordem:**

1. **`docs/Resumo.md`** ⭐ **PRIORIDADE MÁXIMA**
   - Contexto atual do projeto
   - Preferências de comunicação com Ricardo
   - Status de implementações recentes

2. **`docs/README.txt`** - Índice de Navegação
   - Use como mapa para encontrar documentação específica
   - NÃO leia completo, apenas use os links

3. **Documentação Específica** (quando necessário):
   - `docs/guias/` - Quick start, instalação, comandos, troubleshooting
   - `docs/funcionalidades/` - CSV, backup, PWA, multiusuário, dashboard
   - `docs/desenvolvimento/` - Personalização, performance, testes
   - `docs/specs/` - Stack técnica, estrutura do projeto

**Regra de Ouro:**
- ✅ Leia Resumo.md SEMPRE antes de começar
- ✅ Use README.txt como índice (não leia completo)
- ✅ Leia apenas documentos específicos que você precisa
- ❌ NUNCA leia todos os documentos de uma vez

## Regras de Implementação
- SEMPRE valide TypeScript antes de continuar
- SEMPRE rode linter após mudanças (quando possível)
- NUNCA pule etapas de validação
- Se algo falhar, PARE e corrija antes de prosseguir
- NUNCA deixe variáveis não usadas (Vercel falha no deploy)
- NUNCA deixe imports não utilizados (Vercel falha no deploy)
- SEMPRE use tipos explícitos em props e funções

## Comandos Obrigatórios
- `npx tsc --noEmit` para validar TypeScript
- `npm run build` para testar build (43s tempo atual otimizado)
- `npm run build:analyze` para análise de bundle
- `npm run lint` quando problemas WSL forem resolvidos
- `node --version` para verificar Node.js 20.19.4

## Comandos Customizados
- `qcheck` - Revisão rápida de código e best practices
- `qplan` - Analise consistência antes de implementar mudanças

## Sistema de Transações (Janeiro 2025)
- **NOVA ARQUITETURA**: Sistema de abas único em `/transacoes`
- **PERFORMANCE**: Navegação instantânea (state interno)
- **UX MELHORADA**: Indicadores visuais + loading otimizado
- **DOCUMENTAÇÃO**: Ver `docs/SISTEMA-TRANSACOES-ABAS.md`