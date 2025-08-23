# 🏦 TEMPLATE - ADICIONAR NOVO BANCO

**Versão:** 1.0  
**Data:** 22/08/2025  
**Uso:** Guia para adicionar suporte a novos formatos CSV

---

## 🎯 **QUANDO USAR ESTE TEMPLATE**

Use este guia sempre que precisar adicionar suporte a um novo banco/formato CSV:
- Novo banco enviou CSV com formato diferente
- Cartão de outro banco tem estrutura única  
- Fintech com formato próprio
- Arquivo de exportação de app financeiro

---

## 📋 **CHECKLIST DE ANÁLISE DO CSV**

### **1. Análise Inicial do Arquivo**
- [ ] **Obter arquivo CSV** de exemplo do novo banco
- [ ] **Abrir no Excel/Editor** para ver estrutura
- [ ] **Identificar headers** (primeira linha)
- [ ] **Verificar encoding** (UTF-8, ISO, etc.)
- [ ] **Contar linhas** de exemplo disponíveis

### **2. Mapeamento de Campos**
Preencha a tabela abaixo com base no CSV:

| **Campo Nosso** | **Campo do Banco** | **Formato** | **Exemplo** |
|-----------------|-------------------|-------------|-------------|
| `data` | ??? | ??? | ??? |
| `descricao` | ??? | ??? | ??? |
| `valor` | ??? | ??? | ??? |
| `identificador_unico` | ??? | ??? | ??? |

### **3. Características Especiais**
- [ ] **Formato da data:** DD/MM/YYYY, YYYY-MM-DD, etc.
- [ ] **Separador decimal:** vírgula ou ponto
- [ ] **Valores negativos:** como são representados
- [ ] **Headers em:** Português, inglês, outro idioma
- [ ] **Encoding:** UTF-8, Latin1, etc.
- [ ] **Campo UUID:** existe identificador único?

---

## 🔧 **PASSOS DE IMPLEMENTAÇÃO**

### **PASSO 1: Criar Mapeador**

**Arquivo:** `src/servicos/importacao/mapeadores/mapeador-[NOME_BANCO].ts`

```typescript
import { TransacaoImportada } from '@/tipos/importacao'

// 1. Definir interface específica do banco
export interface Linha[NomeBanco] {
  // Copiar headers exatos do CSV
  // Exemplo:
  // data_movimento: string
  // descricao_transacao: string
  // valor_real: string
}

// 2. Implementar função de mapeamento
export function mapearLinhas[NomeBanco](
  linhas: Linha[NomeBanco][], 
  contaId: string
): TransacaoImportada[] {
  return linhas.map((linha, index) => {
    try {
      // Converter valor
      const valor = parseFloat(linha.[CAMPO_VALOR])
      if (isNaN(valor)) {
        throw new Error(`Valor inválido na linha ${index + 1}`)
      }
      
      // Converter data
      const dataConvertida = converterData[NomeBanco](linha.[CAMPO_DATA])
      
      // Gerar identificador único
      const identificadorUnico = gerarIdentificador[NomeBanco](linha)
      
      return {
        data: dataConvertida,
        valor: Math.abs(valor),
        identificador_externo: identificadorUnico,
        descricao: linha.[CAMPO_DESCRICAO] || '',
        conta_id: contaId,
        tipo: determinarTipo[NomeBanco](valor, linha)
      }
    } catch (error) {
      throw new Error(`Erro na linha ${index + 1}: ${error}`)
    }
  })
}

// 3. Funções auxiliares específicas
function converterData[NomeBanco](data: string): string {
  // Implementar conversão específica
  // Exemplo para DD/MM/YYYY:
  // const [dia, mes, ano] = data.split('/')
  // return `${ano}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`
}

function gerarIdentificador[NomeBanco](linha: Linha[NomeBanco]): string {
  // Se tem UUID nativo:
  // return linha.campo_uuid
  
  // Se não tem UUID, gerar hash:
  // const textoHash = `${linha.data}_${linha.descricao}_${linha.valor}`
  // return `[SIGLA_BANCO]_${Buffer.from(textoHash).toString('base64').substring(0, 16)}`
}

function determinarTipo[NomeBanco](valor: number, linha: Linha[NomeBanco]): 'receita' | 'despesa' {
  // Implementar lógica específica do banco
  // Exemplos:
  // return valor >= 0 ? 'despesa' : 'receita'  // Para cartões
  // return valor >= 0 ? 'receita' : 'despesa' // Para conta corrente
  // return linha.tipo_operacao === 'D' ? 'despesa' : 'receita' // Se tem campo tipo
}
```

### **PASSO 2: Adicionar ao Registry**

**Arquivo:** `src/servicos/importacao/mapeadores/index.ts`

```typescript
import { mapearLinhas[NomeBanco] } from './mapeador-[nome-banco]'

// Adicionar ao array formatosSuportados:
{
  nome: '[Nome Exibido do Banco]',
  icone: '[Emoji do Banco]', // Exemplo: 🏦, 💳, 🔷
  detector: (headers: string[]) => {
    // Implementar detecção baseada em headers únicos
    const tem[CampoUnico1] = headers.includes('[header_unico_1]')
    const tem[CampoUnico2] = headers.includes('[header_unico_2]')
    
    // Score: 0-100 (maior = mais confiança)
    if (tem[CampoUnico1] && tem[CampoUnico2]) return 95
    if (tem[CampoUnico1]) return 70
    return 0
  },
  mapeador: mapearLinhas[NomeBanco],
  estrategiaDuplicacao: (t) => t.identificador_externo
}
```

