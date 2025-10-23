# 📊 Importação CSV Inteligente

> **Sistema completo para importar extratos bancários automaticamente**

---

## 🏦 Bancos e Formatos Suportados

### ✅ Nubank (Cartão de Crédito)
- Detecta automaticamente colunas do extrato
- Classifica transações por histórico anterior
- Identifica estabelecimentos conhecidos

### ✅ Nubank (Conta Corrente)
- Diferencia receitas de despesas
- Processa PIX, TED, débitos automáticos
- Mantém descrições originais

### ✅ Conta Simples (Conta Empresarial)
- Ignora automaticamente cabeçalho empresarial (7 linhas)
- Suporta colunas Crédito/Débito separadas
- **Vinculação automática de clientes via campo "Centro de Custo"** (independente de categoria)
- Match inteligente de categorias do banco (opcional)
- Precisão temporal com hora/minuto/segundo
- Cliente vinculado mesmo sem categoria classificada

### ✅ Cartões Genéricos
- Formato padrão: Data, Descrição, Valor
- Mapeamento flexível de colunas
- Validação de dados automática

---

## 🧠 Classificação Inteligente

O sistema aprende com suas transações anteriores:

```typescript
// Exemplo de aprendizado
const historico = {
  "UBER": { categoria: "Transporte", subcategoria: "Uber/99" },
  "IFOOD": { categoria: "Alimentação", subcategoria: "Delivery" },
  "NETFLIX": { categoria: "Lazer", subcategoria: "Streaming" }
};

// Novas transações são classificadas automaticamente
// "UBER TRIP SAO PAULO" → Transporte > Uber/99
```

---

## 🔍 Funcionalidades Avançadas

### Detecção de Duplicatas
- Compara data, valor e descrição
- Evita importações duplas
- Preview de conflitos antes de importar

### Preview Inteligente
- Mostra classificação sugerida
- Permite edição antes de salvar
- Estatísticas da importação

### Validação Automática
- Verifica formato de datas
- Valida valores monetários
- Identifica erros de encoding

---

## 📋 Como Usar

### Passo a Passo

1. **Baixar extrato** do banco em formato CSV

2. **Acessar Importação** no sistema
   - Menu > Importação CSV

3. **Upload do arquivo**
   - Sistema detecta formato automaticamente
   - Mostra resumo das transações encontradas

4. **Preview e edição**
   - Conferir classificações sugeridas
   - Editar categorias se necessário
   - Ver estatísticas (total, duplicatas, erros)

5. **Confirmar importação**
   - Salvar todas as transações
   - Sistema cria registros no banco

**Resultado:** Centenas de transações categorizadas em segundos! 🚀

---

## 🎯 Exemplos de Uso

### Importar Extrato Nubank Cartão

```typescript
// Sistema detecta automaticamente:
{
  formato: "nubank_cartao",
  transacoes: 47,
  periodo: "2024-12-01 a 2024-12-31",
  classificadas: 42,  // 89% classificadas automaticamente
  nao_classificadas: 5
}
```

### Importar Conta Corrente

```typescript
// Diferencia receitas e despesas:
{
  formato: "nubank_conta",
  receitas: 3,   // PIX recebido, transferências
  despesas: 28,  // Débitos, PIX enviado
  total_valor: -2547.80
}
```

### Importar Conta Simples (Empresarial)

```typescript
// Vinculação automática de clientes:
{
  formato: "conta_simples",
  transacoes: 47,
  classificadas: 42,  // 89% classificadas automaticamente
  clientes_vinculados: 38,  // Campo "Centro de Custo" → cliente_id
  categorias_match: 40  // Categoria do banco → categoria sistema
}
```

---

## 🔧 Formatos de Arquivo Suportados

### Nubank Cartão de Crédito

```csv
date,category,title,amount
2024-12-15,alimentação,IFOOD,45.90
2024-12-16,transporte,UBER TRIP,23.50
```

### Nubank Conta Corrente

```csv
Data,Tipo,Descrição,Valor
15/12/2024,Transferência,PIX Recebido,150.00
16/12/2024,Pagamento,Conta de Luz,-85.50
```

### Conta Simples (Empresarial)

```csv
Data hora;Histórico;Crédito R$;Débito R$;Descrição;Categoria;Centro de Custo
28/02/2025 16:33;PIX Enviado;;181,8;Cabideiros;COMPONETES;Suelen e Osmar
27/02/2025 13:48;Recebimento PIX;5000;;Projeto;Vendas;Maurício Ribeiro
```

**Campo especial:**
- **Centro de Custo** → vincula automaticamente em `cliente_id` (independente de receita/despesa)
- Categoria do banco → match automático com categorias do sistema

### Formato Genérico

```csv
Data,Descrição,Valor
15/12/2024,Compra Supermercado,150.00
16/12/2024,Salário,3500.00
```

---

## ⚠️ Troubleshooting

### Erro: "Encoding inválido"

**Solução:**
```bash
# Verificar encoding
file -I arquivo.csv

# Converter para UTF-8 se necessário
iconv -f ISO-8859-1 -t UTF-8 arquivo.csv > arquivo_utf8.csv
```

### Erro: "Formato não reconhecido"

**Causas comuns:**
- Separador incorreto (use vírgula, não ponto-e-vírgula)
- Cabeçalho faltando ou incorreto
- Arquivo vazio ou corrompido

**Solução:**
- Abra o CSV em editor de texto
- Verifique primeira linha (cabeçalho)
- Verifique se há vírgulas separando colunas

---

## 🎓 Dicas e Boas Práticas

### Maximize a Classificação Automática
1. Categorize manualmente algumas transações primeiro
2. Use descrições consistentes
3. Sistema aprende com cada importação

### Evite Duplicatas
1. Use sempre a mesma conta para importar
2. Importe períodos que não se sobrepõem
3. Sistema detecta duplicatas, mas melhor prevenir

### Performance
- Arquivos até 1000 transações: instantâneo
- Arquivos 1000-5000 transações: ~10-15 segundos
- Arquivos >5000 transações: dividir em períodos menores

---

## 🔗 Links Relacionados

- **[Backup/Restore](BACKUP-RESTORE.md)** - Fazer backup antes de importar
- **[← Voltar ao índice](../README.txt)**
