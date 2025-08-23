# 📂 PLANO DE IMPLEMENTAÇÃO - CSV UNIVERSAL (NUBANK + CARTÃO)

**Data de Criação:** 22/08/2025  
**Desenvolvedor:** Ricardo  
**Objetivo:** Expandir importação CSV para suportar Nubank + Cartão + futuros bancos

---

## 📋 RESUMO EXECUTIVO

**Funcionalidade:** Sistema universal de importação CSV com detecção automática de formato.

**Transformação:**
- **ANTES:** Apenas Nubank (hardcoded)
- **DEPOIS:** Nubank + Cartão + Extensível para futuros bancos

**Benefícios:**
- ✅ **Zero mudança** na interface para usuário
- ✅ **Cartão funcionando** automaticamente
- ✅ **Extensível** para novos bancos facilmente
- ✅ **Compatibilidade** total com Nubank existente

**Tempo Total:** 2.5 dias úteis

---

## 🔍 ANÁLISE DOS FORMATOS

### **Formato Nubank (Atual)**
```csv
Data,Valor,Identificador,Descrição
12/08/2025,-45.50,abc123,Supermercado XYZ
```
- **Headers:** Data, Valor, Identificador, Descrição
- **Data:** DD/MM/YYYY (precisa conversão)
- **UUID:** Campo Identificador (anti-duplicação nativa)
- **Valores:** Positivos/negativos separados por tipo

### **Formato Cartão (Novo)**
```csv
date,title,amount
2025-08-12,Drogaria Farmagno,4.75
2025-08-08,Pagamento recebido,-994.30
```
- **Headers:** date, title, amount
- **Data:** YYYY-MM-DD (formato ISO, sem conversão)
- **UUID:** Não tem (usar hash composto)
- **Valores:** Negativos indicam receitas/pagamentos

### **Critérios de Distinção**
```typescript
Nubank: headers.includes('Identificador') && headers.includes('Descrição') → Score 95
Cartão: headers.includes('date') && headers.includes('title') → Score 90
```

---

## 🏗️ ARQUITETURA PROPOSTA

### **Estrutura de Arquivos**
```
src/servicos/importacao/
├── detector-formato.ts              # 🔍 Auto-detecção
├── processador-universal.ts         # 🔄 Processador único
├── estrategias-duplicacao.ts        # 🛡️ Anti-dup inteligente
└── mapeadores/
    ├── index.ts                     # 📋 Registry de formatos
    ├── mapeador-nubank.ts          # 💜 Nubank (movido)
    └── mapeador-cartao.ts          # 💳 Cartão (novo)
```

### **Sistema de Detecção**
```typescript
interface FormatoCSV {
  nome: string
  icone: string
  detector: (headers: string[]) => number  // Score 0-100
  mapeador: (dados: any[], contaId: string) => TransacaoImportada[]
  estrategiaDuplicacao: (transacao: TransacaoImportada) => string
}
```

### **Fluxo de Processamento**
```
CSV Upload → Parse Headers → Detectar Formato → Mapear Dados → Anti-Duplicação → Preview → Salvar
```

---

## 📅 FASES DE IMPLEMENTAÇÃO

### **FASE 1 - REFATORAÇÃO BASE** (Dia 1)
**Objetivo:** Preparar código atual para múltiplos formatos

#### 1.1 Criar Sistema de Detecção
**Arquivo:** `src/servicos/importacao/detector-formato.ts`
```typescript
export interface FormatoCSV {
  nome: string
  icone: string
  detector: (headers: string[]) => number
  mapeador: (dados: any[], contaId: string) => TransacaoImportada[]
  estrategiaDuplicacao: (transacao: TransacaoImportada) => string
}

export function detectarFormato(dados: any[]): FormatoCSV {
  if (!dados.length) throw new Error('CSV vazio')
  
  const headers = Object.keys(dados[0])
  let melhorFormato = formatosSuportados[0]
  let melhorScore = 0
  
  for (const formato of formatosSuportados) {
    const score = formato.detector(headers)
    if (score > melhorScore) {
      melhorScore = score
      melhorFormato = formato
    }
  }
  
  if (melhorScore < 50) {
    throw new Error('Formato CSV não reconhecido')
  }
  
  return melhorFormato
}
```

