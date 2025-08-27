# 🚦 Sistema de Sinalização de Lançamentos

## 📋 Visão Geral

Sistema inteligente que **sinaliza** diferentes tipos de lançamentos durante importação de CSV, permitindo ao usuário **decidir conscientemente** o que importar para seu controle financeiro.

## 🎯 Problema Resolvido

**Antes:** Sistema filtrava automaticamente valores negativos
**Agora:** Usuário vê TODOS os lançamentos sinalizados e decide individualmente

## 🏷️ Tipos de Sinalização

### 💳 **Gasto Real**
- **O que é:** Compras e serviços efetivamente utilizados
- **Exemplos:** "Drogaria Farmagno", "Posto Varanda", "Restaurante"
- **Recomendação:** ✅ **IMPORTAR** - são gastos do seu orçamento
- **Padrão:** Selecionado automaticamente

### 📊 **Taxa/Juro** 
- **O que é:** Custos financeiros do cartão
- **Exemplos:** "IOF de atraso", "Multa de atraso", "Juros de dívida"
- **Recomendação:** ✅ **IMPORTAR** - são gastos reais a controlar
- **Padrão:** Selecionado automaticamente

### ⚖️ **Ajuste Contábil**
- **O que é:** Lançamentos internos do banco para controle
- **Exemplos:** "Saldo em atraso", "Crédito de atraso"
- **Recomendação:** ❌ **NÃO IMPORTAR** - são movimentações contábeis, não gastos novos
- **Padrão:** Desmarcado automaticamente

### 💰 **Pagamento/Crédito**
- **O que é:** Pagamentos da fatura ou valores creditados
- **Exemplos:** "Pagamento recebido", "Encerramento de dívida", "Estorno"
- **Recomendação:** ❌ **NÃO IMPORTAR** - já existem na conta corrente
- **Padrão:** Desmarcado automaticamente

## 🎨 Interface do Usuário

### **Preview de Importação**
```
[✓] 💳 Gasto Real        | Drogaria Farmagno    | -R$ 4,75
[✓] 💳 Gasto Real        | Posto Varanda        | -R$ 95,36
[✓] 📊 Taxa/Juro         | IOF de atraso        | -R$ 3,81
[ ] ⚖️ Ajuste Contábil   | Saldo em atraso      | -R$ 994,30
[ ] 💰 Pagamento/Crédito | Pagamento recebido   | +R$ 994,30
```

### **Tooltips Explicativos**
- **Ao passar mouse:** Explicação detalhada do que cada tipo significa
- **Decisão informada:** Usuário entende o que cada lançamento representa

## ⚙️ Lógica de Detecção

### **Algoritmo de Classificação:**
1. **Analisa descrição** da transação (palavras-chave)
2. **Considera valor** (positivo/negativo)  
3. **Aplica regras** de categorização
4. **Gera sinalização** com ícone + tooltip

### **Palavras-Chave por Tipo:**
```typescript
// Pagamentos/Créditos
['pagamento', 'crédito', 'estorno', 'encerramento']

// Ajustes Contábeis  
['saldo em atraso', 'crédito de atraso', 'ajuste']

// Taxas/Juros
['juro', 'iof', 'multa', 'tarifa', 'taxa']

// Gastos Reais (padrão)
[tudo que não se enquadra acima]
```

## 🎛️ Funcionalidades

### **✅ Seleção Individual**
- **Checkbox** em cada transação
- **Controle granular** pelo usuário
- **Padrão inteligente** baseado no tipo

### **🔄 Padrões Automáticos**
- **💳 Gastos + 📊 Taxas:** Selecionados (usuário quer controlar)
- **⚖️ Ajustes + 💰 Pagamentos:** Desmarcados (duplicação/contábil)

### **📱 Responsivo**
- **Desktop:** Tooltips ao passar mouse
- **Mobile:** Tap para ver explicação
- **Acessível:** Suporte a teclado e screen readers

## 🚀 Benefícios para Multiusuário