### **PASSO 3: Atualizar Tipos (se necessário)**

**Arquivo:** `src/tipos/importacao.ts`

```typescript
// Adicionar nova interface se precisar de tipos específicos
export interface Linha[NomeBanco] {
  [campo1]: string
  [campo2]: string
  // ... outros campos
}

// Atualizar union type
export type LinhaCSVUniversal = LinhaCSV | LinhaCartao | Linha[NomeBanco]
```

### **PASSO 4: Testar**

1. **Upload do CSV** do novo banco
2. **Verificar detecção:** "[Icone] [Nome] detectado"
3. **Conferir preview** das transações mapeadas
4. **Importar** algumas transações de teste
5. **Verificar no banco** se os dados estão corretos
6. **Testar duplicatas** (importar mesmo arquivo duas vezes)

---

## 🧪 **CENÁRIOS DE TESTE**

### **Teste 1: Detecção Automática**
```
✅ Upload CSV → Sistema detecta "[Nome Banco]"
✅ Score adequado (acima de 70)
✅ Não conflita com outros bancos
```

### **Teste 2: Mapeamento de Dados**
```
✅ Datas convertidas corretamente
✅ Valores positivos/negativos mapeados
✅ Descrições preservadas
✅ Identificador único gerado
```

### **Teste 3: Anti-Duplicação**
```
✅ Primeira importação: X transações importadas
✅ Segunda importação: X duplicatas detectadas
✅ Zero transações duplicadas no banco
```

### **Teste 4: Tipos de Transação**
```
✅ Receitas identificadas corretamente
✅ Despesas identificadas corretamente
✅ Transferências (se aplicável) mapeadas
```

---

## 📊 **EXEMPLOS DE FORMATOS COMUNS**

### **Modelo 1: Banco Tradicional**
```csv
Data,Histórico,Valor,Saldo
01/08/2025,TED RECEBIDA,-1500.00,2500.00
```
**Características:**
- Data: DD/MM/YYYY
- Valor: Negativos são receitas
- Sem UUID: usar hash de data+histórico+valor

### **Modelo 2: Cartão de Crédito**
```csv
data,descricao,valor,parcela
2025-08-01,SUPERMERCADO XYZ,45.50,1/1
```
**Características:**
- Data: ISO (YYYY-MM-DD)
- Valor: Positivos são despesas
- Sem UUID: usar hash composto

### **Modelo 3: Fintech Moderna**
```csv
timestamp,description,amount,transaction_id,category
2025-08-01T10:30:00,Transfer to John,25.00,tx_abc123,transfer
```
**Características:**
- Data: ISO com timestamp
- UUID: transaction_id
- Categoria: já tem sugestão

---

## ⚠️ **ARMADILHAS COMUNS**

### **1. Encoding de Caracteres**
```
❌ Problema: Acentos viram "ç��o"
✅ Solução: Verificar encoding do CSV (UTF-8 vs Latin1)
```

### **2. Formato de Data**
```
❌ Problema: 01/08/2025 → Agosto ou Janeiro?
✅ Solução: Confirmar formato com dados de exemplo
```

### **3. Separador Decimal**
```
❌ Problema: "1.234,56" vs "1,234.56"
✅ Solução: Testar parseFloat vs replace vírgulas
```

### **4. Headers com Espaços**
```
❌ Problema: " Data " !== "Data"
✅ Solução: .trim() nos headers durante detecção
```

### **5. Valores Zerados**
```
❌ Problema: Importar transações de valor 0
✅ Solução: Validar valor > 0 no mapeador
```

---

## 📝 **DOCUMENTAÇÃO DO NOVO BANCO**

Após implementar, documentar:

### **No arquivo do mapeador:**
```typescript
/**
 * BANCO: [Nome do Banco]
 * FORMATO: [Descrição dos headers]
 * CARACTERÍSTICAS:
 * - Data: [formato]
 * - Valor: [como interpretar sinais]
 * - UUID: [nativo ou hash]
 * - Encoding: [UTF-8/Latin1]
 * 
 * EXEMPLO CSV:
 * data,descricao,valor
 * 2025-08-01,Compra no mercado,45.50
 */
```

### **No README do projeto:**
```markdown
## Bancos Suportados
- 💜 Nubank (Data, Valor, Identificador, Descrição)
- 💳 Cartão de Crédito (date, title, amount)  
- 🏦 [Novo Banco] ([headers principais])
```

---

## 🎯 **RESULTADO ESPERADO**

Após seguir este template:
- ✅ **Novo banco funcionando** automaticamente
- ✅ **Detecção automática** sem configuração manual
- ✅ **Anti-duplicação** eficiente
- ✅ **Zero impacto** nos bancos existentes
- ✅ **Código organizado** e fácil de manter

---

## 💡 **DICAS FINAIS**

1. **Comece sempre** com um CSV de exemplo real
2. **Teste pequeno** antes de importar dados grandes
3. **Mantenha padrão** de nomenclatura dos arquivos
4. **Documente peculiaridades** do banco no código
5. **Valide com usuário** antes de finalizar

**🚀 Próximo banco será ainda mais rápido de implementar!**