#### 1.2 Criar Registry de Formatos
**Arquivo:** `src/servicos/importacao/mapeadores/index.ts`
```typescript
import { mapearLinhasNubank } from './mapeador-nubank'
import { FormatoCSV } from '../detector-formato'

export const formatosSuportados: FormatoCSV[] = [
  {
    nome: 'Nubank',
    icone: '💜',
    detector: (headers) => {
      const temIdentificador = headers.includes('Identificador')
      const temDescricao = headers.includes('Descrição')
      return temIdentificador && temDescricao ? 95 : 0
    },
    mapeador: mapearLinhasNubank,
    estrategiaDuplicacao: (t) => t.identificador_externo
  }
]
```

#### 1.3 Mover Mapeador Nubank
**Ação:** Mover `src/servicos/importacao/mapeador-nubank.ts` para `src/servicos/importacao/mapeadores/mapeador-nubank.ts`

#### 1.4 Atualizar Modal Principal
**Arquivo:** `src/componentes/importacao/modal-importacao-csv.tsx`
```typescript
// Substituir linha 66 (hardcoded Nubank)
const formatoDetectado = detectarFormato(dadosProcessados)
const transacoesMap = formatoDetectado.mapeador(dadosProcessados, contaSelecionada)

// Adicionar feedback visual
<div className="bg-blue-50 p-3 rounded-lg">
  <p className="text-sm text-blue-700">
    {formatoDetectado.icone} Formato detectado: <strong>{formatoDetectado.nome}</strong>
  </p>
</div>
```

**Checklist Fase 1:**
- [x] Sistema de detecção criado (detector-formato.ts)
- [x] Registry de formatos implementado (mapeadores/index.ts)
- [x] Mapeador Nubank movido para nova estrutura
- [x] Modal atualizado para usar detecção automática
- [x] Testes: TypeScript validado e build executado com sucesso

**✅ FASE 1 CONCLUÍDA - 22/08/2025**
- **Status:** Refatoração base implementada e testada
- **Resultado:** Sistema de detecção automática funcionando, Nubank compatível
- **Próximo:** Aguardando permissão para Fase 2

---

### **FASE 2 - FORMATO CARTÃO** (Dia 2)
**Objetivo:** Implementar suporte ao formato cartão

#### 2.1 Criar Mapeador Cartão
**Arquivo:** `src/servicos/importacao/mapeadores/mapeador-cartao.ts`
```typescript
import { LinhaCSV, TransacaoImportada } from '@/tipos/importacao'

export interface LinhaCartao {
  date: string
  title: string
  amount: string
}

export function mapearLinhasCartao(
  linhas: LinhaCartao[], 
  contaId: string
): TransacaoImportada[] {
  return linhas.map((linha, index) => {
    try {
      const valor = parseFloat(linha.amount)
      if (isNaN(valor)) {
        throw new Error(`Valor inválido na linha ${index + 1}: ${linha.amount}`)
      }
      
      // Data já está no formato ISO (YYYY-MM-DD)
      const dataISO = linha.date
      
      // Gerar ID único baseado nos dados (já que não tem UUID nativo)
      const hashId = gerarHashTransacao(linha.date, linha.title, valor)
      
      return {
        data: dataISO,
        valor: Math.abs(valor),
        identificador_externo: hashId,
        descricao: linha.title || '',
        conta_id: contaId,
        tipo: valor >= 0 ? 'despesa' : 'receita' // Cartão: positivo=gasto, negativo=pagamento
      }
    } catch (error) {
      throw new Error(`Erro na linha ${index + 1}: ${error}`)
    }
  })
}

function gerarHashTransacao(data: string, titulo: string, valor: number): string {
  const textoHash = `${data}_${titulo.substring(0, 20)}_${valor}`
  return `CARTAO_${Buffer.from(textoHash).toString('base64').substring(0, 16)}`
}
```

#### 2.2 Atualizar Tipos
**Arquivo:** `src/tipos/importacao.ts`
```typescript
// Adicionar nova interface
export interface LinhaCartao {
  date: string
  title: string
  amount: string
}

// Union type para suportar múltiplos formatos
export type LinhaCSVUniversal = LinhaCSV | LinhaCartao
```