### **🔒 Segurança**
- **Zero persistência** de preferências
- **Sempre pergunta** - evita conflitos entre usuários
- **Decisão individual** por importação

### **📚 Educativo**
- **Novos usuários** aprendem sobre tipos de lançamentos
- **Tooltips explicativos** reduzem suporte
- **Decisão consciente** melhora controle financeiro

### **⚡ Performance**
- **Filtro inteligente** reduz transações desnecessárias
- **Menos duplicação** entre extratos
- **Melhor qualidade** dos dados importados

## 🧪 Testes Recomendados

### **Cenário 1: CSV Cartão Limpo**
- Importar apenas gastos reais
- Verificar se pagamentos foram desmarcados
- Confirmar pré-seleção de "Crédito"

### **Cenário 2: CSV com Atrasos**
- Verificar sinalização de "Saldo em atraso"
- Confirmar que está desmarcado por padrão
- Testar tooltip explicativo

### **Cenário 3: Usuario Experiente** 
- Pode marcar ajustes contábeis se necessário
- Flexibilidade total de escolha
- Sistema não força decisões

## 🛠️ Detalhes Técnicos de Implementação

### **Arquivos Modificados**

#### **1. Tipos e Interfaces** 
- **`src/tipos/importacao.ts`**
  - Adicionado: `TipoLancamento`, `SinalizacaoLancamento`
  - Modificado: `TransacaoClassificada` (campos `sinalizacao`, `selecionada`)

#### **2. Detector de Tipos**
- **`src/servicos/importacao/detector-tipos-lancamento.ts`** (NOVO)
  - Função: `detectarTipoLancamento(transacao) → SinalizacaoLancamento`
  - Algoritmo: Análise por palavras-chave + valor + tipo

#### **3. Mapeador de Cartão**
- **`src/servicos/importacao/mapeadores/mapeador-cartao.ts`**
  - Removido: Filtro automático de valores negativos
  - Restaurado: Lógica original de tipo (positivo=despesa, negativo=receita)

#### **4. Modal de Importação**
- **`src/componentes/importacao/modal-importacao-csv.tsx`**
  - Adicionado: `handleToggleSelecaoTransacao()`
  - Modificado: `handleConfirmarImportacao()` (filtra selecionadas)
  - Integração: Detector de tipos no processamento

#### **5. Preview e Interface**
- **`src/componentes/importacao/preview-importacao.tsx`**
  - Adicionado: `onToggleSelecaoTransacao` prop
  - Modificado: Contagem de transações selecionadas
- **`src/componentes/importacao/linha-transacao-classificada.tsx`**
  - Adicionado: Checkboxes individuais
  - Adicionado: Exibição de sinalizações com ícones

### **🔄 Fluxo de Processamento**

```typescript
CSV Upload → Detecção de Formato → Mapeamento → 
Classificação Histórica → Detecção de Tipos → 
Sinalização Visual → Seleção do Usuário → Importação
```

### **📊 Algoritmo de Seleção Padrão**

```typescript
selecionada: sinalizacao.tipo === 'gasto_real' || sinalizacao.tipo === 'taxa_juro'
```

**Lógica:**
- ✅ **Gastos reais:** Sempre selecionados (usuário quer controlar)
- ✅ **Taxas/Juros:** Selecionados (são custos reais)
- ❌ **Ajustes contábeis:** Desmarcados (não são gastos novos)
- ❌ **Pagamentos/Créditos:** Desmarcados (evita duplicação)

### **🎯 Integração com Motor de Classificação**

O sistema se integra perfeitamente com o **Motor de Classificação Inteligente** existente:

1. **Pré-classificação automática** continua funcionando
2. **Sinalizações** são aplicadas independentemente do status de classificação
3. **Modal de classificação** ainda pré-seleciona "Crédito" para cartões
4. **Seleção** funciona tanto para transações reconhecidas quanto pendentes

### **💡 Casos de Uso Específicos**

#### **Exemplo Real - Seu CSV:**

