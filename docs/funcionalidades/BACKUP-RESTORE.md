# 💾 Sistema de Backup Completo

> **Backup e restauração total dos seus dados financeiros**

---

## 📦 Exportação Completa

### O que é Exportado

Gera arquivo ZIP contendo:
- ✅ Todas as transações com relacionamentos
- ✅ Categorias e subcategorias personalizadas
- ✅ Contas, formas de pagamento, centros de custo
- ✅ Metas mensais e configurações
- ✅ Relatório detalhado da exportação

---

## ⚡ Funcionalidades

### Progress em Tempo Real

```typescript
// Sistema mostra progresso da exportação
const progresso = {
  "Categorias": "✅ 15 itens exportados",
  "Transações": "⏳ 1.247/2.156 processadas",
  "Contas": "✅ 6 itens exportados"
};
```

### Validação de Integridade

- Verifica relacionamentos entre tabelas
- Conta total de registros por tipo
- Gera hash de verificação dos dados

---

## 📥 Como Fazer Backup

### Passo a Passo

1. **Acessar Menu Backup**
   - Menu > Backup e Restauração

2. **Escolher Opções**
   ```typescript
   {
     incluirTransacoes: true,
     incluirCategorias: true,
     incluirContas: true,
     incluirMetas: true
   }
   ```

3. **Iniciar Exportação**
   - Clique em "Exportar Dados"
   - Acompanhe o progresso

4. **Download Automático**
   - Arquivo ZIP baixado: `backup_YYYY-MM-DD_HHmm.zip`
   - Salve em local seguro

---

## 🔄 Importação Inteligente

### Antes de Importar

O sistema automaticamente:
- ✅ **Cria backup** dos dados atuais
- ✅ **Analisa conflitos** com dados existentes
- ✅ **Mostra preview** do que será importado
- ✅ **Valida** a estrutura dos dados

### Durante a Importação

1. Limpa dados existentes (se solicitado)
2. Reconstrói relacionamentos
3. Atualiza IDs automaticamente
4. Log detalhado de operações

---

## 📋 Como Restaurar Backup

### Passo a Passo

1. **Acessar Menu Backup**
   - Menu > Backup e Restauração

2. **Selecionar Arquivo ZIP**
   - Upload do arquivo de backup

3. **Escolher Opções**
   ```typescript
   {
     limparDadosExistentes: false,  // Preservar dados atuais
     criarBackupAntes: true          // Backup de segurança
   }
   ```

4. **Confirmar Restauração**
   - Sistema mostra preview
   - Clique em "Confirmar"

5. **Aguardar Conclusão**
   - Progresso em tempo real
   - Log de operações

---

## 🔧 Opções Avançadas

### Backup Parcial

Escolha o que exportar:
- Apenas transações
- Apenas categorias
- Apenas configurações

### Importação Seletiva

Opções disponíveis:
- **Substituir tudo** - Remove dados atuais, importa do backup
- **Mesclar** - Mantém dados atuais, adiciona do backup
- **Apenas preview** - Ver o que seria importado sem aplicar

---

## 🔄 Reset Controlado

### Opções de Reset

**Reset Completo**
- Remove todos os dados
- Mantém estrutura de tabelas
- Workspace continua existindo

**Reset Parcial**
- Escolher tabelas específicas
- Manter categorias, limpar transações
- Personalizar reset

**Reset com Backup**
- Salva estado atual antes de limpar
- Recomendado para segurança

---

## ⚠️ Segurança

### Confirmação Dupla

Operações destrutivas sempre solicitam:
1. Primeira confirmação: "Tem certeza?"
2. Segunda confirmação: Digite "CONFIRMAR"

### Backup Automático

Antes de qualquer operação destrutiva:
- Sistema cria backup automático
- Backup salvo com timestamp
- Pode restaurar se algo der errado

---

## 🎯 Casos de Uso

### Trocar de Computador

1. Fazer backup no computador antigo
2. Instalar sistema no computador novo
3. Restaurar backup

### Testar Importação CSV

1. Fazer backup antes de importar CSV grande
2. Importar e verificar resultado
3. Se tiver problema, restaurar backup

### Migração de Dados

1. Exportar dados do workspace atual
2. Criar novo workspace
3. Importar backup no novo workspace

---

## 📊 Estrutura do Arquivo ZIP

```
backup_2025-01-15_1430.zip
├── metadata.json          # Informações do backup
├── transacoes.json       # Todas as transações
├── categorias.json       # Categorias e subcategorias
├── contas.json           # Contas bancárias/cartões
├── formas_pagamento.json # Formas de pagamento
├── centros_custo.json    # Centros de custo
├── metas.json            # Metas mensais
└── relatorio.txt         # Resumo da exportação
```

---

## 🐛 Troubleshooting

### Exportação Trava

**Causas:**
- Muitas transações (>5000)
- Pouco espaço em disco
- Pouca memória RAM

**Solução:**
```bash
# Verificar espaço em disco
df -h

# Verificar memória
free -h

# Para exports grandes, exportar por período
# Ex: Exportar só 2024, depois 2023, etc.
```

### Importação Falha

**Verificar arquivo ZIP:**
```bash
unzip -t backup.zip
```

**Se corrompido:**
- Tentar novamente o download
- Verificar se download completou
- Testar em outro computador

---

## 💡 Dicas e Boas Práticas

### Frequência de Backup

**Recomendado:**
- **Diário:** Se usa muito o sistema
- **Semanal:** Uso normal
- **Mensal:** Uso esporádico
- **Antes de:** Importações grandes, updates, migrações

### Armazenamento

**Onde guardar backups:**
- ✅ Google Drive / OneDrive
- ✅ Pendrive externo
- ✅ Múltiplas cópias (redundância)
- ❌ Só no computador (risco de perda)

### Nomenclatura

```
backup_controle_financeiro_2025-01-15.zip
backup_antes_importacao_nubank_2025-01-20.zip
backup_mensal_janeiro_2025.zip
```

---

## 🔗 Links Relacionados

- **[Importação CSV](IMPORTACAO-CSV.md)** - Importar extratos
- **[← Voltar ao índice](../README.txt)**
