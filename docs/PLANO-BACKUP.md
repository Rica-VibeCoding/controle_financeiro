# 💾 PLANO DE IMPLEMENTAÇÃO - SISTEMA DE BACKUP

**Projeto:** Sistema de Controle Financeiro  
**Versão:** 1.0  
**Data:** 2025-01-22  
**Status:** Planejamento  

---

## 📋 CONTEXTO E ANÁLISE

### 🏗️ Arquitetura Atual
- **Frontend:** Next.js 14 + TypeScript + Tailwind CSS
- **Backend:** Supabase (PostgreSQL + Storage)
- **Padrões:** Nomenclatura em português, hooks customizados com prefixo `usar-`
- **Localização UI:** `http://localhost:3000/configuracoes` (Card "Backup e Dados")

### 📊 Dados Atuais no Banco
- **8 tabelas fp_**: Estrutura completa implementada
- **120 transações**: Dados reais do usuário
- **21 categorias**: 10 padrão + 11 customizadas
- **7 contas**: Bancos e cartões personalizados
- **3 centros de custo**: Projetos específicos

### 🔗 Dependências Identificadas
```
Ordem de Backup/Restore:
1. fp_categorias (independente)
2. fp_contas (independente) 
3. fp_formas_pagamento (independente)
4. fp_centros_custo (independente)
5. fp_subcategorias (depende: fp_categorias)
6. fp_metas_mensais (depende: fp_categorias)
7. fp_transacoes (depende: TODAS as outras)
```

---

## 🎯 IMPLEMENTAÇÃO POR FASES

### 🟢 FASE 1: EXPORTAR DADOS
**Prioridade:** ALTA | **Complexidade:** ⭐⭐☆☆☆ | **Tempo:** 1-2h

#### Funcionalidades
- Exportação completa de todas as 7 tabelas fp_
- Geração de arquivo ZIP com CSVs
- Download automático pelo navegador
- Feedback visual durante processo

#### Arquivos a Criar
```
src/hooks/usar-backup-exportar.ts
src/servicos/backup/exportador-dados.ts
src/componentes/backup/modal-exportar.tsx
src/tipos/backup.ts
```

#### Estrutura do Hook `usar-backup-exportar.ts`
```typescript
interface DadosExportacao {
  categorias: Categoria[]
  subcategorias: Subcategoria[]
  contas: Conta[]
  formasPagamento: FormaPagamento[]
  centrosCusto: CentroCusto[]
  transacoes: Transacao[]
  metasMensais: MetaMensal[]
}

interface EstadoExportacao {
  exportando: boolean
  progresso: number
  etapaAtual: string
  erro: string | null
}

export function usarBackupExportar() {
  // Lógica de exportação
}
```

#### Integração com UI Existente
- Conectar ao botão "Exportar Dados" em `/configuracoes`
- Modal com progresso da exportação
- Toast de sucesso/erro

---

### 🟡 FASE 2: IMPORTAR DADOS  
**Prioridade:** MÉDIA | **Complexidade:** ⭐⭐⭐☆☆ | **Tempo:** 3-4h

#### Funcionalidades
- Upload de arquivo ZIP de backup
- Validação da estrutura dos dados
- Preview dos dados antes da importação
- Importação com controle de transações
- Verificação de integridade referencial

#### Arquivos a Criar
```
src/hooks/usar-backup-importar.ts
src/servicos/backup/importador-dados.ts
src/servicos/backup/validador-backup.ts
src/componentes/backup/modal-importar.tsx
src/componentes/backup/preview-importacao.tsx
src/componentes/backup/uploader-arquivo.tsx
```

#### Fluxo de Importação
1. **Upload**: Validação do arquivo ZIP
2. **Extração**: Leitura dos CSVs internos  
3. **Validação**: Verificação de estrutura e integridade
4. **Preview**: Resumo dos dados a serem importados
5. **Confirmação**: Usuário confirma a operação
6. **Importação**: Inserção ordenada respeitando dependências
7. **Feedback**: Relatório final da operação

#### Estratégias de Importação
- **Modo Limpo**: Apaga tudo e reimporta (padrão)
- **Modo Incremental**: Mantém dados existentes, adiciona novos
- **Modo Sobrescrita**: Atualiza registros existentes

---

### 🔴 FASE 3: BACKUP AUTOMÁTICO
**Prioridade:** BAIXA | **Complexidade:** ⭐⭐⭐⭐☆ | **Tempo:** 5-6h

#### Funcionalidades
- Configuração de frequência (diário/semanal/mensal)
- Armazenamento automático no Supabase Storage
- Histórico de backups com data/tamanho
- Limpeza automática de backups antigos
- Notificações de backup realizado

#### Arquivos a Criar
```
src/hooks/usar-backup-automatico.ts
src/servicos/backup/agendador-backup.ts
src/servicos/backup/armazenador-nuvem.ts
src/componentes/backup/configurar-automatico.tsx
src/componentes/backup/historico-backups.tsx
src/componentes/backup/item-historico.tsx
```

#### Configurações Automáticas
- **Bucket Supabase**: `backups-automaticos`
- **Retenção**: 30 backups (configurável)
- **Nomenclatura**: `backup_YYYY-MM-DD_HH-mm-ss.zip`
- **Agendamento**: Via `setInterval` ou Web Workers

---

## 🏗️ PADRÕES DE DESENVOLVIMENTO

### Nomenclatura (Seguindo Padrão do Projeto)
```
Hooks: usar-backup-*.ts
Serviços: /backup/*.ts
Componentes: /backup/*.tsx
Tipos: backup.ts (em /tipos)
```