**Transações que ficarão DESMARCADAS por padrão:**
```
⚖️ "Saldo em atraso": R$ 994,30        → Ajuste contábil interno
💰 "Pagamento recebido": R$ 994,30     → Já existe na conta corrente  
💰 "Crédito de atraso": R$ 994,30      → Compensação do saldo em atraso
💰 "Encerramento de dívida": R$ 23,77  → Liquidação de pendência
```

**Transações que ficarão MARCADAS por padrão:**
```
💳 "Drogaria Farmagno": R$ 4,75        → Gasto real
💳 "Posto Varanda": R$ 95,36           → Gasto real
📊 "IOF de atraso": R$ 3,81            → Custo financeiro real
📊 "Multa de atraso": R$ 19,96         → Custo financeiro real
📊 "Juros de dívida encerrada": R$ 23,77 → Custo financeiro real
```

## 🎯 Resultado Esperado

**Para seu CSV específico:**
- **22 linhas** → **17 gastos/taxas selecionados** + **5 ajustes/pagamentos desmarcados**
- **Usuário decide** conscientemente cada um
- **Zero duplicação** entre extratos
- **Controle financeiro** mais limpo e preciso

## 📝 Notas de Manutenção

### **Para Adicionar Novos Tipos:**
1. Atualizar `TipoLancamento` em `tipos/importacao.ts`
2. Adicionar regra em `detector-tipos-lancamento.ts`
3. Definir padrão de seleção conforme necessário

### **Para Novos Formatos de Banco:**
1. Criar novo mapeador em `mapeadores/`
2. Adicionar detecção em `detector-formato.ts`
3. Sistema de sinalização funciona automaticamente

### **Para Debug:**
- Console logs mostram classificações aplicadas
- Tooltips explicam cada decisão ao usuário
- Preview permite verificação visual antes da importação

## 🎮 Exemplos Práticos de Uso

### **Cenário 1: Usuário Conservador**
```
Ricardo importa seu CSV e vê:
- 17 transações marcadas (gastos + taxas)
- 5 desmarcadas (ajustes + pagamentos)
- Mantém padrão, clica "Importar 17 transações"
- Resultado: Controle limpo, zero duplicação
```

### **Cenário 2: Usuário Detalhista**  
```
Maria quer rastrear TUDO para auditoria:
- Vê as 22 transações sinalizadas
- Marca também "Saldo em atraso" (quer histórico completo)
- Classifica como "Serviços Financeiros" 
- Resultado: Controle detalhado com consciência
```

### **Cenário 3: Usuário Experiente**
```
João conhece contabilidade:
- Identifica que "Saldo em atraso" + "Crédito de atraso" se anulam
- Mantém só os gastos reais e taxas marcados
- Tooltip confirma sua intuição
- Resultado: Importação otimizada
```

## 🚨 Troubleshooting

### **Problema: "Muitas transações desmarcadas"**
**Solução:** 
- Verifique tooltips para entender cada tipo
- Lembre-se: Pagamentos já existem na conta corrente
- Ajustes contábeis não são gastos novos

### **Problema: "Saldo em atraso deveria ser importado?"**
**Análise:**
- ⚖️ É lançamento contábil interno
- Não representa gasto novo
- É compensado pelo "Crédito de atraso"
- **Recomendação:** Manter desmarcado

### **Problema: "IOF/Multas são importantes?"**  
**Análise:**
- 📊 São custos financeiros REAIS
- Afetam seu orçamento mensal
- Devem ser controlados e categorizados
- **Recomendação:** Manter marcado

## 🔮 Considerações Futuras

### **Expansão para Outros Bancos**
- Sistema é **agnóstico** ao formato
- Detector funciona com qualquer descrição
- Fácil adicionar regras específicas por banco

### **Machine Learning** 
- Base preparada para ML futuro
- Histórico de decisões do usuário
- Pode evoluir para sugestões personalizadas

### **Auditoria Empresarial**
- Sistema transparente para compliance
- Usuário controla cada decisão
- Histórico rastreável de seleções

### **API para Terceiros**
- Interface pronta para integração
- Tipos bem definidos
- Sistema modular e extensível