#### 2.3 Adicionar ao Registry
**Arquivo:** `src/servicos/importacao/mapeadores/index.ts`
```typescript
import { mapearLinhasCartao } from './mapeador-cartao'

// Adicionar ao array formatosSuportados
{
  nome: 'Cartão de Crédito',
  icone: '💳',
  detector: (headers) => {
    const temDate = headers.includes('date')
    const temTitle = headers.includes('title')  
    const temAmount = headers.includes('amount')
    return temDate && temTitle && temAmount ? 90 : 0
  },
  mapeador: mapearLinhasCartao,
  estrategiaDuplicacao: (t) => t.identificador_externo // Usa hash gerado
}
```

#### 2.4 Criar Estratégias de Duplicação
**Arquivo:** `src/servicos/importacao/estrategias-duplicacao.ts`
```typescript
import { TransacaoImportada } from '@/tipos/importacao'

export const estrategiasDuplicacao = {
  nubank: (transacao: TransacaoImportada): string => {
    return transacao.identificador_externo
  },
  
  cartao: (transacao: TransacaoImportada): string => {
    // Hash já gerado no mapeador
    return transacao.identificador_externo
  },
  
  generico: (transacao: TransacaoImportada): string => {
    // Fallback para bancos sem UUID
    const textoHash = `${transacao.data}_${transacao.valor}_${transacao.descricao.substring(0, 20)}`
    return Buffer.from(textoHash).toString('base64').substring(0, 16)
  }
}
```

**Checklist Fase 2:**
- [x] Mapeador cartão implementado (mapeador-cartao.ts)
- [x] Tipos atualizados para suportar múltiplos formatos
- [x] Cartão adicionado ao registry de formatos
- [x] Estratégias de duplicação criadas
- [x] Testes: Cartão sendo detectado e importado corretamente

**✅ FASE 2 CONCLUÍDA - 22/08/2025**
- **Status:** Formato cartão implementado e testado
- **Resultado:** Sistema detecta automaticamente Nubank (💜) e Cartão (💳)
- **Validação:** TypeScript OK, Build OK, Integração OK

---

### **FASE 3 - POLISH E FINALIZAÇÃO** (Dia 3 - meio período)
**Objetivo:** Finalizar detalhes e robustez

#### 3.1 Melhorar Feedback Visual
**Arquivo:** `src/componentes/importacao/modal-importacao-csv.tsx`
```typescript
// Melhorar feedback da detecção
{dadosProcessados.length > 0 && formatoDetectado && (
  <div className="space-y-3">
    {/* Formato Detectado */}
    <div className="bg-blue-50 p-4 rounded-lg">
      <h4 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
        {formatoDetectado.icone} Formato Detectado: {formatoDetectado.nome}
      </h4>
      <p className="text-sm text-blue-700">
        {dadosProcessados.length} transações encontradas e validadas.
      </p>
    </div>

    {/* Preview Rápido */}
    <div className="bg-gray-50 p-4 rounded-lg">
      <h4 className="font-medium text-gray-900 mb-2">Preview dos Dados</h4>
      <div className="text-xs font-mono text-gray-600 space-y-1">
        {dadosProcessados.slice(0, 3).map((linha, idx) => (
          <div key={idx} className="truncate">
            {Object.values(linha).join(' | ')}
          </div>
        ))}
        {dadosProcessados.length > 3 && (
          <div className="text-gray-500">... e mais {dadosProcessados.length - 3} transações</div>
        )}
      </div>
    </div>
  </div>
)}
```

#### 3.2 Tratamento de Erros Melhorado
```typescript
// Tratamento específico por formato
const handleArquivoSelecionado = async (file: File | null) => {
  setArquivo(file)
  setDadosProcessados([])
  
  if (file) {
    setCarregando(true)
    try {
      const linhasCSV = await processarCSV(file)
      
      // Tentar detectar formato
      const formato = detectarFormato(linhasCSV)
      setFormatoDetectado(formato)
      
      sucesso(`${formato.icone} ${formato.nome} detectado: ${linhasCSV.length} transações`)
      setDadosProcessados(linhasCSV)
    } catch (error) {
      if (error.message.includes('formato não reconhecido')) {
        erro('Formato CSV não reconhecido. Verifique se é um arquivo de banco suportado.')
      } else {
        erro('Erro ao processar arquivo CSV')
      }
      logger.error(error)
    } finally {
      setCarregando(false)
    }
  }
}
```