### Estrutura de Pasta Backup
```
src/
├── hooks/
│   ├── usar-backup-exportar.ts
│   ├── usar-backup-importar.ts
│   └── usar-backup-automatico.ts
├── servicos/
│   └── backup/
│       ├── exportador-dados.ts
│       ├── importador-dados.ts
│       ├── validador-backup.ts
│       ├── agendador-backup.ts
│       └── armazenador-nuvem.ts
├── componentes/
│   └── backup/
│       ├── modal-exportar.tsx
│       ├── modal-importar.tsx
│       ├── preview-importacao.tsx
│       ├── uploader-arquivo.tsx
│       ├── configurar-automatico.tsx
│       └── historico-backups.tsx
└── tipos/
    └── backup.ts
```

### Padrões de Código
- **Async/Await**: Para operações assíncronas
- **Error Handling**: Try-catch com toast de feedback
- **TypeScript**: Tipagem forte em todos os componentes
- **Loading States**: Estados de carregamento visíveis
- **Validação**: Zod para validação de schemas

---

## 📡 INTEGRAÇÃO COM SUPABASE

### Queries Necessárias
```sql
-- Exportação completa
SELECT * FROM fp_categorias WHERE ativo = true;
SELECT * FROM fp_subcategorias WHERE ativo = true;
SELECT * FROM fp_contas WHERE ativo = true;
SELECT * FROM fp_formas_pagamento WHERE ativo = true;
SELECT * FROM fp_centros_custo WHERE ativo = true;
SELECT * FROM fp_transacoes;
SELECT * FROM fp_metas_mensais;
```

### Storage Configuration
```javascript
// Bucket para backups automáticos
const { data, error } = await supabase.storage
  .from('backups-automaticos')
  .upload(`backup_${timestamp}.zip`, zipFile)
```

### RLS Policies (Se necessário)
```sql
-- Permitir usuário acessar apenas seus backups
CREATE POLICY "Usuários podem acessar seus backups" 
ON storage.objects FOR ALL 
USING (bucket_id = 'backups-automaticos');
```

---

## 🧪 TESTES E VALIDAÇÃO

### Cenários de Teste
1. **Exportação**: Arquivo ZIP gerado com todos os CSVs
2. **Importação**: Dados importados mantêm integridade
3. **Validação**: Arquivos corrompidos são rejeitados
4. **Performance**: Exportação de grande volume de dados
5. **Erro de Rede**: Recuperação de falhas de upload

### Dados de Teste
- Base limpa (só dados padrão)
- Base com 1000+ transações
- Arquivo ZIP corrompido
- CSV com dados inválidos

---

## 🚀 PLANO DE IMPLEMENTAÇÃO

### Cronograma Sugerido
```
Semana 1: FASE 1 (Exportar)
├── Dia 1-2: Serviços de exportação
├── Dia 3-4: Hook e UI
└── Dia 5: Testes e refinamentos

Semana 2: FASE 2 (Importar)  
├── Dia 1-2: Validador e importador
├── Dia 3-4: Upload e preview
└── Dia 5: Integração e testes

Semana 3: FASE 3 (Automático)
├── Dia 1-3: Agendador e storage
├── Dia 4-5: UI de configuração
└── Dia 6-7: Histórico e polimento
```

### Marcos de Entrega
- ✅ **Marco 1**: Backup manual funcionando
- ✅ **Marco 2**: Restore completo operacional  
- ✅ **Marco 3**: Sistema automático configurado

---

## ⚠️ CONSIDERAÇÕES TÉCNICAS

### Limitações Identificadas
- **Tamanho Máximo**: Supabase tem limite de 50MB por arquivo
- **Timeout**: Operações longas podem dar timeout no Vercel
- **Memória**: CSVs grandes podem consumir muita RAM

### Soluções Propostas
- **Compressão**: ZIP reduz tamanho significativamente
- **Chunking**: Dividir grandes datasets em lotes
- **Streaming**: Processar dados em streaming quando possível

### Segurança
- Validação rigorosa de arquivos de entrada
- Sanitização de dados antes da importação
- Backup de segurança antes de qualquer restore

---

## 📝 CHECKLIST DE IMPLEMENTAÇÃO

### FASE 1 - Exportar
- [ ] Criar tipos em `src/tipos/backup.ts`
- [ ] Implementar `exportador-dados.ts`
- [ ] Criar hook `usar-backup-exportar.ts`
- [ ] Desenvolver modal de exportação
- [ ] Integrar com botão existente
- [ ] Testar com dados reais
- [ ] Validar arquivo ZIP gerado

### FASE 2 - Importar  
- [ ] Implementar `validador-backup.ts`
- [ ] Criar `importador-dados.ts`
- [ ] Desenvolver hook `usar-backup-importar.ts`
- [ ] Criar uploader de arquivo
- [ ] Implementar preview de dados
- [ ] Criar modal de importação
- [ ] Testar fluxo completo
- [ ] Validar integridade pós-importação

### FASE 3 - Automático
- [ ] Configurar bucket no Supabase
- [ ] Implementar `agendador-backup.ts`
- [ ] Criar `armazenador-nuvem.ts`
- [ ] Desenvolver tela de configuração
- [ ] Implementar histórico de backups
- [ ] Criar sistema de notificações
- [ ] Testar agendamento
- [ ] Validar limpeza automática

---

## 🎯 CONCLUSÃO

Este plano fornece uma implementação completa e robusta do sistema de backup, respeitando os padrões arquiteturais do projeto e garantindo uma experiência de usuário consistente.

A implementação faseada permite entregar valor rapidamente (FASE 1) enquanto constrói funcionalidades mais complexas progressivamente.

**Próximo Passo:** Iniciar FASE 1 com foco no botão "Exportar Dados" da página de configurações.