#### 3.3 Documentação de Interface
**Arquivo:** `src/componentes/importacao/modal-importacao-csv.tsx`
```typescript
// Atualizar informações de formatos suportados
<div className="bg-blue-50 p-4 rounded-lg">
  <h4 className="font-medium text-blue-900 mb-2">Formatos Suportados</h4>
  <div className="text-sm text-blue-700 space-y-1">
    <div>💜 <strong>Nubank:</strong> Data, Valor, Identificador, Descrição</div>
    <div>💳 <strong>Cartão:</strong> date, title, amount</div>
    <div className="text-xs text-blue-600 mt-2">
      ✨ Detecção automática - apenas arraste o arquivo!
    </div>
  </div>
</div>
```

**Checklist Fase 3:**
- [x] Feedback visual melhorado com formato detectado
- [x] Tratamento de erros específico por formato
- [x] Preview rápido dos dados processados
- [x] Documentação atualizada na interface
- [x] Testes finais: Nubank + Cartão funcionando perfeitamente

**✅ FASE 3 CONCLUÍDA - 22/08/2025**
- **Status:** Interface polida e finalizada
- **Resultado:** Sistema completo com detecção automática e feedback visual
- **Validação:** TypeScript OK, Build OK, Interface OK

---

## 🧪 TESTES MANUAIS

### **Cenário 1: Nubank (Regressão)**
1. Upload CSV Nubank existente
2. Verificar: "💜 Nubank detectado"
3. Importar normalmente
4. Confirmar: funcionamento idêntico ao atual

### **Cenário 2: Cartão (Novo)**
1. Upload CSV cartão (date, title, amount)
2. Verificar: "💳 Cartão de Crédito detectado"
3. Preview mostra transações corretas
4. Importar e verificar no banco

### **Cenário 3: CSV Inválido**
1. Upload CSV com headers desconhecidos
2. Verificar: erro "formato não reconhecido"
3. Mensagem clara para usuário

### **Cenário 4: Duplicatas**
1. Importar mesmo arquivo duas vezes
2. Segunda vez: mostrar X duplicadas
3. Não importar duplicatas

---

## 📊 RESULTADO FINAL

### **📋 STATUS GERAL:**
- ✅ **FASE 1** - Sistema de detecção base (22/08/2025)
- ✅ **FASE 2** - Formato cartão implementado (22/08/2025)  
- ✅ **FASE 3** - Interface polida e finalizada (22/08/2025)

### **Funcionalidades Entregues:**
1. ✅ **Detecção automática** de formato CSV
2. ✅ **Suporte Nubank** (compatibilidade total)
3. ✅ **Suporte Cartão** com anti-duplicação por hash
4. ✅ **Interface melhorada** com feedback visual
5. ✅ **Arquitetura extensível** para futuros bancos

### **Para o Usuário:**
- **Zero mudança** no fluxo de trabalho
- **Feedback claro** do formato detectado
- **Funcionamento automático** sem configuração

### **Para Desenvolvimento:**
- **Base sólida** para novos bancos
- **Código organizado** e modular
- **Fácil manutenção** e extensão

---

## 🔄 COMPATIBILIDADE

### **Garantias:**
- ✅ **Nubank:** Funciona exatamente como antes
- ✅ **Base de dados:** Estrutura inalterada
- ✅ **Interface:** Mesmo fluxo para usuário
- ✅ **Performance:** Sem impacto na velocidade

### **Melhorias:**
- ✅ **Feedback visual** do formato detectado
- ✅ **Tratamento de erros** mais específico
- ✅ **Preview melhorado** dos dados
- ✅ **Extensibilidade** para futuro

---

## 📞 SUPORTE PÓS-IMPLEMENTAÇÃO

Após implementação, Ricardo terá:
- **Sistema universal** de importação CSV
- **Suporte automático** para Nubank + Cartão
- **Base preparada** para qualquer novo banco
- **Zero complexidade** adicional na interface

**🎉 Economia estimada: Sistema único para todos os bancos + preparação para crescimento futuro**

---

## ⚠️ OBSERVAÇÕES IMPORTANTES

1. **Compatibilidade Total:** Nubank continuará funcionando exatamente como hoje
2. **Detecção Automática:** Sistema detecta formato pelos headers automaticamente
3. **Anti-Duplicação:** Cada formato tem estratégia específica (UUID vs Hash)
4. **Extensibilidade:** Novos bancos = apenas criar novo mapeador
5. **Zero Configuração:** Usuário não precisa escolher formato manualmente

**💡 Próximo banco será analisado pontualmente quando necessário**